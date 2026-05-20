"""
Vlaams Verkeerscentrum file-data fetcher.
Doc 03_Laag-4 §2.2: I-D2-001 Filezwaarte (km·min spitsuur).

STATUS: skeleton. Het Verkeerscentrum publiceert geen open API; de
publieke dashboard-data wordt geserveerd via een proprietary endpoint
op verkeerscentrum.be. Real-fetch vereist scraping van die JSON,
of fallback naar TomTom Move / HERE Traffic API met token.
TODO_REAL_FETCH.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_traffic_load(target_date: date) -> FetchResult:
    # F_total in km·min — typische Vlaamse spits 5000-9000
    weekday = target_date.weekday()  # 0=Mon
    is_weekday = 0 <= weekday <= 4
    base = 7500 if is_weekday else 1500
    value = max(0.0, base + seasonal_noise(target_date, 0, 1500, 1200, -0.5))
    return FetchResult(
        "I-D2-001", value, target_date.isoformat(),
        simulated=True, source="mock (Verkeerscentrum — TODO_REAL_FETCH)",
    )
