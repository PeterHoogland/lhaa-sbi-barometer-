"""
GDELT v2 nieuwsnegativiteit fetcher — v4 met persistent cache.
Doc 03_Laag-4 §2.5: I-D5-001.

Strategie:
1. Probeer GDELT timelinetone (lichtste endpoint)
2. Bij rate-limit of fail: gebruik laatst-succesvolle waarde uit cache (≤14d)
3. Bij geen cache: mock met eerlijke vlag

Cache wordt via `sbi-cache.json` persistent gemaakt en door GitHub Actions
workflow gecommit terug naar de repo (zie .github/workflows/daily.yml).
"""
from __future__ import annotations
import time
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put


def _fetch_timelinetone(target_date: date) -> tuple[bool, float | None]:
    start = (target_date - timedelta(days=7)).strftime("%Y%m%d000000")
    end = target_date.strftime("%Y%m%d235959")
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query=sourcecountry:BE%20sourcelang:dut"
        f"&mode=timelinetone&format=json"
        f"&startdatetime={start}&enddatetime={end}"
    )
    ok, body = safe_request(url, timeout=30)
    if ok and isinstance(body, str) and "limit requests" in body.lower():
        return False, None
    if not ok or not isinstance(body, dict):
        return False, None
    timeline = body.get("timeline", [])
    if not timeline:
        return False, None
    try:
        for series in timeline:
            if series.get("seriesAlias") in ("Average Tone", "AvgTone"):
                points = series.get("data", [])
                if points:
                    avg = sum(p.get("value", 0) for p in points) / len(points)
                    return True, -avg
        first = timeline[0]
        points = first.get("data", [])
        if points:
            avg = sum(p.get("value", 0) for p in points) / len(points)
            return True, -avg
    except (KeyError, ValueError, TypeError, ZeroDivisionError):
        pass
    return False, None


def fetch_news_negativity(target_date: date) -> FetchResult:
    time.sleep(15)  # extra delay om rate-limit voor te zijn
    for attempt in range(3):
        ok, val = _fetch_timelinetone(target_date)
        if ok and val is not None:
            source = "GDELT DOC v2 (timelinetone, 7d avg)"
            cache_put("I-D5-001", val, source, target_date.isoformat())
            return FetchResult(
                "I-D5-001", val, target_date.isoformat(),
                simulated=False, source=source,
            )
        time.sleep(10 + attempt * 6)

    # Fallback: cache hit (≤14d)
    cached = cache_get("I-D5-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-001", value, target_date.isoformat(),
            simulated=False,
            source=f"GDELT cache (laatst succesvol via {prev_source})",
        )

    # Definitief: mock
    value = seasonal_noise(target_date, 2.0, 1.5, 2.0, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT API + cache beide leeg)",
    )
