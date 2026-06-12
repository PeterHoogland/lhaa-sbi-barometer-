"""Standalone test voor de Infrabel-vertragingsgraadfetcher (I-D2-009, amendement 2026-06-12).
Run: python3 app/pipeline/tests/test_infrabel.py

Borgt: (a) de bucket-aggregatie (alleen volledige uren, 20u-cutoff), (b) de
ladder einddag → cache-D-1 → intraday-partieel → mock, (c) eerlijke
observation_date op elke trede, (d) de gedeelde schaalconstanten met het
backfill-script (schaaldiscipline). Netwerk/cache gemonkeypatcht — geen IO.
"""
import os
import sys
from datetime import date, datetime
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.fetchers import infrabel  # noqa: E402

TARGET = date(2026, 6, 12)
BE = ZoneInfo("Europe/Brussels")


def _body(buckets):
    """Opendatasoft-respons met (startuur, metingen, stipt)-buckets."""
    return {
        "results": [
            {"uurinterval": f"[{h:02d}u-{h + 1:02d}u]", "aantalmetingen": n, "aantal_stipt": s}
            for h, n, s in buckets
        ]
    }


class _PutSpy:
    def __init__(self):
        self.calls = []

    def __call__(self, code, value, source, target_date, observation_date=None):
        self.calls.append((code, value, source, target_date, observation_date))


def _patch(*, ok, body, cached, put=None):
    infrabel.safe_request = lambda *a, **k: (ok, body)
    infrabel.cache_get_with_date = lambda code: cached
    infrabel.cache_put = put if put is not None else _PutSpy()
    return infrabel.cache_put


def _at(hour):
    return datetime(2026, 6, 12, hour, 10, tzinfo=BE)


# --- (a) bucket-aggregatie ----------------------------------------------------

def test_aggregatie_telt_alleen_volledige_uren():
    # om 10u is bucket [09u-10u] volledig, [10u-11u] niet
    value, n, used = infrabel.aggregate_buckets(
        [(8, 400, 380), (9, 400, 360), (10, 100, 50)], current_hour=10
    )
    assert used == 2 and n == 800, (used, n)
    assert abs(value - 100 * (1 - 740 / 800)) < 1e-9, value


def test_aggregatie_respecteert_20u_cutoff():
    # om 23u tellen alleen buckets vóór 20u mee (schaal van de baseline)
    value, n, used = infrabel.aggregate_buckets(
        [(18, 500, 450), (19, 500, 450), (20, 500, 100), (21, 500, 100)], current_hour=23
    )
    assert used == 2 and n == 1000, (used, n)
    assert abs(value - 10.0) < 1e-9, value


def test_aggregatie_te_weinig_metingen_geeft_none():
    value, n, _ = infrabel.aggregate_buckets([(5, 60, 55)], current_hour=8)
    assert value is None and n == 60, (value, n)


# --- (b+c) ladder -------------------------------------------------------------

def test_einddag_run_geeft_vers_dagcijfer_en_cachet():
    put = _patch(ok=True, body=_body([(h, 200, 185) for h in range(6, 20)]), cached=None)
    r = infrabel.fetch_train_delays(TARGET, now=_at(20))
    assert r.simulated is False and not r.imputed, r
    assert not r.source.startswith(("cache", "mock")), r.source
    assert 0 <= r.value <= 100, r.value
    assert r.observation_date == "2026-06-12", r.observation_date
    assert put.calls and put.calls[0][0] == "I-D2-009", put.calls
    assert put.calls[0][4] == "2026-06-12", put.calls  # periode mee de cache in


def test_ochtendrun_serveert_gisteren_uit_cache_met_eerlijke_datum():
    _patch(ok=True, body=_body([(6, 200, 190)]), cached=(7.2, "Infrabel (…)", "2026-06-11"))
    r = infrabel.fetch_train_delays(TARGET, now=_at(8))
    assert r.simulated is False, r
    assert r.source.startswith("cache"), r.source
    assert r.value == 7.2, r.value
    assert r.observation_date == "2026-06-11", r.observation_date  # D-1, geen valse versheid


def test_cold_start_intraday_is_echte_data_maar_imputed():
    _patch(ok=True, body=_body([(h, 300, 280) for h in range(6, 14)]), cached=None)
    r = infrabel.fetch_train_delays(TARGET, now=_at(14))
    assert r.simulated is False and r.imputed is True, r
    assert "intraday" in r.source, r.source
    assert r.observation_date == "2026-06-12", r.observation_date


def test_oude_irail_cache_entry_wordt_genegeerd():
    # Vóór het amendement stond onder I-D2-009 de iRail-VERSTORINGSTELLER in de
    # cache (andere maat/schaal). Die mag nooit als vertragingsgraad doorgaan.
    _patch(ok=False, body="timeout",
           cached=(2.0, "iRail API (NMBS/SNCB-verstoringen, 2 ongepland)", "2026-06-04"))
    r = infrabel.fetch_train_delays(TARGET, now=_at(8))
    assert r.simulated is True, r          # valt door naar mock, niet naar de oude teller
    assert r.source.startswith("mock"), r.source


def test_alles_plat_zonder_cache_geeft_mock():
    _patch(ok=False, body="timeout", cached=None)
    r = infrabel.fetch_train_delays(TARGET, now=_at(9))
    assert r.simulated is True, r
    assert r.source.startswith("mock"), r.source
    assert 0 <= r.value <= 100, r.value


# --- (d) schaaldiscipline -----------------------------------------------------

def test_schaalconstanten_gedeeld_met_backfill():
    # Het backfill-script importeert deze constanten; de gevalideerde ijking
    # (mei 2026: 7,63% vs officieel 7,61%) geldt alleen voor exact deze waarden.
    assert infrabel.DELAY_THRESHOLD_S == 360, infrabel.DELAY_THRESHOLD_S
    assert infrabel.CUTOFF_HOUR == 20, infrabel.CUTOFF_HOUR


def _run():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  ✗ {t.__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} geslaagd")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_run())
