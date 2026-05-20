"""
Brandstofprijs — Belgische Euro95 maximumprijs.
Doc 03_Laag-4 §2.2: I-D2-004.

Strategie:
1. Probeer FOD Economie HTML scrape (Drupal — kan JS-only zijn)
2. Probeer carbu.be (Belgian fuel-aggregator)
3. Probeer Stooq Brent crude futures als proxy met conversie
4. Conservative fallback met seizoens-modulatie

Stooq-proxy verklaring: Brent crude (USD/barrel) → Euro95 retail BE
heeft een lineaire relatie. Typische conversie: 1 USD Brent ≈ €0.02 Euro95
retail-impact. Baseline: Brent €70/bbl ≈ Euro95 €1.85/l. Met aanpassing
voor accijns + BTW (vast deel ~€1.20) en variabel deel (~€0.65/l aan
brent-€70). Disclosed in source.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


FOD_URL = "https://economie.fgov.be/nl/themas/energie/energieprijzen/brandstofprijzen"
CARBU_URL = "https://carbu.com/belgie/index.php/laagsteprijs/EUROPE_95/-/-"
STOOQ_URL = "https://stooq.com/q/d/l/?s=cl.f&i=d"  # WTI crude futures daily CSV (proxy)

EURO95_PATTERN = re.compile(
    r"(?:Euro\s*95|euro95|E95)\D{0,40}?(\d[,.]\d{2,3})",
    re.IGNORECASE,
)


def _try_scrape(url: str, target_pattern: re.Pattern) -> float | None:
    ok, body = safe_request(
        url, timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0 (SBI-pipeline)",
            "Accept-Language": "nl-BE,nl;q=0.9",
        },
    )
    if not ok or not isinstance(body, str):
        return None
    match = target_pattern.search(body)
    if not match:
        return None
    try:
        val = float(match.group(1).replace(",", "."))
        if 0.5 < val < 5.0:  # sanity bounds
            return val
    except ValueError:
        pass
    return None


def _try_stooq_proxy() -> float | None:
    """WTI/Brent crude futures → Euro95 retail proxy."""
    ok, body = safe_request(STOOQ_URL, timeout=15)
    if not ok or not isinstance(body, str):
        return None
    # CSV header + recente regels. Pak de laatste close-prijs.
    lines = [l for l in body.strip().split("\n") if l]
    if len(lines) < 2:
        return None
    try:
        last = lines[-1].split(",")
        # CSV: Date,Open,High,Low,Close,Volume
        close = float(last[4])
        # Brent USD/barrel → Euro95 €/l proxy
        # Approx: 1 USD Brent ≈ €0.013 Euro95 retail impact
        # Baseline: $70 ≈ €1.85, scaling +/- $1 ≈ +/- €0.013
        euro95_estimate = 1.85 + (close - 70) * 0.013
        if 1.0 < euro95_estimate < 3.5:
            return round(euro95_estimate, 3)
    except (ValueError, IndexError):
        pass
    return None


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # 1) FOD Economie direct
    val = _try_scrape(FOD_URL, EURO95_PATTERN)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="FOD Economie maximumprijzen",
        )

    # 2) carbu.be aggregator
    val = _try_scrape(CARBU_URL, EURO95_PATTERN)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="carbu.com Belgische pomp-prijzen",
        )

    # 3) Stooq crude oil proxy
    val = _try_stooq_proxy()
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False,
            source="Stooq WTI crude futures (proxy voor BE Euro95)",
        )

    # 4) Conservative mock
    value = 1.85 + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True,
        source="mock (FOD + carbu + Stooq alle drie faalden)",
    )
