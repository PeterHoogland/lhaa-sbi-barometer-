"""
Google Trends stress-termen fetcher — v2 met cache-fallback.
Doc 03_Laag-4 §2.5: I-D5-002 — weighted index NL-termen, regio BE.

WAARSCHUWING (Lazer 2014): Google Trends-validiteit is fragiel.
pytrends is de enige gratis weg en wordt door Google regelmatig
rate-limited (429). Daarom dezelfde cache-strategie als GDELT:

Ladder:
1. pytrends real-fetch (met retry)
2. cache (laatst succesvolle waarde, ≤14 dagen)
3. mock met eerlijke vlag

De cache wordt via sbi-cache.json door de GitHub Actions workflow
gecommit terug naar de repo.
"""
from __future__ import annotations
import time
from datetime import date, timedelta
from ..util import FetchResult, seasonal_noise
from ..cache import get as cache_get, put as cache_put


GT_TERMS = ["stress", "burn-out", "slaapproblemen", "moe", "hoofdpijn",
            "angst", "uitgeput", "slapeloosheid"]


def _try_pytrends(target_date: date) -> float | None:
    """Eén poging via pytrends. Return gemiddelde index of None."""
    try:
        from pytrends.request import TrendReq  # type: ignore
        pytrends = TrendReq(hl="nl-BE", tz=60, retries=2, backoff_factor=1.0)
        start = target_date - timedelta(days=14)
        timeframe = f"{start.isoformat()} {target_date.isoformat()}"
        scores = []
        for batch in (GT_TERMS[:5], GT_TERMS[5:]):
            pytrends.build_payload(batch, geo="BE", timeframe=timeframe)
            df = pytrends.interest_over_time()
            if not df.empty:
                scores.extend(df[batch].mean().tolist())
            time.sleep(1)  # kleine pauze tussen batches
        if scores:
            return sum(scores) / len(scores)
    except Exception:  # noqa: BLE001
        pass
    return None


def fetch_stress_searches(target_date: date) -> FetchResult:
    # 1) pytrends real-fetch (2 pogingen met pauze)
    for attempt in range(2):
        val = _try_pytrends(target_date)
        if val is not None:
            source = "Google Trends (pytrends)"
            cache_put("I-D5-002", val, source, target_date.isoformat())
            return FetchResult(
                "I-D5-002", val, target_date.isoformat(),
                simulated=False, source=source,
            )
        if attempt == 0:
            time.sleep(8)

    # 2) Cache-fallback (≤14d) — echte data, mogelijk een paar dagen oud
    cached = cache_get("I-D5-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-002", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
        )

    # 3) Mock
    value = max(0, seasonal_noise(target_date, 50, 10, 15, 0.0))
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (pytrends + cache beide leeg)",
    )
