"""
Standalone tests voor validation/criterion_validity.py (C1) — geen pytest.
Run: python3 tests/test_criterion_validity.py
"""
from __future__ import annotations

import csv
import math
import random
import sys
import tempfile
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from validation.criterion_validity import (  # noqa: E402
    cross_correlate_daily,
    cross_correlate_periodic,
    fisher_p,
    month_center,
    run,
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


def daily_series(n: int, fn) -> dict[str, float]:
    start = date(2025, 1, 1)
    return {(start + timedelta(days=i)).isoformat(): fn(i) for i in range(n)}


def main() -> int:
    print("test_criterion_validity (C1)")
    rng = random.Random(7)

    # --- fisher_p ----------------------------------------------------------
    ok("p klein bij sterke r en grote n", fisher_p(0.8, 200) < 1e-6)
    ok("p ~1 bij r=0", fisher_p(0.0, 200) > 0.99)
    ok("p NaN bij te kleine n", math.isnan(fisher_p(0.5, 3)))

    # --- month_center ------------------------------------------------------
    series = daily_series(365, lambda i: math.sin(2 * math.pi * i / 365) * 10)
    centered = month_center(series)
    spread_raw = max(series.values()) - min(series.values())
    spread_cent = max(centered.values()) - min(centered.values())
    ok("maand-centrering dempt seizoensgang", spread_cent < spread_raw * 0.5,
       f"(ruw {spread_raw:.1f}, gecentreerd {spread_cent:.1f})")

    # --- kruiscorrelatie dag: bekende lag ------------------------------------
    # Witte ruis als basissignaal: autocorrelatie ~0 buiten lag 0, dus de
    # geconstrueerde verschuiving van 2 dagen is ondubbelzinnig de beste lag.
    base = [rng.gauss(0, 1) for _ in range(400)]
    sbi = daily_series(400, lambda i: base[i] + rng.gauss(0, 0.1))
    ext = {}
    start = date(2025, 1, 1)
    for i in range(400):
        ext[(start + timedelta(days=i + 2)).isoformat()] = base[i] + rng.gauss(0, 0.1)
    res = cross_correlate_daily(sbi, ext)
    ok("dagcorrelatie levert lags 0-3 (ruw en gecorrigeerd)",
       len(res["by_lag"]) == 4 and len(res["by_lag_season_adjusted"]) == 4)
    ok("beste lag = 2 (geconstrueerd)", res["best"]["lag_days"] == 2, f"(kreeg {res['best']})")
    ok("beste r hoog + p klein", res["best"]["r"] > 0.9 and res["best"]["p_approx"] < 1e-4)
    ok("sufficient_n bij 400 dagen", res["sufficient_n"] is True)
    ok("best komt uit de seizoens-gecorrigeerde reeks", res["best_basis"] == "season_adjusted")

    # --- periodiek (maandelijks) ----------------------------------------------
    sbi_year = daily_series(720, lambda i: (i // 30) % 12 + rng.gauss(0, 0.2))
    ext_monthly = {}
    for m in range(24):
        y, mm = 2025 + m // 12, m % 12 + 1
        ext_monthly[f"{y}-{mm:02d}-01"] = float((m % 12))
    resm = cross_correlate_periodic(sbi_year, ext_monthly, "maandelijks")
    ok("maandcorrelatie berekend met lag 0 en 1", len(resm["by_lag"]) == 2)
    ok("maandcorrelatie vindt het verband", abs(resm["best"]["r"]) > 0.5, f"(kreeg {resm['best']})")

    # --- run(): stub zonder data, computed met data ----------------------------
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        rep = run(data_dir=tmp, sbi_override=sbi)
        ok("zonder ijkdata: status stub + alle bronnen missing",
           rep["status"] == "stub" and len(rep["missing"]) == 5)
        ok("rapport draagt datacontract, confounder-note en validatiekalender",
           "data_contract" in rep and "confounder_note" in rep and "validation_calendar" in rep)
        # schrijf één primaire ijkbron
        with (tmp / "tele_onthaal.csv").open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=["date", "value"])
            w.writeheader()
            for d, v in ext.items():
                w.writerow({"date": d, "value": v})
        rep2 = run(data_dir=tmp, sbi_override=sbi)
        ok("met primaire ijkbron: status computed + resultaat met r/p/lag",
           rep2["status"] == "computed" and rep2["results"]["tele_onthaal.csv"]["best"]["r"] > 0.9)

    print(f"\n{PASSED}/{PASSED} geslaagd")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
