"""
FOD WASO collectieve-ontslagen fetcher.
Doc 03_Laag-4 §2.3: I-D3-003 = log(1 + werknemers in procedure / week).

STATUS: skeleton. FOD WASO publiceert wekelijkse lijst van Renault-
procedures op werk.belgie.be — vereist HTML-scraping. Geen open API.
"""
from __future__ import annotations
import math
import random
from datetime import date
from ..util import FetchResult


def fetch_collective_layoffs(target_date: date) -> FetchResult:
    # Mock: gemiddeld 80 werknemers/week met sporadische pieken
    workers = max(0, int(random.gauss(80, 60)))
    value = math.log1p(workers)
    return FetchResult(
        "I-D3-003", value, target_date.isoformat(),
        simulated=True, source="mock (FOD WASO — TODO_REAL_FETCH)",
    )
