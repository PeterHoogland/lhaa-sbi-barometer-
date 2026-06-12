"""
Onzekerheids-/gevoeligheidsanalyse (B4, OECD/JRC Handbook stap 7).

Doel: kwantificeren hoeveel het dagcijfer beweegt onder redelijke alternatieve
methodekeuzes. Monte-Carlo (>= 1000 runs, default 1200) over vier factoren:

  1. normalisatiemethode   : MAD-z (productie) | IQR-z | klassieke SD-z
  2. domeingewichten       : per gescoord domein x (1 + U(-0.30, +0.30)), hernormaliseerd
  3. baselinelengte        : 18 | 24 maanden (productie: 24)
  4. indicator-uitsluiting : geen | één willekeurige gescoorde indicator weggelaten

Per run wordt voor elke analysedag het composiet berekend en omgezet naar een
percentiel BINNEN de eigen run (zelfde keuzes voor alle dagen, dus eerlijk
vergelijkbaar). Gerapporteerd worden:
  - per dag: p05/p50/p95 van het dagpercentiel over alle runs + spread (p95-p05)
  - eerste-orde Sobol'-indices per factor (Var(E[Y|X_i]) / Var(Y), geschat via
    conditional-mean-binning over de Monte-Carlo-steekproef; Y = gemiddeld
    dagpercentiel van de run). Dit is een brute-force eerste-orde-schatter,
    geen Saltelli-design; voldoende voor de vraag "welke keuze domineert".

EERLIJKE VEREENVOUDIGINGEN (gedocumenteerd, geen stille afwijking van productie):
  - geen STL-decompositie (de analyse meet gevoeligheid van normalisatie/weging,
    niet de exacte productiewaarden; STL-parameters horen bij de multiverse-
    analyse van doc 07 §5);
  - percentiel binnen het analysisvenster i.p.v. het seizoensbewuste
    24-maandsvenster van productie;
  - indicatorgewichten binnen een domein blijven gelijk (productie-equal).

Pure Python (geen numpy), deterministisch geseed: zelfde seed = zelfde rapport.

Run:  python3 app/pipeline/analysis/sensitivity.py [--runs 1200] [--days 90]
      [--seed 20260612] [--hist-dir PAD] [--out PAD]
Uitvoer: app/data/analysis/sensitivity.json + leesbare samenvatting op stdout.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from bisect import bisect_left
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../app
DEFAULT_HIST_DIR = ROOT / "data" / "history"
DEFAULT_OUT = ROOT / "data" / "analysis" / "sensitivity.json"

# --- registry-spiegel (bewust minimaal; de engine-registry blijft single source
# of truth voor productie — dit is een analyse-script, geen scoringspad) -------
SKIP_SUFFIXES = ("S", "-rt", "-emotie", "-verdriet")
CONTEXT_DOMAIN = "D6"          # kalendercontext (A6): telt niet mee
DIAGNOSTIC_CODES = {"I-D3-003"}  # grade D: telt niet mee (registry.test.ts pint dit)
INVERSE_CODES = {"I-D1-001", "I-D3-007"}  # daglicht, consumentenvertrouwen

NORM_METHODS = ("mad", "iqr", "sd")
BASELINE_MONTHS = (18, 24)
WEIGHT_PERTURBATION = 0.30  # plan-eis: gewichten +/- 30%
MIN_BASELINE_POINTS = 30    # zelfde drempel als MIN_HISTORY_FOR_Z (v0.2)
WINSOR_BOUND = 3.0          # gedeeld met de engine (winsorize.ts)
MIN_SCALE = 1e-6


def domain_of(code: str) -> str:
    # I-D1-001 -> D1
    return code.split("-")[1]


def load_series(hist_dir: Path) -> dict[str, list[tuple[str, float]]]:
    """Per gescoorde indicator: chronologische (datum, waarde)-lijst."""
    series: dict[str, list[tuple[str, float]]] = {}
    for path in sorted(hist_dir.glob("I-*.json")):
        code = path.stem
        if code.endswith(SKIP_SUFFIXES) or code in DIAGNOSTIC_CODES:
            continue
        if domain_of(code) == CONTEXT_DOMAIN:
            continue
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        pts = sorted(
            (r["date"], float(r["value"]))
            for r in rows
            if isinstance(r, dict) and "date" in r and isinstance(r.get("value"), (int, float))
        )
        if len(pts) >= MIN_BASELINE_POINTS + 10:
            series[code] = pts
    return series


def _median_sorted(xs: list[float]) -> float:
    n = len(xs)
    mid = n // 2
    return xs[mid] if n % 2 else (xs[mid - 1] + xs[mid]) / 2.0


def _scale(sorted_xs: list[float], med: float, method: str) -> float:
    """Spreidingsschaal per methode. Geeft 0.0 terug bij geen bruikbare schaal."""
    n = len(sorted_xs)
    if method == "mad":
        dev = sorted(abs(x - med) for x in sorted_xs)
        s = 1.4826 * _median_sorted(dev)
    elif method == "iqr":
        def q(p: float) -> float:
            pos = (n - 1) * p
            lo, hi = int(pos), min(int(pos) + 1, n - 1)
            frac = pos - lo
            return sorted_xs[lo] + frac * (sorted_xs[hi] - sorted_xs[lo])
        s = (q(0.75) - q(0.25)) / 1.349
    elif method == "sd":
        mean = sum(sorted_xs) / n
        s = (sum((x - mean) ** 2 for x in sorted_xs) / (n - 1)) ** 0.5 if n > 1 else 0.0
    else:  # pragma: no cover
        raise ValueError(f"onbekende methode {method}")
    return s if s >= MIN_SCALE else 0.0


def precompute_z(
    series: dict[str, list[tuple[str, float]]],
    days: list[str],
) -> dict[tuple[str, int], dict[str, dict[str, float]]]:
    """
    Per (methode, baselinelengte): {dag: {code: z}}.
    z volgens de vereenvoudigde keten: schaal-methode -> winsorize -> inverse.
    Geen schaal of te weinig punten = indicator ontbreekt die dag (geen stille 0).
    """
    out: dict[tuple[str, int], dict[str, dict[str, float]]] = {}
    for method in NORM_METHODS:
        for months in BASELINE_MONTHS:
            window = int(months * 30.4)
            per_day: dict[str, dict[str, float]] = {d: {} for d in days}
            for code, pts in series.items():
                dates = [p[0] for p in pts]
                values = [p[1] for p in pts]
                val_by_date = dict(pts)
                for d in days:
                    # meting op de dag zelf of niets — geen stille carry-forward
                    x = val_by_date.get(d)
                    if x is None:
                        continue
                    # baseline = waarden strikt vóór dag d, binnen het venster
                    hi = bisect_left(dates, d)
                    lo = max(0, hi - window)
                    base = values[lo:hi]
                    if len(base) < MIN_BASELINE_POINTS:
                        continue
                    sb = sorted(base)
                    med = _median_sorted(sb)
                    s = _scale(sb, med, method)
                    if s == 0.0:
                        # vlakke baseline: op/onder mediaan = gemeten "geen
                        # uitschieter" (z=0), erboven = ontbreekt — spiegel van
                        # runtime.ts (niet-inverse pad).
                        if code not in INVERSE_CODES and x <= med:
                            z = 0.0
                        else:
                            continue
                    else:
                        z = (x - med) / s
                    z = max(-WINSOR_BOUND, min(WINSOR_BOUND, z))
                    if code in INVERSE_CODES:
                        z = -z
                    per_day[d][code] = z
            out[(method, months)] = per_day
    return out


def composite_for_day(
    zmap: dict[str, float],
    domain_weights: dict[str, float],
    excluded: str | None,
) -> float | None:
    """Equal-binnen-domein composiet met (geperturbeerde) domeingewichten."""
    by_domain: dict[str, list[float]] = {}
    for code, z in zmap.items():
        if code == excluded:
            continue
        by_domain.setdefault(domain_of(code), []).append(z)
    if not by_domain:
        return None
    total_w = sum(domain_weights[d] for d in by_domain)
    if total_w <= 0:
        return None
    comp = 0.0
    for d, zs in by_domain.items():
        comp += (domain_weights[d] / total_w) * (sum(zs) / len(zs))
    return comp


def percentile_rank(x: float, dist: list[float]) -> float:
    if not dist:
        return 50.0
    lower = sum(1 for v in dist if v < x)
    equal = sum(1 for v in dist if v == x)
    return (lower + 0.5 * equal) / len(dist) * 100.0


def first_order_sobol(samples: list[tuple[dict, float]], factor_key, n_bins: int = 8) -> float:
    """
    Brute-force eerste-orde Sobol': Var(E[Y|X]) / Var(Y) via binning.
    factor_key: functie config -> hashbare bin-waarde.
    Negatieve schattingsruis wordt op 0 geklemd; >1 op 1.
    """
    ys = [y for _, y in samples]
    n = len(ys)
    mean = sum(ys) / n
    var = sum((y - mean) ** 2 for y in ys) / n
    if var <= 0:
        return 0.0
    bins: dict[object, list[float]] = {}
    for cfg, y in samples:
        bins.setdefault(factor_key(cfg), []).append(y)
    var_of_means = 0.0
    for vals in bins.values():
        bm = sum(vals) / len(vals)
        var_of_means += len(vals) * (bm - mean) ** 2
    var_of_means /= n
    return max(0.0, min(1.0, var_of_means / var))


def continuous_bin(value: float, lo: float, hi: float, n_bins: int = 8) -> int:
    frac = (value - lo) / (hi - lo) if hi > lo else 0.0
    return min(n_bins - 1, max(0, int(frac * n_bins)))


def run_analysis(hist_dir: Path, n_runs: int, n_days: int, seed: int) -> dict:
    series = load_series(hist_dir)
    if len(series) < 5:
        raise SystemExit(f"te weinig indicatorreeksen in {hist_dir} ({len(series)}); minimaal 5")

    # Analysedagen: de laatste n_days kalenderdagen waarop >= 5 indicatoren data hebben.
    date_sets = {code: {d for d, _ in pts} for code, pts in series.items()}
    all_dates = sorted({d for ds in date_sets.values() for d in ds})
    candidates = all_dates[-(n_days * 2):]
    day_counts = {d: sum(1 for ds in date_sets.values() if d in ds) for d in candidates}
    days = [d for d in sorted(day_counts) if day_counts[d] >= 5][-n_days:]
    if len(days) < 10:
        raise SystemExit(f"te weinig analysedagen met data ({len(days)}); minimaal 10")

    z_variants = precompute_z(series, days)
    scored_codes = sorted(series)
    domains = sorted({domain_of(c) for c in scored_codes})

    rng = random.Random(seed)
    samples: list[tuple[dict, float]] = []
    per_day_percentiles: dict[str, list[float]] = {d: [] for d in days}

    for _ in range(n_runs):
        cfg = {
            "method": rng.choice(NORM_METHODS),
            "months": rng.choice(BASELINE_MONTHS),
            "weight_mult": {d: 1.0 + rng.uniform(-WEIGHT_PERTURBATION, WEIGHT_PERTURBATION) for d in domains},
            "excluded": rng.choice([None] * len(scored_codes) + scored_codes),  # ~50% kans op uitsluiting
        }
        weights = {d: cfg["weight_mult"][d] for d in domains}  # hernormalisatie zit in composite_for_day
        zs = z_variants[(cfg["method"], cfg["months"])]
        composites: dict[str, float] = {}
        for d in days:
            c = composite_for_day(zs[d], weights, cfg["excluded"])
            if c is not None:
                composites[d] = c
        if len(composites) < 10:
            continue
        dist = list(composites.values())
        run_percentiles = {d: percentile_rank(c, dist) for d, c in composites.items()}
        for d, p in run_percentiles.items():
            per_day_percentiles[d].append(p)
        # Y voor Sobol': het percentiel van de RECENTSTE dagen (het "vandaag"-
        # analoog dat gepubliceerd wordt). NIET het gemiddelde over alle dagen:
        # het gemiddelde van percentielen binnen de eigen verdeling is per
        # constructie ~50 (nulvariantie) en zou alle indices naar 0 drukken.
        recent = [run_percentiles[d] for d in days[-7:] if d in run_percentiles]
        if not recent:
            continue
        y = sum(recent) / len(recent)
        samples.append((cfg, y))

    # --- Sobol' eerste orde per factor -------------------------------------
    sobol = {
        "norm_method": first_order_sobol(samples, lambda c: c["method"]),
        "baseline_months": first_order_sobol(samples, lambda c: c["months"]),
        "indicator_exclusion": first_order_sobol(samples, lambda c: c["excluded"]),
    }
    weight_per_domain = {
        d: first_order_sobol(
            samples,
            lambda c, dd=d: continuous_bin(c["weight_mult"][dd], 1 - WEIGHT_PERTURBATION, 1 + WEIGHT_PERTURBATION),
        )
        for d in domains
    }
    sobol["weights_per_domain"] = weight_per_domain
    sobol["weights_total_first_order"] = min(1.0, sum(weight_per_domain.values()))

    # --- per-dag spreidingsmaat ---------------------------------------------
    def q(sorted_xs: list[float], p: float) -> float:
        pos = (len(sorted_xs) - 1) * p
        lo, hi = int(pos), min(int(pos) + 1, len(sorted_xs) - 1)
        frac = pos - lo
        return sorted_xs[lo] + frac * (sorted_xs[hi] - sorted_xs[lo])

    per_day = []
    spreads = []
    for d in days:
        ps = sorted(per_day_percentiles[d])
        if len(ps) < 30:
            continue
        p05, p50, p95 = q(ps, 0.05), q(ps, 0.50), q(ps, 0.95)
        spread = p95 - p05
        spreads.append(spread)
        per_day.append({
            "date": d,
            "p05": round(p05, 1),
            "p50": round(p50, 1),
            "p95": round(p95, 1),
            "spread_pp": round(spread, 1),
        })

    spreads_sorted = sorted(spreads)
    return {
        "method": "monte_carlo_oecd_jrc_step7",
        "n_runs_requested": n_runs,
        "n_runs_used": len(samples),
        "n_days": len(per_day),
        "n_indicators": len(scored_codes),
        "seed": seed,
        "factors": {
            "norm_method": list(NORM_METHODS),
            "baseline_months": list(BASELINE_MONTHS),
            "weight_perturbation": WEIGHT_PERTURBATION,
            "indicator_exclusion": "geen of één gescoorde indicator (uniform)",
        },
        "sobol_first_order": {
            k: (round(v, 3) if isinstance(v, float) else {kk: round(vv, 3) for kk, vv in v.items()})
            for k, v in sobol.items()
        },
        "per_day": per_day,
        "summary": {
            "mean_spread_pp": round(sum(spreads) / len(spreads), 1) if spreads else None,
            "median_spread_pp": round(q(spreads_sorted, 0.5), 1) if spreads else None,
            "max_spread_pp": round(max(spreads), 1) if spreads else None,
        },
        "limitations": [
            "Geen STL-decompositie: de analyse meet keuzegevoeligheid, niet exacte productiewaarden.",
            "Percentiel binnen het analysisvenster, niet het seizoensbewuste 24-maandsvenster van productie.",
            "Sobol' eerste orde via conditional-mean-binning (brute force), geen Saltelli-design; interacties (hogere orde) niet gescheiden.",
            "Indicatorgewichten binnen een domein blijven gelijk (productie-equal).",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="SBI gevoeligheidsanalyse (B4)")
    ap.add_argument("--runs", type=int, default=1200)
    ap.add_argument("--days", type=int, default=90)
    ap.add_argument("--seed", type=int, default=20260612)
    ap.add_argument("--hist-dir", type=Path, default=DEFAULT_HIST_DIR)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args(argv)

    if args.runs < 1000:
        print(f"waarschuwing: {args.runs} runs < plan-eis 1000 (ok voor tests)", file=sys.stderr)

    report = run_analysis(args.hist_dir, args.runs, args.days, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    s = report["summary"]
    print(f"Gevoeligheidsanalyse: {report['n_runs_used']} runs, {report['n_days']} dagen, "
          f"{report['n_indicators']} indicatoren (seed {report['seed']})")
    print(f"Spreiding dagpercentiel (p95-p05): gemiddeld {s['mean_spread_pp']} pp, "
          f"mediaan {s['median_spread_pp']} pp, max {s['max_spread_pp']} pp")
    print("Sobol' eerste orde:", json.dumps(report["sobol_first_order"], ensure_ascii=False))
    print(f"Rapport: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
