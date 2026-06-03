"""
Google Trends — stress-aandeel van de Belgische trending searches (I-D5-trends).

WAAROM (Peter, 2026-06-03: "zoekgedrag = de vergeten tussenstroom")
-------------------------------------------------------------------
Bovenstroom = mainstream media (GDELT + kranten). Onderstroom = sociaal (Reddit).
De vergeten MIDDENLAAG = zoek-/querygedrag op schaal: de stille meerderheid die
niets post en geen nieuws maakt, maar wél zoekt ("burn-out", "energiefactuur",
"oorlog", "staking"). Wanneer een collectieve stressor toeslaat, zóékt het land,
en dat trendt. Dit signaal meet welk AANDEEL van de Belgische trending searches
vandaag over stressvolle thema's gaat.

BRON (werkt wél vanaf server-IP, anders dan pytrends)
-----------------------------------------------------
De trending-RSS-feed `https://trends.google.com/trending/rss?geo=BE`. Anders dan
de oude pytrends-interestquery (die GitHub-Actions-IP's blokkeert — daarom verving
wikipedia.py I-D5-002) levert deze RSS gewoon XML met de top trending searches, hun
geschat zoekvolume (`approx_traffic`) en de nieuwskoppen erachter. We scoren elke
trend tegen het NL stress-/emotie-lexicon (lexicon_nl + lexicon_emotion_nl) en wegen
met het zoekvolume.

PLAATS IN HET MODEL
-------------------
Secundair signaal (trigger-/signaallaag), NIET het publieke cijfer. Bouwt vanaf
nu historie op (`data/history/I-D5-trends.json`); pas met genoeg eigen historie
kan het percentiel "uitzonderlijk hoog stress-zoekgedrag" bepalen. geo=BE dekt
zowel Vlaams als Franstalig zoekgedrag.

EERLIJKE BEPERKING
------------------
Trending searches zijn vaak entertainment/sport; het stress-aandeel is meestal
laag en piekt bij een echte collectieve gebeurtenis. `approx_traffic` is Googles
eigen grove schatting ("500+"), geen exact volume. De stress-detectie leunt op het
NL-lexicon, dus Franstalige trends scoren enkel mee als hun nieuwskoppen NL-termen
bevatten (target-state: FR-lexicon).
"""
from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from datetime import date
from ..util import FetchResult, safe_request
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import tone_of_text
from ..lexicon_emotion_nl import aggregate_emotions

TRENDS_URL = "https://trends.google.com/trending/rss?geo=BE"
_NS = "{https://trends.google.com/trending/rss}"

# Een trend telt als stress-relevant wanneer de gecombineerde tekst (zoekterm +
# nieuwskoppen) duidelijk negatief is OF een discrete stress-emotie bevat.
_NEG_THRESHOLD = 4.0  # negativiteit (= -toon) hierboven = duidelijk negatief


def _parse_traffic(s: str | None) -> int:
    """'500+' / '1.000+' / '20.000+' → int. Ontbreekt → 0 (krijgt later floor 1)."""
    digits = re.sub(r"[^\d]", "", s or "")
    return int(digits) if digits else 0


def _trend_text(item: ET.Element) -> str:
    """Zoekterm + alle nieuwskoppen achter de trend, als één tekst om te scoren."""
    parts = [item.findtext("title") or ""]
    for ni in item.findall(f"{_NS}news_item"):
        t = ni.findtext(f"{_NS}news_item_title")
        if t:
            parts.append(t)
    return " ".join(parts).strip()


def _is_stress(text: str) -> bool:
    if len(text.split()) < 3:
        return False
    tone = tone_of_text(text)
    if tone is not None and -tone[0] >= _NEG_THRESHOLD:
        return True
    prof = aggregate_emotions([text])
    return bool(prof.get("dominant"))  # enige discrete stress-emotie aanwezig


def fetch_google_trends_stress(target_date: date) -> FetchResult:
    """I-D5-trends — aandeel (0-1) van het Belgische trending-zoekvolume dat vandaag
    over stressvolle thema's gaat. Secundair, bouwt historie. Bron-ladder:
    1) trending-RSS · 2) cache · 3) mock."""
    ok, body = safe_request(
        TRENDS_URL, timeout=20,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if ok and isinstance(body, str):
        try:
            root = ET.fromstring(body.encode("utf-8"))
        except ET.ParseError:
            root = None
        if root is not None:
            channel = root.find("channel")
            items = channel.findall("item") if channel is not None else []
            total_w = 0.0
            stress_w = 0.0
            stress_terms: list[str] = []
            for it in items:
                w = max(_parse_traffic(it.findtext(f"{_NS}approx_traffic")), 1)
                total_w += w
                if _is_stress(_trend_text(it)):
                    stress_w += w
                    term = (it.findtext("title") or "").strip()
                    if term:
                        stress_terms.append(term)
            if items:
                share = round(stress_w / total_w, 4) if total_w > 0 else 0.0
                top = ", ".join(stress_terms[:5]) if stress_terms else "geen"
                source = (
                    f"Google Trends trending RSS (geo=BE) — {len(stress_terms)}/{len(items)} "
                    f"trends stress-relevant, aandeel zoekvolume {share:.2f} "
                    f"(stress-trends: {top})"
                )
                cache_put("I-D5-trends", share, source, target_date.isoformat())
                return FetchResult(
                    "I-D5-trends", share, target_date.isoformat(),
                    simulated=False, source=source,
                )

    cached = cache_get("I-D5-trends")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-trends", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    return FetchResult(
        "I-D5-trends", 0.0, target_date.isoformat(),
        simulated=True, source="mock (Google Trends RSS onbereikbaar + cache leeg)",
    )
