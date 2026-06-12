"""
Multicollineariteit-audit (verbeterplan §4.6).

Doel: nagaan of de gescoorde indicatoren (21 gemeten, registry) elkaar deels dubbel tellen. Sterk gecorreleerde
indicatoren dragen feitelijk hetzelfde signaal en wegen dan dubbel in het composiet.
We rapporteren paren met |Spearman-rho| >= 0,70 (de plan-drempel) en een ruwe
schatting van de effectieve dimensionaliteit.

Pure Python (geen numpy), zodat het overal draait. De volledige PCA-eigenwaarde-
analyse (exacte effectieve dimensionaliteit) vereist numpy en draait in CI; hier
geven we een conservatieve onder-/bovengrens op basis van de correlatie-graaf.

Run:  python3 app/pipeline/analysis/multicollinearity.py
Uitvoer: app/data/analysis/multicollinearity.json + een leesbare samenvatting.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../app
HIST_DIR = ROOT / "data" / "history"
OUT_DIR = ROOT / "data" / "analysis"

MIN_OVERLAP = 30        # minimaal aantal gemeenschappelijke dagen voor een betrouwbare rho
HIGH_CORR = 0.70        # plan-drempel §4.6

# Secundaire/afgeleide reeksen tellen niet mee als indicator.
SKIP_SUFFIXES = ("S", "-rt", "-emotie")


def _avg_ranks(xs: list[float]) -> list[float]:
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    ranks = [0.0] * len(xs)
    i = 0
    while i < len(xs):
        j = i
        while j + 1 < len(xs) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        avg = (i + j) / 2.0 + 1.0  # 1-based gemiddelde rang bij ties
        for k in range(i, j + 1):
            ranks[order[k]] = avg
        i = j + 1
    return ranks


def _pearson(a: list[float], b: list[float]) -> float:
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    num = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    da = sum((x - ma) ** 2 for x in a) ** 0.5
    db = sum((x - mb) ** 2 for x in b) ** 0.5
    return num / (da * db) if da > 0 and db > 0 else 0.0


def spearman(a: list[float], b: list[float]) -> float:
    return _pearson(_avg_ranks(a), _avg_ranks(b))


# --- B6-uitbreiding: echte PCA-dimensionaliteit (Jacobi, pure Python) --------

def jacobi_eigenvalues(matrix: list[list[float]], sweeps: int = 50, tol: float = 1e-10) -> list[float]:
    """
    Eigenwaarden van een symmetrische matrix via cyclische Jacobi-rotaties.
    Pure Python; voor een ~20x20 correlatiematrix ruim snel en stabiel genoeg.
    """
    n = len(matrix)
    a = [row[:] for row in matrix]
    for _ in range(sweeps):
        off = sum(a[i][j] ** 2 for i in range(n) for j in range(n) if i != j)
        if off < tol:
            break
        for p in range(n - 1):
            for q in range(p + 1, n):
                if abs(a[p][q]) < tol / (n * n):
                    continue
                # rotatiehoek
                theta = (a[q][q] - a[p][p]) / (2.0 * a[p][q])
                t = (1.0 if theta >= 0 else -1.0) / (abs(theta) + (theta * theta + 1.0) ** 0.5)
                c = 1.0 / (t * t + 1.0) ** 0.5
                s = t * c
                for k in range(n):
                    akp, akq = a[k][p], a[k][q]
                    a[k][p] = c * akp - s * akq
                    a[k][q] = s * akp + c * akq
                for k in range(n):
                    apk, aqk = a[p][k], a[q][k]
                    a[p][k] = c * apk - s * aqk
                    a[q][k] = s * apk + c * aqk
    return sorted((a[i][i] for i in range(n)), reverse=True)


def effective_dimensionality(eigenvalues: list[float]) -> dict:
    """Kaiser-telling (lambda > 1) + participatieratio (som lambda)^2 / som lambda^2."""
    pos = [max(0.0, ev) for ev in eigenvalues]
    total = sum(pos)
    sq = sum(ev * ev for ev in pos)
    return {
        "kaiser_components": sum(1 for ev in pos if ev > 1.0),
        "participation_ratio": round((total * total) / sq, 2) if sq > 0 else 0.0,
        "eigenvalues": [round(ev, 3) for ev in pos],
    }


# --- B6-uitbreiding: EWMA-correlatie voor het D5-paar ------------------------

EWMA_HALFLIFE_DAYS = 7.0  # zelfde tijdschaal als het 7d-venster van doc 03 §4.4


def ewma_correlation(a: list[float], b: list[float], halflife: float = EWMA_HALFLIFE_DAYS) -> list[float]:
    """
    Exponentieel gewogen lopende correlatie (RiskMetrics-stijl): EWMA van
    gemiddelden, varianties en covariantie met halfwaardetijd `halflife` dagen.
    Geeft per dag (vanaf de tweede) de actuele correlatieschatting.
    """
    if len(a) != len(b) or len(a) < 2:
        return []
    lam = 0.5 ** (1.0 / halflife)  # decay per dag
    ma, mb = a[0], b[0]
    va = vb = cab = 0.0
    out: list[float] = []
    for i in range(1, len(a)):
        da, db = a[i] - ma, b[i] - mb
        ma = lam * ma + (1 - lam) * a[i]
        mb = lam * mb + (1 - lam) * b[i]
        va = lam * va + (1 - lam) * da * da
        vb = lam * vb + (1 - lam) * db * db
        cab = lam * cab + (1 - lam) * da * db
        denom = (va * vb) ** 0.5
        out.append(cab / denom if denom > 0 else 0.0)
    return out


def d5_ewma_monitor(series: dict[str, dict[str, float]]) -> dict | None:
    """
    Formalisering van de D5-monitor (doc 03 §4.4 stap 2) als EWMA-benadering:
    lopende correlatie I-D5-001 x I-D5-003 + aandeel dagen boven de 0,70-drempel.
    LET OP: dit is een AUDIT-rapportage. De automatische gewichts-halvering uit
    doc 03 §4.4 is in de engine bewust NIET actief (monitor-only); activeren
    is een amendement (zie doc 03 §4.4-annotatie + CHANGELOG 2026-06-12).
    """
    a, b = series.get("I-D5-001"), series.get("I-D5-003")
    if not a or not b:
        return None
    common = sorted(set(a) & set(b))
    if len(common) < MIN_OVERLAP:
        return None
    corr = ewma_correlation([a[d] for d in common], [b[d] for d in common])
    days_above = sum(1 for c in corr if c > HIGH_CORR)
    recent = corr[-30:]
    return {
        "pair": ["I-D5-001", "I-D5-003"],
        "halflife_days": EWMA_HALFLIFE_DAYS,
        "n_days": len(corr),
        "days_above_threshold": days_above,
        "fraction_above_threshold": round(days_above / len(corr), 3),
        "current": round(corr[-1], 3),
        "max_recent_30d": round(max(recent), 3),
        "threshold": HIGH_CORR,
        "note": "Gewichts-halvering (doc 03 §4.4 stap 2) is monitor-only; activering vergt een amendement.",
    }


def load_series() -> dict[str, dict[str, float]]:
    series: dict[str, dict[str, float]] = {}
    for path in sorted(HIST_DIR.glob("I-*.json")):
        code = path.stem
        if code.endswith(SKIP_SUFFIXES):
            continue
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        pts = {r["date"]: float(r["value"]) for r in rows
               if isinstance(r, dict) and "date" in r and isinstance(r.get("value"), (int, float))}
        if len(pts) >= MIN_OVERLAP:
            series[code] = pts
    return series


def main() -> int:
    series = load_series()
    codes = sorted(series)
    if len(codes) < 2:
        print("Te weinig indicator-historie voor een audit.", file=sys.stderr)
        return 1

    pairs = []
    for i in range(len(codes)):
        for j in range(i + 1, len(codes)):
            a, b = series[codes[i]], series[codes[j]]
            common = sorted(set(a) & set(b))
            if len(common) < MIN_OVERLAP:
                continue
            va = [a[d] for d in common]
            vb = [b[d] for d in common]
            rho = spearman(va, vb)
            pairs.append({"a": codes[i], "b": codes[j], "rho": round(rho, 3), "n": len(common)})

    high = sorted([p for p in pairs if abs(p["rho"]) >= HIGH_CORR],
                  key=lambda p: -abs(p["rho"]))

    # Ruwe effectieve dimensionaliteit: clusters van indicatoren die via
    # hoge-correlatie-randen verbonden zijn, tellen als ~1 onafhankelijke component.
    parent = {c: c for c in codes}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for p in high:
        ra, rb = find(p["a"]), find(p["b"])
        if ra != rb:
            parent[ra] = rb
    clusters = len({find(c) for c in codes})

    # B6: echte PCA-dimensionaliteit op de Spearman-correlatiematrix (Jacobi,
    # pure Python — de oude numpy-disclaimer vervalt). Paren zonder voldoende
    # overlap krijgen rho 0 (conservatief: geen verzonnen samenhang).
    rho_by_pair = {(p["a"], p["b"]): p["rho"] for p in pairs}
    matrix = [
        [
            1.0 if i == j else rho_by_pair.get((codes[min(i, j)], codes[max(i, j)]), 0.0)
            for j in range(len(codes))
        ]
        for i in range(len(codes))
    ]
    eigen = jacobi_eigenvalues(matrix)
    dim = effective_dimensionality(eigen)

    # B6: EWMA-formalisering van de D5-monitor (doc 03 §4.4 stap 2).
    d5_monitor = d5_ewma_monitor(series)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "method": "Spearman rank-correlatie op overlappende dagen (>= %d), drempel |rho| >= %.2f" % (MIN_OVERLAP, HIGH_CORR),
        "n_indicators": len(codes),
        "indicators": codes,
        "high_correlation_pairs": high,
        "effective_dimensionality_lower_bound": clusters,
        "pca": {
            "method": "Jacobi-eigenwaarden van de Spearman-correlatiematrix (pure Python); ontbrekende overlap = rho 0 (conservatief)",
            **dim,
        },
        "d5_ewma_monitor": d5_monitor,
        "maintenance": "Halfjaarlijkse audit per 08_Onderhoud-Protocol §5; drempel 0,70 per doc 03 §4.4.",
    }
    (OUT_DIR / "multicollinearity.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Multicollineariteit-audit: {len(codes)} indicatoren, {len(pairs)} paren beoordeeld.")
    print(f"Paren met |rho| >= {HIGH_CORR}: {len(high)}")
    for p in high[:15]:
        print(f"  {p['a']} ~ {p['b']}: rho={p['rho']} (n={p['n']})")
    print(f"Effectieve dimensionaliteit: clusters-ondergrens ~{clusters}, "
          f"Kaiser {dim['kaiser_components']}, participatieratio {dim['participation_ratio']} (van {len(codes)})")
    if d5_monitor:
        print(f"D5 EWMA-monitor (I-D5-001 x I-D5-003): nu {d5_monitor['current']}, "
              f"{d5_monitor['fraction_above_threshold']:.0%} van de dagen boven {HIGH_CORR} "
              f"(halvering blijft monitor-only, zie doc 03 §4.4)")
    print(f"-> {OUT_DIR / 'multicollinearity.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
