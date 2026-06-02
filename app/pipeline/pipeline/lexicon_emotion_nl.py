"""
Nederlands emotie-lexicon — discrete stress-emoties in nieuwsheadlines.

WAAROM (V6-sessie, Peters vraag: "headlines bepalen veel in de stressvorming")
------------------------------------------------------------------------------
De valentie-meting (lexicon_nl.py) scoort één as: HOE negatief. Maar niet alle
negativiteit weegt even zwaar op stress. De psychofysiologische stress-respons
wordt vooral gedreven door specifieke emoties — woede, angst, verdriet, walging
(Soroka, Fournier & Nir 2019, PNAS; Marin et al. 2012, PLoS ONE). Dit lexicon
scoort headlines op die vier discrete emoties, BOVENOP de valentie.

PLAATS IN HET MODEL
-------------------
Trigger-/signaallaag, NIET het publieke 1-5-cijfer. Mediatoon/-emotie ≠
bevolkingsstress (grade-D, review §3): een woede-/angstpiek scherpt het
campagnesignaal, maar stuurt het publieke cijfer niet. Vlaams/NL.

METHODE
-------
Lexicon-telling per emotie-categorie (subset van Plutchiks basisemoties),
dezelfde transparante, reproduceerbare benadering als lexicon_nl.py. Een woord
mag in meerdere categorieën vallen (bv. "tragedie" → verdriet; "schandalig" →
woede + walging). Target-state-upgrade: het NRC Emotion Lexicon (Mohammad &
Turney 2013, NL-variant) of een fine-tuned RobBERT-emotieclassifier.

EERLIJKE BEPERKING
------------------
Een gecompileerde woordenlijst, geen formeel gevalideerd NL-emotielexicon.
Stammen + courante varianten; geen lemmatisering. Bewust transparant: de hele
lijst staat hieronder en is reproduceerbaar.
"""
from __future__ import annotations

# Vier stress-relevante emoties. Per categorie nieuws-relevante NL-vocabulaire
# (stammen + courante varianten). Overlap tussen categorieën is toegestaan.
WOEDE = {
    "woede", "woedend", "woede-uitbarsting", "woedeaanval", "boos", "boosheid",
    "kwaad", "kwaadheid", "razend", "razernij", "furieus", "verbolgen",
    "verontwaardiging", "verontwaardigd", "verontwaardigde", "frustratie",
    "gefrustreerd", "agressie", "agressief", "protest", "protesten",
    "protesteren", "protesteert", "betoging", "betogen", "betogers", "staking",
    "stakingen", "staken", "stakers", "rel", "rellen", "opstand", "oproer",
    "verzet", "boycot", "aanklacht", "beschuldigt", "beschuldiging", "eist",
    "eisen", "veroordeelt", "schande", "schandalig", "onrecht", "onrechtvaardig",
    "ruzie", "scheldt", "tegenstand", "woede-uitbarstingen",
}
ANGST = {
    "angst", "angstig", "angstaanjagend", "bang", "vrees", "vrezen", "gevreesd",
    "bezorgd", "bezorgdheid", "ongerust", "ongerustheid", "paniek", "panisch",
    "schrik", "geschrokken", "terreur", "terreurdreiging", "dreiging",
    "bedreiging", "bedreigd", "gevaar", "gevaarlijk", "risico", "risico's",
    "alarm", "alarmerend", "waarschuwing", "waarschuwt", "onzeker",
    "onzekerheid", "crisis", "noodtoestand", "evacuatie", "evacueren",
    "geëvacueerd", "dreigend", "dreigende", "beangstigend", "verontrustend",
    "zorgwekkend", "nachtmerrie", "onveilig", "vluchten",
}
VERDRIET = {
    "verdriet", "verdrietig", "droevig", "droef", "treurig", "treuren",
    "rouw", "rouwen", "rouwt", "tranen", "huilen", "huilt", "wanhoop",
    "wanhopig", "hopeloos", "somber", "somberheid", "depressie", "depressief",
    "eenzaam", "eenzaamheid", "gemis", "verlies", "verloren", "leed", "lijden",
    "lijdt", "pijn", "gebroken", "teleurgesteld", "teleurstelling", "tragedie",
    "tragisch", "tragische", "drama", "dramatisch", "slachtoffer", "slachtoffers",
    "overleden", "betreurt", "afscheid", "verloor",
}
WALGING = {
    "walging", "walgelijk", "walgelijke", "walgt", "weerzin", "afkeer",
    "afschuw", "afschuwelijk", "afschuwelijke", "gruwel", "gruwelijk",
    "gruwelijke", "gruweldaad", "weerzinwekkend", "weerzinwekkende",
    "schandalig", "schande", "corruptie", "corrupt", "fraude", "frauduleus",
    "misbruik", "mishandeling", "mishandeld", "wantoestand", "wantoestanden",
    "smerig", "vies", "verrot", "verziekt", "schaamteloos", "stuitend",
    "misselijk", "onsmakelijk", "schending", "schennis",
}

EMOTIONS: dict[str, set[str]] = {
    "woede": WOEDE,
    "angst": ANGST,
    "verdriet": VERDRIET,
    "walging": WALGING,
}
EMOTION_CATEGORIES = tuple(EMOTIONS.keys())

LEXICON_VERSION = "nl-emotie-1.0"
LEXICON_SIZE = sum(len(s) for s in EMOTIONS.values())

_PUNCT = ".,;:!?\"'()[]«»–-…*#>"


def _tokens(text: str) -> list[str]:
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    return [w for w in words if w]


def emotions_of_text(text: str, min_words: int = 3) -> dict | None:
    """Tel per emotie-categorie hoeveel woorden in `text` matchen.

    Return {"woede": n, "angst": n, "verdriet": n, "walging": n, "n_words": N},
    of None wanneer de tekst te kort is (zelfde drempel als tone_of_text)."""
    words = _tokens(text)
    n = len(words)
    if n < min_words:
        return None
    counts = {emo: 0 for emo in EMOTION_CATEGORIES}
    for w in words:
        for emo, lex in EMOTIONS.items():
            if w in lex:
                counts[emo] += 1
    counts["n_words"] = n
    return counts


def aggregate_emotions(texts: list[str], min_words: int = 3) -> dict:
    """Aggregeer emotie-tellingen over een lijst headlines → dagprofiel.

    Return dict met:
      - counts: ruwe telling per emotie
      - intensity: matches per 100 woorden, per emotie (vergelijkbaar over dagen)
      - dominant: sterkste emotie (None als alles 0)
      - n_headlines / n_words: meegewogen volume
    """
    totals = {emo: 0 for emo in EMOTION_CATEGORIES}
    n_words_total = 0
    n_scored = 0
    for t in texts:
        r = emotions_of_text(t, min_words)
        if r is None:
            continue
        n_scored += 1
        n_words_total += r["n_words"]
        for emo in EMOTION_CATEGORIES:
            totals[emo] += r[emo]

    if n_words_total == 0:
        return {
            "counts": totals,
            "intensity": {e: 0.0 for e in EMOTION_CATEGORIES},
            "dominant": None,
            "n_headlines": n_scored,
            "n_words": 0,
        }

    intensity = {
        emo: round(totals[emo] / n_words_total * 100, 3) for emo in EMOTION_CATEGORIES
    }
    dom = max(intensity, key=lambda e: intensity[e])
    return {
        "counts": totals,
        "intensity": intensity,
        "dominant": dom if intensity[dom] > 0 else None,
        "n_headlines": n_scored,
        "n_words": n_words_total,
    }
