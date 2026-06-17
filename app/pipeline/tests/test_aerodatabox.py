"""Standalone test voor de AeroDataBox-vluchtvertragingfetcher (I-D2-flights,
secundair, 2026-06-17). Run: python3 app/pipeline/tests/test_aerodatabox.py

Borgt: (a) de aggregatie (aandeel >= 15 min, cancelled + zonder-werkelijke-tijd
uitgesloten, drempel-grens, MIN_ARRIVALS), (b) de ladder live -> cache-D-1 ->
geen-data, (c) eerlijke D-1 observation_date, (d) GEEN synthetische fallback
(stap 3 is simulated met value 0, nooit een verzonnen vertragingsgetal).
Netwerk/cache gemonkeypatcht — geen IO, geen API-sleutel nodig.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.fetchers import aerodatabox  # noqa: E402
from datetime import date  # noqa: E402

TARGET = date(2026, 6, 17)        # meet D-1 = 2026-06-16
D1 = "2026-06-16"
BASE = datetime(2026, 6, 15, 8, 0, tzinfo=timezone.utc)


def _t(dt):
    return {"utc": dt.strftime("%Y-%m-%d %H:%MZ")}


def arr(delay_min, status="Arrived", sched=True, actual=True):
    mv = {}
    if sched:
        mv["scheduledTime"] = _t(BASE)
    if actual:
        mv["revisedTime"] = _t(BASE + timedelta(minutes=delay_min))
    return {"status": status, "movement": mv}


class _PutSpy:
    def __init__(self):
        self.calls = []

    def __call__(self, code, value, source, target_date, observation_date=None):
        self.calls.append((code, value, source, target_date, observation_date))


def _patch(*, day_result, cached, put=None):
    aerodatabox._fetch_day_arrivals = lambda day: day_result
    aerodatabox.cache_get_with_date = lambda code: cached
    aerodatabox.cache_put = put if put is not None else _PutSpy()
    return aerodatabox.cache_put


# --- (a) aggregatie -----------------------------------------------------------

def test_aandeel_vertraagd():
    # 30 vertraagd (>=15) + 30 stipt (5 min) = 60 meetbaar -> 50%
    arrivals = [arr(20) for _ in range(30)] + [arr(5) for _ in range(30)]
    value, n, delayed = aerodatabox.aggregate_arrivals(arrivals)
    assert n == 60 and delayed == 30, (n, delayed)
    assert abs(value - 50.0) < 1e-9, value


def test_cancelled_en_zonder_werkelijke_tijd_tellen_niet():
    arrivals = (
        [arr(30) for _ in range(55)]            # 55 vertraagd, meetbaar
        + [arr(0, status="Cancelled") for _ in range(10)]   # genegeerd
        + [arr(40, actual=False) for _ in range(8)]         # geen werkelijke tijd -> genegeerd
    )
    value, n, delayed = aerodatabox.aggregate_arrivals(arrivals)
    assert n == 55 and delayed == 55, (n, delayed)
    assert abs(value - 100.0) < 1e-9, value


def test_drempel_is_inclusief_15_min():
    arrivals = [arr(15) for _ in range(40)] + [arr(14) for _ in range(20)]
    value, n, delayed = aerodatabox.aggregate_arrivals(arrivals)
    assert n == 60 and delayed == 40, (n, delayed)     # exact 15 telt mee, 14 niet


def test_te_weinig_aankomsten_geeft_none():
    value, n, _ = aerodatabox.aggregate_arrivals([arr(20) for _ in range(10)])
    assert value is None and n == 10, (value, n)


# --- (b+c) ladder + observation_date -----------------------------------------

def test_live_meetdag_geeft_vers_cijfer_en_cachet_op_d1():
    arrivals = [arr(20) for _ in range(23)] + [arr(2) for _ in range(77)]   # 23/100 = 23%
    put = _patch(day_result=(True, arrivals), cached=None)
    r = aerodatabox.fetch_flight_delays(TARGET)
    assert r.simulated is False and not r.imputed, r
    assert abs(r.value - 23.0) < 1e-9, r.value
    assert r.observation_date == D1, r.observation_date          # eerlijk D-1, geen valse versheid
    assert r.source.startswith("AeroDataBox"), r.source
    assert put.calls and put.calls[0][0] == "I-D2-flights", put.calls
    assert put.calls[0][4] == D1, put.calls                      # periode mee de cache in


def test_geen_live_serveert_cache_met_eerlijke_datum():
    _patch(day_result=(False, []),
           cached=(18.5, "AeroDataBox FIDS EBBR (280 aankomsten, meetdag 2026-06-14)", "2026-06-14"))
    r = aerodatabox.fetch_flight_delays(TARGET)
    assert r.simulated is False, r
    assert r.source.startswith("cache"), r.source
    assert r.value == 18.5, r.value
    assert r.observation_date == "2026-06-14", r.observation_date  # oorspronkelijke meetdag


def test_geen_data_is_simulated_zonder_verzonnen_getal():
    os.environ.pop(aerodatabox.KEY_ENV, None)
    _patch(day_result=(False, []), cached=None)
    r = aerodatabox.fetch_flight_delays(TARGET)
    assert r.simulated is True, r                  # geen mock-waarde, eerlijk gevlagd
    assert r.value == 0.0, r.value                 # geen verzonnen vertragingsgetal
    assert r.source.startswith("geen data"), r.source
    assert aerodatabox.KEY_ENV in r.source, r.source   # noemt de ontbrekende sleutel


def test_vreemde_cache_entry_wordt_genegeerd():
    # Een entry die deze fetcher niet zelf schreef mag nooit als vertraging doorgaan.
    os.environ.pop(aerodatabox.KEY_ENV, None)
    _patch(day_result=(False, []), cached=(2.0, "iets anders", "2026-06-01"))
    r = aerodatabox.fetch_flight_delays(TARGET)
    assert r.simulated is True, r
    assert r.source.startswith("geen data"), r.source


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
