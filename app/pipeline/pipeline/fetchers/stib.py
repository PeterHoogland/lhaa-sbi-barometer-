"""
STIB/MIVB — Brusselse openbaar-vervoer-verstoringen (I-D2-stib).

WAAROM (openbaar-vervoer-uitbreiding 2026-06-03, Peter: "treinen en bussen ook")
--------------------------------------------------------------------------------
Naast de trein (iRail, I-D2-009) ook stedelijk vervoer. STIB/MIVB ontsluit zijn
reizigersinformatie (verstoringen + werken) als open JSON, zonder sleutel. Brussel
is een dichtbevolkt knooppunt; metro/tram/bus-verstoringen raken veel pendelaars
tegelijk.

BRON (no-auth, JSON, werkt vanaf server-IP)
-------------------------------------------
`api-management-discovery-production.azure-api.net/.../stibmivb/rt/TravellersInformation`
(CC BY 4.0, data.belgianmobility.io). Anonieme limiet 100/dag — ruim voor 1×/dag.
Het `results`-veld bevat verstoringen ÉN lopende werken; we tellen het volume als
ruwe verstoringsdruk. Verfijning (priority/type filteren op acuut vs. gepland) is
een latere stap.

PLAATS IN HET MODEL
-------------------
SECUNDAIR signaal dat historie opbouwt (zoals DATEX-verkeer). Nog NIET in het cijfer;
kan later (met De Lijn + TEC) een gecombineerde OV-verstoringsindicator worden.
Bron-ladder: 1) live · 2) cache · 3) mock.
"""
from __future__ import annotations
import json as _json
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

URL = (
    "https://api-management-discovery-production.azure-api.net"
    "/api/datasets/stibmivb/rt/TravellersInformation"
)
USER_AGENT = "Mozilla/5.0 (compatible; SBI-barometer/0.3; +mailto:peter@hoogland.be)"


def _count_disruptions(body: object) -> int | None:
    data = body if isinstance(body, dict) else None
    if data is None and isinstance(body, str):
        try:
            data = _json.loads(body)
        except _json.JSONDecodeError:
            return None
    if not isinstance(data, dict):
        return None
    results = data.get("results")
    if not isinstance(results, list):
        return None
    return len(results)


def fetch_stib_disruptions(target_date: date) -> FetchResult:
    """Aantal actieve STIB/MIVB-reizigersinformatie-items (verstoringen + werken)
    in Brussel (I-D2-stib). Secundair, bouwt historie."""
    ok, body = safe_request(URL, timeout=20, headers={"User-Agent": USER_AGENT})
    if ok:
        count = _count_disruptions(body)
        if count is not None:
            source = f"STIB/MIVB TravellersInformation (Brussel, {count} actieve items; CC BY 4.0)"
            cache_put("I-D2-stib", float(count), source, target_date.isoformat())
            return FetchResult(
                "I-D2-stib", float(count), target_date.isoformat(),
                simulated=False, source=source,
            )

    cached = cache_get("I-D2-stib")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D2-stib", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    return FetchResult(
        "I-D2-stib", max(0.0, round(seasonal_noise(target_date, 30, 5, 8, 1.57))),
        target_date.isoformat(), simulated=True,
        source="mock (STIB onbereikbaar, geen cache)",
    )
