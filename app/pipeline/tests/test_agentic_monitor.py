"""Test de pure beslislogica van de agentic monitor (decide()).
Run: python3 app/pipeline/tests/test_agentic_monitor.py
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline import agentic_monitor as mon  # noqa: E402

NOW = datetime(2026, 6, 4, 12, 0, 0, tzinfo=timezone.utc)        # 14:00 BE -> in venster
NIGHT = datetime(2026, 6, 4, 1, 0, 0, tzinfo=timezone.utc)       # 03:00 BE -> buiten venster
OK_RUN = {"status": "completed", "conclusion": "success"}
FAIL_RUN = {"status": "completed", "conclusion": "failure"}
STALE = ["live data 240 min oud (> 45) — deploy niet gepropageerd of run draaide niet"]


def test_gezond_doet_niets():
    sr, hard = mon.decide({"x": 1}, [], OK_RUN, NOW)
    assert sr is False and hard == [], (sr, hard)


def test_stale_hertriggert_maar_geen_hard_alarm():
    sr, hard = mon.decide({}, ["live data 120 min oud (> 45) — deploy niet gepropageerd"], OK_RUN, NOW)
    assert sr is True and hard == [], (sr, hard)


def test_gefaalde_run_hertriggert():
    sr, _ = mon.decide({"x": 1}, [], {"status": "completed", "conclusion": "failure"}, NOW)
    assert sr is True


def test_structureel_probleem_is_hard_alarm():
    sr, hard = mon.decide({"x": 1}, ["composiet 0.9 ≠ som contributies 0.2 (Δ=0.7 > 0.06)"], OK_RUN, NOW)
    assert any("composiet" in h for h in hard), hard


def test_fallback_vangrail_is_hard_alarm():
    # De Hitte-bug-klasse moet ook hier hard alarmeren.
    sr, hard = mon.decide({"x": 1}, ["I-D1-002: gesimuleerd én 'extreem' (raw=26.08) — fallback verkeerde schaal"], None, NOW)
    assert any("extreem" in h for h in hard), hard


def test_aanhoudende_staleness_met_faalpatroon_is_hard_alarm():
    # Data oud + >= STALE_HARD_FAILS opeenvolgende gefaalde dagruns, binnen het venster:
    # het zelf-herstel werkt niet -> escaleer naar hard alarm (de blinde vlek van 3/8).
    sr, hard = mon.decide({}, STALE, FAIL_RUN, NOW, consec_fail=2)
    assert sr is True and any("zelf-herstel" in h for h in hard), (sr, hard)


def test_eenmalige_faal_bij_staleness_is_nog_geen_hard_alarm():
    # Eén gefaalde run = transiente hobbel -> hertrigger, nog GEEN escalatie.
    sr, hard = mon.decide({}, STALE, FAIL_RUN, NOW, consec_fail=1)
    assert sr is True and hard == [], (sr, hard)


def test_staleness_snachts_escaleert_niet():
    # Buiten het update-venster (06-20u BE) hoort de data oud te zijn -> geen nachtalarm,
    # ook niet bij een faalpatroon.
    sr, hard = mon.decide({}, STALE, FAIL_RUN, NIGHT, consec_fail=5)
    assert hard == [], (sr, hard)


def test_consec_failures_telt_tot_eerste_success():
    runs = [
        {"status": "completed", "conclusion": "failure"},
        {"status": "in_progress", "conclusion": None},      # lopend -> overslaan
        {"status": "completed", "conclusion": "cancelled"},  # geannuleerd -> overslaan
        {"status": "completed", "conclusion": "failure"},
        {"status": "completed", "conclusion": "success"},    # stop hier
        {"status": "completed", "conclusion": "failure"},
    ]
    assert mon.consecutive_failures(runs) == 2, mon.consecutive_failures(runs)


def test_consec_failures_nul_als_laatste_beslissende_run_slaagde():
    runs = [
        {"status": "in_progress", "conclusion": None},
        {"status": "completed", "conclusion": "success"},
        {"status": "completed", "conclusion": "failure"},
    ]
    assert mon.consecutive_failures(runs) == 0, mon.consecutive_failures(runs)


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
