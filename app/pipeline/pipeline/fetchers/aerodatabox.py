"""
I-D2-flights — Vluchtvertragingen Brussel (AeroDataBox). SECUNDAIR.

STATUS (2026-06-17, Peter GO). Brand-nieuwe ECHTE databron die VOORUIT historie
opbouwt. De gratis AeroDataBox-tier heeft geen diepe historie-API, dus er is nog
geen "vs normaal"-baseline. Daarom start deze bron — net als datex_traffic, stib,
delijn en sciensano_pollen — als SECUNDAIR signaal: niet in het cijfer, wel echt
gemeten en gelogd. Zodra er een echte baseline is opgebouwd (~maanden), kan hij
via amendement (00_Pre-Registratie §4.1) een gescoorde D2-indicator worden. Een
gloednieuwe indicator meteen scoren tegen een lege baseline zou hem op "ontbreekt"
zetten EN zijn domein verwateren (D2-gewicht 1/3 -> 1/4 met een altijd-missende) —
dus eerst echt meten, later promoveren.

MAAT: aandeel aankomsten >= 15 min vertraagd (%) op Brussels Airport (EBBR), over
de VOLLEDIGE vorige meetdag (D-1; dan hebben alle aankomsten een werkelijke tijd).
15 min is de standaard luchtvaart-stiptheidsdrempel. Geannuleerde vluchten en
vluchten zonder werkelijke tijd tellen niet in de noemer. Empirisch gevalideerd
2026-06-15: 295 aankomsten, 68 >= 15 min -> 23,1% (mediaan +2 min).

BRON: AeroDataBox FIDS via RapidAPI. Vereist het secret AERODATABOX_API_KEY. Twee
calls van 12 uur (00-12u, 12-24u lokale tijd) per meetdag.

LADDER (GEEN mock — Peter: enkel echte data, geen synthetische vertragingsgetallen):
  1. Live volledige D-1-meetdag -> vers cijfer + cache (observation_date = D-1).
  2. API onbereikbaar of sleutel ontbreekt -> gecachte laatste meetdag, eerlijk
     gedateerd (observation_date = oorspronkelijke meetdag).
  3. Geen cache -> simulated=True, value 0, bron "geen data". Nooit een verzonnen
     vertragingsgetal; uit historie (append_to_history slaat simulated over) en in
     strict-real-modus uit de output.
"""
from __future__ import annotations

import os
import time
from datetime import date, datetime, timedelta

from ..util import FetchResult, safe_request
from ..cache import get_with_date as cache_get_with_date, put as cache_put

CODE = "I-D2-flights"
ICAO = "EBBR"
HOST = "aerodatabox.p.rapidapi.com"
KEY_ENV = "AERODATABOX_API_KEY"

# >= 15 min aankomstvertraging telt als vertraagd (standaard luchtvaart-stiptheid).
DELAY_THRESHOLD_MIN = 15
# Onder dit aantal meetbare aankomsten is het dagaandeel te ruisig om te tellen.
MIN_ARRIVALS = 50
# BASIC RapidAPI-tier throttelt per seconde; pauze tussen de twee dagvensters.
_INTER_CALL_PAUSE_S = 1.3

_BASE = f"https://{HOST}/flights/airports/icao/{ICAO}"


def _url(frm: str, to: str) -> str:
    return (
        f"{_BASE}/{frm}/{to}"
        "?direction=Arrival&withCancelled=true&withCodeshared=false"
        "&withCargo=true&withPrivate=false&withLocation=false&withLeg=false"
    )


def _headers() -> dict | None:
    key = os.environ.get(KEY_ENV)
    if not key:
        return None
    return {"x-rapidapi-host": HOST, "x-rapidapi-key": key, "Accept": "application/json"}


def _parse_utc(node: dict | None) -> datetime | None:
    """UTC-tijdstip uit een AeroDataBox-tijdknoop ({'utc': '2026-06-15 08:20Z'})."""
    if not isinstance(node, dict):
        return None
    s = node.get("utc")
    if not isinstance(s, str):
        return None
    s = s.strip().replace(" ", "T")
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def aggregate_arrivals(arrivals: list[dict]) -> tuple[float | None, int, int]:
    """Aandeel (%) aankomsten >= DELAY_THRESHOLD_MIN vertraagd over de MEETBARE
    aankomsten (niet-geannuleerd, met geplande EN werkelijke tijd). Vertraging =
    werkelijke (revised/runway) tijd minus geplande tijd, in UTC.
    Return (waarde of None bij < MIN_ARRIVALS, n_meetbaar, n_vertraagd)."""
    n = delayed = 0
    for f in arrivals:
        if str(f.get("status", "")).lower() == "cancelled":
            continue
        mv = f.get("movement") or {}
        sched = _parse_utc(mv.get("scheduledTime"))
        actual = _parse_utc(mv.get("revisedTime") or mv.get("runwayTime") or mv.get("actualTime"))
        if sched is None or actual is None:
            continue
        n += 1
        if (actual - sched).total_seconds() >= DELAY_THRESHOLD_MIN * 60:
            delayed += 1
    if n < MIN_ARRIVALS:
        return None, n, delayed
    return 100.0 * delayed / n, n, delayed


def _fetch_day_arrivals(day: date) -> tuple[bool, list[dict]]:
    """Alle aankomsten van een volledige dag via twee FIDS-calls (12u-vensters,
    lokale luchthaventijd). Return (minstens-een-call-ok, arrivals)."""
    headers = _headers()
    if headers is None:
        return False, []
    iso = day.isoformat()
    arrivals: list[dict] = []
    ok_any = False
    for i, (a, b) in enumerate((("T00:00", "T12:00"), ("T12:00", "T23:59"))):
        if i > 0:
            time.sleep(_INTER_CALL_PAUSE_S)
        ok, body = safe_request(_url(iso + a, iso + b), timeout=25, headers=headers)
        if ok and isinstance(body, dict):
            ok_any = True
            arrivals.extend(body.get("arrivals") or [])
    return ok_any, arrivals


def fetch_flight_delays(target_date: date) -> FetchResult:
    """Vluchtvertraging Brussel (I-D2-flights, secundair) via de ladder uit de
    module-docstring. Meet de vorige volledige dag (D-1)."""
    d1 = target_date - timedelta(days=1)
    d1_iso = d1.isoformat()
    iso_today = target_date.isoformat()

    ok, arrivals = _fetch_day_arrivals(d1)
    value, n, delayed = aggregate_arrivals(arrivals) if arrivals else (None, 0, 0)

    # 1. Live volledige D-1-meetdag -> vers cijfer + cache.
    if value is not None:
        source = (
            f"AeroDataBox FIDS EBBR ({n} aankomsten, {delayed} >= "
            f"{DELAY_THRESHOLD_MIN}min, meetdag {d1_iso})"
        )
        cache_put(CODE, value, source, iso_today, observation_date=d1_iso)
        return FetchResult(
            CODE, value, iso_today,
            simulated=False, source=source,
            observation_date=d1_iso, source_url=_BASE,
        )

    # 2. Gecachte laatste meetdag — eerlijk gedateerd. Guard tegen vreemde entries:
    #    accepteer alleen wat deze fetcher zelf schreef (source "AeroDataBox").
    cached = cache_get_with_date(CODE)
    if cached and str(cached[1]).startswith(("AeroDataBox", "cache (laatste meetdag: AeroDataBox")):
        prev_value, prev_source, cached_obs = cached
        return FetchResult(
            CODE, prev_value, iso_today,
            simulated=False,
            source=f"cache (laatste meetdag: {prev_source})",
            observation_date=cached_obs, source_url=_BASE,
        )

    # 3. Geen data — eerlijk leeg, NOOIT een verzonnen vertragingsgetal (Peter).
    reason = "AERODATABOX_API_KEY ontbreekt" if _headers() is None else (
        "AeroDataBox onbereikbaar of te weinig aankomsten"
    )
    return FetchResult(
        CODE, 0.0, iso_today,
        simulated=True,
        source=f"geen data ({reason}, geen cache)",
        error=None if ok else "fetch mislukt",
    )
