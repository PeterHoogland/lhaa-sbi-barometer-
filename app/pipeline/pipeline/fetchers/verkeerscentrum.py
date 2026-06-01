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
verkeer een TRAGE grondlast-indicator (niveau, geen dagelijkse spike) — net als
brandstof en inflatie. Zie kern.ts (klasse "traag" + ACHTERGROND_CODES).

EERLIJKE BEPERKING: jaargemiddelden, geen dagwaarden. Tussen jaarrapporten houdt
de indicator het laatste gekende jaargemiddelde vast (zoals inflatie haar laatste
maandprint vasthoudt). Methodebreuk in 2024 (nieuwe rekenmethode) — niet 1-op-1
met 2013-2023; de MAD-normalisatie is robuust tegen dat ene punt.

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


def fetch_traffic_load(target_date: date) -> FetchResult:
    """Geef het laatst gekende jaargemiddelde filezwaarte terug.

    Geen netwerk-call: de officiële reeks is niet machine-leesbaar, dus we houden
    het laatst gepubliceerde jaarcijfer vast tot een nieuw jaarrapport in
    ANNUAL_FILEZWAARTE wordt ingevoerd. observation_date = het meetjaar, zodat de
    UI eerlijk toont dat dit een jaarmaat is (niet de dag van vandaag).
    """
    year = latest_year()
    value = float(ANNUAL_FILEZWAARTE[year])
    return FetchResult(
        "I-D2-001",
        value,
        target_date.isoformat(),
        simulated=False,
        source=SOURCE,
        observation_date=str(year),
    )
