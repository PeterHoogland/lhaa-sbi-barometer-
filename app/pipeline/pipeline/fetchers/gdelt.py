"""
GDELT v2 nieuwsnegativiteit fetcher.
Doc 03_Laag-4 §2.5: I-D5-001 — GDELT tone-score, 7-daags voortschrijdend
gemiddelde voor NL-talige Belgische bronnen.

GDELT levert publieke datasets via BigQuery én via 2.0 DOC-API REST.
Real-fetch via DOC-API (gratis, geen token):
  https://api.gdeltproject.org/api/v2/doc/doc?query=...&mode=tonechart
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise


def fetch_news_negativity(target_date: date) -> FetchResult:
    # Bevraag GDELT DOC 2.0 — sourcecountry:BE, sourcelang:dut
    # Voor 7-daags voortschrijdend: query last 7 days, neem gem. tone, neg.
    start = (target_date - timedelta(days=7)).strftime("%Y%m%d000000")
    end = target_date.strftime("%Y%m%d235959")
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query=sourcecountry:BE%20sourcelang:dut"
        f"&mode=tonechart&format=json"
        f"&startdatetime={start}&enddatetime={end}"
    )
    ok, body = safe_request(url, timeout=20)
    if ok and isinstance(body, dict):
        # GDELT tonechart returns binned counts; we approximate the mean
        # tone as weighted center of tonechart bins
        try:
            bins = body.get("tonechart", [])
            if bins:
                total = sum(b.get("count", 0) for b in bins)
                if total > 0:
                    weighted = sum(float(b.get("bin", 0)) * b.get("count", 0) for b in bins) / total
                    # Negativity = -tone
                    return FetchResult(
                        "I-D5-001", -weighted, target_date.isoformat(),
                        simulated=False, source="GDELT DOC v2",
                    )
        except (KeyError, ValueError, TypeError):
            pass
    value = seasonal_noise(target_date, 2.0, 1.5, 2.0, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT — fallback)",
    )
