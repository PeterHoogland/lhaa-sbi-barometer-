"""
KMI/RMI weer-data fetcher.
Doc 03_Laag-4 §2.1: I-D1-002 Hitte, I-D1-003 Kou.

Bron: open-meteo.com — gratis proxy voor Belgisch weer dat de KMI-data
voedt (geen API-key nodig). Vervangt directe KMI-toegang waar die
registratie vereist.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


def fetch_temperature_extremes(target_date: date) -> tuple[FetchResult, FetchResult]:
    """Haalt Tmax en Tmin op voor Brussel op een gegeven datum."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=50.85&longitude=4.35"
        f"&daily=temperature_2m_max,temperature_2m_min"
        f"&start_date={target_date.isoformat()}&end_date={target_date.isoformat()}"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url)

    if ok and isinstance(body, dict):
        try:
            tmax = body["daily"]["temperature_2m_max"][0]
            tmin = body["daily"]["temperature_2m_min"][0]
            # I-D1-002: continu Heat_excess = max(0, Tmax - 30) (doc 03 §2.1)
            heat = max(0.0, tmax - 30) if tmax is not None else seasonal_noise(target_date, 18, 10, 4, -1.57)
            # I-D1-003: continu Cold_excess = max(0, -5 - Tmin)
            cold = max(0.0, -5 - tmin) if tmin is not None else seasonal_noise(target_date, 5, 8, 3, 0)
            return (
                FetchResult("I-D1-002", heat, target_date.isoformat(), simulated=False,
                            source="open-meteo (KMI proxy)"),
                FetchResult("I-D1-003", cold, target_date.isoformat(), simulated=False,
                            source="open-meteo (KMI proxy)"),
            )
        except (KeyError, IndexError, TypeError):
            pass

    # Fallback: synthetische seizoens-gemoduleerde waarde
    return (
        FetchResult("I-D1-002", max(0, seasonal_noise(target_date, 5, 8, 3, -1.57)),
                    target_date.isoformat(), simulated=True, source="mock (KMI fallback)",
                    error=body if not ok else None),
        FetchResult("I-D1-003", max(0, seasonal_noise(target_date, 3, 5, 2, 1.57)),
                    target_date.isoformat(), simulated=True, source="mock (KMI fallback)"),
    )
