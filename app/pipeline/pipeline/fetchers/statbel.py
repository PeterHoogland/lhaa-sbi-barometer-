"""
STATBEL fetcher voor CPI (consumptieprijsindex) en werkloosheid.
Doc 03_Laag-4 §2.3: I-D3-001 CPI inflatie yoy %, I-D3-005 werkloosheid %.

Real-fetch: STATBEL CTAS API geeft maandelijkse cijfers in JSON.
Wekelijks composiet doet forward-fill (doc 03 §3.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


STATBEL_CPI_LATEST = (
    "https://bestat.statbel.fgov.be/bestat/api/views/c5b94a5d-4e5d-4d64-862a-bcaa39b22cad/result/JSON"
)


def fetch_cpi(target_date: date) -> FetchResult:
    # STATBEL CTAS endpoints vereisen vaak een specifiek view-ID dat
    # over tijd verandert. Real-fetch vereist een view-discovery-stap.
    # Voor MVP: mock met realistische CPI-yoy waarde rond 2.5%.
    value = 2.5 + seasonal_noise(target_date, 0, 0.5, 0.4, 0.0) / 2
    return FetchResult(
        "I-D3-001", value, target_date.isoformat(),
        simulated=True, source="mock (STATBEL CTAS — TODO_REAL_FETCH)",
    )


def fetch_unemployment(target_date: date) -> FetchResult:
    value = 6.2 + seasonal_noise(target_date, 0, 0, 0.3, 0.0)
    return FetchResult(
        "I-D3-005", value, target_date.isoformat(),
        simulated=True, source="mock (STATBEL — TODO_REAL_FETCH)",
    )
