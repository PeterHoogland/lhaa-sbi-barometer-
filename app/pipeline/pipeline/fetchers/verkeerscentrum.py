"""
Vlaams Verkeerscentrum — filezwaarte (officiële jaarmaat) voor I-D2-001.
Doc 03_Laag-4 §2.1 + MASTERDOCUMENT-v0.4-addendum (Pad A-amendement, 2026-06).

v0.4-HERDEFINITIE (Pad A). De indicator meet nu de OFFICIËLE filezwaarte —
filelengte × fileduur in kilometeruren per werkdag — uit de jaarrapporten
"Verkeersindicatoren Snelwegen Vlaanderen" van het Vlaams Verkeerscentrum. Dat
is exact de tijds-geïntegreerde maat die doc 03 §2.1 voorschreef.

WAAROM de verandering: de vorige bron schraapte het MOMENTANE aantal km file van
de homepage (× 60) — een toegegeven proxy op een andere schaal, zonder enige
historische baseline (de oude history was 3 ruis-punten). Er bestaat GEEN
publiek machine-leesbare historische filezwaarte-reeks: de webtool
indicatoren.verkeerscentrum.be is interactief (geen API/CSV/JSON), DATEX II is
realtime-only, en het Vlaams Dataportaal Verkeersgegevens vereist Itsme-auth.
Bevestigd via deep-research (juni 2026); de datacatalogus verwijst voor
automatische toegang naar wegen.verkeer@mow.vlaanderen.be.

De officiële JAARGEMIDDELDEN zijn wél citeerbaar en betrouwbaar. Daarmee wordt
verkeer een TRAGE grondlast-indicator — net als brandstof en inflatie. Zie
kern.ts (klasse "traag" + ACHTERGROND_CODES).

YoY-AMENDEMENT (2026-06, pre-registratie doc 00 §13 grond A2): we scoren niet
langer het NIVEAU maar de JAAR-OP-JAAR-VERANDERING (% t.o.v. vorig jaar). Reden:
filezwaarte heeft een sterke opwaartse trend (604→952, +58%), en een MAD-Z op het
niveau veronderstelt een STATIONAIRE reeks. Bij een stijgende reeks is het nieuwste
jaar bijna altijd het hoogste → permanent "uitzonderlijk hoog" (z_lang ~4,4) — een
artefact van de trend, geen signaal. De verandering (2024 = +12,7%) is wél eerlijk:
"groeit de file-druk abnormaal snel?" → z ~0,3 (gewoon). De prijs van deze keuze:
we meten niet langer het absolute recordniveau als grondlast, enkel de abnormale groei.

EERLIJKE BEPERKING: jaarcijfers, geen dagwaarden. Tussen jaarrapporten houdt de
indicator de laatst gekende jaar-op-jaar-groei vast (zoals inflatie haar laatste
maandprint vasthoudt). Methodebreuk in 2024 (nieuwe rekenmethode) — een stuk van de
+12,7% is methode, niet extra file; de MAD-normalisatie is robuust tegen dat punt.

Bron: Jaarrapport Verkeersindicatoren Snelwegen Vlaanderen 2024, Tabel 10
(jaargemiddelde filezwaarte Vlaanderen, km·uur/werkdag, volledige dag 0-24u).
https://www.verkeerscentrum.be/sites/default/files/2025-04/Jaarrapport_Verkeersindicatoren_SnelwegenVlaanderen_2024.pdf
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult


# Officiële jaargemiddelde filezwaarte Vlaanderen (km·uur/werkdag). Bron:
# Verkeerscentrum, Jaarrapport 2024 Tabel 10. Citeerbaar en stabiel; werk deze
# tabel bij wanneer een nieuw jaarrapport verschijnt (ten vroegste de 19e van de
# maand na het meetjaar) en draai dan scripts/backfill_verkeer_baseline.py.
ANNUAL_FILEZWAARTE: dict[int, float] = {
    2013: 604,
    2014: 627,
    2015: 643,
    2016: 732,
    2017: 779,
    2018: 756,
    2019: 772,
    2020: 377,  # corona-dip
    2021: 554,
    2022: 726,
    2023: 845,
    2024: 952,  # methodebreuk: nieuwe rekenmethode vanaf dit jaar
}

SOURCE = (
    "Vlaams Verkeerscentrum — Jaarrapport Verkeersindicatoren Snelwegen "
    "Vlaanderen 2024, Tabel 10 (jaargemiddelde filezwaarte, km·uur/werkdag)"
)


def latest_year() -> int:
    return max(ANNUAL_FILEZWAARTE)


def yoy_growth(year: int) -> float:
    """Jaar-op-jaar % verandering van de filezwaarte voor `year` (t.o.v. year-1)."""
    prev = ANNUAL_FILEZWAARTE[year - 1]
    return (ANNUAL_FILEZWAARTE[year] - prev) / prev * 100.0


def fetch_traffic_load(target_date: date) -> FetchResult:
    """Geef de laatst gekende JAAR-OP-JAAR-VERANDERING van de filezwaarte terug (%).

    Geen netwerk-call: de officiële reeks is niet machine-leesbaar, dus we houden de
    laatst gepubliceerde jaargroei vast tot een nieuw jaarrapport in ANNUAL_FILEZWAARTE
    wordt ingevoerd. We scoren de VERANDERING, niet het niveau (zie YoY-amendement in de
    module-docstring). observation_date = het meetjaar, zodat de UI eerlijk toont dat dit
    een jaarcijfer is (niet de dag van vandaag).
    """
    year = latest_year()
    value = yoy_growth(year)
    return FetchResult(
        "I-D2-001",
        value,
        target_date.isoformat(),
        simulated=False,
        # Jaarconstante uit het Verkeerscentrum-jaarrapport: een echte cijferbron,
        # maar GEEN verse dagmeting. Eerlijk als geimputeerd vlaggen (A7) zodat de
        # data-quality-laag + de breakdown het niet als verse live meting tonen.
        imputed=True,
        source=SOURCE,
        observation_date=str(year),
    )
