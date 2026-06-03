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
# schade, achteruitgang, angst). Stammen + courante varianten. Uitgebreid
# 2026-06-03 (Peters vraag "zo ver mogelijk"): meer Vlaams/NL stress-, crisis-,
# economie-, gezondheid- en onrust-vocabulaire + morfologische varianten. Deze
# overlay voedt de RSS-CONTROLE-lezing (poststratificatie), niet het gescoorde
# I-D5-001 (dat is GDELT-toon) — uitbreiden verschuift het cijfer dus niet.
NEGATIVE = {
    # dood / slachtoffers
    "dood", "doden", "dode", "sterft", "stierf", "gestorven", "overleden",
    "overlijden", "omgekomen", "omgebracht", "gesneuveld", "bezweken",
    "levenloos", "stoffelijk", "slachtoffer", "slachtoffers", "fataal",
    "fataliteit", "dodelijk", "dodelijke", "dodental", "dodentol",
    "gewond", "gewonden", "verwond", "zwaargewond", "zwaargewonden",
    # ramp / catastrofe
    "ramp", "rampen", "rampzalig", "rampspoed", "calamiteit", "tragedie",
    "tragisch", "tragische", "drama", "dramatisch", "catastrofe",
    "catastrofaal", "debacle", "fiasco", "noodtoestand", "noodweer",
    "noodsituatie", "kaalslag",
    # geweld / terreur / oorlog
    "aanslag", "aanslagen", "aanval", "aanvallen", "terreur", "terrorist",
    "terroristisch", "terreurdreiging", "geweld", "gewelddadig",
    "geweldpleging", "oorlog", "oorlogen", "oorlogsgeweld", "conflict",
    "conflicten", "gevecht", "gevechten", "strijd", "moord", "vermoord",
    "doodslag", "doodgeschoten", "neergeschoten", "neergestoken",
    "steekpartij", "schietpartij", "schietincident", "beschieting",
    "bombardement", "bombardementen", "raket", "raketten", "drone-aanval",
    "offensief", "invasie", "bezetting", "ontvoerd", "ontvoering",
    "gegijzeld", "gijzelaar", "gijzeling", "vermist", "explosie",
    "ontploffing", "ontploft", "bom", "bomaanslag", "extremisme",
    "vechtpartij", "knokpartij", "afrekening", "liquidatie",
    # brand / natuur
    "brand", "branden", "bosbrand", "vlammenzee", "vuur", "instorting",
    "ingestort", "instortte", "overstroming", "overstromingen",
    "wateroverlast", "modderstroom", "aardverschuiving", "lawine",
    "storm", "orkaan", "tornado", "windhoos", "hagelstorm", "hittegolf",
    "droogte", "aardbeving", "evacuatie", "geëvacueerd", "evacueren",
    "ijzel", "gladheid", "smog",
    # economie / werk
    "ontslag", "ontslagen", "ontslaat", "afdanking", "afdankingen",
    "herstructurering", "reorganisatie", "jobverlies", "banenverlies",
    "faillissement", "failliet", "bankroet", "sluiting", "sluit",
    "schuld", "schulden", "schuldenberg", "betaalachterstand",
    "deurwaarder", "uithuiszetting", "verlies", "verliezen", "verloren",
    "daling", "gedaald", "dalen", "kelderen", "kelderde", "gekelderd",
    "koersval", "beurscrash", "inzinking", "recessie", "recessievrees",
    "stagflatie", "krimp", "krimpt", "krimpcijfer", "duurder",
    "prijsstijging", "prijsexplosie", "inflatie", "hyperinflatie",
    "koopkrachtverlies", "energiearmoede", "armoede", "verarming",
    "arm", "honger", "tekort", "tekorten", "schaarste", "besparingen",
    "besparingsronde", "saneren", "bestaansonzeker", "bestaansonzekerheid",
    "precair", "wachtlijst", "wachtlijsten",
    # sociaal / onrust
    "staking", "stakingen", "staken", "protest", "protesten", "betoging",
    "betogingen", "rel", "rellen", "oproer", "opstand", "ongeregeldheden",
    "plundering", "blokkade", "wegblokkade", "polarisatie", "verdeeldheid",
    "haatzaaien", "intimidatie", "onrust", "chaos", "paniek", "ontwrichting",
    "ontwricht", "ontwrichtend",
    # emotie / gezondheid
    "angst", "bang", "vrees", "vrezen", "bezorgd", "bezorgdheid", "zorgen",
    "woede", "boos", "kwaad", "frustratie", "verdriet", "pijn", "lijden",
    "stress", "stresserend", "burn-out", "burnout", "overspannen",
    "overbelast", "oververmoeid", "uitputting", "uitgeput", "slapeloosheid",
    "paniekaanval", "angststoornis", "depressie", "depressief",
    "neerslachtig", "somberheid", "zelfdoding", "zelfmoord", "suïcide",
    "welzijnscrisis", "zorgcrisis", "wachttijd", "opnamestop", "oversterfte",
    "ziek", "ziekte", "besmetting", "besmettingsgolf", "virus", "epidemie",
    "pandemie", "invaliditeit", "chronisch",
    # dreiging / gevaar / escalatie
    "dreiging", "bedreiging", "bedreigd", "dreigend", "dreigende",
    "doodsbedreiging", "gevaar", "gevaarlijk", "risico", "risico's",
    "alarm", "alarmerend", "waarschuwing", "waarschuwt", "schok",
    "geschokt", "escalatie", "escaleert", "escaleren", "noodplan",
    "rampenplan", "evacuatiebevel", "onheilspellend",
    # misdaad / schandaal
    "schandaal", "schandalig", "fraude", "frauduleus", "corruptie",
    "corrupt", "omkoping", "witwas", "oplichting", "oplichter",
    "malversatie", "machtsmisbruik", "misdaad", "crimineel", "diefstal",
    "inbraak", "overval", "plofkraak", "ramkraak", "agressie",
    "mishandeling", "mishandeld", "misbruik", "grensoverschrijdend",
    "pesterijen", "stalking", "mensenhandel", "drugsbende",
    # algemeen negatief
    "slecht", "slechter", "slechtste", "fout", "fouten", "mislukt",
    "mislukking", "falen", "gefaald", "falend", "probleem", "problemen",
    "problematisch", "moeilijk", "zwaar", "kritiek", "kritieke",
    "bekritiseerd", "klacht", "klachten", "boete", "straf", "veroordeeld",
    "veroordeling", "ruzie", "spanning", "spanningen", "breuk",
    "eenzaam", "eenzaamheid", "somber", "wanhoop", "wanhopig", "hopeloos",
    "uitzichtloos", "verontrustend", "zorgwekkend", "alarmerend", "nijpend",
    "penibel", "schrijnend", "ernstig", "verslechtering", "verslechtert",
    "ontspoort", "instabiel", "wankel", "broos", "kwetsbaar", "onzeker",
    "onzekerheid", "ondermaats", "gebrekkig", "tekortschietend",
}

# Positieve valentie — mee uitgebreid (2026-06-03) zodat de toon-schaal in
# balans blijft: alleen NEGATIVE oprekken zou de controle-lezing systematisch
# negatiever maken (meet-artefact). Herstel-/verzoening-/opluchting-termen erbij.
POSITIVE = {
    # succes / prestatie
    "succes", "succesvol", "gelukt", "geslaagd", "akkoord", "overeenkomst",
    "deal", "oplossing", "opgelost", "doorbraak", "prestatie", "presteren",
    "record", "kampioen", "winst", "gewonnen", "won", "zege", "overwinning",
    "meevaller", "meevallers",
    # vrede / hulp / herstel / verzoening
    "vrede", "vreedzaam", "hulp", "geholpen", "helpen", "steun", "gesteund",
    "steunt", "redding", "reddingsoperatie", "gered", "redt", "bevrijd",
    "vrijlating", "herstel", "hersteld", "herstelt", "herstellen",
    "heropleving", "heropbouw", "wederopbouw", "doorstart", "veerkracht",
    "solidariteit", "verzoening", "bemiddeling", "wapenstilstand",
    "staakt-het-vuren", "stabilisatie", "normalisering",
    # groei / vooruitgang
    "groei", "gegroeid", "groeit", "bloei", "bloeiend", "vooruitgang",
    "verbetering", "verbeterd", "verbetert", "ontwikkeling", "innovatie",
    "investering", "investeert", "opening", "geopend", "nieuw", "vernieuwd",
    "stijging", "gestegen", "toename", "voorspoed", "voorspoedig", "welvaart",
    "welvarend",
    # emotie / positief
    "beter", "best", "beste", "blij", "vrolijk", "gelukkig", "geluk",
    "tevreden", "trots", "viert", "gevierd", "feest", "viering", "applaus",
    "geprezen", "lof", "dankbaar", "dank", "hoop", "hoopvol", "hoopgevend",
    "bemoedigend", "veelbelovend", "opluchting", "opgelucht", "geruststelling",
    "geruststellend", "optimisme", "optimistisch", "vertrouwen",
    # kwaliteit
    "mooi", "prachtig", "schitterend", "geweldig", "fantastisch",
    "uitstekend", "knap", "sterk", "sterker", "krachtig", "gezond",
    "gezonder", "veilig", "veiliger", "veiligheid", "bescherming", "beschermd",
    # verbinding
    "vrij", "vrijheid", "samen", "samenwerking", "verbonden", "vriendschap",
    "liefde", "warmte", "genereus", "vrijgevig", "gul", "kans", "kansen",
    "duurzaam", "groen", "schoon", "talent", "gewaardeerd", "eerlijk",
    "rust", "kalm", "kalmte", "sereniteit", "ontspanning", "ontspannen",
    "stabiel", "stabiliteit",
}

from .lexicon_pattern_nl import POLARITY as _PATTERN_POL, LEXICON_VERSION as _PATTERN_VER

# v0.5 §9.3 Laag 1: Pattern.nl (CLiPS, Universiteit Antwerpen, PDDL) ALS basis
# (2.7k+ NL-woorden met gevalideerde polariteit), met daarbovenop onze eigen
# nieuws-domein overrides (NEGATIVE/POSITIVE) die ramp/aanslag/...-termen
# een sterk signaal geven van ±1.0.
# +nieuws-overlay-1.1 (2026-06-03): uitgebreide NEGATIVE/POSITIVE + negatie- en
# versterker-verwerking in tone_of_text (linguïstische valentie-verschuiving).
LEXICON_VERSION = f"{_PATTERN_VER}+nieuws-overlay-1.1"
LEXICON_SIZE = len(_PATTERN_POL) + len(NEGATIVE) + len(POSITIVE)

_PUNCT = ".,;:!?\"'()[]«»–-…*#>"

# --- Valentie-verschuivers (linguïstische laag, De Smedt & Daelemans 2012 /
# Pattern.nl; VADER-familie) ---
# Negatie keert de polariteit van het EERSTVOLGENDE polaire woord om en dempt
# (×-0.5): "niet slecht" wordt licht positief i.p.v. negatief. Scope = enkele
# tokens, geconsumeerd door het eerste polaire woord.
NEGATORS = {
    "niet", "geen", "nooit", "nergens", "niets", "niemand", "zonder",
    "nauwelijks", "amper", "allesbehalve", "noch",
}
# Versterkers/verzwakkers schalen de magnitude van het volgende polaire woord.
BOOSTERS = {
    "zeer": 1.5, "heel": 1.4, "erg": 1.4, "bijzonder": 1.4, "uiterst": 1.7,
    "ontzettend": 1.7, "enorm": 1.6, "extreem": 1.8, "buitengewoon": 1.6,
    "hoogst": 1.6, "ongelooflijk": 1.6, "compleet": 1.4, "totaal": 1.4,
    "volledig": 1.3, "uitermate": 1.6, "intens": 1.5,
}
DIMINISHERS = {
    "enigszins": 0.5, "ietwat": 0.5, "licht": 0.6, "lichtjes": 0.5,
    "matig": 0.6, "tamelijk": 0.7, "redelijk": 0.7,
}


def _word_polarity(w: str) -> float:
    """Polariteit ∈ [-1, +1]. Nieuws-overlay slaat Pattern over."""
    if w in NEGATIVE:
        return -1.0
    if w in POSITIVE:
        return +1.0
    return _PATTERN_POL.get(w, 0.0)


# Aantal tokens dat een negator vooruit "reikt" tot een polair woord.
_NEG_WINDOW = 3


def tone_of_text(text: str, min_words: int = 3) -> tuple[float, int] | None:
    """Toon van één tekst-eenheid (headline + lead) — v0.5 §9.4.
    Som van per-woord polariteit (met negatie + versterkers) gedeeld door aantal
    woorden, × 100. Hogere score = positiever; lagere = negatiever. Zelfde schaal
    als v0.2, maar nu met (a) continue valenties uit een gevalideerd lexicon
    (Pattern.nl) en (b) een linguïstische laag: negatoren keren+dempen de polariteit
    van het volgende polaire woord ("niet slecht" → licht positief), versterkers/
    verzwakkers schalen de magnitude ("zeer zwaar" weegt sterker).
    Return (tone, n_words), of None wanneer de tekst te kort is."""
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    words = [w for w in words if w]
    n = len(words)
    if n < min_words:
        return None
    total = 0.0
    neg_left = 0          # resterende tokens waarvoor negatie geldt
    mult = 1.0            # versterker/verzwakker voor het volgende polaire woord
    for w in words:
        if w in NEGATORS:
            neg_left = _NEG_WINDOW
            continue
        if w in BOOSTERS:
            mult = BOOSTERS[w]
            continue
        if w in DIMINISHERS:
            mult = DIMINISHERS[w]
            continue
        pol = _word_polarity(w)
        if pol != 0.0:
            if neg_left > 0:
                pol = -pol * 0.5   # negatie: omkeren + dempen
                neg_left = 0       # geconsumeerd door dit polaire woord
            total += pol * mult
            mult = 1.0             # versterker geldt maar voor één woord
        if neg_left > 0:
            neg_left -= 1
    return total / n * 100, n
