"""
Collectieve gebeurtenissen — RSS-monitor + menselijke confirmation.
Doc 03_Laag-4 §2.5: I-D5-003.

Methodologisch verplicht (doc 03 §2.5): twee onafhankelijke menselijke
codeurs met κ ≥ 0.75. Volledige automatisering is NIET toegestaan.

Wat deze fetcher wel doet:
1. Leest RSS-feeds van VRT NWS, HLN, De Standaard
2. Scoort headlines tegen magnitude-keywords (niveau 1/3/5)
3. Schrijft candidates naar `pending_events.json` voor admin-review
4. Leest `events.json` (door admin bevestigd) voor de daadwerkelijke score

Admin review-workflow: bekijk `pending_events.json` → kopieer relevante
entries naar `events.json`. De fetcher leest alleen events.json voor de
actieve score.

NB: voor MVP draait de classifier op simpele keyword-matching. Echte deployment
vereist een tweede codeur — bv. via een aparte AI-codeur of menselijke review,
met κ-test op 50 historische cases (doc 03 §2.5).
"""
from __future__ import annotations
import json
import math
import re
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from pathlib import Path
from ..util import FetchResult, ROOT, safe_request
from ..cache import get as cache_get, put as cache_put
from .gdelt import gdelt_event_series


EVENTS_FILE = ROOT / "pipeline" / "events.json"
PENDING_FILE = ROOT / "pipeline" / "pending_events.json"

RSS_FEEDS = {
    "VRT NWS": "https://www.vrt.be/vrtnws/nl.rss.articles.xml",
    "De Standaard": "https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss",
    "De Morgen": "https://www.demorgen.be/rss.xml",
    "Het Laatste Nieuws": "https://www.hln.be/rss.xml",
    "De Tijd": "https://www.tijd.be/rss/ondernemen.xml",
    "Het Belang van Limburg": "https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A",
    "Bruzz": "https://www.bruzz.be/rss.xml",
    "Knack": "https://www.knack.be/nieuws/feed/",
}

# Magnitude-classificatie via keywords. Doc 03 §2.5 niveaus 1/3/5.
KEYWORDS_MAG_5 = re.compile(
    r"\b(aanslag|terreur|terroristisch|oorlogsverklaring|massa[-\s]?evacuatie)\b",
    re.IGNORECASE,
)
KEYWORDS_MAG_3 = re.compile(
    r"\b(nationale\s+rouw|nationale\s+ramp|tragedie|catastrofe|noodtoestand"
    r"|algemene\s+staking|nationale\s+staking)\b",
    re.IGNORECASE,
)
# MAG_1 vangt ook sociale onrust / collectieve actie (V6, skeyes-type): merkbaar
# collectief en ontwrichtend, maar geen ramp. Stakingen/betogingen/blokkades die
# het dagelijks leven raken worden zo minstens kandidaat voor menselijke review.
KEYWORDS_MAG_1 = re.compile(
    r"\b(zware\s+ramp|noodweer|overstroming|hittegolf\s+rood|grootschalige\s+evacuatie|treintragedie"
    r"|staking|sociale\s+onrust|betoging|blokkade|vakbondsactie|stilgelegd|lamgelegd|stilgevallen)\b",
    re.IGNORECASE,
)


def _classify(title: str, description: str = "") -> int:
    """Geeft magnitude 0 (geen match), 1, 3, of 5."""
    haystack = f"{title} {description}"
    if KEYWORDS_MAG_5.search(haystack): return 5
    if KEYWORDS_MAG_3.search(haystack): return 3
    if KEYWORDS_MAG_1.search(haystack): return 1
    return 0


def _parse_rss(xml_text: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[dict] = []
    # Atom feeds use {namespace}entry, RSS 2.0 uses plain "item"
    for tag_suffix in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag_suffix):
                continue
            title = ""
            desc = ""
            link = ""
            pubdate = ""
            for child in el:
                tag = child.tag.split("}", 1)[-1].lower()
                if tag == "title":
                    title = (child.text or "").strip()
                elif tag in ("description", "summary", "content"):
                    if not desc:
                        desc = (child.text or "").strip()
                elif tag in ("pubdate", "published", "updated"):
                    if not pubdate:
                        pubdate = (child.text or "").strip()
                elif tag == "link":
                    href = child.attrib.get("href")
                    if href:
                        link = href
                    elif child.text:
                        link = child.text.strip()
            if title:
                items.append({"title": title, "description": desc, "pubDate": pubdate, "link": link})
        if items:
            break
    return items


def _scan_rss_for_candidates(target_date: date) -> tuple[list[dict], bool]:
    """Return (candidates, rss_reachable).
    rss_reachable = True wanneer minstens één feed succesvol opgehaald is.
    Dat onderscheidt 'geen gebeurtenissen gemeten' (echte 0) van
    'kon niet meten' (feeds onbereikbaar)."""
    candidates = []
    seen_titles = set()
    rss_reachable = False
    for source, url in RSS_FEEDS.items():
        ok, body = safe_request(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"})
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        items = _parse_rss(body)
        for it in items:
            mag = _classify(it["title"], it["description"])
            if mag == 0:
                continue
            if it["title"] in seen_titles:
                continue
            seen_titles.add(it["title"])
            candidates.append({
                "date": target_date.isoformat(),
                "magnitude": mag,
                "title": it["title"],
                "source": source,
                "link": it["link"],
                "auto_detected": True,
                "review_status": "pending",
            })
    return candidates, rss_reachable


def _read_confirmed_events() -> list[dict]:
    if not EVENTS_FILE.exists():
        return []
    try:
        with open(EVENTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _write_pending(candidates: list[dict]) -> None:
    """Append nieuwe pending events, dedupliceren op title+date."""
    existing = []
    if PENDING_FILE.exists():
        try:
            with open(PENDING_FILE, encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, OSError):
            existing = []
    seen = {(e.get("title"), e.get("date")) for e in existing}
    for c in candidates:
        if (c["title"], c["date"]) not in seen:
            existing.append(c)
    with open(PENDING_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)


def fetch_collective_events(target_date: date) -> FetchResult:
    """I-D5-003 — sinds de v0.4-herdefinitie (doc 00 §13, grond A2): de score is de
    GDELT-volume-intensiteit van zware negatieve thema's (oorlog/geweld/ramp/terreur)
    in BE-nieuws. Dezelfde schaal als de GDELT-backfill-baseline (I-D5-003.json), dus
    de z-score klopt. De RSS-scan blijft lopen om concrete kandidaat-gebeurtenissen
    naar pending_events.json te schrijven voor menselijke review (transparantie)."""
    # Transparantie: scan RSS voor kandidaat-gebeurtenissen → pending_events.json
    candidates, _rss_reachable = _scan_rss_for_candidates(target_date)
    if candidates:
        _write_pending(candidates)

    # Score = GDELT-volume-intensiteit (schaal-consistent met de backfill-baseline).
    time.sleep(8)  # respecteer GDELT rate-limit (komt ná de toon-call in run.py)
    series = gdelt_event_series(target_date - timedelta(days=21), target_date)
    if series:
        recent = series[-3:]  # lichte stabilisatie tegen ontbrekende laatste dag
        value = round(sum(p["value"] for p in recent) / len(recent), 6)
        source = (
            f"GDELT DOC v2 timelinevol — intensiteit zware negatieve gebeurtenissen "
            f"(oorlog/geweld/ramp/terreur, sourcecountry:BE, {len(recent)}d-venster); "
            f"{len(candidates)} RSS-kandidaten naar pending voor menselijke review"
        )
        cache_put("I-D5-003", value, source, target_date.isoformat())
        return FetchResult(
            "I-D5-003", value, target_date.isoformat(),
            simulated=False, source=source,
        )

    # Fallback: laatste succesvolle GDELT-waarde (zelfde schaal)
    cached = cache_get("I-D5-003")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-003", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # Mock (GDELT + cache leeg) — in de GDELT-volume-schaal (~0.05-0.26)
    return FetchResult(
        "I-D5-003", 0.1, target_date.isoformat(),
        simulated=True, source="mock (GDELT timelinevol + cache leeg)",
    )
