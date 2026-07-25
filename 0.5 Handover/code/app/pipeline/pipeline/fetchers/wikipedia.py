"""
Zoekinteresse-/aandachts-fetcher (I-D5-002) — Wikipedia-pageviews.
Doc 03_Laag-4 §2.6.

WAAROM WIKIPEDIA EN NIET MEER GOOGLE TRENDS
-------------------------------------------
Google Trends (pytrends) blokkeert server-IP's: vanaf GitHub Actions
draaide I-D5-002 permanent op cache-fallback, dus niet vers. De Wikimedia
Pageviews-API werkt wel betrouwbaar vanaf elk server-IP, heeft 11 jaar
historie, en levert absolute, reproduceerbare tellingen.

Wikipedia-pageviews zijn een gevestigde proxy voor publieke aandacht in
de digital-epidemiologie-literatuur (Generous et al. 2014; McIver &
Brownstein 2014; Mestyán et al. 2013).

METHODE
-------
We tellen de dagelijkse weergaven (agent=user, dus geen bots) van een
vaste set Nederlandstalige Wikipedia-artikels over stress-thema's, en delen
die door het TOTALE aantal NL-Wikipedia-weergaven van die dag. Dat geeft
een aandachts-index "per miljoen weergaven": hij is drift-gecorrigeerd —
alleen de RELATIEVE interesse in stress-thema's beweegt hem, niet de
algemene groei of krimp van Wikipedia-verkeer. Daarna nemen we het
voortschrijdend 7-daags gemiddelde, wat het weekdag-effect verwijdert.

Pre-registratie-amendement: I-D5-002 was gespecificeerd als Google-Trends-
index 0-100. Deze wijziging is gedocumenteerd en gemotiveerd door de
server-IP-blokkade; de meting blijft conceptueel "publieke aandachts-
interesse in stress-thema's".
"""
from __future__ import annotations
from datetime import date, timedelta
from urllib.parse import quote
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

WIKI_UA = "LHA-SBI-barometer/1.0 (https://les-hautes-alpes-sbi.surge.sh; peter@hoogland.be)"
_REST = "https://wikimedia.org/api/rest_v1/metrics/pageviews"
WIKI_ARTICLE_BASE = f"{_REST}/per-article/nl.wikipedia/all-access/user"
WIKI_AGG_BASE = f"{_REST}/aggregate/nl.wikipedia/all-access/user"

# Geverifieerde NL-Wikipedia-artikeltitels over stress-thema's.
STRESS_ARTICLES = [
    "Stress",
    "Burn-out",
    "Depressie_(klinisch)",
    "Angststoornis",
    "Overspannenheid",
    "Slapeloosheid",
]


def _ts_to_iso(ts: str) -> str | None:
    ts = str(ts)
    if len(ts) < 8:
        return None
    return f"{ts[0:4]}-{ts[4:6]}-{ts[6:8]}"


def _article_daily(article: str, start: date, end: date) -> dict[str, int]:
    """Dagelijkse weergaven voor één artikel: {YYYY-MM-DD: views}."""
    url = (
        f"{WIKI_ARTICLE_BASE}/{quote(article, safe='')}/daily/"
        f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}"
    )
    ok, body = safe_request(
        url, timeout=30, retries=2, retry_delay=3,
        headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return {}
    out: dict[str, int] = {}
    for it in body.get("items", []):
        iso = _ts_to_iso(it.get("timestamp", ""))
        if iso is None:
            continue
        try:
            out[iso] = int(it.get("views", 0))
        except (ValueError, TypeError):
            continue
    return out


def _aggregate_daily(start: date, end: date) -> dict[str, int]:
    """Totale NL-Wikipedia-weergaven per dag: {YYYY-MM-DD: views}."""
    url = (
        f"{WIKI_AGG_BASE}/daily/"
        f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}"
    )
    ok, body = safe_request(
        url, timeout=30, retries=2, retry_delay=3,
        headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return {}
    out: dict[str, int] = {}
    for it in body.get("items", []):
        iso = _ts_to_iso(it.get("timestamp", ""))
        if iso is None:
            continue
        try:
            out[iso] = int(it.get("views", 0))
        except (ValueError, TypeError):
            continue
    return out


def daily_attention_index(start: date, end: date) -> list[tuple[str, float]]:
    """Per dag: (som stress-artikel-weergaven / totale NL-weergaven) x 1e6.
    Chronologisch. Drift-gecorrigeerd aandachts-aandeel."""
    stress: dict[str, int] = {}
    for art in STRESS_ARTICLES:
        for iso, views in _article_daily(art, start, end).items():
            stress[iso] = stress.get(iso, 0) + views
    total = _aggregate_daily(start, end)
    out: list[tuple[str, float]] = []
    for iso in sorted(stress):
        t = total.get(iso)
        if t and t > 0:
            out.append((iso, round(stress[iso] / t * 1_000_000, 3)))
    return out


def trailing_mean_series(
    series: list[tuple[str, float]], window: int = 7,
) -> list[dict]:
    """Voortschrijdend gemiddelde — verwijdert het weekdag-effect."""
    out: list[dict] = []
    for i in range(len(series)):
        lo = max(0, i - window + 1)
        seg = [v for _, v in series[lo:i + 1]]
        out.append({"date": series[i][0], "value": round(sum(seg) / len(seg), 3)})
    return out


def fetch_stress_searches(target_date: date) -> FetchResult:
    # Ruim venster zodat het 7d-gemiddelde een volledig venster heeft.
    start = target_date - timedelta(days=21)
    series = daily_attention_index(start, target_date)
    if len(series) >= 7:
        smoothed = trailing_mean_series(series, window=7)
        latest = smoothed[-1]
        source = (
            f"Wikipedia-pageviews (nl.wikipedia, {len(STRESS_ARTICLES)} stress-artikels "
            f"/ totale NL-weergaven x1e6, agent=user, voortschrijdend 7d-gemiddelde)"
        )
        cache_put("I-D5-002", latest["value"], source, latest["date"])
        return FetchResult(
            "I-D5-002", latest["value"], target_date.isoformat(),
            simulated=False, source=source, observation_date=latest["date"],
        )

    # Cache
    cached = cache_get("I-D5-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-002", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # Mock
    value = seasonal_noise(target_date, 28, 6, 5, 0.0)
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (Wikipedia + cache leeg)",
    )
