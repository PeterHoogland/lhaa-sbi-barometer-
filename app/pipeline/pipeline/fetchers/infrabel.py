"""
I-D2-009 — Treinvertragingen: vertragingsgraad op het Belgische spoor (Infrabel).

HERDEFINITIE (amendement 2026-06-12, Peter GO, zie 00_Pre-Registratie §4.1 en
CHANGELOG.md): de maat was "aantal ongeplande verstoringen" (iRail-teller, te
dunne eigen historie voor een baseline); ze is nu "vertragingsgraad": het
aandeel treinmetingen met >= 6 minuten aankomstvertraging, in procent, over de
officiële Infrabel-meetset (per trein: eerste Brussel-aankomst, anders
eindbestemming), beperkt tot aankomsten vóór 20:00 lokale tijd. De iRail-teller
loopt door als secundair signaal I-D2-009S.

LIVE BRON (geen sleutel): Opendatasoft "stiptheid-van-vandaag-per-uur" — per
volledig uur-bucket het aantal metingen en het aantal stipte (< 6 min) metingen
van vandaag. Ladder:
  1. Run om/na 20:00 BE → einddagwaarde over de buckets 00u-20u; gaat de cache in.
  2. Eerdere runs → de gecachte volledige meetdag van gisteren (D-1), eerlijk met
     observation_date = gisteren en source-prefix "cache".
  3. Cold start zonder cache → de gedeeltelijke meetdag van vandaag, gevlagd
     imputed (echte data, geen volledige meetdag).
  4. Pas daarna mock (simulated=True). Nooit een synthetische waarde als meting.

BASELINE: app/pipeline/scripts/backfill_infrabel_baseline.py reconstrueert
dezelfde maat per dag uit de maandelijkse ruwe bestanden (PunctualityHistory).
Schaal empirisch gevalideerd op mei 2026: reconstructie 7,63% vs officieel
7,61% (regelmaat 92,39); met 20u-cutoff 7,44% — de live waarde past dezelfde
cutoff toe, dus beide reeksen meten hetzelfde venster.

SCHAALDISCIPLINE: de drempel- en cutoff-constanten hieronder worden gedeeld met
het backfill-script. Wijzig ze nooit eenzijdig (Hitte-bug-klasse).
"""
from __future__ import annotations

import re
from datetime import date, datetime
from zoneinfo import ZoneInfo

from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get_with_date as cache_get_with_date, put as cache_put

CODE = "I-D2-009"

# Gedeeld met backfill_infrabel_baseline.py — schaaldiscipline.
DELAY_THRESHOLD_S = 360  # >= 6 minuten aankomstvertraging telt als vertraagd
CUTOFF_HOUR = 20         # alleen aankomsten vóór 20:00 lokale tijd (laatste dagrun)

# Minimaal aantal metingen voor een bruikbare (deel)dagwaarde — de officiële
# set telt ~3.500 metingen per volledige dag; onder deze grens is het aandeel
# nog te ruisig om als meting te tellen.
MIN_METINGEN = 500

URL_TODAY = (
    "https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets/"
    "stiptheid-van-vandaag-per-uur/records?limit=30"
)

BE_TZ = ZoneInfo("Europe/Brussels")

_BUCKET_RE = re.compile(r"\[(\d{1,2})u-(\d{1,2})u\]")


def _parse_buckets(body: dict) -> list[tuple[int, int, int]]:
    """[(startuur, aantalmetingen, aantal_stipt), ...] uit de records-respons."""
    out: list[tuple[int, int, int]] = []
    for rec in body.get("results", []):
        m = _BUCKET_RE.match(str(rec.get("uurinterval", "")))
        n = rec.get("aantalmetingen")
        stipt = rec.get("aantal_stipt")
        if not m or not isinstance(n, int) or not isinstance(stipt, int):
            continue
        out.append((int(m.group(1)), n, stipt))
    return out


def aggregate_buckets(
    buckets: list[tuple[int, int, int]], current_hour: int
) -> tuple[float | None, int, int]:
    """Vertragingsgraad (%) over de VOLLEDIGE uur-buckets vóór current_hour en
    vóór CUTOFF_HOUR. Een bucket [Hu-(H+1)u] is volledig zodra H+1 <= current_hour.
    Return (waarde of None bij te weinig metingen, n_metingen, n_buckets)."""
    cap = min(current_hour, CUTOFF_HOUR)
    n = stipt = used = 0
    for start, metingen, ok in buckets:
        if start + 1 <= cap:
            n += metingen
            stipt += ok
            used += 1
    if n < MIN_METINGEN:
        return None, n, used
    return 100.0 * (1.0 - stipt / n), n, used


def fetch_train_delays(target_date: date, now: datetime | None = None) -> FetchResult:
    """Vertragingsgraad spoor (I-D2-009) via de ladder uit de module-docstring."""
    now_be = (now or datetime.now(tz=BE_TZ)).astimezone(BE_TZ)
    iso_today = target_date.isoformat()

    ok, body = safe_request(URL_TODAY, timeout=20, headers={"Accept": "application/json"})
    buckets = _parse_buckets(body) if ok and isinstance(body, dict) else []
    value, n_metingen, n_buckets = aggregate_buckets(buckets, now_be.hour) if buckets else (None, 0, 0)

    # 1. Volledige meetdag (run om/na de cutoff) → vers dagcijfer + cache.
    if value is not None and now_be.hour >= CUTOFF_HOUR:
        source = (
            f"Infrabel stiptheid-van-vandaag-per-uur "
            f"({n_metingen} metingen, {n_buckets} uren, dag tot {CUTOFF_HOUR}u)"
        )
        cache_put(CODE, value, source, iso_today, observation_date=iso_today)
        return FetchResult(
            CODE, value, iso_today,
            simulated=False, source=source,
            observation_date=iso_today,
            source_url=URL_TODAY,
        )

    # 2. Gecachte volledige meetdag (gisteren, D-1) — eerlijk gedateerd.
    # GUARD tegen cache-vergiftiging: vóór het amendement van 2026-06-12 stond
    # onder deze sleutel de iRail-VERSTORINGSTELLER (andere maat, andere schaal).
    # Accepteer alleen entries die deze fetcher zelf schreef (source "Infrabel…").
    cached = cache_get_with_date(CODE)
    if cached and str(cached[1]).startswith("Infrabel"):
        prev_value, prev_source, cached_obs = cached
        return FetchResult(
            CODE, prev_value, iso_today,
            simulated=False,
            source=f"cache (laatst volledige meetdag: {prev_source})",
            observation_date=cached_obs,
            source_url=URL_TODAY,
        )

    # 3. Cold start: gedeeltelijke meetdag van vandaag — echte data, gevlagd
    #    imputed (geen volledige meetdag). Verdwijnt na de eerste 20u-run.
    if value is not None:
        return FetchResult(
            CODE, value, iso_today,
            simulated=False, imputed=True,
            source=(
                f"Infrabel intraday (gedeeltelijke meetdag: {n_buckets} uren, "
                f"{n_metingen} metingen — wordt om {CUTOFF_HOUR}u definitief)"
            ),
            observation_date=iso_today,
            source_url=URL_TODAY,
        )

    # 4. Mock — eerlijk gevlagd, rond het lange-termijn-niveau (~7,5%).
    mock = max(0.0, 7.5 + seasonal_noise(target_date, 0, 1.0, 1.5, 2.6))
    return FetchResult(
        CODE, mock, iso_today,
        simulated=True,
        source="mock (Infrabel onbereikbaar of te weinig metingen, geen cache)",
        error=body if not ok else None,
    )
