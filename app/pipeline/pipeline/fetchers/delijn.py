"""
De Lijn — Vlaamse bus/tram-verstoringen, real-time (I-D2-delijn).

WAAROM (openbaar-vervoer-uitbreiding 2026-06-03, Peter: "treinen en bussen ook")
--------------------------------------------------------------------------------
Naast trein (iRail, I-D2-009) en Brussel (STIB, I-D2-stib) ook het Vlaamse net.
Peter leverde de GTFS Realtime v3-key, die het DYNAMISCHE signaal geeft: echte
geannuleerde ritten + vertragingen die mee-ademen met de spits, het weer en
incidenten — geen statische lijst gepland werk.

BRON (vereist gratis subscription-key)
--------------------------------------
De Lijn GTFS-Realtime v3 met `?json=true` → JSON i.p.v. protobuf (geen extra parser).
Sleutel uit env-var DELIJN_API_KEY (GitHub Actions secret); zonder sleutel → mock.
We tellen geannuleerde ritten + ritten met een vertraging ≥ 3 min over heel
Vlaanderen (geverifieerd 2026-06-03: ~3750 entities, honderden vertraagde ritten).

PLAATS IN HET MODEL
-------------------
SECUNDAIR signaal dat historie opbouwt. Nog NIET in het cijfer; kan later met STIB +
trein een gecombineerde OV-verstoringsindicator worden. Bron-ladder: live · cache · mock.
"""
from __future__ import annotations
import os
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

KEY_ENV = "DELIJN_API_KEY"
URL = "https://api.delijn.be/gtfs/v3/realtime?json=true&delay=true&canceled=true&position=false"
USER_AGENT = "Mozilla/5.0 (compatible; SBI-barometer/0.3; +mailto:peter@hoogland.be)"
DELAY_THRESHOLD_S = 180  # vertraging ≥ 3 min telt als merkbaar


def _count_disruptions(feed: dict) -> tuple[int, int, int]:
    """Geeft (geannuleerde ritten, vertraagde ritten ≥3min, service-alerts)."""
    entities = feed.get("entity")
    if not isinstance(entities, list):
        return 0, 0, 0
    canceled = delayed = alerts = 0
    for e in entities:
        if not isinstance(e, dict):
            continue
        if "alert" in e:
            alerts += 1
        tu = e.get("tripUpdate")
        if not isinstance(tu, dict):
            continue
        rel = str((tu.get("trip") or {}).get("scheduleRelationship", "")).upper()
        if rel == "CANCELED":
            canceled += 1
            continue
        for stu in tu.get("stopTimeUpdate") or []:
            if not isinstance(stu, dict):
                continue
            d = (stu.get("arrival") or {}).get("delay")
            if d is None:
                d = (stu.get("departure") or {}).get("delay")
            try:
                if d is not None and abs(int(d)) >= DELAY_THRESHOLD_S:
                    delayed += 1
                    break
            except (TypeError, ValueError):
                continue
    return canceled, delayed, alerts


def fetch_delijn_disruptions(target_date: date) -> FetchResult:
    """Aantal real-time De Lijn-verstoringen (geannuleerd + vertraagd ≥3min) over
    heel Vlaanderen (I-D2-delijn). Secundair, bouwt historie."""
    key = os.environ.get(KEY_ENV)
    if not key:
        return FetchResult(
            "I-D2-delijn", 0.0, target_date.isoformat(),
            simulated=True, source=f"mock (geen {KEY_ENV}-secret gezet)",
        )

    ok, body = safe_request(
        URL, timeout=30,
        headers={"Ocp-Apim-Subscription-Key": key, "User-Agent": USER_AGENT},
    )
    if ok and isinstance(body, dict):
        canceled, delayed, alerts = _count_disruptions(body)
        value = canceled + delayed
        source = (f"De Lijn GTFS-RT v3 — {canceled} geannuleerd + {delayed} vertraagd "
                  f"(≥3min), {alerts} service-alerts (Vlaanderen)")
        cache_put("I-D2-delijn", float(value), source, target_date.isoformat())
        return FetchResult(
            "I-D2-delijn", float(value), target_date.isoformat(),
            simulated=False, source=source,
        )

    cached = cache_get("I-D2-delijn")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D2-delijn", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    return FetchResult(
        "I-D2-delijn", max(0.0, round(seasonal_noise(target_date, 200, 40, 60, 1.57))),
        target_date.isoformat(), simulated=True,
        source="mock (De Lijn onbereikbaar, geen cache)",
    )
