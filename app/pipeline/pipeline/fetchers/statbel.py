"""
STATBEL/Eurostat/ECB fetcher voor CPI (consumptieprijsindex) en werkloosheid.
Doc 03_Laag-4 §2.3: I-D3-001 CPI inflatie yoy %, I-D3-005 werkloosheid %.

We gebruiken de gestandardiseerde Europese bronnen omdat ze direct
JSON-toegankelijk zijn zonder view-ID-discovery:
- **ECB Statistical Data Warehouse** voor BE HICP (geharmoniseerde inflatie)
- **Eurostat** voor BE werkloosheid

Beide leveren maandelijkse data — in de wekelijkse SBI wordt forward-fill
toegepast (doc 03 §3.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put


# ECB SDW dataset: ICP (Indices of Consumer Prices), key voor BE HICP yoy:
#   M = monthly, BE = Belgium, N = neither working day nor seasonally adjusted,
#   000000 = overall index, 4 = ANR (Annual Rate of change), ANR confirms type
ECB_CPI_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.000000.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

# Eurostat unemployment rate, BE, total, percentage active population, seasonally adjusted
EUROSTAT_UE_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m"
    "?geo=BE&sex=T&age=TOTAL&unit=PC_ACT&s_adj=SA&format=JSON&lastTimePeriod=1"
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


def fetch_cpi(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_CPI_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            source = "ECB SDW (BE HICP yoy %)"
            cache_put("I-D3-001", val, source, target_date.isoformat())
            return FetchResult(
                "I-D3-001", val, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=period,
                source_url=ECB_CPI_URL,
            )

    # Cache-vangnet (≤14d) vóór de mock — zelfde ladder als irail.py/nbb.py.
    cached = cache_get("I-D3-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-001", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            source_url=ECB_CPI_URL,
        )

    value = 2.5 + seasonal_noise(target_date, 0, 0.5, 0.4, 0.0) / 2
    return FetchResult(
        "I-D3-001", value, target_date.isoformat(),
        simulated=True, source="mock (ECB SDW endpoint faalde, geen cache)",
    )


def fetch_unemployment(target_date: date) -> FetchResult:
    # Primair: ECB LFSI (zelfde ECB-infrastructuur als ons hypotheek/ontslagen-pad)
    ok, body = safe_request(ECB_UNEMPLOYMENT_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            source = "ECB LFSI (BE werkloosheidsrate, seizoens-gecorrigeerd)"
            cache_put("I-D3-005", val, source, target_date.isoformat())
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
            cache_put("I-D3-005", val, source, target_date.isoformat())
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=period,
                source_url=EUROSTAT_UE_URL,
            )

    # Cache-vangnet (≤14d) vóór de mock — welke bron de gecachte waarde leverde
    # staat in de source-string; source_url wijst naar het primaire endpoint.
    cached = cache_get("I-D3-005")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-005", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            source_url=ECB_UNEMPLOYMENT_URL,
        )

    value = 6.2 + seasonal_noise(target_date, 0, 0, 0.3, 0.0)
    return FetchResult(
        "I-D3-005", value, target_date.isoformat(),
        simulated=True, source="mock (ECB + Eurostat beide faalden, geen cache)",
    )
