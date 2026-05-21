"""
Ontslag-radar (I-D3-003S) — SECUNDAIR signaal.
Doc 02 §10 (secundaire signalen, niet in de composiet).

WAAROM SECUNDAIR
----------------
De primaire ontslag-indicator I-D3-003 draait op de ECB-LFSI-werkloosheids-
delta: een echte officiele bron met een echte, schaal-consistente baseline,
maar met ~2 maanden vertraging.

Collectieve ontslagen worden echter onmiddellijk publiek zodra een bedrijf
ze aankondigt. Deze radar telt elke dag hoeveel Belgische nieuwsartikels
een collectief-ontslag-thema bevatten. Dat is een verse, real-time lezing,
maar zonder een lange eigen historie heeft ze geen betrouwbare meetlat.
Daarom rapporteren we ze als SECUNDAIR signaal (zoals de Reddit-peiling):
zichtbaar en actueel, maar buiten de composiet en de Z-scoring.

Methode: trefwoord-detectie over dezelfde RSS-corpus die de nieuwstoon-
controle gebruikt. Eerlijk over de beperking: trefwoord-tellen overschat
bij veel duiding rond één gebeurtenis. Het is een attentie-radar, geen
banentelling.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request
from ..cache import get as cache_get, put as cache_put
from .gdelt import RSS_FEEDS, _parse_rss_texts

# Trefwoorden voor collectief-ontslag-/herstructurerings-nieuws.
LAYOFF_TERMS = [
    "collectief ontslag", "collectieve ontslag", "naakte ontslag",
    "herstructurering", "herstructureren", "intentie tot ontslag",
    "wet renault", "banenverlies", "banen verlies", "jobs op de tocht",
    "ontslagronde", "ontslagen vallen", "afslanking", "afdanking",
    "bedrijf sluit", "sluiting van", "faillissement", "failliet",
    "saneringsplan", "herstructureringsplan",
]
# Aantal-banen-detectie ("400 jobs", "1.200 banen")
_JOBS_RE = re.compile(r"(\d[\d.]{1,6})\s*(?:jobs|banen|werknemers|jobverlies)", re.IGNORECASE)


def _matches(text: str) -> bool:
    low = text.lower()
    return any(term in low for term in LAYOFF_TERMS)


def fetch_layoff_radar(target_date: date) -> FetchResult:
    """SECUNDAIR I-D3-003S: telt collectief-ontslag-artikels in de BE-pers."""
    hit_articles = 0
    job_total = 0
    feeds_ok = 0
    for url, _key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        feeds_ok += 1
        for text in _parse_rss_texts(body):
            if _matches(text):
                hit_articles += 1
                for m in _JOBS_RE.finditer(text):
                    try:
                        job_total += int(m.group(1).replace(".", ""))
                    except ValueError:
                        pass

    if feeds_ok >= 4:
        jobs_note = f", ~{job_total} expliciet genoemde jobs" if job_total else ""
        source = (
            f"Ontslag-radar: {hit_articles} artikels met collectief-ontslag-thema "
            f"in {feeds_ok} BE-nieuwsbronnen{jobs_note}; SECUNDAIR, "
            f"trefwoord-detectie, niet in composiet"
        )
        cache_put("I-D3-003S", float(hit_articles), source, target_date.isoformat())
        return FetchResult(
            "I-D3-003S", float(hit_articles), target_date.isoformat(),
            simulated=False, source=source, observation_date=target_date.isoformat(),
        )

    # Cache-fallback
    cached = cache_get("I-D3-003S")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-003S", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    return FetchResult(
        "I-D3-003S", 0.0, target_date.isoformat(),
        simulated=True, source="mock (RSS-feeds onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
