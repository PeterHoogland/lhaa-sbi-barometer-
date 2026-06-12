"""
Standalone tests voor analysis/multicollinearity.py (B6-uitbreiding) — geen pytest.
Run: python3 tests/test_multicollinearity.py
"""
from __future__ import annotations

import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from analysis.multicollinearity import (  # noqa: E402
    d5_ewma_monitor,
    effective_dimensionality,
    ewma_correlation,
    jacobi_eigenvalues,
    spearman,
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


def main() -> int:
    print("test_multicollinearity (B6)")

    # --- Jacobi-eigenwaarden: bekende gevallen --------------------------------
    identity = [[1.0, 0.0], [0.0, 1.0]]
    ev = jacobi_eigenvalues(identity)
    ok("identiteit: eigenwaarden [1,1]", all(abs(e - 1.0) < 1e-9 for e in ev))

    # perfecte correlatie: eigenwaarden [2, 0]
    perfect = [[1.0, 1.0], [1.0, 1.0]]
    ev = jacobi_eigenvalues(perfect)
    ok("perfecte correlatie: [2, 0]", abs(ev[0] - 2.0) < 1e-9 and abs(ev[1]) < 1e-9,
       f"(kreeg {ev})")

    # 3x3 met bekende structuur: som eigenwaarden = spoor = 3
    m3 = [[1.0, 0.5, 0.2], [0.5, 1.0, 0.3], [0.2, 0.3, 1.0]]
    ev3 = jacobi_eigenvalues(m3)
    ok("spoor behouden (som eigenwaarden = n)", abs(sum(ev3) - 3.0) < 1e-9)
    ok("eigenwaarden aflopend gesorteerd", ev3 == sorted(ev3, reverse=True))

    # --- effectieve dimensionaliteit ------------------------------------------
    dim = effective_dimensionality([2.0, 1.0, 0.0])
    ok("Kaiser telt lambda > 1", dim["kaiser_components"] == 1)
    ok("participatieratio (3^2/5 = 1.8)", abs(dim["participation_ratio"] - 1.8) < 0.01)
    dim_ind = effective_dimensionality([1.0] * 5)
    ok("onafhankelijk: participatieratio = n", abs(dim_ind["participation_ratio"] - 5.0) < 0.01)

    # --- EWMA-correlatie -------------------------------------------------------
    rng = random.Random(3)
    xs = [rng.gauss(0, 1) for _ in range(300)]
    same = ewma_correlation(xs, xs)
    ok("identieke reeksen convergeren naar corr ~1", same[-1] > 0.99, f"(kreeg {same[-1]:.3f})")
    ys = [rng.gauss(0, 1) for _ in range(300)]
    indep = ewma_correlation(xs, ys)
    ok("onafhankelijke reeksen blijven laag", abs(indep[-1]) < 0.5, f"(kreeg {indep[-1]:.3f})")
    anti = ewma_correlation(xs, [-x for x in xs])
    ok("anti-correlatie convergeert naar ~-1", anti[-1] < -0.99, f"(kreeg {anti[-1]:.3f})")
    ok("EWMA op te korte reeks geeft lege lijst", ewma_correlation([1.0], [1.0]) == [])

    # --- D5-monitor ------------------------------------------------------------
    days = [f"2026-{m:02d}-{d:02d}" for m in range(1, 5) for d in range(1, 29)]
    a = {day: math.sin(i / 5.0) + rng.gauss(0, 0.05) for i, day in enumerate(days)}
    b = {day: math.sin(i / 5.0) + rng.gauss(0, 0.05) for i, day in enumerate(days)}
    mon = d5_ewma_monitor({"I-D5-001": a, "I-D5-003": b})
    ok("D5-monitor rapporteert sterk gecorreleerd paar", mon is not None and mon["current"] > 0.7,
       f"(kreeg {mon})")
    ok("D5-monitor benoemt monitor-only expliciet", "monitor-only" in mon["note"])
    ok("D5-monitor None zonder beide reeksen", d5_ewma_monitor({"I-D5-001": a}) is None)

    # --- spearman blijft intact (regressie) -------------------------------------
    ok("spearman perfecte rang-correlatie", abs(spearman([1, 2, 3, 4], [10, 20, 30, 40]) - 1.0) < 1e-9)

    print(f"\n{PASSED}/{PASSED} geslaagd")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
