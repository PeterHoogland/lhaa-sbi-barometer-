"""
Mastodon — onderstroom-sentiment van Belgische Mastodon-posts (I-D5-mastodon).

WAAROM (onderstroom-uitbreiding 2026-06-03)
-------------------------------------------
Naast Reddit een tweede grassroots-/onderstroom-peiling. Mastodon heeft een open,
no-auth publieke API: de LOKALE timeline van een Belgische instance bevat posts van
Belgische gebruikers. Kleiner en technischer publiek dan Reddit (dun volume), dus
descriptief/trigger, niet representatief.

BRON (no-auth, werkt vanaf server-IP)
-------------------------------------
`mastodon.vlaanderen/api/v1/timelines/public?local=true` — publieke JSON, geen token,
royale rate-limit (7500/5min). `content` is HTML → tags strippen, dan dezelfde
lexicon-toon-analyse als de mainstream nieuwsindicator (Young & Soroka 2012).

PLAATS IN HET MODEL
-------------------
SECUNDAIR signaal (zoals Reddit), NIET in het composiet-cijfer. Bouwt historie op.
Bron-ladder: 1) live · 2) cache · 3) mock.
"""
from __future__ import annotations
import json as _json
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text

# Lokale timelines van Belgische/Vlaamse instances (no-auth). Uitbreidbaar.
INSTANCES = [
    "https://mastodon.vlaanderen/api/v1/timelines/public?local=true&limit=40",
]
USER_AGENT = "Mozilla/5.0 (compatible; SBI-barometer/0.3; +mailto:peter@hoogland.be)"
_TAG_RE = re.compile(r"<[^>]+>")


def _fetch_instance_posts(url: str) -> list[str]:
    ok, body = safe_request(url, timeout=20, headers={"User-Agent": USER_AGENT})
    if not ok:
        return []
    data = body if isinstance(body, list) else None
    if data is None and isinstance(body, str):
        try:
            data = _json.loads(body)
        except _json.JSONDecodeError:
            return []
    if not isinstance(data, list):
        return []
    texts: list[str] = []
    for post in data:
        if not isinstance(post, dict):
            continue
        html = post.get("content", "") or ""
        text = _TAG_RE.sub(" ", html).strip()  # strip HTML
        if text:
            texts.append(text)
    return texts


def fetch_mastodon_sentiment(target_date: date) -> FetchResult:
    all_tones: list[float] = []
    posts_total = 0
    reachable = False
    for url in INSTANCES:
        posts = _fetch_instance_posts(url)
        if posts:
            reachable = True
            posts_total += len(posts)
            for text in posts:
                r = tone_of_text(text)
                if r is not None:
                    all_tones.append(r[0])

    if reachable and all_tones:
        negativity = -(sum(all_tones) / len(all_tones))
        source = (f"Mastodon (mastodon.vlaanderen lokale timeline), {posts_total} posts, "
                  f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}); "
                  f"SECUNDAIR, niet-representatief, niet in composiet")
        cache_put("I-D5-mastodon", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-mastodon", negativity, target_date.isoformat(),
            simulated=False, source=source,
        )

    cached = cache_get("I-D5-mastodon")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-mastodon", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    return FetchResult(
        "I-D5-mastodon", seasonal_noise(target_date, 1.0, 1.0, 2.0, 0.0),
        target_date.isoformat(), simulated=True,
        source="mock (Mastodon onbereikbaar, geen cache)",
    )
