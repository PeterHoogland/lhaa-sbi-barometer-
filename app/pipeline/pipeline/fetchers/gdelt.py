"""
Nieuwsnegativiteits-fetcher (I-D5-001).
Doc 03_Laag-4 §2.5.

WETENSCHAPPELIJKE METHODE
-------------------------
Primaire meting: **GDELT DOC 2.0 timelinetone** — de gemiddelde nieuwstoon
van Belgische nieuwsbronnen (sourcecountry:BE, zowel Nederlands- als
Franstalig). negativity = -AvgTone.

Waarom GDELT primair (en niet meer het RSS-lexicon):
GDELT levert ook een ECHTE 24-maanden-historie van exact dezelfde meting
(zie scripts/backfill_gdelt_baseline.py → data/history/I-D5-001.json).
Daardoor wordt de dagwaarde tegen een ECHTE mediaan+MAD-meetlat gewogen,
op dezelfde schaal. Vroeger draaide de baseline op een synthetische
sinus-reeks; dat is nu opgelost.

Naast GDELT meten we de RSS-corpus-toon nog steeds met het NL-valentielexicon
+ bron-niveau poststratificatie naar mediapubliek-profielen. Dat levert de
demografisch gesegmenteerde lezing (negativiteit jong/midden/ouder) die in
de bronvermelding wordt getoond — een controle-meting naast GDELT.

Bron-ladder voor de dagwaarde:
  1. GDELT DOC v2 timelinetone (zelfde schaal als de 24m-baseline)
  2. cache (≤14d)
  3. mock
"""
from __future__ import annotations
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text
from ..lexicon_emotion_nl import aggregate_emotions, LEXICON_SIZE as EMOTIE_LEXICON_SIZE
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
    # V6-uitbreiding (geverifieerde feeds, Vlaams) — meer headlines = scherper
    # toon- én emotie-profiel.
    ("https://www.nieuwsblad.be/rss", "nieuwsblad"),
    ("https://www.gva.be/rss", "gva"),
    ("https://www.dewereldmorgen.be/rss.xml", "dewereldmorgen"),
]

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

# Stash van het laatst-berekende emotie-profiel per datum, zodat
# news_emotion_secondary() het kan hergebruiken zonder de RSS opnieuw te fetchen.
_LAST_EMOTION: dict[str, dict] = {}


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


import re as _re
_WORD_RE = _re.compile(r"\w{3,}", _re.UNICODE)


def _tokens(text: str) -> set[str]:
    return {t.lower() for t in _WORD_RE.findall(text)}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / max(len(a | b), 1)


def _dedup_headlines(items: list[tuple[str, str, float]],
                     threshold: float = 0.8) -> list[tuple[str, str, float]]:
    """v0.5 §9.1 — near-duplicate-detectie op token-sets (Jaccard ≥ 0.8).
    Houdt de eerste verschijning per gebeurtenis, gooit copycat-headlines weg."""
    seen: list[set[str]] = []
    out: list[tuple[str, str, float]] = []
    for src, text, tone in items:
        toks = _tokens(text)
        if not toks:
            continue
        if any(_jaccard(toks, s) >= threshold for s in seen):
            continue
        seen.append(toks)
        out.append((src, text, tone))
    return out


def _per_source_tones(
    target_date: date,
) -> tuple[bool, list[tuple[str, float]], int, int, list[tuple[str, str, float]], dict]:
    """Meet de toon per bron afzonderlijk (RSS-controle-meting, v0.5 §9).
    Return (rss_reachable, [(bron, gemiddelde toon)], n_unique, n_raw,
             top10_negatiefste_headlines, emotie-profiel)."""
    raw_headlines: list[tuple[str, str, float]] = []
    rss_reachable = False
    for url, key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        for text in _parse_rss_texts(body):
            result = tone_of_text(text)
            if result is not None:
                raw_headlines.append((key, text.strip(), result[0]))

    deduped = _dedup_headlines(raw_headlines, threshold=0.8)
    by_source: dict[str, list[float]] = {}
    for src, _txt, tone in deduped:
        by_source.setdefault(src, []).append(tone)
    source_tones = [(k, sum(v) / len(v)) for k, v in by_source.items()]
    top_neg = sorted(deduped, key=lambda h: h[2])[:10]
    # Discrete emotie-profiel over dezelfde (deduped) headlines (V6: woede/angst/
    # verdriet/walging) — trigger-/signaallaag, descriptief naast de valentie.
    emotion_profile = aggregate_emotions([txt for _src, txt, _tone in deduped])
    return rss_reachable, source_tones, len(deduped), len(raw_headlines), top_neg, emotion_profile


def gdelt_tone_series(start: date, end: date) -> list[dict] | None:
    """Haal de dagelijkse GDELT-nieuwstoon voor BE op tussen start en end.

    Return list van {"date": "YYYY-MM-DD", "value": negativity} of None.
    negativity = -AvgTone. Eén GDELT-call; gebruikt door zowel de dagelijkse
    fetcher als het 24m-backfill-script (scripts/backfill_gdelt_baseline.py).
    """
    url = (
        f"{GDELT_DOC_URL}?query=sourcecountry:BE"
        f"&mode=timelinetone&format=json"
        f"&startdatetime={start.strftime('%Y%m%d000000')}"
        f"&enddatetime={end.strftime('%Y%m%d235959')}"
    )
    ok, body = safe_request(url, timeout=45, retries=2, retry_delay=8)
    if ok and isinstance(body, str) and "limit requests" in body.lower():
        return None
    if not ok or not isinstance(body, dict):
        return None
    timeline = body.get("timeline", [])
    if not timeline:
        return None
    series = None
    for s in timeline:
        if s.get("seriesAlias") in ("Average Tone", "AvgTone"):
            series = s
            break
    if series is None:
        series = timeline[0]
    out: list[dict] = []
    for pt in series.get("data", []):
        raw_date = str(pt.get("date", ""))
        try:
            iso = datetime.strptime(raw_date[:8], "%Y%m%d").strftime("%Y-%m-%d")
            out.append({"date": iso, "value": round(-float(pt["value"]), 4)})
        except (ValueError, KeyError, TypeError):
            continue
    return out or None


# --- I-D5-003 herdefinitie: GDELT-gebeurtenis-intensiteit (zware neg. thema's) ---
# GKG-thema's voor "grote negatieve collectieve gebeurtenis". Volume-intensiteit
# (mode=timelinevol) = % van de Belgische mediadekking dat hierover gaat.
GDELT_EVENT_THEMES = (
    "(theme:WAR OR theme:ARMEDCONFLICT OR theme:TERROR OR theme:KILL "
    "OR theme:NATURAL_DISASTER OR theme:MANMADE_DISASTER OR theme:CRISISLEX_CRISISLEXREC)"
)


def gdelt_event_series(start: date, end: date) -> list[dict] | None:
    """Dagelijkse GDELT-volume-intensiteit van zware negatieve gebeurtenissen in
    BE-nieuws tussen start en end. Return [{"date","value"}] of None.

    value = volume-intensiteit (% mediadekking) van de zwaar-negatieve thema's —
    een proxy voor "grote collectieve gebeurtenis" (I-D5-003), backfillbaar tot
    ~2017. Zelfde API/parsing als gdelt_tone_series.
    """
    import urllib.parse as _up
    query = f"sourcecountry:BE {GDELT_EVENT_THEMES}"
    url = (
        f"{GDELT_DOC_URL}?query={_up.quote(query)}"
        f"&mode=timelinevol&format=json"
        f"&startdatetime={start.strftime('%Y%m%d000000')}"
        f"&enddatetime={end.strftime('%Y%m%d235959')}"
    )
    ok, body = safe_request(url, timeout=60, retries=3, retry_delay=10)
    if ok and isinstance(body, str) and (
        "limit requests" in body.lower() or "too many" in body.lower()
    ):
        return None
    if not ok or not isinstance(body, dict):
        return None
    timeline = body.get("timeline", [])
    if not timeline:
        return None
    series = timeline[0]
    out: list[dict] = []
    for pt in series.get("data", []):
        raw_date = str(pt.get("date", ""))
        try:
            iso = datetime.strptime(raw_date[:8], "%Y%m%d").strftime("%Y-%m-%d")
            out.append({"date": iso, "value": round(float(pt["value"]), 6)})
        except (ValueError, KeyError, TypeError):
            continue
    return out or None


def fetch_news_negativity(target_date: date) -> FetchResult:
    # RSS-controle-meting: demografisch gesegmenteerde lezing (los van de schaal
    # die de composiet aanstuurt — puur descriptief in de bronvermelding).
    seg_text = ""
    emo_text = ""
    rss_ok, source_tones, n_unique, n_raw, top_neg, emotion_profile = _per_source_tones(target_date)
    _LAST_EMOTION[target_date.isoformat()] = emotion_profile  # hergebruik in news_emotion_secondary
    if rss_ok and source_tones and n_unique >= 8:
        ps = poststratify(source_tones)
        if ps["national"] is not None:
            seg = ps["segments"]
            top_titles = " · ".join(
                _re.sub(r"\s+", " ", t).strip()[:120] for _src, t, _tone in top_neg[:3]
            )
            seg_text = (
                f"; RSS-lexicon-controle (Pattern.nl {LEXICON_SIZE} woorden, "
                f"{LEXICON_VERSION}, {n_unique}/{n_raw} unieke artikels na dedup, "
                f"{ps['n_sources']} bronnen, poststratificatie): "
                f"negativiteit jong {-seg['jong']:+.2f} / midden {-seg['midden']:+.2f} / "
                f"ouder {-seg['ouder']:+.2f}. Negatiefste headlines: «{top_titles}»"
            )
        if emotion_profile and emotion_profile.get("dominant"):
            em = emotion_profile["intensity"]
            emo_text = (
                f"; emotie-profiel headlines (matches/100 woorden): "
                f"woede {em['woede']:.2f} / angst {em['angst']:.2f} / "
                f"verdriet {em['verdriet']:.2f} / walging {em['walging']:.2f} "
                f"(dominant: {emotion_profile['dominant']})"
            )

    # 1) GDELT timelinetone — zelfde schaal als de 24m-baseline
    time.sleep(8)  # respecteer GDELT rate-limit (1 req / 5s)
    series = gdelt_tone_series(target_date - timedelta(days=21), target_date)
    if series:
        recent = series[-3:]  # lichte stabilisatie tegen ontbrekende laatste dag
        negativity = round(sum(p["value"] for p in recent) / len(recent), 4)
        source = (
            f"GDELT DOC v2 timelinetone (gemiddelde nieuwstoon BE, "
            f"sourcecountry:BE, {len(recent)}d-venster){seg_text}{emo_text}"
        )
        cache_put("I-D5-001", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", negativity, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 2) Cache (GDELT-schaal)
    cached = cache_get("I-D5-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-001", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 3) Mock
    value = seasonal_noise(target_date, 1.4, 0.6, 0.5, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT + cache leeg)",
    )


# --- I-D5-emotie: secundair emotie-signaal (V6 increment 2) ---
def news_emotion_secondary(target_date: date) -> FetchResult:
    """Secundair signaal I-D5-emotie — totale emotionele lading van de nieuws-
    headlines (woede+angst+verdriet+walging, matches per 100 woorden). Hergebruikt
    het emotie-profiel dat fetch_news_negativity al over dezelfde RSS-corpus
    berekende (géén extra fetch). Trigger-/signaallaag, NIET het publieke cijfer.

    Roep dit ALTIJD ná fetch_news_negativity(d) aan — run.py doet dat: de primaire
    nieuws-fetch eerst, de secundaire signalen daarna."""
    prof = _LAST_EMOTION.get(target_date.isoformat())
    if prof and prof.get("n_headlines", 0) > 0:
        em = prof["intensity"]
        total = round(em["woede"] + em["angst"] + em["verdriet"] + em["walging"], 3)
        dom = prof.get("dominant") or "geen"
        source = (
            f"Emotie-lexicon NL ({EMOTIE_LEXICON_SIZE} woorden) over "
            f"{prof['n_headlines']} headlines; dominant: {dom} "
            f"(woede {em['woede']:.2f} / angst {em['angst']:.2f} / "
            f"verdriet {em['verdriet']:.2f} / walging {em['walging']:.2f})"
        )
        return FetchResult(
            "I-D5-emotie", total, target_date.isoformat(),
            simulated=False, source=source,
        )
    return FetchResult(
        "I-D5-emotie", 0.0, target_date.isoformat(),
        simulated=True, source="mock (geen RSS-headlines voor emotie-profiel)",
    )
