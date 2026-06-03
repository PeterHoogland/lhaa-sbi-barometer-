"""
Reddit-sentiment — SECUNDAIRE indicator I-D5-006S.

⚠ METHODOLOGISCHE STATUS — LEES DIT
-----------------------------------
Deze indicator zit BEWUST NIET in het primaire SBI-composiet.

Doc 02 §8 sluit sociale-media-sentiment expliciet uit als primaire bron
(criterium 3: publieke beschikbaarheid + representativiteit). Reddit-gebruikers
zijn GEEN doorsnede van de Belgische bevolking — het is een jongere, vaak
hoger-opgeleide, stedelijke, deels Engelstalige niche.

Daarom is dit een SECUNDAIRE / sensitiviteits-indicator (vergelijk doc 02 §10
secundaire set). Hij wordt apart getoond, expliciet gelabeld als
"niet-representatieve onderstroom-peiling", en draagt NIET bij aan het
stress-cijfer 1-5 of aan banner-activatie.

METHODE
-------
Zelfde lexicon-gebaseerde toon-analyse als de mainstream nieuwsindicator
(Young & Soroka 2012): per post (titel + tekst) de toon
(pos - neg) / woorden × 100, gemiddeld over alle posts.

BRON
----
Reddit publieke Atom-feeds (.rss) van Belgische subreddits:
  r/belgium, r/Vlaanderen, r/brussels, r/Antwerpen, r/BEFire.

⚠ Reddit blokkeert sinds eind 2024 ALLE ongeauthenticeerde .json-toegang (HTTP 403).
De vroegere .json-route viel daardoor stil terug op cache→mock (een verborgen
degradatie). Sinds 2026-06-03 gebruiken we de publieke .rss (Atom), die nog wél
werkt vanaf een niet-ingelogd IP, met een browser-achtige User-Agent. Lage
frequentie (1×/dag), read-only, publieke data. Caveat: datacenter-IP's (GitHub
Actions) worden soms alsnog geweigerd → dan cache→mock met eerlijke vlag. Een
robuustere upgrade is OAuth (client-credentials); de .rss is de no-auth-variant.
"""
from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text

# r/belgium + r/Vlaanderen (algemeen NL/FR/EN) + r/brussels (stedelijk, deels FR/EN)
# + r/Antwerpen (NL, lokaal) + r/BEFire (geld/werk/pensioen-stress). Uitgebreid
# 2026-06-03 voor bredere onderstroom-dekking van Belgisch dagelijks-leven-stress.
SUBREDDITS = ["belgium", "Vlaanderen", "brussels", "Antwerpen", "BEFire"]
# Reddit blokkeert sinds eind 2024 ALLE ongeauthenticeerde .json (403). De publieke
# .rss (Atom) werkt nog wél met een browser-achtige UA. Vandaar deze UA + de .rss-route.
USER_AGENT = "Mozilla/5.0 (compatible; SBI-barometer/0.3; +mailto:peter@hoogland.be)"
_TAG_RE = re.compile(r"<[^>]+>")


def _fetch_subreddit_posts(sub: str) -> list[str]:
    """Haal titels + tekst van de nieuwste posts uit één subreddit via de publieke
    Atom-feed (.rss). De vroegere .json-route geeft sinds eind 2024 HTTP 403 vanaf
    elk niet-ingelogd IP — die viel stil terug op cache/mock. De .rss werkt nog."""
    url = f"https://www.reddit.com/r/{sub}/.rss"
    ok, body = safe_request(url, timeout=20, headers={"User-Agent": USER_AGENT})
    if not ok or not isinstance(body, str):
        return []
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return []
    texts: list[str] = []
    for el in root.iter():
        if not el.tag.endswith("entry"):
            continue
        title, content = "", ""
        for child in el:
            tag = child.tag.split("}", 1)[-1].lower()
            if tag == "title" and child.text:
                title = child.text.strip()
            elif tag in ("content", "summary") and child.text and not content:
                content = _TAG_RE.sub(" ", child.text)  # strip HTML uit de post-body
        combined = f"{title} {content}".strip()
        if combined:
            texts.append(combined)
    return texts


def fetch_reddit_sentiment(target_date: date) -> FetchResult:
    all_tones: list[float] = []
    reachable = False
    posts_total = 0
    for sub in SUBREDDITS:
        posts = _fetch_subreddit_posts(sub)
        if posts:
            reachable = True
            posts_total += len(posts)
            for text in posts:
                result = tone_of_text(text)
                if result is not None:
                    all_tones.append(result[0])

    if reachable and all_tones:
        mean_tone = sum(all_tones) / len(all_tones)
        negativity = -mean_tone
        subs = ", ".join(f"r/{s}" for s in SUBREDDITS)
        source = (f"Reddit ({subs}) via Atom-feed, {posts_total} posts, "
                  f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}); "
                  f"SECUNDAIR, niet-representatief, niet in composiet")
        cache_put("I-D5-006S", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-006S", negativity, target_date.isoformat(),
            simulated=False, source=source,
            observation_date=target_date.isoformat(),
        )

    # Reddit blokkeert datacenter-IP's regelmatig — val terug op cache (≤14d)
    cached = cache_get("I-D5-006S")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-006S", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock met eerlijke vlag
    value = seasonal_noise(target_date, 1.0, 1.0, 2.0, 0.0)
    return FetchResult(
        "I-D5-006S", value, target_date.isoformat(),
        simulated=True,
        source="mock (Reddit onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
    )
