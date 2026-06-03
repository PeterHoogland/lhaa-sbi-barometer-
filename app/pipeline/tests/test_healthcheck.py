"""Standalone test voor de dagelijkse bron-gezondheidstest (canary).
Run: python3 app/pipeline/tests/test_healthcheck.py

Borgt vooral de KERNREGEL: een waarde van 0 met simulated=False is een GEZONDE
nul (Google Trends op een sportdag, "Kou" in de zomer) en mag NOOIT alarm geven.
Het alarm hangt aan de simulated-vlag, aan afwezigheid en aan veroudering.
"""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline import healthcheck as hc  # noqa: E402

TODAY = date(2026, 6, 3)


def _src(code: str, value: float = 0.5, simulated: bool = False, obs: str = "2026-06-03") -> dict:
    return {"code": code, "value": value, "simulated": simulated,
            "observation_date": obs, "source": "test-bron"}


def _healthy_raw() -> dict:
    return {
        "target_date": "2026-06-03",
        "results": [_src(c) for c in hc.PRIMARY_SOURCES],
        "secondary": [_src(c) for c in hc.SECONDARY_SOURCES],
    }


def _healthy_index() -> dict:
    return {
        "composite": {"equal": 0.24},
        "percentile": {"short_24m": 71},
        "indicator_breakdown": [{"code": f"X-{i}", "state": "normaal"} for i in range(25)],
        "timestamp": "2026-06-03T08:00:00Z",
    }


def _status(report, code: str) -> str:
    return next(s.status for s in report.sources if s.code == code)


# --- de basis ---------------------------------------------------------------

def test_alles_gezond_is_ok():
    r = hc.analyze(_healthy_raw(), _healthy_index(), TODAY)
    assert r.verdict == "ok", r.messages


def test_volledige_inventaris_wordt_gecontroleerd():
    # 18 primair + 10 secundair = de volledige verwachte set.
    assert len(hc.PRIMARY_SOURCES) == 18
    assert len(hc.SECONDARY_SOURCES) == 10
    r = hc.analyze(_healthy_raw(), _healthy_index(), TODAY)
    assert len(r.sources) == 28


# --- KERNREGEL: gezonde nul is geen alarm -----------------------------------

def test_kou_nul_in_de_zomer_is_gezond():
    # I-D1-003 "Kou" = 0.0, echte fetch (open-meteo bereikt). GEEN alarm.
    raw = _healthy_raw()
    for r in raw["results"]:
        if r["code"] == "I-D1-003":
            r["value"] = 0.0
            r["simulated"] = False
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D1-003") == "ok"
    assert rep.verdict == "ok"


def test_google_trends_nul_op_sportdag_is_gezond():
    # I-D5-trends = 0 (0/10 trends stress-relevant), simulated=False. GEEN alarm.
    raw = _healthy_raw()
    for r in raw["secondary"]:
        if r["code"] == "I-D5-trends":
            r["value"] = 0
            r["simulated"] = False
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D5-trends") == "ok"
    assert rep.verdict == "ok"


# --- echte degradatie wordt WEL gevangen ------------------------------------

def test_secundaire_mock_is_degraded():
    # De Reddit-blinde-vlek: een secundaire bron die stil op mock valt.
    raw = _healthy_raw()
    for r in raw["secondary"]:
        if r["code"] == "I-D5-006S":
            r["simulated"] = True
            r["source"] = "mock (Reddit onbereikbaar)"
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D5-006S") == "mock"
    assert rep.verdict == "degraded"


def test_primaire_mock_is_degraded():
    raw = _healthy_raw()
    for r in raw["results"]:
        if r["code"] == "I-D3-001":
            r["simulated"] = True
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert rep.verdict == "degraded"


def test_afwezige_secundaire_bron_is_degraded():
    # Een fetcher die uit de pijplijn verdwijnt → code ontbreekt → afwezig.
    raw = _healthy_raw()
    raw["secondary"] = [r for r in raw["secondary"] if r["code"] != "I-D2-delijn"]
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D2-delijn") == "absent"
    assert rep.verdict == "degraded"


def test_cache_terugval_is_degraded():
    # A8: een fetcher die de verse fetch mist en een oude cache-waarde uitstuurt
    # met simulated=False (en datum=vandaag) mag NIET als verse meting doorgaan.
    raw = _healthy_raw()
    for r in raw["secondary"]:
        if r["code"] == "I-D2-stib":
            r["simulated"] = False
            r["source"] = "cache (laatst succesvol: STIB 2026-06-01)"
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D2-stib") == "cache"
    assert rep.verdict == "degraded"


def test_nan_waarde_is_degraded():
    raw = _healthy_raw()
    for r in raw["results"]:
        if r["code"] == "I-D3-002":
            r["value"] = None
            r["simulated"] = False
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D3-002") == "nan"
    assert rep.verdict == "degraded"


# --- critical: de index zelf is stuk ----------------------------------------

def test_composiet_ontbreekt_is_critical():
    idx = _healthy_index()
    idx["composite"] = {}
    rep = hc.analyze(_healthy_raw(), idx, TODAY)
    assert rep.verdict == "critical"


def test_percentiel_buiten_bereik_is_critical():
    idx = _healthy_index()
    idx["percentile"] = {"short_24m": 250}
    rep = hc.analyze(_healthy_raw(), idx, TODAY)
    assert rep.verdict == "critical"


def test_verkeerd_aantal_indicatoren_is_critical():
    idx = _healthy_index()
    idx["indicator_breakdown"] = idx["indicator_breakdown"][:24]  # 24 i.p.v. 25
    rep = hc.analyze(_healthy_raw(), idx, TODAY)
    assert rep.verdict == "critical"


def test_geen_index_is_critical():
    rep = hc.analyze(_healthy_raw(), None, TODAY)
    assert rep.verdict == "critical"


def test_stale_dagrun_is_critical():
    # raw-values van 5 dagen geleden = de fetch draaide vandaag niet.
    raw = _healthy_raw()
    raw["target_date"] = "2026-05-29"
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert rep.verdict == "critical"


def test_zes_primaire_bronnen_plat_is_critical():
    raw = _healthy_raw()
    down = ["I-D1-002", "I-D1-004", "I-D2-004", "I-D3-002", "I-D3-009", "I-D2-009"]
    for r in raw["results"]:
        if r["code"] in down:
            r["simulated"] = True
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert rep.verdict == "critical"


def test_alle_nieuwsbronnen_plat_is_critical():
    raw = _healthy_raw()
    for r in raw["results"]:
        if r["code"].startswith("I-D5-"):
            r["simulated"] = True
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert rep.verdict == "critical"


# --- veroudering: zacht, geen alarm -----------------------------------------

def test_maandcijfer_vorige_maand_is_ok():
    # Consumentenvertrouwen verwijst naar vorige maand → binnen tolerantie.
    raw = _healthy_raw()
    for r in raw["results"]:
        if r["code"] == "I-D3-007":
            r["observation_date"] = "2026-05"
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D3-007") == "ok"
    assert rep.verdict == "ok"


def test_dagbron_te_oud_is_stale_maar_niet_degraded():
    # Een dagbron die op een waarde van 30 dagen oud blijft hangen → zacht "stale".
    raw = _healthy_raw()
    for r in raw["results"]:
        if r["code"] == "I-D5-001":
            r["observation_date"] = "2026-05-04"  # 30d oud, tolerantie 3d
    rep = hc.analyze(raw, _healthy_index(), TODAY)
    assert _status(rep, "I-D5-001") == "stale"
    assert rep.verdict == "ok"  # stale alleen = geen degraded


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
