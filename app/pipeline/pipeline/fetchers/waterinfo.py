"""
Waterinfo.be — hoogwater-/overstromingssignaal voor Vlaanderen.
Doc 03_Laag-4: I-D1-009 — overstromingsdruk (domein D1 fysieke leefomgeving).

Bron: waterinfo.be KIWIS-API (Kisters KiWIS, datasource 0).
  https://download.waterinfo.be/tsmdownload/KiWIS/KiWIS
Open, gratis, geen token. Waterinfo.be is het officiële kanaal van de Vlaamse
Milieumaatschappij (VMM) + De Vlaamse Waterweg voor waterstanden en debieten.

⚠ EERLIJKE BEPERKING — LEES DIT
-------------------------------
De KIWIS-API levert GEEN kant-en-klaar "aantal stations boven alarmdrempel".
Alarmdrempels zitten verspreid over timeseries-metadata en zijn niet uniform
ontsloten. Een volledig drempel-overschrijdingsmodel vergt per station een
aparte metadata-call (honderden calls) — te zwaar voor een dagelijkse
pipeline-run.

Daarom werkt deze fetcher in twee modi:
  1. LIVE: we vragen de actuele waterstand-timeseries op (parametertype
     "waterstand"/"WS"), tellen hoeveel stations recent meten, en berekenen
     een hoogwater-index = mediaan van de procentuele afwijking van elke
     station-meting tov zijn eigen recente bereik (proxy voor "hoe hoog staat
     het water nu, netbreed"). Hogere index = meer stations met hoog water.
  2. MOCK-fallback: als KIWIS onbereikbaar/te traag is, een seizoens-
     gemoduleerde mock (winter/lente hoger door neerslag), eerlijk gevlagd.

De waarde is dus een hoogwater-INDICATOR (0 = laag, hoger = natter/hoger
water netbreed), geen exact drempel-telling. Dit staat eerlijk in 'source'.

Hogere waarde = meer hoogwater = meer overstromingsstress.
"""
from __future__ import annotations
import statistics
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

BASE = "https://download.waterinfo.be/tsmdownload/KiWIS/KiWIS"
USER_AGENT = "SBI-barometer/0.2 (publieke stress-indicator; contact peter@hoogland.be)"

# getTimeseriesList: alle "actuele waterstand" tijdreeksen.
# returnfields beperkt de payload; ts_name filtert op de standaard
# 15-minuten-waterstandsreeksen van waterinfo.be.
_TS_LIST_URL = (
    f"{BASE}?service=kisters&type=queryServices&request=getTimeseriesList"
    "&datasource=0&format=json"
    "&ts_name=*15.*"
    "&stationparameter_name=waterstand"
    "&returnfields=ts_id,station_no,station_name"
)


def _fetch_timeseries_ids() -> list[str]:
    """Haal ts_id's van waterstand-tijdreeksen op (KIWIS getTimeseriesList)."""
    ok, body = safe_request(_TS_LIST_URL, timeout=25, headers={"User-Agent": USER_AGENT})
    if not ok or not isinstance(body, list) or len(body) < 2:
        return []
    # KIWIS json-format: eerste rij = kolomnamen, daarna data-rijen.
    header = body[0]
    try:
        ts_idx = header.index("ts_id")
    except (ValueError, AttributeError):
        return []
    ids: list[str] = []
    for row in body[1:]:
        if isinstance(row, list) and len(row) > ts_idx and row[ts_idx]:
            ids.append(str(row[ts_idx]))
    return ids


def _fetch_recent_levels(ts_ids: list[str]) -> list[float]:
    """Voor een batch ts_id's: haal de recentste waterstandwaarde per reeks.

    KIWIS getTimeseriesValues accepteert komma-gescheiden ts_id's. We vragen
    de laatste dag op en nemen per reeks de hoogste waarde van die dag als
    proxy voor de actuele waterstand.
    """
    if not ts_ids:
        return []
    # Batch beperken — KIWIS limiteert URL-lengte; 200 reeksen is ruim genoeg
    # voor een netbrede schatting.
    batch = ",".join(ts_ids[:200])
    url = (
        f"{BASE}?service=kisters&type=queryServices&request=getTimeseriesValues"
        f"&datasource=0&format=json&ts_id={batch}"
        "&period=P1D&returnfields=Timestamp,Value"
    )
    ok, body = safe_request(url, timeout=30, headers={"User-Agent": USER_AGENT})
    if not ok or not isinstance(body, list):
        return []
    levels: list[float] = []
    for series in body:
        if not isinstance(series, dict):
            continue
        rows = series.get("data")
        if not isinstance(rows, list) or not rows:
            continue
        vals = []
        for row in rows:
            # data-rijen zijn [timestamp, value, ...]
            if isinstance(row, list) and len(row) >= 2 and isinstance(row[1], (int, float)):
                vals.append(float(row[1]))
        if vals:
            # mediaan van de dag = robuuste actuele-stand-proxy per station
            levels.append(statistics.median(vals))
    return levels


def _highwater_index(levels: list[float]) -> float | None:
    """Netbrede hoogwater-index uit de verzamelde stationsniveaus.

    We hebben geen per-station referentiebereik binnen één call, dus de index
    is de variatiecoëfficiënt-vrije spreiding: het 90e-percentiel gedeeld door
    de mediaan van alle stationsniveaus. Bij hoogwater stijgt de bovenkant van
    de verdeling sneller dan de mediaan → index > 1 wijst op netbrede pieken.
    """
    clean = [v for v in levels if v is not None]
    if len(clean) < 5:
        return None
    clean.sort()
    median = statistics.median(clean)
    if median == 0:
        return None
    idx_p90 = min(len(clean) - 1, int(round(0.9 * (len(clean) - 1))))
    p90 = clean[idx_p90]
    return p90 / median


def fetch_flood_signal(target_date: date) -> FetchResult:
    """Netbreed hoogwater-/overstromingssignaal voor Vlaanderen (I-D1-009)."""
    ts_ids = _fetch_timeseries_ids()
    if ts_ids:
        levels = _fetch_recent_levels(ts_ids)
        index = _highwater_index(levels)
        if index is not None:
            source = (
                f"waterinfo.be KIWIS (VMM, {len(levels)} waterstand-stations; "
                "hoogwater-index = p90/mediaan, proxy — zie module-docstring)"
            )
            cache_put("I-D1-009", index, source, target_date.isoformat())
            return FetchResult(
                "I-D1-009", index, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D1-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D1-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock. Basislijn ~1.4; winter/lente natter → fase verschoven
    # zodat de piek rond februari-maart valt.
    value = max(0.0, 1.4 + seasonal_noise(target_date, 0.0, 0.35, 0.15, 1.2))
    return FetchResult(
        "I-D1-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (waterinfo.be KIWIS onbereikbaar/leeg, geen cache)",
        observation_date=target_date.isoformat(),
    )
