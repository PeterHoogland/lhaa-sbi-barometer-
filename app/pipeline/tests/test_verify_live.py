"""Standalone test voor verify_live.assess() — de volledige eindresultaat-controle.
Run: python3 app/pipeline/tests/test_verify_live.py

Borgt dat de live-verificatie de juiste dingen als FOUT (run faalt) markeert: stale
data, verkeerd aantal indicatoren, een stil-kapotte indicator, gesimuleerd-in-cijfer,
composiet ≠ som contributies, en een kritieke canary. En dat een gezond + eerlijk-
uitgesloten resultaat schoon doorkomt.
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline import verify_live as vl  # noqa: E402

NOW = datetime(2026, 6, 4, 12, 0, 0, tzinfo=timezone.utc)


def _healthy_latest() -> dict:
    bd = [{"code": f"X-{i}", "state": "normaal", "z_short": 0.1, "contribution": 0.01} for i in range(21)]
    return {
        "timestamp": "2026-06-04T11:55:00Z",            # 5 min oud
        "indicator_breakdown": bd,
        "composite": {"equal": 0.21},                    # = 21 x 0.01
        "percentile": {"short_24m": 60},
        "data_quality": {"indicators_simulated": []},
        "secondary_signals": [{} for _ in range(9)],
    }


_OK = {"verdict": "ok", "messages": []}


def test_gezond_geen_problemen():
    p, _ = vl.assess(_healthy_latest(), _OK, NOW)
    assert p == [], p


def test_stale_faalt():
    l = _healthy_latest()
    l["timestamp"] = "2026-06-04T10:00:00Z"             # 2 uur oud
    p, _ = vl.assess(l, _OK, NOW)
    assert any("oud" in x for x in p), p


def test_verkeerd_aantal_faalt():
    l = _healthy_latest()
    l["indicator_breakdown"] = l["indicator_breakdown"][:20]
    p, _ = vl.assess(l, _OK, NOW)
    assert any("verwacht 21" in x for x in p), p


def test_stil_kapotte_indicator_faalt():
    l = _healthy_latest()
    l["indicator_breakdown"][0]["z_short"] = None       # gescoord maar geen z
    p, _ = vl.assess(l, _OK, NOW)
    assert any("stil kapot" in x for x in p), p


def test_eerlijk_uitgesloten_indicator_is_ok():
    l = _healthy_latest()
    l["indicator_breakdown"][0] = {"code": "X-0", "state": "ontbreekt", "z_short": None, "contribution": 0}
    l["composite"]["equal"] = 0.24                       # 24 x 0.01
    p, _ = vl.assess(l, _OK, NOW)
    assert p == [], p


def test_simulated_is_notitie_geen_fail():
    # Gesimuleerd = bron-degradatie → canary alarmeert (degraded), verify_live faalt
    # de run NIET (anders dubbel alarm op een tijdelijke mock). Wel een notitie.
    l = _healthy_latest()
    l["data_quality"]["indicators_simulated"] = ["I-D5-001"]
    p, n = vl.assess(l, _OK, NOW)
    assert p == [], p
    assert any("gesimuleerd" in x for x in n), n


def test_harde_eis_mode_live_met_simulated_faalt():
    # HARDE EIS (go-live): mode "live" (v04-blok publiek in latest.json) +
    # indicators_simulated niet leeg → de run moet rood.
    l = _healthy_latest()
    l["v04"] = {"mode": "live"}
    l["data_quality"]["indicators_simulated"] = ["I-D3-006"]
    p, _ = vl.assess(l, _OK, NOW)
    assert any("HARDE EIS" in x for x in p), p


def test_harde_eis_mode_live_zonder_simulated_is_ok():
    l = _healthy_latest()
    l["v04"] = {"mode": "live"}
    p, _ = vl.assess(l, _OK, NOW)
    assert p == [], p


def test_harde_eis_mode_test_met_simulated_blijft_notitie():
    # In test-modus blijft gesimuleerd een notitie (bestaand gedrag), geen probleem.
    l = _healthy_latest()
    l["v04"] = {"mode": "test"}
    l["data_quality"]["indicators_simulated"] = ["I-D3-006"]
    p, n = vl.assess(l, _OK, NOW)
    assert p == [], p
    assert any("gesimuleerd" in x for x in n), n


def test_gesimuleerd_extreem_faalt():
    # De Hitte-bug-klasse (2026-06-04): een fallback-waarde op de verkeerde schaal leest
    # "extreem". Een gesimuleerde indicator hoort climatologisch/neutraal te zijn, dus
    # gesimuleerd + extreem = schaal-bug → de run moet falen.
    l = _healthy_latest()
    l["indicator_breakdown"][0] = {
        "code": "I-D1-002", "state": "extreem", "z_short": 3, "contribution": 0.08,
        "simulated": True, "raw_value": 26.08,
    }
    l["composite"]["equal"] = 0.32                       # 24 x 0.01 + 0.08
    p, _ = vl.assess(l, _OK, NOW)
    assert any("verkeerde schaal" in x for x in p), p


def test_composiet_inconsistent_faalt():
    l = _healthy_latest()
    l["composite"]["equal"] = 0.9                        # ≠ 0.21
    p, _ = vl.assess(l, _OK, NOW)
    assert any("som contributies" in x for x in p), p


def test_percentiel_buiten_bereik_faalt():
    l = _healthy_latest()
    l["percentile"]["short_24m"] = 150
    p, _ = vl.assess(l, _OK, NOW)
    assert any("percentiel" in x for x in p), p


def test_canary_kritiek_faalt():
    p, _ = vl.assess(_healthy_latest(), {"verdict": "critical", "messages": ["index stuk"]}, NOW)
    assert any("KRITIEK" in x for x in p), p


def test_geen_latest_faalt():
    p, _ = vl.assess({}, _OK, NOW)
    assert p and "geen latest.json" in p[0]


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
