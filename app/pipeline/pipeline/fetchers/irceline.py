"""
IRCEL-CELINE luchtkwaliteit fetcher.
Doc 03_Laag-4 §2.1: I-D1-004 — PM2.5, O₃, NO₂ tegen WHO 2021 grenswaarden.

STATUS: skeleton. Real-fetch vereist scraping van irceline.be of WMS-WFS
service (geen open REST API beschikbaar). Voor MVP: mock-fallback.
TODO_REAL_FETCH: implementeer beautifulsoup4-scraper of WFS-aanroep.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_air_quality(target_date: date) -> FetchResult:
    # Composite_AQ = max(PM25/15, O3_max/100, NO2/25) — ratio tov WHO 2021
    # Mock: gemiddeld 0.8 met seizoens-variatie (winter NO₂-piek, zomer O₃-piek)
    ratio = max(0.0, seasonal_noise(target_date, 0.8, 0.3, 0.2, 0.0))
    return FetchResult(
        "I-D1-004", ratio, target_date.isoformat(),
        simulated=True, source="mock (IRCEL-CELINE — TODO_REAL_FETCH)",
    )
