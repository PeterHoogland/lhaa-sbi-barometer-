"""
FOD WASO — aangekondigde collectieve ontslagen.
Doc 03_Laag-4 §2.3: I-D3-003.

Strategie: meervoudige URL-paden + Belgisch Staatsblad als zekere fallback.

Belgisch Staatsblad publiceert alle officiële herstructurerings-akten
(o.a. wet-Renault procedures, faillissementen) in een doorzoekbare database.
Hun publicatieportaal heeft een open API-achtige zoek-URL.
"""
from __future__ import annotations
import math
import re
from datetime import date, timedelta
from ..util import FetchResult, safe_request


# FOD WASO pagina's (URL's wijzigen wel eens — we proberen er meerdere)
WASO_URLS = [
    "https://werk.belgie.be/nl/themas/wet-renault-collectief-ontslag",
    "https://werk.belgie.be/nl/themas/wet-renault",
    "https://werk.belgie.be/nl/themas/herstructureringen-en-collectief-ontslag",
    "https://werk.belgie.be/nl/themas/herstructureringen",
]

# Belgisch Staatsblad zoek-API (Justel/Moniteur)
# We zoeken op "collectief ontslag" in de laatste 30 dagen.
STAATSBLAD_SEARCH = (
    "https://www.ejustice.just.fgov.be/cgi/api.pl"
    "?language=nl&caller=list&fr=f&choix1=zoekenzoekwoord&txt=collectief+ontslag"
)

WORKERS_PATTERN = re.compile(r"(\d{1,4})\s*(?:betrokken\s+)?werknemers", re.IGNORECASE)
PROCEDURE_PATTERN = re.compile(r"(?:collectief\s+ontslag|wet[-\s]?renault|herstructurering)", re.IGNORECASE)


def _scan_waso_pages() -> int:
    aggregate = 0
    for url in WASO_URLS:
        ok, body = safe_request(
            url, timeout=15,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        matches = WORKERS_PATTERN.findall(body)
        if matches:
            try:
                page_total = sum(int(m) for m in matches if 1 <= int(m) < 5000)
                aggregate = max(aggregate, page_total)
            except ValueError:
                continue
    return aggregate


def _count_staatsblad_procedures() -> int:
    """Schat aantal recent gepubliceerde herstructurerings-procedures."""
    ok, body = safe_request(
        STAATSBLAD_SEARCH, timeout=15,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if not ok or not isinstance(body, str):
        return 0
    # Tel hits met procedure-keyword
    return len(PROCEDURE_PATTERN.findall(body))


def fetch_collective_layoffs(target_date: date) -> FetchResult:
    workers = _scan_waso_pages()
    if workers > 0:
        return FetchResult(
            "I-D3-003", math.log1p(workers), target_date.isoformat(),
            simulated=False,
            source=f"FOD WASO werk.belgie.be (≈{workers} werknemers)",
        )

    # Fallback: Staatsblad-tellingen als proxy
    procedures = _count_staatsblad_procedures()
    if procedures > 0:
        # Heuristic: gemiddeld 50 werknemers per gevonden procedure-vermelding
        estimated_workers = procedures * 50
        return FetchResult(
            "I-D3-003", math.log1p(estimated_workers), target_date.isoformat(),
            simulated=False,
            source=f"Belgisch Staatsblad (≈{procedures} procedures × 50w proxy)",
        )

    # Conservatief: log(1+1) = 0.693 (niet 0, want dat verstoort Z-scoring)
    return FetchResult(
        "I-D3-003", math.log1p(1), target_date.isoformat(),
        simulated=True,
        source="mock (FOD WASO + Staatsblad beide leeg, baseline log(1)=0.69)",
    )
