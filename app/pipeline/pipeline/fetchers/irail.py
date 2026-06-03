"""
iRail — live treinverstoringen op het Belgische spoornet.
Doc 03_Laag-4: I-D2-009 — ongeplande spoorverstoringen (domein D2 mobiliteit).

Bron: iRail API (https://api.irail.be/) — open, gratis, geen token. iRail is
een community-project dat de officiële NMBS/SNCB-data ontsluit.

Endpoint: https://api.irail.be/v1/disturbances?format=json&lang=nl
(De oude /disturbances/ geeft sinds 2026 een 303-redirect naar /v1/ — fragiel;
daarom rechtstreeks de v1-URL, geverifieerd 2026-06-03: HTTP 200, zelfde structuur.)
De respons bevat een lijst 'disturbance'. Elk item heeft een veld 'type' dat
ofwel "disturbance" (ongeplande verstoring) ofwel "planned" (geplande werken)
is. We tellen ENKEL de ongeplande verstoringen — geplande werken zijn
aangekondigd en veroorzaken weinig acute stress.

Hogere waarde = meer ongeplande verstoringen = meer reizigersstress.

iRail vereist een herkenbare User-Agent (fair-use policy).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

URL = "https://api.irail.be/v1/disturbances?format=json&lang=nl"
USER_AGENT = "SBI-barometer/0.2 (publieke stress-indicator; contact peter@hoogland.be)"


def _count_unplanned(body: dict) -> int | None:
    """Tel de ongeplande verstoringen in een iRail-disturbances-respons."""
    items = body.get("disturbance")
    if items is None:
        return None
    if not isinstance(items, list):
        return None
    unplanned = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        # iRail markeert geplande werken met type "planned"; ongeplande
        # verstoringen met type "disturbance". Onbekende/ontbrekende type
        # tellen we mee als verstoring (conservatief).
        dtype = str(item.get("type", "")).strip().lower()
        if dtype == "planned":
            continue
        unplanned += 1
    return unplanned


def fetch_train_disruptions(target_date: date) -> FetchResult:
    """Aantal ongeplande spoorverstoringen op het Belgische net (I-D2-009)."""
    ok, body = safe_request(URL, timeout=20, headers={"User-Agent": USER_AGENT})

    if ok and isinstance(body, dict):
        count = _count_unplanned(body)
        if count is not None:
            source = f"iRail API (NMBS/SNCB-verstoringen, {count} ongepland)"
            cache_put("I-D2-009", float(count), source, target_date.isoformat())
            return FetchResult(
                "I-D2-009", float(count), target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d) voordat we naar mock vallen
    cached = cache_get("I-D2-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D2-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock met eerlijke vlag. Basislijn ~6 verstoringen,
    # licht seizoens-gemoduleerd (winter/herfst iets hoger door weer).
    value = max(0.0, round(seasonal_noise(target_date, 6, 3, 3, 1.57)))
    return FetchResult(
        "I-D2-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (iRail onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
        error=body if not ok else None,
    )
