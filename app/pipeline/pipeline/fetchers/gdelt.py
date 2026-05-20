"""
GDELT v2 nieuwsnegativiteit fetcher — verbeterde versie.
Doc 03_Laag-4 §2.5: I-D5-001 — GDELT tone-score, 7-daags voortschrijdend
gemiddelde voor NL-talige Belgische bronnen.

Verbeteringen t.o.v. v1:
- Retry met exponentiële backoff (3 pogingen)
- 30s timeout per poging
- Fallback: artlist endpoint indien tonechart faalt
- Betere parsing (toon bin gemiddelde gewogen naar count)
"""
from __future__ import annotations
import time
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise


def _fetch_tonechart(target_date: date) -> tuple[bool, float | None]:
    """Probeer GDELT tonechart endpoint — return (ok, mean_negativity)."""
    start = (target_date - timedelta(days=7)).strftime("%Y%m%d000000")
    end = target_date.strftime("%Y%m%d235959")
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query=sourcecountry:BE%20sourcelang:dut"
        f"&mode=tonechart&format=json"
        f"&startdatetime={start}&enddatetime={end}"
    )
    ok, body = safe_request(url, timeout=30)
    if not ok or not isinstance(body, dict):
        return False, None
    bins = body.get("tonechart", [])
    if not bins:
        return False, None
    total = sum(b.get("count", 0) for b in bins)
    if total == 0:
        return False, None
    try:
        weighted_tone = sum(float(b.get("bin", 0)) * b.get("count", 0) for b in bins) / total
        return True, -weighted_tone  # negativity = -tone
    except (KeyError, ValueError, TypeError):
        return False, None


def _fetch_artlist_tone(target_date: date) -> tuple[bool, float | None]:
    """Fallback: gebruik artlist endpoint, neem gemiddelde van tone-velden."""
    start = (target_date - timedelta(days=7)).strftime("%Y%m%d000000")
    end = target_date.strftime("%Y%m%d235959")
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query=sourcecountry:BE%20sourcelang:dut"
        f"&mode=artlist&format=json&maxrecords=250&sort=datedesc"
        f"&startdatetime={start}&enddatetime={end}"
    )
    ok, body = safe_request(url, timeout=30)
    if not ok or not isinstance(body, dict):
        return False, None
    arts = body.get("articles", [])
    tones = [a.get("tone") for a in arts if isinstance(a.get("tone"), (int, float))]
    if not tones:
        return False, None
    return True, -(sum(tones) / len(tones))


def fetch_news_negativity(target_date: date) -> FetchResult:
    # GDELT vraagt min. 5s tussen requests. Initiële delay + retry-backoff.
    time.sleep(5)
    for attempt in range(3):
        ok, val = _fetch_tonechart(target_date)
        if ok and val is not None:
            return FetchResult(
                "I-D5-001", val, target_date.isoformat(),
                simulated=False, source="GDELT DOC v2 (tonechart)",
            )
        time.sleep(6 + attempt * 3)  # 6s, 9s, 12s — buiten rate limit

    # Fallback: artlist
    ok, val = _fetch_artlist_tone(target_date)
    if ok and val is not None:
        return FetchResult(
            "I-D5-001", val, target_date.isoformat(),
            simulated=False, source="GDELT DOC v2 (artlist fallback)",
        )

    # Definitive fallback: mock
    value = seasonal_noise(target_date, 2.0, 1.5, 2.0, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT — alle endpoints faalden)",
    )
