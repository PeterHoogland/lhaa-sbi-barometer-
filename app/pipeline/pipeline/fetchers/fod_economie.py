"""
Brandstof-fetcher voor BE (I-D2-004).
Doc 03_Laag-4 §2.2.

Primaire bron: **ECB SDW HICP CP0722** (Fuels and lubricants for personal transport,
yoy %, BE). Dit is methodologisch sterker dan een losse Euro95-spotprijs omdat
het de *verandering* in brandstofkosten meet, wat het stress-relevante signaal is.

We rapporteren de yoy % als "implicit Euro95 €/l" via:
  baseline €1.85 × (1 + yoy/100)
Dat geeft een €/l-equivalent die de indicator (eenheid €/l in doc 03)
respecteert terwijl de onderliggende data ECB-officieel is.

Fallback cascade: HICP → FOD scrape → carbu scrape → mock.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest


# ECB HICP key voor "Fuels and lubricants for personal transport equipment"
# Coicop 07.2.2, BE, monthly, annual rate of change
ECB_FUEL_HICP_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.072200.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

FOD_URL = "https://economie.fgov.be/nl/themas/energie/energieprijzen/brandstofprijzen"
CARBU_URL = "https://carbu.com/belgie/index.php/laagsteprijs/EUROPE_95/-/-"

EURO95_PATTERN = re.compile(
    r"(?:Euro\s*95|euro95|E95)\D{0,40}?(\d[,.]\d{2,3})",
    re.IGNORECASE,
)
EURO95_BASELINE_PER_L = 1.85  # 2024-baseline voor BE Euro95


def _try_ecb_fuel_hicp() -> tuple[float | None, float | None]:
    """Return (yoy_pct, eur_per_l_estimate) or (None, None)."""
    ok, body = safe_request(
        ECB_FUEL_HICP_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None, None
    yoy = _parse_ecb_latest(body)
    if yoy is None:
        return None, None
    estimate = EURO95_BASELINE_PER_L * (1 + yoy / 100)
    return yoy, round(estimate, 3)


def _try_scrape(url: str) -> float | None:
    ok, body = safe_request(
        url, timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0 (SBI-pipeline)",
            "Accept-Language": "nl-BE,nl;q=0.9",
        },
    )
    if not ok or not isinstance(body, str):
        return None
    m = EURO95_PATTERN.search(body)
    if not m:
        return None
    try:
        val = float(m.group(1).replace(",", "."))
        if 0.5 < val < 5.0:
            return val
    except ValueError:
        pass
    return None


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # 1) ECB HICP CP0722 — methodologisch sterkste
    yoy, estimate = _try_ecb_fuel_hicp()
    if estimate is not None:
        return FetchResult(
            "I-D2-004", estimate, target_date.isoformat(),
            simulated=False,
            source=f"ECB HICP brandstof yoy {yoy:+.1f}% → €{estimate}/l geschat",
        )

    # 2) FOD Economie direct scrape
    val = _try_scrape(FOD_URL)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="FOD Economie maximumprijzen",
        )

    # 3) carbu.com fallback
    val = _try_scrape(CARBU_URL)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="carbu.com (BE pomp-prijzen)",
        )

    # 4) Conservative mock
    value = 1.85 + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True,
        source="mock (ECB HICP + FOD + carbu alle drie faalden)",
    )
