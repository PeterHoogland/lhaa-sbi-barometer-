"""Test de pure beslislogica van de agentic monitor (decide()).
Run: python3 app/pipeline/tests/test_agentic_monitor.py
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline import agentic_monitor as mon  # noqa: E402

NOW = datetime(2026, 6, 4, 12, 0, 0, tzinfo=timezone.utc)
OK_RUN = {"status": "completed", "conclusion": "success"}


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
