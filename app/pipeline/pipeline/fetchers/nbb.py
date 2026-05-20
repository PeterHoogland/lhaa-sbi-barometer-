"""
Nationale Bank België fetcher voor hypotheekrente.
Doc 03_Laag-4 §2.3: I-D3-006 — NBB-gemiddelde rente nieuwe hypotheken.

Bron: NBB Stat (https://stat.nbb.be). Heeft open data downloads in CSV.
Voor MVP gebruiken we een statische plausibele waarde + ruis.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_mortgage_rate(target_date: date) -> FetchResult:
    value = 3.4 + seasonal_noise(target_date, 0, 0, 0.15, 0.0)
    return FetchResult(
        "I-D3-006", value, target_date.isoformat(),
        simulated=True, source="mock (NBB Stat — TODO_REAL_FETCH)",
    )
