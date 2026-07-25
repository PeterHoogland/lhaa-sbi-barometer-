"""
Nederlands valentie-lexicon voor nieuwstoon-analyse.

METHODE
-------
Lexicon-gebaseerde valentie-analyse, de standaardmethode in computationele
sociale wetenschap voor het coderen van nieuwstoon:

  - Young, L. & Soroka, S. (2012). "Affective News: The Automated Coding of
    Sentiment in Political Texts." Political Communication, 29(2), 205-231.
    → de Lexicoder Sentiment Dictionary-methode.
  - Soroka, S., Fournier, P. & Nir, L. (2019). "Cross-national evidence of a
    negativity bias in psychophysiological reactions to news." PNAS 116(38).
    → reeds in doc 02 §8 als onderbouwing van indicator I-D5-001.
  - Leetaru, K. (2013). GDELT Global Knowledge Graph — V2Tone gebruikt
    dezelfde familie van lexicon-gebaseerde toonmeting.

TOON-FORMULE (per artikel, dan gemiddeld over alle artikels):
    tone_article = (pos_count - neg_count) / total_words * 100
    negativity   = -mean(tone_article)

EERLIJKE BEPERKING
------------------
Dit is een gecompileerd lexicon, geen formeel gevalideerd Nederlands
sentiment-woordenboek. De target-state-upgrade is integratie van een
peer-reviewed NL-lexicon (De Smedt & Daelemans 2012, "Pattern", JMLR;
of het NRC Emotion Lexicon, Mohammad & Turney 2013). Tot dan is dit een
transparante, reproduceerbare benadering met expliciete woordenlijst.
Doc 02 §8 erkent reeds dat tone-analyse-validiteit tussen taalgebieden
varieert (Boydstun et al. 2014).
"""
from __future__ import annotations

# Negatieve valentie — nieuws-relevante vocabulaire (crisis, conflict,
# schade, achteruitgang, angst). Stammen + courante varianten.
NEGATIVE = {
    # dood / slachtoffers
    "dood", "doden", "dode", "sterft", "stierf", "gestorven", "overleden",
    "overlijden", "omgekomen", "slachtoffer", "slachtoffers", "fataal",
    "dodelijk", "gewond", "gewonden", "verwond",
    # ramp / catastrofe
    "ramp", "rampen", "rampzalig", "tragedie", "tragisch", "drama",
    "dramatisch", "catastrofe", "catastrofaal", "noodtoestand", "noodweer",
    # geweld / terreur / oorlog
    "aanslag", "aanslagen", "aanval", "aanvallen", "terreur", "terrorist",
    "terroristisch", "geweld", "gewelddadig", "oorlog", "oorlogen",
    "conflict", "conflicten", "gevecht", "strijd", "moord", "vermoord",
    "doodgeschoten", "neergeschoten", "ontvoerd", "ontvoering", "vermist",
    "gijzeling", "explosie", "ontploffing", "bom",
    # brand / natuur
    "brand", "branden", "vuur", "instorting", "ingestort", "instortte",
    "overstroming", "storm", "hittegolf", "droogte", "aardbeving",
    # economie / werk
    "ontslag", "ontslagen", "ontslaat", "afdanking", "afdankingen",
    "faillissement", "failliet", "sluiting", "sluit", "schuld", "schulden",
    "verlies", "verliezen", "verloren", "daling", "gedaald", "dalen",
    "kelderen", "gekelderd", "inzinking", "recessie", "krimp", "krimpt",
    "duurder", "prijsstijging", "armoede", "arm", "honger", "tekort",
    "tekorten", "besparingen", "saneren",
    # sociaal / onrust
    "staking", "stakingen", "staken", "protest", "protesten", "betoging",
    "rel", "rellen", "onrust", "chaos", "paniek",
    # emotie / gezondheid
    "angst", "bang", "vrees", "vrezen", "bezorgd", "bezorgdheid", "zorgen",
    "woede", "boos", "kwaad", "frustratie", "verdriet", "pijn", "lijden",
    "ziek", "ziekte", "besmetting", "virus", "epidemie", "pandemie",
    # dreiging / gevaar
    "dreiging", "bedreiging", "bedreigd", "gevaar", "gevaarlijk", "risico",
    "alarm", "alarmerend", "waarschuwing", "schok", "geschokt",
    # misdaad / schandaal
    "schandaal", "fraude", "corruptie", "misdaad", "crimineel", "diefstal",
    "inbraak", "agressie", "mishandeling",
    # algemeen negatief
    "slecht", "slechter", "slechtste", "fout", "fouten", "mislukt",
    "mislukking", "falen", "gefaald", "probleem", "problemen", "moeilijk",
    "zwaar", "kritiek", "bekritiseerd", "klacht", "klachten", "boete",
    "straf", "veroordeeld", "ruzie", "spanning", "spanningen", "breuk",
    "eenzaam", "eenzaamheid", "depressie", "somber", "wanhoop", "hopeloos",
    "verontrustend", "zorgwekkend", "ernstig", "verslechtering",
}

# Positieve valentie
POSITIVE = {
    # succes / prestatie
    "succes", "succesvol", "gelukt", "geslaagd", "akkoord", "overeenkomst",
    "deal", "oplossing", "opgelost", "doorbraak", "prestatie", "presteren",
    "record", "kampioen", "winst", "gewonnen", "won", "zege", "overwinning",
    # vrede / hulp / herstel
    "vrede", "vreedzaam", "hulp", "geholpen", "helpen", "steun", "gesteund",
    "steunt", "redding", "gered", "redt", "herstel", "hersteld", "herstellen",
    "veerkracht", "solidariteit",
    # groei / vooruitgang
    "groei", "gegroeid", "groeit", "bloei", "bloeiend", "vooruitgang",
    "verbetering", "verbeterd", "verbetert", "ontwikkeling", "innovatie",
    "investering", "investeert", "opening", "geopend", "nieuw", "vernieuwd",
    "stijging", "gestegen", "toename", "voorspoed", "welvaart",
    # emotie / positief
    "beter", "best", "beste", "blij", "vrolijk", "gelukkig", "geluk",
    "tevreden", "trots", "viert", "gevierd", "feest", "viering", "applaus",
    "geprezen", "lof", "dankbaar", "dank", "hoop", "hoopvol", "optimisme",
    "optimistisch", "vertrouwen",
    # kwaliteit
    "mooi", "prachtig", "schitterend", "geweldig", "fantastisch",
    "uitstekend", "knap", "sterk", "sterker", "krachtig", "gezond",
    "veilig", "veiligheid", "bescherming", "beschermd",
    # verbinding
    "vrij", "vrijheid", "samen", "samenwerking", "verbonden", "vriendschap",
    "liefde", "warmte", "genereus", "vrijgevig", "gul", "kans", "kansen",
    "duurzaam", "groen", "schoon", "talent", "gewaardeerd", "eerlijk",
    "rust", "kalm", "stabiel", "stabiliteit",
}

from .lexicon_pattern_nl import POLARITY as _PATTERN_POL, LEXICON_VERSION as _PATTERN_VER

# v0.5 §9.3 Laag 1: Pattern.nl (CLiPS, Universiteit Antwerpen, PDDL) ALS basis
# (2.7k+ NL-woorden met gevalideerde polariteit), met daarbovenop onze eigen
# nieuws-domein overrides (NEGATIVE/POSITIVE) die ramp/aanslag/...-termen
# een sterk signaal geven van ±1.0.
LEXICON_VERSION = f"{_PATTERN_VER}+nieuws-overlay-1.0"
LEXICON_SIZE = len(_PATTERN_POL) + len(NEGATIVE) + len(POSITIVE)

_PUNCT = ".,;:!?\"'()[]«»–-…*#>"


def _word_polarity(w: str) -> float:
    """Polariteit ∈ [-1, +1]. Nieuws-overlay slaat Pattern over."""
    if w in NEGATIVE:
        return -1.0
    if w in POSITIVE:
        return +1.0
    return _PATTERN_POL.get(w, 0.0)


def tone_of_text(text: str, min_words: int = 3) -> tuple[float, int] | None:
    """Toon van één tekst-eenheid (headline + lead) — v0.5 §9.4.
    Som van per-woord polariteit gedeeld door aantal woorden, × 100.
    Hogere score = positiever; lagere = negatiever. Zelfde schaal als v0.2,
    maar nu met continue valenties uit een gevalideerd lexicon (Pattern.nl)
    in plaats van binaire +1/-1 woorddetectie.
    Return (tone, n_words), of None wanneer de tekst te kort is."""
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    words = [w for w in words if w]
    n = len(words)
    if n < min_words:
        return None
    total = sum(_word_polarity(w) for w in words)
    return total / n * 100, n
