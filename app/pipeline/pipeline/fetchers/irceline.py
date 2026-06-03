"""
Luchtkwaliteit-fetcher (I-D1-004) — BELGISCHE bron.

Bron: IRCELINE (Intergewestelijke Cel voor het Leefmilieu), het officiële
Belgische luchtmeetnet, via de open 52°North SOS REST API op geo.irceline.be
(geen sleutel, werkt vanaf een server-IP). We lezen drie Brusselse meetstations
(NO2, O3, PM10) en nemen de hoogste ratio tov de WHO 2021-grenswaarden als één
luchtkwaliteit-stress-signaal. Hogere concentratie = slechtere lucht = meer stress.

(Voorheen: open-meteo Air Quality = het Europese CAMS-model, geen Belgische
meting. Peter 2026-06-04: alle bronnen Belgisch. IRCELINE is de echte meetbron.
De baseline in data/history/I-D1-004.json is bijgevolg her-backfilled op deze
zelfde bron + formule, zodat de Z-score consistent blijft.)
"""
from __future__ import annotations
from datetime import date, datetime, timedelta, timezone
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

SOS = "https://geo.irceline.be/sos/api/v1/timeseries"

# Brusselse meetstation-tijdreeksen (geverifieerd live 2026-06-04) + WHO 2021-grenswaarde
# (µg/m³). Aggregatie per dag: NO2/PM10 = daggemiddelde, O3 = dagmaximum (8u-piek-proxy).
POLLUTANTS = [
    ("NO2", 6504, 25.0, "mean"),   # 41B001 Brussel Arts-Loi
    ("O3", 6625, 100.0, "max"),    # 41R012 Ukkel (Parlement-station 6517 ligt stil)
    ("PM10", 6626, 45.0, "mean"),  # 41R012 Ukkel
]
# Minstens zoveel van de drie vervuilers nodig voor een eerlijke composiet (tolereert
# één stilliggend station zonder het hele signaal te laten wegvallen).
MIN_POLLUTANTS = 2


def _fetch_points(ts_id: int, start: date, end: date) -> list[tuple[date, float]]:
    """Uurwaarden (Brussel-dag, waarde) voor één tijdreeks over [start, end],
    in stukken van 45 dagen (de SOS-API beperkt grote vensters)."""
    out: list[tuple[date, float]] = []
    chunk_start = start
    while chunk_start <= end:
        chunk_end = min(chunk_start + timedelta(days=45), end)
        url = (
            f"{SOS}/{ts_id}/getData"
            f"?timespan={chunk_start.isoformat()}T00:00:00Z/{chunk_end.isoformat()}T23:59:59Z"
        )
        ok, body = safe_request(url, timeout=40, headers={"Accept": "application/json"})
        if ok and isinstance(body, dict):
            for v in body.get("values", []):
                ts, val = v.get("timestamp"), v.get("value")
                if isinstance(ts, (int, float)) and isinstance(val, (int, float)):
                    d = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).date()
                    out.append((d, float(val)))
        chunk_start = chunk_end + timedelta(days=1)
    return out


def _agg(values: list[float], how: str) -> float:
    return max(values) if how == "max" else sum(values) / len(values)


def daily_composite_series(start: date, end: date) -> list[tuple[str, float]]:
    """Eén luchtkwaliteit-composiet per dag = max(NO2̄/25, O3_max/100, PM10̄/45).
    Gedeeld door de dag-fetcher en het backfill-script, zodat live-waarde en
    baseline op exact dezelfde meetbron + formule staan. Chronologisch."""
    # Per vervuiler: {dag: [uurwaarden]}
    per_pollutant: dict[str, dict[date, list[float]]] = {}
    for name, ts_id, _who, _how in POLLUTANTS:
        buckets: dict[date, list[float]] = {}
        for d, val in _fetch_points(ts_id, start, end):
            buckets.setdefault(d, []).append(val)
        per_pollutant[name] = buckets

    all_days = sorted(set().union(*[set(b.keys()) for b in per_pollutant.values()])) \
        if any(per_pollutant.values()) else []
    out: list[tuple[str, float]] = []
    for d in all_days:
        ratios = []
        for name, _ts, who, how in POLLUTANTS:
            vals = per_pollutant[name].get(d)
            if vals:
                ratios.append(_agg(vals, how) / who)
        if len(ratios) >= MIN_POLLUTANTS:
            out.append((d.isoformat(), round(max(ratios), 4)))
    return out


def fetch_air_quality(target_date: date) -> FetchResult:
    series = daily_composite_series(target_date - timedelta(days=7), target_date)
    if series:
        latest_date, value = series[-1]
        source = "IRCELINE (Belgisch luchtmeetnet, Brussel: NO2/O3/PM10 tov WHO 2021)"
        cache_put("I-D1-004", value, source, latest_date)
        return FetchResult(
            "I-D1-004", value, target_date.isoformat(),
            simulated=False, source=source, observation_date=latest_date,
        )

    cached = cache_get("I-D1-004")
    if cached:
        cval, prev_source = cached
        return FetchResult(
            "I-D1-004", cval, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    ratio = max(0.0, seasonal_noise(target_date, 0.8, 0.3, 0.2, 0.0))
    return FetchResult(
        "I-D1-004", ratio, target_date.isoformat(),
        simulated=True, source="mock (IRCELINE SOS onbereikbaar + cache leeg)",
    )
