"""
Energy-Charts.info — Belgische day-ahead elektriciteitsprijs.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Bron: api.energy-charts.info (Fraunhofer ISE, voor Belgische BZN data).
Open, geen token, CC BY 4.0. Voedt zich met ENTSO-E + Bundesnetzagentur data.

We nemen het gemiddelde van vandaag's uurprijzen, terugvallend op gisteren
als vandaag nog niet gepubliceerd is.
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise


def _fetch_avg_price(start: date, end: date) -> tuple[bool, float | None]:
    url = (
        f"https://api.energy-charts.info/price"
        f"?bzn=BE&start={start.isoformat()}&end={end.isoformat()}"
    )
    ok, body = safe_request(url, timeout=20)
    if not ok or not isinstance(body, dict):
        return False, None
    prices = body.get("price", [])
    if not prices:
        return False, None
    try:
        valid = [p for p in prices if isinstance(p, (int, float))]
        if valid:
            return True, sum(valid) / len(valid)
    except (TypeError, ValueError):
        pass
    return False, None


def fetch_energy_prices(target_date: date) -> FetchResult:
    # Probeer eerst vandaag, dan gisteren als vandaag leeg is
    for delta in (0, 1):
        d = target_date - timedelta(days=delta)
        ok, val = _fetch_avg_price(d, d + timedelta(days=1))
        if ok and val is not None:
            return FetchResult(
                "I-D3-002", val, target_date.isoformat(),
                simulated=False, source="Energy-Charts (Fraunhofer ISE, BE day-ahead)",
            )

    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (Energy-Charts endpoint faalde)",
    )
