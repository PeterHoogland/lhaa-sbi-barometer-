"""
FOD Economie maximumprijzen-fetcher voor brandstof.
Doc 03_Laag-4 §2.2: I-D2-004 — Euro95, diesel €/l (officiële maximumprijzen).

STATUS: real-fetch poging via publieke FOD-API; fallback naar mock.
Bron: https://economie.fgov.be/nl/themas/energie/energieprijzen/brandstofprijzen
Geen open REST API; scraping van HTML-tabel vereist.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # 7-daags voortschrijdend gemiddelde Euro95 (€/l)
    base = 1.85
    value = base + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True, source="mock (FOD Economie — TODO_REAL_FETCH)",
    )
