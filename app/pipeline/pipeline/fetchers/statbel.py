"""
STATBEL/Eurostat/ECB fetcher voor CPI (consumptieprijsindex) en werkloosheid.
Doc 03_Laag-4 §2.3: I-D3-001 CPI inflatie yoy %, I-D3-005 werkloosheid %.

We gebruiken de gestandardiseerde Europese bronnen omdat ze direct
JSON-toegankelijk zijn zonder view-ID-discovery:
- **Eurostat** voor BE HICP (geharmoniseerde inflatie) — sinds de
  HICP-migratie van 2026 (ECOICOP ver.2, basis 2025=100) is `prc_hicp_minr`
  de enige doorlopende reeks; de oude ECB SDW ICP-reeks en Eurostat
  `prc_hicp_manr` zijn per 2025-12 officieel bevroren.
- **ECB SDW (LFSI)** voor BE werkloosheid, met Eurostat als fallback.

Beide leveren maandelijkse data — in de wekelijkse SBI wordt forward-fill
toegepast (doc 03 §3.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get_with_date as cache_get_with_date, put as cache_put


# Eurostat HICP — ECOICOP ver.2-opvolger (2026-migratie, ontdekt 13/6/2026).
# De oude reeksen (ECB SDW ICP/M.BE.N.000000.4.ANR en Eurostat prc_hicp_manr)
# zijn per 2025-12 bevroren (catalogus: "HICP ... (1997-2025)"); prc_hicp_minr
# (dimensie coicop18, all-items = TOTAL, RCH_A = annual rate of change) loopt
# door. lastTimePeriod=3 omdat de nieuwste periode voor BE leeg kan zijn
# (publicatie-naijling) — de parser pakt de laatste niet-lege observatie.
EUROSTAT_CPI_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr"
    "?geo=BE&coicop18=TOTAL&unit=RCH_A&format=JSON&lastTimePeriod=3"
)

# Volledige maandreeks van exact dezelfde meetset — gedeeld met
# scripts/backfill_macro_baseline.py zodat baseline en dagwaarde uit dezelfde
# reeks komen (schaaldiscipline, CLAUDE.md regel 5).
EUROSTAT_CPI_HISTORY_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr"
    "?geo=BE&coicop18=TOTAL&unit=RCH_A&format=JSON&sinceTimePeriod=2008-01"
)

# Eurostat unemployment rate, BE, total, percentage active population, seasonally
# adjusted. lastTimePeriod=3: de nieuwste periode kan voor BE nog leeg zijn —
# met =1 gaf de fallback dan None terwijl de maand ervoor wél beschikbaar was.
EUROSTAT_UE_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m"
    "?geo=BE&sex=T&age=TOTAL&unit=PC_ACT&s_adj=SA&format=JSON&lastTimePeriod=3"
)

# Fallback: ECB LFSI BE unemployment rate (bewezen stabiel)
ECB_UNEMPLOYMENT_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&lastNObservations=1"
)


def _parse_ecb_latest(body) -> float | None:
    """ECB SDW JSON-data format heeft genest series-pad. Pak de laatste observatie."""
    result = _parse_ecb_latest_with_period(body)
    return result[0] if result else None


def _parse_ecb_latest_with_period(body) -> tuple[float, str] | None:
    """Pak de laatste ECB-observatie + de periode (bv. '2026-04') waar ze naar verwijst."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        latest_key = max(observations.keys(), key=lambda k: int(k))
        value = float(observations[latest_key][0])
        # Periode uit structure.dimensions.observation
        period = ""
        try:
            obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
            period = obs_dim[int(latest_key)]["id"]
        except (KeyError, IndexError, ValueError, TypeError):
            period = ""
        return value, period
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None


def _parse_eurostat_latest(body) -> tuple[float, str] | None:
    """Eurostat JSON-stat: laatste waarde + bijhorende tijdsperiode."""
    try:
        values = body.get("value", {})
        if not values:
            return None
        last_idx = max(values.keys(), key=lambda k: int(k))
        value = float(values[last_idx])
        # Periode uit dimension.time.category.index/label
        period = ""
        try:
            time_cat = body["dimension"]["time"]["category"]
            index_map = time_cat["index"]
            # vind het label waarvan de index gelijk is aan last_idx
            for label, idx in index_map.items():
                if int(idx) == int(last_idx):
                    period = label
                    break
        except (KeyError, ValueError, TypeError):
            period = ""
        return value, period
    except (KeyError, ValueError, TypeError):
        return None


def _parse_eurostat_series(body) -> list[tuple[str, float]]:
    """Volledige Eurostat JSON-stat-reeks → chronologisch gesorteerde
    (periode, waarde)-lijst. Veronderstelt dat alleen de tijd-dimensie varieert
    (één geo/unit/coicop in de query), net als _parse_eurostat_latest.
    Lege observaties (BE-naijling) ontbreken in 'value' en vallen er vanzelf uit."""
    try:
        index_map = body["dimension"]["time"]["category"]["index"]
        values = body["value"]
    except (KeyError, TypeError):
        return []
    if not isinstance(index_map, dict) or not isinstance(values, dict):
        return []
    rows: list[tuple[str, float]] = []
    for period, idx in index_map.items():
        v = values.get(str(idx))
        if v is None:
            continue
        try:
            rows.append((period, float(v)))
        except (TypeError, ValueError):
            continue
    rows.sort(key=lambda r: r[0])
    return rows


def fetch_cpi(target_date: date) -> FetchResult:
    ok, body = safe_request(EUROSTAT_CPI_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_eurostat_latest(body)
        if result is not None:
            val, period = result
            source = "Eurostat prc_hicp_minr (BE HICP yoy %, ECOICOP ver.2)"
            cache_put("I-D3-001", val, source, target_date.isoformat(), observation_date=period)
            return FetchResult(
                "I-D3-001", val, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=period,
                source_url=EUROSTAT_CPI_URL,
            )

    # Cache-vangnet (≤14d) vóór de mock — zelfde ladder als irail.py/nbb.py.
    cached = cache_get_with_date("I-D3-001")
    if cached:
        value, prev_source, cached_obs = cached
        return FetchResult(
            "I-D3-001", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=cached_obs,
            source_url=EUROSTAT_CPI_URL,
        )

    value = 2.5 + seasonal_noise(target_date, 0, 0.5, 0.4, 0.0) / 2
    return FetchResult(
        "I-D3-001", value, target_date.isoformat(),
        simulated=True, source="mock (Eurostat HICP-endpoint faalde, geen cache)",
    )


def fetch_unemployment(target_date: date) -> FetchResult:
    # Primair: ECB LFSI (zelfde ECB-infrastructuur als ons hypotheek/ontslagen-pad)
    ok, body = safe_request(ECB_UNEMPLOYMENT_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            source = "ECB LFSI (BE werkloosheidsrate, seizoens-gecorrigeerd)"
            cache_put("I-D3-005", val, source, target_date.isoformat(), observation_date=period)
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=period,
                source_url=ECB_UNEMPLOYMENT_URL,
            )

    # Fallback: Eurostat
    ok, body = safe_request(EUROSTAT_UE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_eurostat_latest(body)
        if result is not None:
            val, period = result
            source = "Eurostat (BE werkloosheid, seizoens-gecorrigeerd)"
            cache_put("I-D3-005", val, source, target_date.isoformat(), observation_date=period)
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=period,
                source_url=EUROSTAT_UE_URL,
            )

    # Cache-vangnet (≤14d) vóór de mock — welke bron de gecachte waarde leverde
    # staat in de source-string; source_url wijst naar het primaire endpoint.
    cached = cache_get_with_date("I-D3-005")
    if cached:
        value, prev_source, cached_obs = cached
        return FetchResult(
            "I-D3-005", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=cached_obs,
            source_url=ECB_UNEMPLOYMENT_URL,
        )

    value = 6.2 + seasonal_noise(target_date, 0, 0, 0.3, 0.0)
    return FetchResult(
        "I-D3-005", value, target_date.isoformat(),
        simulated=True, source="mock (ECB + Eurostat beide faalden, geen cache)",
    )
