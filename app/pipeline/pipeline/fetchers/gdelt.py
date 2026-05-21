"""
Nieuwsnegativiteits-fetcher (I-D5-001).
Doc 03_Laag-4 §2.5.

WETENSCHAPPELIJKE METHODE
-------------------------
Lexicon-gebaseerde valentie-analyse — de standaardmethode voor nieuwstoon
in computationele sociale wetenschap:
  - Young & Soroka (2012), Lexicoder Sentiment Dictionary
  - Soroka et al. (2019, PNAS) — reeds in doc 02 §8
  - GDELT V2Tone (Leetaru 2013) — zelfde methode-familie

Per artikel: tone = (pos - neg) / totaal_woorden × 100.
negativity = -gemiddelde(tone) over alle artikels van de 7-daagse window.

Bron-ladder:
  1. RSS-corpus (VRT NWS, De Standaard, De Tijd, Het Belang van Limburg) +
     NL valentie-lexicon → eigen reproduceerbare toonmeting
  2. GDELT DOC v2 timelinetone (de doc-02-voorgeschreven bron, vaak
     rate-limited vanaf CI-IP's)
  3. cache (laatst succesvol, ≤14d)
  4. mock
"""
from __future__ import annotations
import time
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import NEGATIVE, POSITIVE, LEXICON_VERSION, LEXICON_SIZE

# Nederlandstalige Belgische nieuwsbronnen — RSS.
# Brede dwarsdoorsnede van de Vlaamse mainstream-pers:
#   openbare omroep · kwaliteitskranten · populaire kranten ·
#   economisch · regionaal · duiding/opinie.
# Onbereikbare feeds worden door de fetcher stilzwijgend overgeslagen.
RSS_FEEDS = [
    "https://www.vrt.be/vrtnws/nl.rss.articles.xml",                                 # VRT NWS — openbare omroep
    "https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss",  # De Standaard — kwaliteitskrant
    "https://www.demorgen.be/rss.xml",                                               # De Morgen — kwaliteitskrant
    "https://www.hln.be/rss.xml",                                                    # Het Laatste Nieuws — grootste populaire krant
    "https://www.tijd.be/rss/ondernemen.xml",                                        # De Tijd — economisch
    "https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A",           # Het Belang van Limburg — regionaal
    "https://www.bruzz.be/rss.xml",                                                  # Bruzz — Brussel regionaal
    "https://www.knack.be/nieuws/feed/",                                             # Knack — weekblad, duiding/opinie
]

_PUNCT = ".,;:!?\"'()[]«»–-…"


def _parse_rss_texts(xml_text: str) -> list[str]:
    """Return list van 'titel + samenvatting' strings uit RSS/Atom XML."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[str] = []
    for tag in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag):
                continue
            title, desc = "", ""
            for child in el:
                t = child.tag.split("}", 1)[-1].lower()
                if t == "title" and child.text:
                    title = child.text.strip()
                elif t in ("description", "summary", "content") and child.text and not desc:
                    desc = child.text.strip()
            if title:
                items.append(f"{title} {desc}")
        if items:
            break
    return items


def _article_tone(text: str) -> tuple[float, int] | None:
    """Toon van één artikel: (pos - neg) / totaal_woorden × 100.
    Return (tone, n_words) of None wanneer te kort."""
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    words = [w for w in words if w]
    n = len(words)
    if n < 3:
        return None
    pos = sum(1 for w in words if w in POSITIVE)
    neg = sum(1 for w in words if w in NEGATIVE)
    tone = (pos - neg) / n * 100
    return tone, n


def _corpus_negativity(target_date: date) -> tuple[bool, float | None, int]:
    """Verzamel alle RSS-artikels, bereken per-artikel toon, gemiddelde.
    Return (rss_reachable, negativity_score, n_articles)."""
    article_tones: list[float] = []
    rss_reachable = False
    for url in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        for text in _parse_rss_texts(body):
            result = _article_tone(text)
            if result is not None:
                article_tones.append(result[0])
    if not article_tones:
        return rss_reachable, None, 0
    mean_tone = sum(article_tones) / len(article_tones)
    negativity = -mean_tone  # indicator meet negativiteit
    return True, negativity, len(article_tones)


def _gdelt_timelinetone(target_date: date) -> float | None:
    start = (target_date - timedelta(days=7)).strftime("%Y%m%d000000")
    end = target_date.strftime("%Y%m%d235959")
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query=sourcecountry:BE%20sourcelang:dut"
        f"&mode=timelinetone&format=json"
        f"&startdatetime={start}&enddatetime={end}"
    )
    ok, body = safe_request(url, timeout=20, retries=1, retry_delay=8)
    if ok and isinstance(body, str) and "limit requests" in body.lower():
        return None
    if not ok or not isinstance(body, dict):
        return None
    timeline = body.get("timeline", [])
    if not timeline:
        return None
    try:
        for series in timeline:
            if series.get("seriesAlias") in ("Average Tone", "AvgTone"):
                pts = series.get("data", [])
                if pts:
                    return -sum(p.get("value", 0) for p in pts) / len(pts)
        pts = timeline[0].get("data", [])
        if pts:
            return -sum(p.get("value", 0) for p in pts) / len(pts)
    except (KeyError, ValueError, TypeError, ZeroDivisionError):
        pass
    return None


def fetch_news_negativity(target_date: date) -> FetchResult:
    # 1) Eigen lexicon-gebaseerde toonmeting op RSS-corpus
    rss_ok, neg, n_articles = _corpus_negativity(target_date)
    if rss_ok and neg is not None and n_articles >= 8:
        source = (
            f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}) "
            f"op {n_articles} artikels uit {len(RSS_FEEDS)} BE-nieuwsbronnen; "
            f"toon-methode Young & Soroka 2012"
        )
        cache_put("I-D5-001", neg, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", neg, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 2) GDELT (doc-02-voorgeschreven bron, vaak rate-limited)
    time.sleep(8)
    g = _gdelt_timelinetone(target_date)
    if g is not None:
        source = "GDELT DOC v2 (timelinetone, 7d gemiddelde)"
        cache_put("I-D5-001", g, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", g, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 3) Cache
    cached = cache_get("I-D5-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-001", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 4) Mock
    value = seasonal_noise(target_date, 2.0, 1.5, 2.0, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (RSS + GDELT + cache alle leeg)",
    )
