"""
Media-publieksprofielen — bron-niveau poststratificatie.

HET PRINCIPE
------------
Een gescrapet nieuwsartikel draagt geen demografisch label. Maar het MEDIUM
waar het uit komt wel: elke krant, zender en site heeft een gedocumenteerd
lezersprofiel. Door per bron de toon te meten en die te wegen naar het
bekende publiek van die bron, krijg je een demografisch gebalanceerd signaal
zonder dat je de auteur van elke post hoeft te kennen.

Dit is bron-niveau poststratificatie — de haalbare variant van MRP wanneer je
publieke data scrapet in plaats van een panel te bevragen.

METHODE
-------
1. Per bron meten we de nieuwstoon (lexicon-methode, Young & Soroka 2012).
2. Per bron kennen we de leeftijdsverdeling van het publiek + het relatieve
   bereik (hoe groot de bron is).
3. Per bevolkingssegment berekenen we de "ervaren toon":
      toon_segment = Σ_bron (publiek[bron,segment] × bereik[bron] × toon[bron])
                     / Σ_bron (publiek[bron,segment] × bereik[bron])
4. Het nationale poststratified cijfer = Σ_segment (bevolkingsaandeel × toon_segment).

EERLIJKE BEPERKING
------------------
De publieksprofielen zijn ramingen op basis van publieke CIM-bereikcijfers,
Digimeter en mediakits — geen exacte panelmetingen. Drie leeftijdssegmenten
i.p.v. een volledige demografische celstructuur. Het is de transparante,
reproduceerbare benadering; een echt gevalideerd panel blijft de target-state.
"""
from __future__ import annotations

# Belgische volwassen bevolking (18+), grove Statbel-aandelen per segment.
POPULATION_SHARE = {
    "jong": 0.27,    # 18-34
    "midden": 0.32,  # 35-54
    "ouder": 0.41,   # 55+
}

# Per mediabron (schone sleutel): leeftijdsverdeling van het publiek
# [jong, midden, ouder] (telt op tot 1.0) + relatief bereik-gewicht.
# Ramingen op basis van CIM-bereik, Digimeter en mediakits.
MEDIA_PROFILES: dict[str, dict] = {
    "vrtnws":     {"name": "VRT NWS",                "reach": 9.0, "audience": {"jong": 0.22, "midden": 0.33, "ouder": 0.45}},
    "standaard":  {"name": "De Standaard",           "reach": 4.0, "audience": {"jong": 0.20, "midden": 0.38, "ouder": 0.42}},
    "demorgen":   {"name": "De Morgen",              "reach": 3.0, "audience": {"jong": 0.26, "midden": 0.40, "ouder": 0.34}},
    "hln":        {"name": "Het Laatste Nieuws",     "reach": 10.0, "audience": {"jong": 0.30, "midden": 0.34, "ouder": 0.36}},
    "tijd":       {"name": "De Tijd",                "reach": 3.0, "audience": {"jong": 0.22, "midden": 0.44, "ouder": 0.34}},
    "hbvl":       {"name": "Het Belang van Limburg", "reach": 4.0, "audience": {"jong": 0.20, "midden": 0.32, "ouder": 0.48}},
    "bruzz":      {"name": "Bruzz",                  "reach": 1.5, "audience": {"jong": 0.34, "midden": 0.38, "ouder": 0.28}},
    "knack":      {"name": "Knack",                  "reach": 2.5, "audience": {"jong": 0.18, "midden": 0.38, "ouder": 0.44}},
    "sporza":     {"name": "Sporza",                 "reach": 6.0, "audience": {"jong": 0.34, "midden": 0.36, "ouder": 0.30}},
    "trends":     {"name": "Trends",                 "reach": 2.0, "audience": {"jong": 0.22, "midden": 0.44, "ouder": 0.34}},
    "businessam": {"name": "Business AM",            "reach": 1.5, "audience": {"jong": 0.30, "midden": 0.42, "ouder": 0.28}},
    "eos":        {"name": "Eos",                    "reach": 1.0, "audience": {"jong": 0.30, "midden": 0.38, "ouder": 0.32}},
    "newsmonkey": {"name": "Newsmonkey",             "reach": 1.0, "audience": {"jong": 0.62, "midden": 0.26, "ouder": 0.12}},
    # Reddit — sterk jong/stedelijk skew (secundaire indicator)
    "reddit":     {"name": "Reddit Belgium",         "reach": 1.0, "audience": {"jong": 0.68, "midden": 0.26, "ouder": 0.06}},
}


def poststratify(source_tones: list[tuple[str, float]]) -> dict:
    """
    source_tones: lijst van (mediaprofiel-sleutel, toon) per bron.
    Return dict met:
      - national: poststratified nationale toon
      - segments: toon per leeftijdssegment
      - n_sources: aantal bronnen meegewogen
    """
    entries: list[tuple[dict, float]] = []
    for key, tone in source_tones:
        profile = MEDIA_PROFILES.get(key)
        if profile is not None:
            entries.append((profile, tone))

    if not entries:
        return {"national": None, "segments": {}, "n_sources": 0}

    segments: dict[str, float] = {}
    for seg in POPULATION_SHARE:
        num = 0.0
        den = 0.0
        for profile, tone in entries:
            w = profile["audience"][seg] * profile["reach"]
            num += w * tone
            den += w
        segments[seg] = num / den if den > 0 else 0.0

    national = sum(POPULATION_SHARE[seg] * segments[seg] for seg in POPULATION_SHARE)
    return {"national": national, "segments": segments, "n_sources": len(entries)}
