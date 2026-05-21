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
Reddit publieke JSON-endpoints van Belgische subreddits:
  r/belgium    — algemeen, gemengd NL/FR/EN
  r/Vlaanderen — Nederlandstalig

Reddit vereist een herkenbare User-Agent. Lage frequentie (1×/dag),
read-only, publieke data.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text

SUBREDDITS = ["belgium", "Vlaanderen"]
USER_AGENT = "SBI-barometer/0.2 (publieke sensitiviteits-indicator; contact peter@hoogland.be)"


def _fetch_subreddit_posts(sub: str) -> list[str]:
    """Haal titels + selftext van de nieuwste posts uit één subreddit."""
    url = f"https://www.reddit.com/r/{sub}/new.json?limit=100&raw_json=1"
    ok, body = safe_request(url, timeout=20, headers={"User-Agent": USER_AGENT})
    if not ok or not isinstance(body, dict):
        return []
    texts: list[str] = []
    try:
        for child in body.get("data", {}).get("children", []):
            d = child.get("data", {})
            title = d.get("title", "") or ""
            selftext = d.get("selftext", "") or ""
            combined = f"{title} {selftext}".strip()
            if combined:
                texts.append(combined)
    except (AttributeError, TypeError):
        return []
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
        return FetchResult(
            "I-D5-006S", negativity, target_date.isoformat(),
            simulated=False,
            source=(f"Reddit r/belgium + r/Vlaanderen, {posts_total} posts, "
                    f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}); "
                    f"SECUNDAIR, niet-representatief, niet in composiet"),
            observation_date=target_date.isoformat(),
        )

    # Fallback — mock met eerlijke vlag
    value = seasonal_noise(target_date, 1.0, 1.0, 2.0, 0.0)
    return FetchResult(
        "I-D5-006S", value, target_date.isoformat(),
        simulated=True,
        source="mock (Reddit onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
