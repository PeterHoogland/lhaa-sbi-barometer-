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


def _parse_ecb_latest(body) -> float | None:
    """ECB SDW JSON-data format heeft genest series-pad. Pak de laatste observatie."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        # observations is een dict van index→[value, status, ...]
        latest_key = max(observations.keys(), key=lambda k: int(k))
        return float(observations[latest_key][0])
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None


def _parse_eurostat_latest(body) -> float | None:
    """Eurostat JSON-stat heeft 'value' dict met geïndexeerde observaties."""
    try:
        values = body.get("value", {})
        if not values:
            return None
        # Pak de laatste (hoogste) index
        last_idx = max(values.keys(), key=lambda k: int(k))
        return float(values[last_idx])
    except (KeyError, ValueError, TypeError):
        return None


def fetch_cpi(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_CPI_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        val = _parse_ecb_latest(body)
        if val is not None:
            return FetchResult(
                "I-D3-001", val, target_date.isoformat(),
                simulated=False, source="ECB SDW (BE HICP yoy %)",
            )
    value = 2.5 + seasonal_noise(target_date, 0, 0.5, 0.4, 0.0) / 2
    return FetchResult(
        "I-D3-001", value, target_date.isoformat(),
        simulated=True, source="mock (ECB SDW endpoint faalde)",
    )


def fetch_unemployment(target_date: date) -> FetchResult:
    ok, body = safe_request(EUROSTAT_UE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        val = _parse_eurostat_latest(body)
        if val is not None:
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source="Eurostat (BE werkloosheid, seizoens-gecorrigeerd)",
            )
    value = 6.2 + seasonal_noise(target_date, 0, 0, 0.3, 0.0)
    return FetchResult(
        "I-D3-005", value, target_date.isoformat(),
        simulated=True, source="mock (Eurostat endpoint faalde)",
    )
