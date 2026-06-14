"""
Afvlakking-prototype — stabiliseert een voortschrijdend venster de barometer?

WAAROM (Peter, 2026-06-14). Het publieke percentiel whipsawt: dag-tot-dag-sprongen
van gemiddeld ~15 en pieken tot ~54 (live sparkline). Oorzaak: de composiet-dag-
tot-dag-sd (0,166) is bijna gelijk aan de TOTALE sd (0,179) — er is nauwelijks
persistentie, het composiet is bijna pure dagruis. Vijf snelle indicatoren drijven
het (nieuws I-D5-001, stroom I-D3-009, gebeurtenissen I-D5-003, treinen I-D2-009,
lucht I-D1-004). Een barometer hoort een traag evoluerende toestand te meten; de
standaardoplossing is een voortschrijdend gemiddelde vóór het percentiel.

Dit script meet hoeveel een trailing venster (1/3/7/14/21 dagen) de dag-tot-dag-
volatiliteit van het percentiel terugbrengt, met een lookahead-vrij seizoens-
percentiel (±45d) op het AFGEVLAKTE composiet (referentie ook afgevlakt — anders
meet je het afgevlakte cijfer tegen ruwe historie).

EERLIJK: dit is een prototype/analyse. Afvlakken verandert het gepubliceerde
cijfer en is dus een pre-registratie-amendement (harde regel 4), geen stille
omschakeling. De absolute percentielen hier kunnen van de live afwijken (lokale
cache/stale data); de REDUCTIEFACTOR is het robuuste resultaat.

Input : app/data/analysis/z-series-dump.json
Output: app/data/analysis/smoothing_prototype.json + samenvatting
Run   : python3 app/pipeline/analysis/smoothing_prototype.py
"""
from __future__ import annotations
import json
import statistics as st
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DUMP = ROOT / "data" / "analysis" / "z-series-dump.json"
OUT = ROOT / "data" / "analysis" / "smoothing_prototype.json"

WINDOWS = (1, 3, 7, 14, 21)
WARMUP = 60
SEASONAL_WINDOW = 45
MIN_SEASONAL = 30


def _doy(s: str) -> int:
    y, m, d = map(int, s.split("-"))
    return (date(y, m, d) - date(y, 1, 1)).days


def _trailing_mean(series: list[float], w: int) -> list[float]:
    out = []
    for i in range(len(series)):
        lo = max(0, i - w + 1)
        out.append(sum(series[lo:i + 1]) / (i - lo + 1))
    return out


def _seasonal_pct(vals: list[float], doys: list[int], idx: int) -> float:
    di = doys[idx]
    ref = []
    for j in range(idx + 1):  # lookahead-vrij
        dd = abs(doys[j] - di)
        dd = min(dd, 366 - dd)
        if dd <= SEASONAL_WINDOW:
            ref.append(vals[j])
    if len(ref) < MIN_SEASONAL:
        ref = vals[:idx + 1]
    x = vals[idx]
    lo = sum(1 for v in ref if v < x)
    eq = sum(1 for v in ref if v == x)
    return (lo + 0.5 * eq) / len(ref) * 100


def main() -> int:
    rows = json.loads(DUMP.read_text(encoding="utf-8"))
    codes = [c for c, v in rows[-1]["z"].items() if isinstance(v, (int, float)) and c != "I-D3-003"]
    days = [r for r in rows if all(isinstance(r["z"].get(c), (int, float)) for c in codes)]
    comp = [r["composite"] for r in days]
    doys = [_doy(r["date"]) for r in days]
    n = len(comp)

    results = {}
    for w in WINDOWS:
        sm = _trailing_mean(comp, w)
        pcts = [_seasonal_pct(sm, doys, i) for i in range(n)]
        dpct = [abs(pcts[i] - pcts[i - 1]) for i in range(WARMUP, n)]
        dcomp = [sm[i] - sm[i - 1] for i in range(1, n)]
        results[f"{w}d"] = {
            "composite_day_sd": round(st.pstdev(dcomp), 4),
            "pct_day_jump_mean": round(st.mean(dpct), 1),
            "pct_day_jump_max": round(max(dpct), 1),
        }

    base = results["1d"]["pct_day_jump_mean"]
    summary = {
        "n_days": n,
        "n_indicators": len(codes),
        "composite_total_sd": round(st.pstdev(comp), 4),
        "composite_day_to_day_sd_raw": results["1d"]["composite_day_sd"],
        "note": "day_sd ~ total_sd => bijna geen persistentie (pure dagruis)",
        "windows": results,
        "reduction_factor_vs_raw": {w: round(base / r["pct_day_jump_mean"], 2)
                                    for w, r in results.items()},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print("Afvlakking-prototype")
    print("=" * 40)
    print(f"dagen {n} | composiet totale sd {summary['composite_total_sd']} | "
          f"dag-tot-dag sd (ruw) {summary['composite_day_to_day_sd_raw']}")
    print("  -> dag-sd ~ totale sd = bijna geen persistentie (pure dagruis)\n")
    print(f"{'venster':<8}{'comp dag-sd':>13}{'pct dag-sprong':>16}{'max':>8}{'reductie':>10}")
    for w, r in results.items():
        print(f"{w:<8}{r['composite_day_sd']:>13.4f}{r['pct_day_jump_mean']:>16.1f}"
              f"{r['pct_day_jump_max']:>8.0f}{summary['reduction_factor_vs_raw'][w]:>9}x")
    print(f"-> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
