"""
Aggregatie-variantie-audit — vlakt het gelijk-gewogen composiet te veel signaal weg?

WAAROM (Peter, 2026-06-14). Het composiet is het gemiddelde van ~21 indicator-
z-scores. Als die indicatoren grotendeels ONGECORRELEERD zijn, daalt de variantie
van het gemiddelde met ~1/N (portefeuille-/diversificatie-effect): het composiet
wordt strak rond 0 en een sterk los signaal (bv. pollen z=+3) verdwijnt in de
ruisvloer. Het percentiel maakt die kleine bewegingen dan weer groot, maar
rangschikt dan grotendeels ruis. Deze audit kwantificeert hoeveel van de
composiet-variantie ECHTE samenhang is versus pure uitmiddeling, en vergelijkt
twee consistentie-bewuste alternatieven die NIET wegmiddelen.

  C_equal   = mean(z_i)                          (huidige publicatie)
  C_breadth = aandeel z>+T  −  aandeel z<−T       (hoeveel indicatoren tegelijk
                                                    dezelfde kant op staan; telt,
                                                    middelt niet weg)
  C_rms     = sign(mean z) * sqrt(mean z_i^2)     (typische afwijking, met netto
                                                    richting; cancelt niet)

EERLIJK: dit is een ANALYSE, geen wijziging. Een andere aggregatie raakt de
pre-registratie (harde regel 4) en hoort via een amendement + backtest, niet via
een stille omschakeling. Het script levert het bewijs waarop die beslissing rust.

Input : app/data/analysis/z-series-dump.json  (engine-dump, SBI_DUMP_Z=1)
Output: app/data/analysis/aggregation_variance.json + leesbare samenvatting
Run   : SBI_DUMP_Z=1 npm --prefix app/engine run generate-fixture   # eenmaal, vult de dump
        python3 app/pipeline/analysis/aggregation_variance.py
"""
from __future__ import annotations
import json
import math
import statistics as st
import itertools
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../app
DUMP = ROOT / "data" / "analysis" / "z-series-dump.json"
OUT = ROOT / "data" / "analysis" / "aggregation_variance.json"

ELEVATED_T = 0.5  # |z| > 0.5 telt als "duidelijk verhoogd/verlaagd" voor breadth
# Grade-D is diagnostisch en telt NIET mee in het gepubliceerde composiet (CLAUDE.md);
# uitsluiten zodat de hermiddeling exact tegen composite.equal loopt.
GRADE_D_CODES = {"I-D3-003"}


def _pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 2:
        return 0.0
    mx, my = st.mean(xs), st.mean(ys)
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / n
    sx, sy = math.sqrt(st.pvariance(xs)), math.sqrt(st.pvariance(ys))
    return cov / (sx * sy) if sx > 0 and sy > 0 else 0.0


def main() -> int:
    if not DUMP.exists():
        print(f"FOUT: {DUMP} ontbreekt. Draai eerst: "
              f"SBI_DUMP_Z=1 npm --prefix app/engine run generate-fixture", file=sys.stderr)
        return 1
    rows = json.loads(DUMP.read_text(encoding="utf-8"))

    # Gescoorde codes = de codes die VANDAAG (laatste rij) een eindige z hebben,
    # minus grade-D (telt niet mee in composite.equal).
    codes = [c for c, v in rows[-1]["z"].items()
             if isinstance(v, (int, float)) and c not in GRADE_D_CODES]
    # Houd alleen dagen waar elke gescoorde code een z heeft (zuivere matrix).
    series: dict[str, list[float]] = {c: [] for c in codes}
    c_equal: list[float] = []        # hermiddeld uit de z's (≈ engine composite.equal)
    c_engine: list[float] = []       # engine composite.equal (authoritatief)
    c_breadth: list[float] = []
    c_rms: list[float] = []
    for r in rows:
        z = r["z"]
        if not all(isinstance(z.get(c), (int, float)) for c in codes):
            continue
        vec = [z[c] for c in codes]
        for c in codes:
            series[c].append(z[c])
        n_ind = len(vec)
        c_equal.append(sum(vec) / n_ind)
        c_engine.append(r["composite"])
        up = sum(1 for v in vec if v > ELEVATED_T)
        dn = sum(1 for v in vec if v < -ELEVATED_T)
        c_breadth.append((up - dn) / n_ind)
        m = sum(vec) / n_ind
        rms = math.sqrt(sum(v * v for v in vec) / n_ind)
        c_rms.append(math.copysign(rms, m if m != 0 else 1.0))

    N = len(codes)
    n = len(c_equal)
    if n < 30:
        print(f"FOUT: te weinig gemeenschappelijke dagen ({n}).", file=sys.stderr)
        return 1

    # Faithfulness: de hermiddeling moet ~gelijk zijn aan het engine-composiet.
    recompute_gap = max(abs(a - b) for a, b in zip(c_equal, c_engine))

    # --- Variantie-decompositie van het gelijk-gewogen composiet ---
    # Gebruik het ENGINE-composiet (gepubliceerd) als var_comp; de floor uit de
    # individuele z-varianties (zelfde set codes die het composiet vormen).
    vars_i = {c: st.pvariance(series[c]) for c in codes}
    var_comp = st.pvariance(c_engine)
    floor_var = sum(vars_i.values()) / (N * N)        # als 0 correlatie
    cross = var_comp - floor_var                      # echte samenhang
    cross_share = cross / var_comp if var_comp > 0 else 0.0

    cors = []
    for a, b in itertools.combinations(codes, 2):
        cors.append(_pearson(series[a], series[b]))
    mean_corr = st.mean(cors)

    # --- Coherentie per dag: |mean z| / mean|z|  (0 = scattergun, 1 = unaniem) ---
    coh = []
    for r_i in range(n):
        vec = [series[c][r_i] for c in codes]
        denom = sum(abs(v) for v in vec) / N
        coh.append(abs(sum(vec) / N) / denom if denom > 0 else 0.0)

    summary = {
        "n_indicators": N,
        "n_days": n,
        "recompute_gap_vs_engine": round(recompute_gap, 4),
        "mean_var_per_indicator": round(sum(vars_i.values()) / N, 4),
        "composite_sd_observed": round(math.sqrt(var_comp), 4),
        "independence_floor_sd": round(math.sqrt(floor_var), 4),
        "co_movement_share_pct": round(100 * cross_share, 1),
        "ratio_observed_over_floor": round(var_comp / floor_var, 3) if floor_var > 0 else None,
        "mean_pairwise_correlation": round(mean_corr, 4),
        "mean_daily_coherence": round(st.mean(coh), 3),
        "alternatives": {
            "C_equal":   {"sd": round(math.sqrt(var_comp), 4)},
            "C_breadth": {"sd": round(math.sqrt(st.pvariance(c_breadth)), 4),
                          "corr_with_equal": round(_pearson(c_breadth, c_equal), 3)},
            "C_rms":     {"sd": round(math.sqrt(st.pvariance(c_rms)), 4),
                          "corr_with_equal": round(_pearson(c_rms, c_equal), 3)},
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print("Aggregatie-variantie-audit")
    print("=" * 40)
    print(f"indicatoren: {N} | dagen: {n}")
    print(f"composiet-sd OBSERVED      : {summary['composite_sd_observed']}")
    print(f"onafhankelijkheids-floor sd: {summary['independence_floor_sd']}  (= bij 0 correlatie)")
    print(f"ECHTE samenhang in variantie: {summary['co_movement_share_pct']}%  "
          f"(rest = uitmiddeling)")
    print(f"gem. paarsgewijze correlatie: {summary['mean_pairwise_correlation']:+}")
    print(f"gem. dag-coherentie (0..1)  : {summary['mean_daily_coherence']}  "
          f"(laag = indicatoren middelen elkaar weg)")
    print("alternatieve aggregaties (sd t.o.v. equal):")
    for k, a in summary["alternatives"].items():
        extra = f" | corr met equal {a['corr_with_equal']}" if "corr_with_equal" in a else ""
        print(f"  {k:<10} sd {a['sd']}{extra}")
    print(f"-> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
