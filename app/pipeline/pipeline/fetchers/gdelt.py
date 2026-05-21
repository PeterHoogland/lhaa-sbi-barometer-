"""
Nieuwsnegativiteits-fetcher (I-D5-001).
Doc 03_Laag-4 §2.5.

WETENSCHAPPELIJKE METHODE
-------------------------
Lexicon-gebaseerde valentie-analyse (Young & Soroka 2012) + bron-niveau
poststratificatie naar mediapubliek-profielen.

Per bron meten we de toon: tone = (pos - neg) / woorden × 100.
Per bron kennen we het leeftijdsprofiel van het publiek en het relatieve
bereik (media_profiles.py, CIM/Digimeter-gegrond). We poststratificeren de
per-bron-tonen naar de Belgische bevolkingsverdeling, zodat het nationale
cijfer demografisch gebalanceerd is in plaats van gedomineerd door
welke bron toevallig de meeste artikels publiceert.

negativity = -national_tone.

Bron-ladder:
  1. RSS-corpus (13 BE-nieuwsbronnen) + poststratificatie
  2. GDELT DOC v2 timelinetone (doc-02-voorgeschreven, vaak rate-limited)
  3. cache (≤14d)
  4. mock
"""
from __future__ import annotations
import time
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text
from ..media_profiles import poststratify

# (feed-URL, mediaprofiel-sleutel). Sleutel matcht media_profiles.MEDIA_PROFILES.
RSS_FEEDS = [
    ("https://www.vrt.be/vrtnws/nl.rss.articles.xml", "vrtnws"),
    ("https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss", "standaard"),
    ("https://www.demorgen.be/rss.xml", "demorgen"),
    ("https://www.hln.be/rss.xml", "hln"),
    ("https://www.tijd.be/rss/ondernemen.xml", "tijd"),
    ("https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A", "hbvl"),
    ("https://www.bruzz.be/rss.xml", "bruzz"),
    ("https://www.knack.be/nieuws/feed/", "knack"),
    ("https://sporza.be/nl.rss.articles.xml", "sporza"),
    ("https://trends.knack.be/feed/", "trends"),
    ("https://businessam.be/feed/", "businessam"),
    ("https://www.eoswetenschap.eu/rss.xml", "eos"),
    ("https://newsmonkey.be/feed", "newsmonkey"),
]


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


def _per_source_tones(target_date: date) -> tuple[bool, list[tuple[str, float]], int]:
    """Meet de toon per bron afzonderlijk.
    Return (rss_reachable, [(profiel-sleutel, gemiddelde toon), ...], totaal_artikels)."""
    source_tones: list[tuple[str, float]] = []
    total_articles = 0
    rss_reachable = False
    for url, key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        tones: list[float] = []
        for text in _parse_rss_texts(body):
            result = tone_of_text(text)
            if result is not None:
                tones.append(result[0])
        if tones:
            source_tones.append((key, sum(tones) / len(tones)))
            total_articles += len(tones)
    return rss_reachable, source_tones, total_articles


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
    # 1) Per-bron toon + poststratificatie naar mediapubliek-profielen
    rss_ok, source_tones, n_articles = _per_source_tones(target_date)
    if rss_ok and source_tones and n_articles >= 8:
        ps = poststratify(source_tones)
        if ps["national"] is not None:
            negativity = -ps["national"]
            seg = ps["segments"]
            source = (
                f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}) "
                f"op {n_articles} artikels uit {ps['n_sources']} BE-nieuwsbronnen; "
                f"bron-niveau poststratificatie naar mediapubliek-profielen "
                f"(negativiteit jong {-seg['jong']:+.2f} / midden {-seg['midden']:+.2f} / "
                f"ouder {-seg['ouder']:+.2f}); methode Young & Soroka 2012"
            )
            cache_put("I-D5-001", negativity, source, target_date.isoformat())
            return FetchResult(
                "I-D5-001", negativity, target_date.isoformat(),
                simulated=False, source=source,
            )

    # 2) GDELT fallback
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
