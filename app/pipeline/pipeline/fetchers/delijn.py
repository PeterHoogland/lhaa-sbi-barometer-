"""
De Lijn — Vlaamse bus/tram-verstoringen (I-D2-delijn).

WAAROM (openbaar-vervoer-uitbreiding 2026-06-03, Peter: "treinen en bussen ook")
--------------------------------------------------------------------------------
Naast trein (iRail, I-D2-009) en Brussel (STIB, I-D2-stib) ook het Vlaamse net.
De Lijn bus/tram raakt heel Vlaanderen; omleidingen/verstoringen treffen veel
pendelaars tegelijk.

BRON (vereist gratis subscription-key)
--------------------------------------
De Lijn Kern Open Data — endpoint `/DLKernOpenData/api/v1/omleidingen` geeft alle
omleidingen netwerk-breed (geverifieerd 2026-06-03 met Peters "Open Data Free"-key:
HTTP 200, 340 omleidingen). De sleutel komt uit de env-var DELIJN_API_KEY (GitHub
Actions secret); zonder sleutel → mock met eerlijke vlag.

We tellen de VANDAAG ACTIEVE omleidingen (startDatum ≤ vandaag ≤ eindDatum, of geen
eindDatum = lopend). Dit is overwegend gepland werk → een trage verstoringslast, geen
acuut real-time signaal. De real-time GTFS-RT-feed (annuleringen/vertragingen) zou
dynamischer zijn maar vereist een ander (ook gratis) product "GTFS Realtime v3".

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
URL = "https://api.delijn.be/DLKernOpenData/api/v1/omleidingen"
USER_AGENT = "Mozilla/5.0 (compatible; SBI-barometer/0.3; +mailto:peter@hoogland.be)"


def _count_active(omleidingen: list, today_iso: str) -> int:
    n = 0
    for o in omleidingen:
        if not isinstance(o, dict):
            continue
        p = o.get("periode") or {}
        start = str(p.get("startDatum") or "")[:10]
        eind = str(p.get("eindDatum") or "")[:10]
        if start and start <= today_iso and (not eind or eind >= today_iso):
            n += 1
    return n


def fetch_delijn_disruptions(target_date: date) -> FetchResult:
    """Aantal vandaag actieve De Lijn-omleidingen (Vlaanderen, I-D2-delijn).
    Secundair, bouwt historie."""
    key = os.environ.get(KEY_ENV)
    if not key:
        return FetchResult(
            "I-D2-delijn", 0.0, target_date.isoformat(),
            simulated=True, source=f"mock (geen {KEY_ENV}-secret gezet)",
        )

    ok, body = safe_request(
        URL, timeout=25,
        headers={"Ocp-Apim-Subscription-Key": key, "User-Agent": USER_AGENT},
    )
    if ok and isinstance(body, dict):
        omleidingen = body.get("omleidingen")
        if isinstance(omleidingen, list):
            count = _count_active(omleidingen, target_date.isoformat())
            source = (f"De Lijn Kern Open Data — {count} vandaag actieve omleidingen "
                      f"(van {len(omleidingen)} totaal, Vlaanderen)")
            cache_put("I-D2-delijn", float(count), source, target_date.isoformat())
            return FetchResult(
                "I-D2-delijn", float(count), target_date.isoformat(),
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
        "I-D2-delijn", max(0.0, round(seasonal_noise(target_date, 150, 20, 30, 1.57))),
        target_date.isoformat(), simulated=True,
        source="mock (De Lijn onbereikbaar, geen cache)",
    )
