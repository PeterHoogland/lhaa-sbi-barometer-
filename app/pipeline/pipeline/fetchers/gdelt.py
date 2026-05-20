"""
Nieuwsnegativiteits-fetcher v5 — RSS-sentiment primair, GDELT secundair.
Doc 03_Laag-4 §2.5: I-D5-001.

Wijziging: GDELT v2 DOC API is door GitHub Actions IP-range chronisch
rate-limited. We schakelen naar een **eigen sentiment-score** berekend op
de NL-talige Belgische RSS-feeds die we al voor events ophalen.

Methode:
1. Haal VRT NWS + De Standaard RSS feeds (zelfde als events.py)
2. Tel positieve vs negatieve sleutelwoorden in titels + samenvattingen
3. negativity = (neg - pos) / max(1, total_words) × 10  [normaliseer schaal]
4. Output is op vergelijkbare schaal als GDELT-tone (-20 tot +20)

Methodologisch zwakker dan GDELT (kleinere corpus, lexicon-gebaseerd ipv NLP)
maar wel **echt** en **stabiel**. Eerlijk gerapporteerd in source.

Fallback ladder: RSS-sentiment → GDELT → cache → mock.
"""
from __future__ import annotations
import time
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

RSS_FEEDS = [
    "https://www.vrt.be/vrtnws/nl.rss.articles.xml",
    "https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss",
]

# Eenvoudig Nederlands sentiment-lexicon (titel-gericht, geen formele NLP)
POS_WORDS = {
    "succes", "gelukt", "akkoord", "mooi", "goed", "sterk", "vrede", "hulp",
    "winst", "best", "groei", "bloei", "nieuwe", "eerste", "redding", "gered",
    "bevrijd", "won", "viert", "voorruitgang", "vooruitgang", "vooruit",
    "doorbraak", "blij", "verbetering", "hoop", "feest", "geboorte",
    "geslaagd", "geweldig", "applaus", "warmte", "samen", "verbond",
}
NEG_WORDS = {
    "dood", "doden", "sterft", "stierf", "overleden", "ramp", "tragedie",
    "aanslag", "aanval", "terreur", "geweld", "gewonden", "gewond", "schok",
    "ontslag", "ontslagen", "ontslaat", "crisis", "verlies", "verloren",
    "breuk", "faal", "fout", "daling", "miljoen", "woede", "conflict",
    "brand", "vuur", "val", "viel", "slecht", "vrees", "vrezen", "angst",
    "rouw", "moord", "vermoord", "vermist", "evacuatie", "noodtoestand",
    "noodweer", "overstroming", "instortte", "instorting", "explosie",
    "drama", "ravage", "wankelen", "kelderen", "verlies",
}


def _parse_rss(xml_text: str) -> list[str]:
    """Return list of strings (title + description) from RSS/Atom XML."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[str] = []
    for tag in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag):
                continue
            title = ""
            desc = ""
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


def _sentiment_score(texts: list[str]) -> tuple[float, int] | None:
    """Return (negativity_score, total_articles) or None."""
    if not texts:
        return None
    total_pos = 0
    total_neg = 0
    total_words = 0
    for text in texts:
        words = [w.lower().strip(".,;:!?\"'()[]") for w in text.split()]
        total_words += len(words)
        for w in words:
            if w in POS_WORDS:
                total_pos += 1
            elif w in NEG_WORDS:
                total_neg += 1
    if total_words == 0:
        return None
    # negativity = (neg - pos) / words × 10 voor GDELT-tone-vergelijkbare schaal
    neg_score = (total_neg - total_pos) / total_words * 100
    return neg_score, len(texts)


def _fetch_rss_sentiment(target_date: date) -> tuple[bool, float | None, int]:
    all_texts: list[str] = []
    for url in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if ok and isinstance(body, str):
            all_texts.extend(_parse_rss(body))
    result = _sentiment_score(all_texts)
    if result is None:
        return False, None, 0
    score, n = result
    return True, score, n


def _fetch_gdelt_timelinetone(target_date: date) -> tuple[bool, float | None]:
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
        return False, None
    if not ok or not isinstance(body, dict):
        return False, None
    timeline = body.get("timeline", [])
    if not timeline:
        return False, None
    try:
        for series in timeline:
            if series.get("seriesAlias") in ("Average Tone", "AvgTone"):
                points = series.get("data", [])
                if points:
                    return True, -sum(p.get("value", 0) for p in points) / len(points)
        first = timeline[0]
        points = first.get("data", [])
        if points:
            return True, -sum(p.get("value", 0) for p in points) / len(points)
    except (KeyError, ValueError, TypeError, ZeroDivisionError):
        pass
    return False, None


def fetch_news_negativity(target_date: date) -> FetchResult:
    # 1) RSS-sentiment (primair, stabiel, geen rate limit)
    ok, val, n_articles = _fetch_rss_sentiment(target_date)
    if ok and val is not None and n_articles >= 5:
        source = f"NL-RSS sentiment-score ({n_articles} artikels VRT NWS + De Standaard)"
        cache_put("I-D5-001", val, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", val, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 2) GDELT (secundair, vaak rate-limited)
    time.sleep(8)
    ok, val = _fetch_gdelt_timelinetone(target_date)
    if ok and val is not None:
        source = "GDELT DOC v2 (timelinetone)"
        cache_put("I-D5-001", val, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", val, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 3) Cache (≤14d)
    cached = cache_get("I-D5-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-001", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
        )

    # 4) Mock fallback
    value = seasonal_noise(target_date, 2.0, 1.5, 2.0, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (RSS + GDELT + cache alle leeg)",
    )
