"""
Standalone tests voor analysis/sensitivity.py (B4) — geen pytest.
Run: python3 tests/test_sensitivity.py
"""
from __future__ import annotations

import json
import math
import random
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from analysis.sensitivity import (  # noqa: E402
    first_order_sobol,
    percentile_rank,
    run_analysis,
    _scale,
    _median_sorted,
)

PASSED = 0


def ok(name: str, cond: bool, detail: str = "") -> None:
    global PASSED
    if cond:
        PASSED += 1
        print(f"  ✓ {name}")
    else:
        print(f"  ✗ {name} {detail}")
        sys.exit(1)


def make_history(tmp: Path, seed: int = 7) -> None:
    """Synthetische maar realistische historie: 8 indicatoren, 400 dagen."""
    rng = random.Random(seed)
    base_date = "2025-05-01"

    def date_n(n: int) -> str:
        # eenvoudige ISO-datumarithmetiek zonder imports buiten stdlib
        import datetime
        d = datetime.date.fromisoformat(base_date) + datetime.timedelta(days=n)
        return d.isoformat()

    codes = {
        "I-D1-002": (1.0, 0.8),
        "I-D1-004": (2.0, 0.5),
        "I-D2-004": (1.8, 0.1),
        "I-D2-009": (6.5, 1.5),
        "I-D3-002": (80.0, 12.0),
        "I-D3-006": (3.2, 0.3),
        "I-D5-001": (-2.4, 0.9),
        "I-D5-002": (140.0, 20.0),
    }
    for code, (center, spread) in codes.items():
        rows = [
            {"date": date_n(i), "value": center + spread * (rng.random() + rng.random() - 1.0)}
            for i in range(400)
        ]
        (tmp / f"{code}.json").write_text(json.dumps(rows), encoding="utf-8")
    # ruis die de loader MOET overslaan: secundair, context, diagnostisch
    (tmp / "I-D2-009S.json").write_text(json.dumps([{"date": date_n(i), "value": i} for i in range(400)]))
    (tmp / "I-D6-001.json").write_text(json.dumps([{"date": date_n(i), "value": 1} for i in range(400)]))
    (tmp / "I-D3-003.json").write_text(json.dumps([{"date": date_n(i), "value": 1} for i in range(400)]))


def main() -> int:
    print("test_sensitivity (B4)")

    # --- unit: scale-methodes ------------------------------------------------
    xs = sorted([1.0, 2.0, 3.0, 4.0, 100.0])
    med = _median_sorted(xs)
    ok("mediaan klopt", med == 3.0)
    ok("MAD robuust tegen outlier", _scale(xs, med, "mad") < _scale(xs, med, "sd"))
    flat = [5.0] * 50
    ok("vlakke reeks geeft schaal 0 (geen stille z)", _scale(flat, 5.0, "mad") == 0.0)

    # --- unit: percentile_rank ----------------------------------------------
    ok("percentile_rank midrank", percentile_rank(2.0, [1.0, 2.0, 3.0]) == 50.0)
    ok("percentile_rank lege dist = 50", percentile_rank(1.0, []) == 50.0)

    # --- unit: sobol-schatter ------------------------------------------------
    rng = random.Random(1)
    # Y hangt VOLLEDIG af van factor a, helemaal niet van b
    samples = []
    for _ in range(2000):
        a = rng.choice([0, 1, 2])
        b = rng.choice([0, 1, 2])
        samples.append(({"a": a, "b": b}, float(a) * 10 + rng.gauss(0, 0.01)))
    s_a = first_order_sobol(samples, lambda c: c["a"])
    s_b = first_order_sobol(samples, lambda c: c["b"])
    ok("Sobol: dominante factor ~1", s_a > 0.95, f"(s_a={s_a:.3f})")
    ok("Sobol: irrelevante factor ~0", s_b < 0.05, f"(s_b={s_b:.3f})")

    # --- integratie: volledige run op synthetische historie ------------------
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        make_history(tmp)
        r1 = run_analysis(tmp, n_runs=120, n_days=30, seed=42)
        r2 = run_analysis(tmp, n_runs=120, n_days=30, seed=42)
        ok("deterministisch: zelfde seed = identiek rapport", r1 == r2)
        r3 = run_analysis(tmp, n_runs=120, n_days=30, seed=43)
        ok("andere seed = ander rapport", r1 != r3)
        ok("alleen gescoorde indicatoren geladen (8, geen S/D6/grade-D)", r1["n_indicators"] == 8,
           f"(kreeg {r1['n_indicators']})")
        ok("per_day aanwezig met spread", len(r1["per_day"]) >= 10 and all("spread_pp" in p for p in r1["per_day"]))
        sob = r1["sobol_first_order"]
        flat_vals = [sob["norm_method"], sob["baseline_months"], sob["indicator_exclusion"],
                     sob["weights_total_first_order"], *sob["weights_per_domain"].values()]
        ok("Sobol-indices in [0,1]", all(0.0 <= v <= 1.0 for v in flat_vals))
        ok("samenvatting volledig", all(
            r1["summary"][k] is not None and math.isfinite(r1["summary"][k])
            for k in ("mean_spread_pp", "median_spread_pp", "max_spread_pp")))
        ok("limitaties expliciet (eerlijkheid)", len(r1["limitations"]) >= 3)

    print(f"\n{PASSED}/{PASSED} geslaagd")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
