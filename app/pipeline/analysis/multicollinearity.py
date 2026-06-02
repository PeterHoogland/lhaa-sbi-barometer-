"""
Multicollineariteit-audit (verbeterplan §4.6).

Doel: nagaan of de 24 indicatoren elkaar deels dubbel tellen. Sterk gecorreleerde
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

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "method": "Spearman rank-correlatie op overlappende dagen (>= %d), drempel |rho| >= %.2f" % (MIN_OVERLAP, HIGH_CORR),
        "n_indicators": len(codes),
        "indicators": codes,
        "high_correlation_pairs": high,
        "effective_dimensionality_lower_bound": clusters,
        "note": "Exacte effectieve dimensionaliteit (PCA-eigenwaarden) vereist numpy en draait in CI; dit is een onder-grens uit de correlatie-graaf.",
    }
    (OUT_DIR / "multicollinearity.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Multicollineariteit-audit: {len(codes)} indicatoren, {len(pairs)} paren beoordeeld.")
    print(f"Paren met |rho| >= {HIGH_CORR}: {len(high)}")
    for p in high[:15]:
        print(f"  {p['a']} ~ {p['b']}: rho={p['rho']} (n={p['n']})")
    print(f"Effectieve dimensionaliteit (ondergrens, correlatie-clusters): ~{clusters} van {len(codes)}")
    print(f"-> {OUT_DIR / 'multicollinearity.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
