"""
CISS-prototype — consistentie-bewuste aggregatie naast het gelijk-gewogen composiet.

WAAROM (Peter, 2026-06-14). De aggregatie-variantie-audit toonde dat het gelijk-
gewogen composiet ~96% uitmiddeling is en maar ~4% echte samenhang draagt: een
los signaal verdwijnt in de ruisvloer. CISS (Holló, Kremer & Lo Duca 2012, de
ECB-systeemstress-index — al onze bron voor de eCDF) lost dit op met
portefeuille-theorie: het aggregeert DOMEIN-subindices met een TIJD-VARIËRENDE
correlatiematrix, zodat het composiet wordt VERSTERKT als domeinen samen bewegen
(systemisch) en GEDEMPT als de stress geïsoleerd is.

  CISS_t = (w ∘ s_t)' C_t (w ∘ s_t)
    s_t = domein-stress-subindices in [0,1] (rang van de domein-z binnen zijn eigen reeks)
    w   = domeingewichten (gelijk, 1/aantal domeinen — zoals het huidige composiet)
    C_t = EWMA tijd-variërende correlatiematrix tussen de domeinen
  Bij correlatie 1 -> (Σ w s)^2 (geen diversificatie); bij 0 -> Σ w^2 s^2 (sterk gediversifieerd).

VERGELIJKING. We zetten CISS naast het huidige domein-gelijk-gewogen composiet en
toetsen de kernvraag: scheidt CISS SYSTEMISCHE dagen (meerdere domeinen tegelijk
hoog) van GEÏSOLEERDE pieken (één domein hoog) beter dan het platte gemiddelde?
Plus een gecontroleerde synthetische demonstratie van het mechanisme.

EERLIJK: dit is een ANALYSE/prototype, geen live-wijziging. Beslissing = amendement.
De backtest draait op het beschikbare dagvenster (~2 jaar); een volledige
historische stressperiode-validatie (energiecrisis 2022) vergt dag-backfill van
weer/nieuws tot 2022, die er niet is — de synthetische test dekt het mechanisme.

Input : app/data/analysis/z-series-dump.json   (SBI_DUMP_Z=1 generate-fixture)
Output: app/data/analysis/ciss_prototype.json + leesbare samenvatting
Run   : python3 app/pipeline/analysis/ciss_prototype.py
"""
from __future__ import annotations
import json
import math
import statistics as st
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DUMP = ROOT / "data" / "analysis" / "z-series-dump.json"
OUT = ROOT / "data" / "analysis" / "ciss_prototype.json"

GRADE_D = {"I-D3-003"}        # diagnostisch, niet in het composiet
CONTEXT_DOMAINS = {"D6"}      # kalendercontext telt niet mee
LAMBDA = 0.94                 # EWMA-decay (RiskMetrics-daglijks; ~16d halfwaarde)
WARMUP = 60                   # dagen voor de EWMA-correlatie stabiliseert
HIGH = 0.70                   # domein-stress > 0,70 = "hoog" (top ~30%)


def _domain_of(code: str) -> str:
    return code.split("-")[1]  # "I-D3-001" -> "D3"


def _rank01(values: list[float]) -> list[float]:
    """Empirische rang in [0,1] (midrank), per reeks — de [0,1]-stressmaat per domein."""
    n = len(values)
    order = sorted(range(n), key=lambda i: values[i])
    out = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j + 1 < n and values[order[j + 1]] == values[order[i]]:
            j += 1
        rank = (i + j) / 2.0          # 0-based gemiddelde rang bij ties
        for k in range(i, j + 1):
            out[order[k]] = rank / max(1, n - 1)
        i = j + 1
    return out


def _pctile(x: float, dist: list[float]) -> float:
    lower = sum(1 for d in dist if d < x)
    equal = sum(1 for d in dist if d == x)
    return (lower + 0.5 * equal) / len(dist) * 100


def main() -> int:
    rows = json.loads(DUMP.read_text(encoding="utf-8"))

    # Domeinen + hun indicatoren (uit de laatste dag, finite z, geen grade-D/context).
    codes = [c for c, v in rows[-1]["z"].items()
             if isinstance(v, (int, float)) and c not in GRADE_D]
    domains: dict[str, list[str]] = {}
    for c in codes:
        d = _domain_of(c)
        if d in CONTEXT_DOMAINS:
            continue
        domains.setdefault(d, []).append(c)
    dom_keys = sorted(domains)
    D = len(dom_keys)

    # Per dag: domein-subindex = gemiddelde z in dat domein (gelijke indicatorweging).
    dates: list[str] = []
    dom_series: dict[str, list[float]] = {d: [] for d in dom_keys}
    for r in rows:
        z = r["z"]
        if not all(isinstance(z.get(c), (int, float)) for c in codes):
            continue
        dates.append(r["date"])
        for d in dom_keys:
            vals = [z[c] for c in domains[d]]
            dom_series[d].append(sum(vals) / len(vals))
    n = len(dates)

    # Domein-stress in [0,1] (rang binnen de eigen reeks) — de CISS-subindices.
    s = {d: _rank01(dom_series[d]) for d in dom_keys}

    # Huidig composiet: domein-gelijk gemiddelde van de domein-z (tweezijdig).
    c_equal = [sum(dom_series[d][t] for d in dom_keys) / D for t in range(n)]

    # EWMA tijd-variërende correlatie + CISS per dag.
    w = 1.0 / D
    mu = [0.5] * D                      # subindices starten rond 0,5
    cov = [[1.0 if i == j else 0.0 for j in range(D)] for i in range(D)]
    ciss: list[float] = []
    for t in range(n):
        x = [s[d][t] for d in dom_keys]
        mu = [LAMBDA * mu[i] + (1 - LAMBDA) * x[i] for i in range(D)]
        dev = [x[i] - mu[i] for i in range(D)]
        for i in range(D):
            for j in range(D):
                cov[i][j] = LAMBDA * cov[i][j] + (1 - LAMBDA) * dev[i] * dev[j]
        # Correlatiematrix uit de EWMA-covariantie.
        corr = [[0.0] * D for _ in range(D)]
        for i in range(D):
            for j in range(D):
                den = math.sqrt(cov[i][i] * cov[j][j])
                corr[i][j] = cov[i][j] / den if den > 1e-12 else (1.0 if i == j else 0.0)
        # CISS = (w*s)' C (w*s)
        ws = [w * x[i] for i in range(D)]
        val = sum(ws[i] * corr[i][j] * ws[j] for i in range(D) for j in range(D))
        ciss.append(max(0.0, val))

    # --- Backtest: scheidt CISS systemische dagen van geïsoleerde pieken? ---
    # Tel per dag de domeinen met stress > HIGH. Systemisch = >=3 hoog; isolatie =
    # precies 1 hoog terwijl het gemiddelde laag blijft (één piek, rest rustig).
    eq_pct = [_pctile(c_equal[t], c_equal[WARMUP:]) for t in range(n)]
    ci_pct = [_pctile(ciss[t], ciss[WARMUP:]) for t in range(n)]
    systemic, isolated = [], []
    for t in range(WARMUP, n):
        high = sum(1 for d in dom_keys if s[d][t] > HIGH)
        if high >= 3:
            systemic.append(t)
        elif high == 1 and c_equal[t] < st.median(c_equal[WARMUP:]) + 0.1:
            isolated.append(t)

    def _avg(idx, arr):
        return round(st.mean(arr[t] for t in idx), 1) if idx else None

    # --- Synthetische demonstratie van het mechanisme (geen echte data) ---
    # Achtergrond = de mediane EWMA-correlatie van vandaag; vergelijk drie dagen.
    def _ciss_for(level_vec: list[float], corr) -> float:
        ws = [w * v for v in level_vec]
        return max(0.0, sum(ws[i] * corr[i][j] * ws[j] for i in range(D) for j in range(D)))
    last_corr = corr  # de laatste (vandaag) EWMA-correlatie
    calm = [0.5] * D
    spike = [0.95] + [0.5] * (D - 1)              # één domein extreem, rest neutraal
    broad = [0.5 + (0.95 - 0.5) / D] * D          # ZELFDE totale stress, gespreid
    synth = {
        "rustig (alle 0,5)": {"equal": round(sum(calm) / D, 3), "ciss": round(_ciss_for(calm, last_corr), 4)},
        "1 piek (0,95 + rest 0,5)": {"equal": round(sum(spike) / D, 3), "ciss": round(_ciss_for(spike, last_corr), 4)},
        "systemisch gespreid (zelfde totaal)": {"equal": round(sum(broad) / D, 3), "ciss": round(_ciss_for(broad, last_corr), 4)},
    }

    summary = {
        "n_days": n, "domains": dom_keys, "lambda": LAMBDA, "high_threshold": HIGH,
        "equal_sd": round(st.pvariance(c_equal) ** 0.5, 4),
        "ciss_sd": round(st.pvariance(ciss) ** 0.5, 4),
        "ciss_corr_with_equal": round(
            (lambda xs, ys: (sum((a - st.mean(xs)) * (b - st.mean(ys)) for a, b in zip(xs, ys)) / len(xs))
             / (st.pvariance(xs) ** 0.5 * st.pvariance(ys) ** 0.5))(ciss, c_equal), 3),
        "n_systemic_days": len(systemic),
        "n_isolated_spike_days": len(isolated),
        "systemic_days_equal_pct_avg": _avg(systemic, eq_pct),
        "systemic_days_ciss_pct_avg": _avg(systemic, ci_pct),
        "isolated_days_equal_pct_avg": _avg(isolated, eq_pct),
        "isolated_days_ciss_pct_avg": _avg(isolated, ci_pct),
        "synthetic_demo": synth,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print("CISS-prototype vs gelijk-gewogen composiet")
    print("=" * 46)
    print(f"domeinen: {dom_keys} | dagen: {n} | lambda {LAMBDA}")
    print(f"sd equal {summary['equal_sd']} | sd CISS {summary['ciss_sd']} | corr {summary['ciss_corr_with_equal']}")
    print()
    print("BACKTEST — scheidt CISS systemisch van geïsoleerd? (gemiddeld percentiel)")
    print(f"  systemische dagen (>=3 domeinen hoog, n={len(systemic)}):")
    print(f"     equal {summary['systemic_days_equal_pct_avg']}  ->  CISS {summary['systemic_days_ciss_pct_avg']}")
    print(f"  geïsoleerde pieken (1 domein hoog, rest rustig, n={len(isolated)}):")
    print(f"     equal {summary['isolated_days_equal_pct_avg']}  ->  CISS {summary['isolated_days_ciss_pct_avg']}")
    print()
    print("SYNTHETISCH (zelfde totale stress, anders verdeeld):")
    for k, v in synth.items():
        print(f"  {k:<40} equal {v['equal']:<6} CISS {v['ciss']}")
    print(f"-> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
