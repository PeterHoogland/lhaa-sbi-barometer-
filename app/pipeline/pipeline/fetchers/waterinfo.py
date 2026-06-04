"""
Wateroverlast-signaal (I-D1-009) — BELGISCHE bron (Vlaanderen + Wallonië).

Bron: de officiële Belgische hydrometrie via de KISTERS KiWIS-API's, geen sleutel:
- VMM / Waterinfo.be (Vlaanderen):  download.waterinfo.be/.../KiWIS
- SPW / hydrometrie.wallonie.be (Wallonië): de flood-rivieren van 2021 (Vesdre, Ourthe)

We sommen het dag-gemiddelde DEBIET (m³/s) over vier representatieve stations in de
twee landsdelen: Vesdre (Verviers) + Ourthe (Tabreux) in Wallonië, Dijle (Wilsele) +
Demer (Bilzen) in Vlaanderen. Hoger totaal debiet = vollere rivieren = meer
overstromingsdruk; de engine scoort de afwijking tov de baseline. We nemen alleen
dagen waarop alle vier de stations data leverden, zodat de som vergelijkbaar blijft.

(Voorheen: open-meteo GloFAS = een Europees Copernicus-model, geen Belgische meting.
Peter 2026-06-04: alle bronnen Belgisch. Dit is de echte Belgische meting, nu ook
Wallonië-dekkend — net de zwaarst getroffen zone in 2021. De baseline
data/history/I-D1-009.json is her-backfilled op exact deze bron + formule, zodat de
Z-score consistent blijft.)
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

VMM = "https://download.waterinfo.be/tsmdownload/KiWIS/KiWIS"
SPW = "https://hydrometrie.wallonie.be/services/KiWIS/KiWIS"

# (label, basis-URL, ts_id) — dag-gemiddeld debiet (m³/s). 2 Waals (flood-rivieren
# 2021) + 2 Vlaams → het signaal dekt heel België.
STATIONS = [
    ("Vesdre/Verviers (W)", SPW, "284632010"),
    ("Ourthe/Tabreux (W)", SPW, "297962010"),
    ("Dijle/Wilsele (Vl)", VMM, "0168407042"),
    ("Demer/Bilzen (Vl)", VMM, "0168901042"),
]


def _station_daily(base: str, ts_id: str, start: date, end: date) -> dict[str, float]:
    """Dag-debiet {YYYY-MM-DD: m³/s} voor één KiWIS-tijdreeks."""
    url = (
        f"{base}?service=kisters&type=queryServices&request=getTimeseriesValues"
        f"&format=json&ts_id={ts_id}&from={start.isoformat()}&to={end.isoformat()}"
        f"&returnfields=Timestamp,Value"
    )
    ok, body = safe_request(url, timeout=40, headers={"User-Agent": "lhaa-sbi-server"})
    out: dict[str, float] = {}
    if ok and isinstance(body, list) and body and isinstance(body[0], dict):
        for row in body[0].get("data", []):
            if len(row) >= 2 and isinstance(row[1], (int, float)) and isinstance(row[0], str):
                out[row[0][:10]] = float(row[1])
    return out


def discharge_sum_series(start: date, end: date) -> list[tuple[str, float]]:
    """Som van het dag-debiet over de vier stations per dag (alleen dagen waarop alle
    vier data leverden). Chronologisch. Gedeeld door de dag-fetcher én het backfill."""
    per_station = [_station_daily(base, ts_id, start, end) for _, base, ts_id in STATIONS]
    if not all(per_station):
        return []
    common = set.intersection(*[set(s.keys()) for s in per_station])
    return [(d, round(sum(s[d] for s in per_station), 2)) for d in sorted(common)]


def fetch_flood_signal(target_date: date) -> FetchResult:
    series = discharge_sum_series(target_date - timedelta(days=10), target_date)
    if series:
        latest_date, value = series[-1]
        source = (
            "VMM (Waterinfo.be) + SPW (hydrometrie.wallonie.be) — som dag-debiet "
            "Vesdre, Ourthe, Dijle, Demer (m³/s)"
        )
        cache_put("I-D1-009", value, source, latest_date)
        return FetchResult(
            "I-D1-009", value, target_date.isoformat(),
            simulated=False, source=source, observation_date=latest_date,
        )

    cached = cache_get("I-D1-009")
    if cached:
        cval, prev_source = cached
        return FetchResult(
            "I-D1-009", cval, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    value = max(0.0, 40.0 + seasonal_noise(target_date, 0.0, 18.0, 10.0, 0.0))
    return FetchResult(
        "I-D1-009", value, target_date.isoformat(),
        simulated=True, source="mock (VMM + SPW KiWIS onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
