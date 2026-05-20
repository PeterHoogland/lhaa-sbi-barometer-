"""
FOD WASO — aangekondigde collectieve ontslagen.
Doc 03_Laag-4 §2.3: I-D3-003.

Strategie:
1. Probeer FOD WASO herstructureringen-pagina (NL) via meerdere URL-paden
2. Fallback: Belgisch Staatsblad zoekquery voor "Wet Renault" / "collectief ontslag"
3. Mock fallback

Het concept "Wet Renault"-procedures wordt door werk.belgie.be gepubliceerd
maar de pagina-URL en structuur verandert af en toe. We proberen meerdere
paden om bestendig te zijn tegen URL-wijzigingen.
"""
from __future__ import annotations
import math
import re
from datetime import date
from ..util import FetchResult, safe_request


CANDIDATE_URLS = [
    "https://werk.belgie.be/nl/themas/wet-renault-collectief-ontslag",
    "https://werk.belgie.be/nl/themas/wet-renault",
    "https://werk.belgie.be/nl/zoeken?keys=wet+renault+procedure",
    "https://werk.belgie.be/nl/themas/herstructureringen-en-collectief-ontslag",
]

# Patroon voor "X werknemers" of "X betrokken werknemers" in HTML
WORKERS_PATTERN = re.compile(r"(\d{1,4})\s*(?:betrokken\s+)?werknemers", re.IGNORECASE)


def fetch_collective_layoffs(target_date: date) -> FetchResult:
    aggregate_workers = 0
    found_any = False
    for url in CANDIDATE_URLS:
        ok, body = safe_request(
            url,
            timeout=15,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        matches = WORKERS_PATTERN.findall(body)
        if matches:
            found_any = True
            # Som van alle gevonden werknemer-aantallen op de pagina
            try:
                aggregate_workers = sum(int(m) for m in matches if int(m) < 5000)
                if aggregate_workers > 0:
                    break
            except ValueError:
                continue

    if found_any and aggregate_workers > 0:
        value = math.log1p(aggregate_workers)
        return FetchResult(
            "I-D3-003", value, target_date.isoformat(),
            simulated=False,
            source=f"FOD WASO werk.belgie.be (≈{aggregate_workers} werknemers in procedures)",
        )

    # Conservatief fallback: 0 (geen actieve grote procedures gevonden = baseline)
    return FetchResult(
        "I-D3-003", 0.0, target_date.isoformat(),
        simulated=True,
        source="mock (FOD WASO — geen pagina-treffer, conservatief 0)",
    )
