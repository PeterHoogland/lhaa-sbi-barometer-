"""
GDELT v2 nieuwsnegativiteit fetcher — v3 met timelinetone modus.
Doc 03_Laag-4 §2.5: I-D5-001.

Wijziging t.o.v. v2: gebruikt **timelinetone**-modus i.p.v. tonechart.
Timelinetone is een licht endpoint dat per dag een gemiddelde toon-score
teruggeeft over de zoekquery. Veel minder rate-limited dan tonechart.

Initial delay 10s om GDELT's "1 request per 5 seconds"-policy te respecteren
in CI-omgeving (waar deze fetcher binnen een batch wordt geroepen).
"""
from __future__ import annotations
import time
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise


def _fetch_timelinetone(target_date: date) -> tuple[bool, float | None]:
    """Probeer GDELT timelinetone — gemiddelde toon over 7d window."""
    start = (target_date - timedelta(days=7)).strftime("%Y%m%d000000")
    end = target_date.strftime("%Y%m%d235959")
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query=sourcecountry:BE%20sourcelang:dut"
        f"&mode=timelinetone&format=json"
        f"&startdatetime={start}&enddatetime={end}"
    )
    ok, body = safe_request(url, timeout=30)
    # GDELT serveert rate-limit als plain-text body met "Please limit" tekst
    if ok and isinstance(body, str) and "limit requests" in body.lower():
        return False, None
    if not ok or not isinstance(body, dict):
        return False, None
    timeline = body.get("timeline", [])
    if not timeline:
        return False, None
    # timeline is list of series; "Average Tone" series is what we want
    try:
        for series in timeline:
            if series.get("seriesAlias") in ("Average Tone", "AvgTone"):
                points = series.get("data", [])
                if points:
                    avg = sum(p.get("value", 0) for p in points) / len(points)
                    return True, -avg  # negativity = -tone
        # If named series not found, use the first one
        first = timeline[0]
        points = first.get("data", [])
        if points:
            avg = sum(p.get("value", 0) for p in points) / len(points)
            return True, -avg
    except (KeyError, ValueError, TypeError, ZeroDivisionError):
        pass
    return False, None


def fetch_news_negativity(target_date: date) -> FetchResult:
    # Respect GDELT's 5s rate limit
    time.sleep(10)
    for attempt in range(3):
        ok, val = _fetch_timelinetone(target_date)
        if ok and val is not None:
            return FetchResult(
                "I-D5-001", val, target_date.isoformat(),
                simulated=False, source="GDELT DOC v2 (timelinetone, 7d avg)",
            )
        time.sleep(8 + attempt * 4)  # 8s, 12s, 16s

    value = seasonal_noise(target_date, 2.0, 1.5, 2.0, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT — alle endpoints faalden)",
    )
