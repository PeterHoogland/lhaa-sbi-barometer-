"""
Frans valentie-lexicon voor nieuwstoon-analyse (Franstalig België).

WAAROM (Peter 2026-06-03: "Franstalig BE moet doorwegen")
---------------------------------------------------------
De toon-analyse was NL-only (Pattern.nl). Franstalige BE-koppen (RTBF, Le Soir,
La Libre, BX1...) scoorden 0. Dit lexicon geeft ze een echte toon, met exact
dezelfde transparante methode als lexicon_nl.py: Pattern.fr (CLiPS, BSD, vrij
commercieel) als basis + een nieuws-domein overlay voor de sterke stress-termen
die Pattern.fr mist (het bevat vooral bijvoeglijke naamwoorden, geen zelfstandige
naamwoorden als guerre/accident/mort/grève) + dezelfde negatie- en versterker-laag.

LICENTIE: Pattern.fr is BSD-3-Clause (vrij, ook commercieel). De overlay is eigen
werk. Dus geen licentie-grijszone (anders dan FEEL/NRC). Emoties (FEEL) blijven
voorlopig NL-only / trigger-laag; dit dekt de TOON, wat Peter vroeg.
"""
from __future__ import annotations

# Negatieve valentie — Franstalige nieuws-stress-vocabulaire (vooral de zelfstandige
# naamwoorden + sleuteltermen die Pattern.fr mist). Stammen + courante varianten.
NEGATIVE_FR = {
    # mort / victimes
    "mort", "morts", "morte", "mortes", "décès", "décédé", "décédée", "tué",
    "tués", "tuée", "victime", "victimes", "blessé", "blessés", "blessée",
    "mortel", "mortelle", "mortels", "décéder", "péri", "disparu", "disparus",
    # drame / catastrophe
    "drame", "drames", "dramatique", "tragédie", "tragique", "catastrophe",
    "désastre", "calamité", "sinistre",
    # violence / guerre / terreur
    "guerre", "guerres", "attentat", "attentats", "terrorisme", "terroriste",
    "violence", "violences", "agression", "meurtre", "assassinat", "fusillade",
    "tir", "explosion", "fusil", "bombe", "otage", "enlèvement", "conflit",
    "affrontement", "émeute", "émeutes", "coups",
    # nature / feu
    "incendie", "incendies", "feu", "inondation", "inondations", "tempête",
    "orage", "séisme", "tremblement", "canicule", "sécheresse", "effondrement",
    "évacuation", "évacués",
    # accident / transport
    "accident", "accidents", "collision", "carambolage", "déraillement",
    "naufrage", "crash", "percuté",
    # économie / travail
    "chômage", "licenciement", "licenciements", "faillite", "fermeture",
    "crise", "récession", "inflation", "dette", "dettes", "pénurie", "pauvreté",
    "précarité", "hausse", "effondrement", "krach", "restructuration",
    # social / onrust
    "grève", "grèves", "manifestation", "manifestations", "blocage", "blocages",
    "colère", "protestation", "tensions", "conflit", "révolte",
    # émotion / santé
    "angoisse", "peur", "stress", "burnout", "dépression", "détresse", "panique",
    "souffrance", "deuil", "maladie", "épidémie", "pandémie", "virus", "contamination",
    # menace / danger
    "menace", "menaces", "danger", "dangereux", "alerte", "urgence", "risque",
    "péril", "alarmant", "inquiétude", "inquiétant",
    # crime / scandale
    "scandale", "fraude", "corruption", "crime", "vol", "cambriolage", "abus",
    "trafic", "escroquerie",
    # général négatif
    "échec", "problème", "problèmes", "grave", "pire", "catastrophique",
    "alarmante", "préoccupant", "dégradation", "chaos", "désespoir",
}

# Positieve valentie — om de schaal in balans te houden (analoog aan lexicon_nl).
POSITIVE_FR = {
    "succès", "victoire", "accord", "paix", "sauvetage", "secours", "sauvé",
    "sauvés", "rescapé", "espoir", "reprise", "relance", "croissance",
    "amélioration", "soulagement", "solidarité", "guéri", "guérison", "record",
    "réussite", "réussi", "progrès", "rétablissement", "soutien", "aide",
    "libéré", "libération", "bonheur", "heureux", "réconciliation", "apaisement",
    "sérénité", "stabilité", "prospérité", "innovation", "opportunité",
}

from .lexicon_pattern_fr import POLARITY as _PATTERN_POL, LEXICON_VERSION as _PATTERN_VER

LEXICON_VERSION = f"{_PATTERN_VER}+nieuws-overlay-fr-1.0"
LEXICON_SIZE = len(_PATTERN_POL) + len(NEGATIVE_FR) + len(POSITIVE_FR)

_PUNCT = ".,;:!?\"'()[]«»–-…*#>"

# --- Valentie-verschuivers (Frans) ---
NEGATORS_FR = {
    "pas", "plus", "jamais", "rien", "aucun", "aucune", "sans", "ni",
    "personne", "nullement", "non",
}
BOOSTERS_FR = {
    "très": 1.5, "extrêmement": 1.8, "vraiment": 1.3, "tellement": 1.5,
    "fortement": 1.5, "gravement": 1.6, "profondément": 1.5, "terriblement": 1.7,
    "particulièrement": 1.4, "hautement": 1.5, "complètement": 1.4,
    "totalement": 1.4, "absolument": 1.5, "trop": 1.3,
}
DIMINISHERS_FR = {
    "peu": 0.5, "légèrement": 0.6, "assez": 0.7, "plutôt": 0.7,
    "à": 1.0, "faiblement": 0.5,
}
_NEG_WINDOW = 3


def _word_polarity_fr(w: str) -> float:
    if w in NEGATIVE_FR:
        return -1.0
    if w in POSITIVE_FR:
        return +1.0
    return _PATTERN_POL.get(w, 0.0)


def tone_of_text_fr(text: str, min_words: int = 3) -> tuple[float, int] | None:
    """Toon van een Franstalige tekst-eenheid. Identieke methode als tone_of_text
    (NL): per-woord polariteit met negatie + versterkers, gedeeld door aantal
    woorden × 100. Return (tone, n_words) of None bij te korte tekst."""
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    words = [w for w in words if w]
    n = len(words)
    if n < min_words:
        return None
    total = 0.0
    neg_left = 0
    mult = 1.0
    for w in words:
        if w in NEGATORS_FR:
            neg_left = _NEG_WINDOW
            continue
        if w in BOOSTERS_FR:
            mult = BOOSTERS_FR[w]
            continue
        if w in DIMINISHERS_FR:
            mult = DIMINISHERS_FR[w]
            continue
        pol = _word_polarity_fr(w)
        if pol != 0.0:
            if neg_left > 0:
                pol = -pol * 0.5
                neg_left = 0
            total += pol * mult
            mult = 1.0
        if neg_left > 0:
            neg_left -= 1
    return total / n * 100, n
