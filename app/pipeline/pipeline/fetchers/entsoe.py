"""
ENTSO-E Transparency Platform fetcher voor Belgische energieprijzen.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Real-fetch vereist gratis ENTSO-E API token (registratie via
transparency.entsoe.eu). Endpoint:
  https://web-api.tp.entsoe.eu/api?securityToken=...

STATUS: skeleton. Token-injectie via env var ENTSOE_TOKEN.
"""
from __future__ import annotations
import os
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_energy_prices(target_date: date) -> FetchResult:
    token = os.environ.get("ENTSOE_TOKEN")
    if token:
        # TODO_REAL_FETCH: implementeer Day-ahead-prices XML-parser
        # (ENTSO-E API geeft XML met Energiebespreking per uur).
        pass
    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (ENTSO-E — set ENTSOE_TOKEN voor real-fetch)",
    )
