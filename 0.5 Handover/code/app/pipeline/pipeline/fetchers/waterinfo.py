"""
Wateroverlast-signaal (I-D1-009).
Doc 03_Laag-4: domein D1 (omgeving).

Bron: open-meteo Flood API (https://flood-api.open-meteo.com/), die de
GloFAS-rivierafvoer (Global Flood Awareness System, Copernicus/ECMWF)
ontsluit. Open, gratis, geen sleutel, betrouwbaar vanaf een server-IP,
en consistent met de andere open-meteo-bronnen in deze pipeline.

We meten de dagelijkse rivierafvoer (m³/s) op vier punten in grote
Belgische stroomgebieden en sommeren die tot één nationaal hoogwater-
signaal. Hogere afvoer = vollere rivieren = meer overstromingsdruk.
De Maas weegt het zwaarst, wat strookt met het reële risico: de
catastrofale overstromingen van 2021 lagen in het Maas/Vesdre-bekken.

Een eerdere versie probeerde de waterinfo.be KIWIS-API; die vergt het
vooraf opzoeken van station-tijdreeks-id's en bleek niet betrouwbaar
machine-leesbaar. De GloFAS-afvoer is een robuuste, wetenschappelijk
gangbare proxy voor overstromingsdruk.
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

# Vier punten in grote Belgische stroomgebieden (lat, lon).
RIVER_POINTS = [
    ("Maas/Luik", 50.63, 5.57),
    ("Schelde/Antwerpen", 51.22, 4.40),
    ("Dijle-Demer/Vlaams-Brabant", 50.88, 4.70),
    ("Leie/West-Vlaanderen", 50.83, 3.27),
]

FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"


def discharge_sum_series(start: date, end: date) -> list[tuple[str, float]]:
    """Som van de rivierafvoer over de vier punten per dag. Chronologisch.
    Wordt door zowel de dagfetcher als het backfill-script gebruikt."""
    lats = ",".join(str(lat) for _, lat, _ in RIVER_POINTS)
    lons = ",".join(str(lon) for _, _, lon in RIVER_POINTS)
    url = (
        f"{FLOOD_URL}?latitude={lats}&longitude={lons}"
        f"&daily=river_discharge"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
    )
    ok, body = safe_request(url, timeout=40, retries=2, retry_delay=3)
    if not ok:
        return []
    locations = body if isinstance(body, list) else [body]
    per_day: dict[str, float] = {}
    counts: dict[str, int] = {}
    for loc in locations:
        if not isinstance(loc, dict):
            continue
        daily = loc.get("daily", {})
        times = daily.get("time", [])
        vals = daily.get("river_discharge", [])
        for t, v in zip(times, vals):
            if isinstance(v, (int, float)):
                per_day[t] = per_day.get(t, 0.0) + float(v)
                counts[t] = counts.get(t, 0) + 1
    # alleen dagen waarop alle vier de punten data leverden
    return [
        (t, round(per_day[t], 2))
        for t in sorted(per_day)
        if counts.get(t) == len(RIVER_POINTS)
    ]


def fetch_flood_signal(target_date: date) -> FetchResult:
    series = discharge_sum_series(target_date - timedelta(days=10), target_date)
    if series:
        latest_date, value = series[-1]
        source = (
            "open-meteo Flood API (GloFAS-rivierafvoer, som van 4 Belgische "
            "stroomgebieden: Maas, Schelde, Dijle-Demer, Leie)"
        )
        cache_put("I-D1-009", value, source, latest_date)
        return FetchResult(
            "I-D1-009", value, target_date.isoformat(),
            simulated=False, source=source, observation_date=latest_date,
        )

    # Cache-fallback
    cached = cache_get("I-D1-009")
    if cached:
        cval, prev_source = cached
        return FetchResult(
            "I-D1-009", cval, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Mock
    value = max(0.0, 40.0 + seasonal_noise(target_date, 0.0, 18.0, 10.0, 0.0))
    return FetchResult(
        "I-D1-009", value, target_date.isoformat(),
        simulated=True, source="mock (open-meteo Flood API onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
