"""
FOD Economie maximumprijzen-fetcher voor brandstof.
Doc 03_Laag-4 §2.2: I-D2-004 Euro95.

Strategie:
1. Probeer FOD Economie Drupal-JSON-feeds via meerdere paden
2. Fallback op weekly EU Oil Bulletin via Eurostat (officiele EU data)
3. Mock fallback met seizoens-modulatie

EU Weekly Oil Bulletin endpoint via Eurostat:
  https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/
  Dataset: prc_fsh_m (monthly fuel prices) — niet meer onderhouden in 1.0 API
Alternatief gebruikt: ECB SDW dataset STS heeft fuel prices.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


# FOD Economie publiek (Drupal-rendered, soms met JS — proberen we anyway)
FOD_URL = "https://economie.fgov.be/nl/themas/energie/energieprijzen/brandstofprijzen"

# ECB SDW STS dataset M.BE.N.PIIE.42121.4.000 = oil price index BE
# Note: SBI doc specificeert €/l, maar ECB heeft alleen indices. Geaccepteerd als
# proxy met disclosure.
ECB_FUEL_INDEX_URL = (
    "https://data-api.ecb.europa.eu/service/data/STS/M.BE.Y.PCPI.41200.4.INX"
    "?format=jsondata&lastNObservations=1"
)

# Pattern voor € 1,xxx/L in FOD HTML
FUEL_PATTERN = re.compile(r"Euro\s*95.*?[€\s]*(\d[,.]\d+)\s*(?:€?/l|EUR/l)?", re.IGNORECASE | re.DOTALL)


def _try_fod_scrape() -> float | None:
    ok, body = safe_request(
        FOD_URL,
        timeout=20,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if not ok or not isinstance(body, str):
        return None
    match = FUEL_PATTERN.search(body)
    if not match:
        return None
    try:
        return float(match.group(1).replace(",", "."))
    except ValueError:
        return None


def _try_ecb_fuel_index() -> float | None:
    """Fallback via ECB SDW STS (Eurostat-relayed price index)."""
    from .statbel import _parse_ecb_latest
    ok, body = safe_request(ECB_FUEL_INDEX_URL, timeout=20, headers={"Accept": "application/json"})
    if not ok or not isinstance(body, dict):
        return None
    idx = _parse_ecb_latest(body)
    if idx is None:
        return None
    # Convert index to €/l estimate. Baseline 2015 = 100, typical Euro95 in 2015 = €1.45
    # So €/l ≈ 1.45 × (idx / 100)
    return round(1.45 * (idx / 100), 3)


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # Try direct FOD scrape first
    val = _try_fod_scrape()
    if val is not None and 0.5 < val < 5.0:  # sanity check
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="FOD Economie maximumprijzen",
        )

    # Try ECB fuel index proxy
    val = _try_ecb_fuel_index()
    if val is not None and 0.5 < val < 5.0:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="ECB STS fuel index (proxy, BE)",
        )

    # Final fallback
    value = 1.85 + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True, source="mock (FOD + ECB beide endpoints faalden)",
    )
