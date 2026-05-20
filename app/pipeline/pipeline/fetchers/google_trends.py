"""
Google Trends stress-termen fetcher.
Doc 03_Laag-4 §2.5: I-D5-002 — weighted index NL-termen, regio BE.

Mitigatie (doc 02 §13.2 + 03 §4.4 Stap 1):
- zoekvolume-spikes binnen 3 dagen na majeure nieuwsgebeurtenis (I-D5-003)
  worden hier nog NIET ge-decoreleerd — dat gebeurt later in de engine-laag.

WAARSCHUWING (Lazer 2014): Google Trends-validiteit is fragiel.
Real-fetch via onofficiële `pytrends` library.

STATUS: real-fetch met try/except; fallback mock.
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, seasonal_noise


GT_TERMS = ["stress", "burn-out", "slaapproblemen", "moe", "hoofdpijn",
            "angst", "uitgeput", "slapeloosheid"]


def fetch_stress_searches(target_date: date) -> FetchResult:
    try:
        from pytrends.request import TrendReq  # type: ignore
        pytrends = TrendReq(hl="nl-BE", tz=60)
        start = target_date - timedelta(days=14)
        timeframe = f"{start.isoformat()} {target_date.isoformat()}"
        # GT laat maximaal 5 termen per query toe — splits
        scores = []
        for batch in (GT_TERMS[:5], GT_TERMS[5:]):
            pytrends.build_payload(batch, geo="BE", timeframe=timeframe)
            df = pytrends.interest_over_time()
            if not df.empty:
                scores.extend(df[batch].mean().tolist())
        if scores:
            return FetchResult(
                "I-D5-002", sum(scores) / len(scores), target_date.isoformat(),
                simulated=False, source="Google Trends (pytrends)",
            )
    except Exception as e:  # noqa: BLE001
        # Lazer 2014 waarschuwing: GT is fragiel. Mock-fallback is normaal.
        pass
    value = max(0, seasonal_noise(target_date, 50, 10, 15, 0.0))
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (Google Trends — pytrends gefaald of niet geïnstalleerd)",
    )
