"""
Criteriumvalidatie tegen Belgische grondwaarheid (C1, verbeterplan §2.4 + §6-bis.4).

WAAROM. Zonder externe validatie is er geen bewijs dat de SBI meet wat hij claimt.
Deze module correleert de SBI-tijdreeks met ONAFHANKELIJKE, klinisch gevalideerde
uitkomstmaten. Die data is NIET vrij beschikbaar (vereist datadelingsprotocollen,
zie DATA-REQUESTS.md met verzendklare aanvragen), dus zonder aangeleverde data is
dit bewust een STUB met een expliciet datacontract. Zodra een bestand in
validation/data/ staat, rekent het script automatisch het volledige rapport.

DATACONTRACT (CSV met kolommen `date` (YYYY-MM-DD) en `value`):
  - dagelijks (sterkste): tele_onthaal.csv (oproepvolume 106), zelfmoordlijn_1813.csv
  - maandelijks: riziv_psychosociaal.csv (arbeidsongeschiktheid burn-out/depressie)
  - kwartaal:   sciensano_belhealth.csv (GAD-7 / PHQ-9)
  - bijkomend/zwak: google_trends_stress.csv (secundair signaal, niet de hoofdscore)

METHODE (C1-acceptatie: correlaties + p-waarden + lag, seizoen als confounder):
  - dagbronnen: kruiscorrelatie SBI(t) x extern(t+lag) voor lag 0-3 dagen,
    Pearson-r met p-waarde via de Fisher-z-benadering (tweezijdig; goede
    benadering vanaf n >= 10, gerapporteerd als p_approx).
  - seizoen als confounder: beide reeksen worden ook maand-gecentreerd
    (waarde minus het maandgemiddelde binnen de overlap) en opnieuw
    gecorreleerd. Rapporteer altijd ruw EN seizoens-gecorrigeerd: een verband
    dat alleen ruw bestaat, kan louter gedeelde seizoensgang zijn.
  - maand-/kwartaalbronnen: de SBI-dagcomposiet wordt naar periodegemiddelden
    geaggregeerd en op periodeniveau gecorreleerd (lag 0 en 1 periode).

CONFOUNDER-EIS (plan §6-bis.4): administratieve stijgingen (bv. +44% RIZIV-burn-out,
GGZ-gebruik na terugbetalingshervorming 2022) weerspiegelen deels beleid/aanbod,
niet zuivere stress. Nooit één proxy = stress; combineer subjectief-klinisch +
uitkomst + gedrag + extreem. Dit staat ook letterlijk in het rapport.

SBI-ZIJDE: data/composite-history.json (volledige reeks) zodra aanwezig, anders
data/sparkline-30d.json (30 dagen; eerlijk gelabeld als te kort voor stevige
conclusies). Pure Python (geen numpy), deterministisch.

Run:  python3 app/pipeline/validation/criterion_validity.py
"""
from __future__ import annotations

import csv
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../app
DATA_DIR = Path(__file__).resolve().parent / "data"   # validation/data/ (extern aan te leveren)
SBI_FULL = ROOT / "data" / "composite-history.json"
SBI_SPARKLINE = ROOT / "data" / "sparkline-30d.json"
OUT = ROOT / "data" / "analysis" / "criterion_validity.json"

# Het datacontract: bestand -> (cadans, kracht-label).
EXPECTED = {
    "tele_onthaal.csv": ("dagelijks", "sterkste"),
    "zelfmoordlijn_1813.csv": ("dagelijks", "sterkste"),
    "riziv_psychosociaal.csv": ("maandelijks", "matig"),
    "sciensano_belhealth.csv": ("kwartaal", "matig"),
    "google_trends_stress.csv": ("dagelijks", "zwak/secundair"),
}
MAX_LAG_DAYS = 3
MIN_N_DAILY = 30      # onder dit aantal overlappende dagen: geen conclusie
MIN_N_PERIODS = 8     # idem voor maand-/kwartaalniveau

CONFOUNDER_NOTE = (
    "Administratieve reeksen weerspiegelen deels beleid en aanbod, geen zuivere stress: "
    "de RIZIV-burn-out-stijging (+44%) volgde mede op de terugbetalingshervorming van 2022, "
    "en hulplijnvolumes bewegen mee met campagnes en mediadekking. Daarom rapporteren we "
    "altijd ruwe EN seizoens-gecorrigeerde correlaties, en geldt: nooit een enkele proxy "
    "als bewijs; convergentie over meerdere onafhankelijke maten is de toetssteen."
)


def _pearson(a: list[float], b: list[float]) -> float:
    n = len(a)
    if n < 3:
        return float("nan")
    ma, mb = sum(a) / n, sum(b) / n
    num = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    da = sum((x - ma) ** 2 for x in a) ** 0.5
    db = sum((x - mb) ** 2 for x in b) ** 0.5
    return num / (da * db) if da > 0 and db > 0 else float("nan")


def fisher_p(r: float, n: int) -> float:
    """Tweezijdige p-waarde voor Pearson-r via de Fisher-z-benadering (n >= 4)."""
    if not math.isfinite(r) or n < 4 or abs(r) >= 1.0:
        return float("nan")
    z = math.atanh(r) * math.sqrt(n - 3)
    return 2.0 * (1.0 - 0.5 * (1.0 + math.erf(abs(z) / math.sqrt(2.0))))


def month_center(series: dict[str, float]) -> dict[str, float]:
    """Seizoenscorrectie als confounder-controle: waarde minus maandgemiddelde."""
    by_month: dict[str, list[float]] = {}
    for d, v in series.items():
        by_month.setdefault(d[5:7], []).append(v)
    means = {m: sum(vs) / len(vs) for m, vs in by_month.items()}
    return {d: v - means[d[5:7]] for d, v in series.items()}


def correlate_pairs(xs: list[float], ys: list[float]) -> dict:
    r = _pearson(xs, ys)
    return {
        "r": round(r, 3) if math.isfinite(r) else None,
        "p_approx": round(fisher_p(r, len(xs)), 4) if math.isfinite(r) else None,
        "n": len(xs),
    }


def cross_correlate_daily(sbi: dict[str, float], ext: dict[str, float], max_lag: int = MAX_LAG_DAYS) -> dict:
    """Kruiscorrelatie SBI(t) x extern(t+lag), lag 0..max_lag, ruw + seizoens-gecorrigeerd."""
    out: dict = {"granularity": "dag", "by_lag": [], "by_lag_season_adjusted": [], "best": None}
    sbi_adj = month_center(sbi)
    ext_adj = month_center(ext)
    for variant, s, e in (("raw", sbi, ext), ("season_adjusted", sbi_adj, ext_adj)):
        for lag in range(0, max_lag + 1):
            xs: list[float] = []
            ys: list[float] = []
            for d, v in s.items():
                try:
                    d0 = date.fromisoformat(d)
                except ValueError:
                    continue
                dl = (d0 + timedelta(days=lag)).isoformat()
                if dl in e:
                    xs.append(v)
                    ys.append(e[dl])
            if len(xs) < 3:
                continue
            row = {"lag_days": lag, **correlate_pairs(xs, ys)}
            (out["by_lag"] if variant == "raw" else out["by_lag_season_adjusted"]).append(row)
    candidates = [r for r in out["by_lag_season_adjusted"] if r["r"] is not None]
    if candidates:
        out["best"] = max(candidates, key=lambda r: abs(r["r"]))
        out["best_basis"] = "season_adjusted"
    out["sufficient_n"] = any(r["n"] >= MIN_N_DAILY for r in out["by_lag"])
    return out


def to_period(d: str, granularity: str) -> str:
    if granularity == "kwartaal":
        q = (int(d[5:7]) - 1) // 3 + 1
        return f"{d[0:4]}-Q{q}"
    return d[0:7]  # maandelijks


def aggregate_periods(series: dict[str, float], granularity: str) -> dict[str, float]:
    sums: dict[str, list[float]] = {}
    for d, v in series.items():
        sums.setdefault(to_period(d, granularity), []).append(v)
    return {p: sum(vs) / len(vs) for p, vs in sums.items()}


def cross_correlate_periodic(sbi: dict[str, float], ext: dict[str, float], granularity: str) -> dict:
    """Periodegemiddelde SBI x externe periodemaat; lag 0 en 1 periode."""
    sbi_p = aggregate_periods(sbi, granularity)
    ext_p = aggregate_periods(ext, granularity)
    periods = sorted(set(sbi_p) & set(ext_p))
    out: dict = {"granularity": granularity, "by_lag": [], "best": None}
    ordered = sorted(set(sbi_p) | set(ext_p))
    idx = {p: i for i, p in enumerate(ordered)}
    inv = {i: p for p, i in idx.items()}
    for lag in (0, 1):
        xs: list[float] = []
        ys: list[float] = []
        for p in periods:
            target = inv.get(idx[p] + lag)
            if target is not None and target in ext_p:
                xs.append(sbi_p[p])
                ys.append(ext_p[target])
        if len(xs) >= 3:
            out["by_lag"].append({"lag_periods": lag, **correlate_pairs(xs, ys)})
    candidates = [r for r in out["by_lag"] if r["r"] is not None]
    if candidates:
        out["best"] = max(candidates, key=lambda r: abs(r["r"]))
    out["sufficient_n"] = any(r["n"] >= MIN_N_PERIODS for r in out["by_lag"])
    return out


def load_sbi() -> tuple[dict[str, float], str]:
    """Volledige composiet-historie als die er is; anders sparkline (gelabeld)."""
    if SBI_FULL.exists():
        rows = json.loads(SBI_FULL.read_text(encoding="utf-8"))
        series = {r["date"]: float(r["value"]) for r in rows if isinstance(r, dict) and "date" in r and "value" in r}
        if series:
            return series, "composite-history.json (volledige reeks; let op de gedocumenteerde 0.3.0-schaalbreuk voor pre-juni-2026-waarden, zie CHANGELOG)"
    if SBI_SPARKLINE.exists():
        rows = json.loads(SBI_SPARKLINE.read_text(encoding="utf-8"))
        series = {r["date"]: float(r["composite"]) for r in rows if isinstance(r, dict) and "date" in r and "composite" in r}
        return series, "sparkline-30d.json (slechts ~30 dagen; te kort voor stevige conclusies)"
    return {}, "geen SBI-reeks gevonden"


def load_csv(path: Path) -> dict[str, float]:
    out: dict[str, float] = {}
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            try:
                out[row["date"]] = float(row["value"])
            except (KeyError, ValueError):
                continue
    return out


def run(data_dir: Path = DATA_DIR, sbi_override: dict[str, float] | None = None) -> dict:
    if sbi_override is not None:
        sbi, sbi_source = sbi_override, "override (test)"
    else:
        sbi, sbi_source = load_sbi()

    report: dict = {
        "status": "stub",
        "sbi_source": sbi_source,
        "sbi_points": len(sbi),
        "method": {
            "daily": f"Pearson-kruiscorrelatie lag 0-{MAX_LAG_DAYS} dagen; p via Fisher-z (benadering); ruw en seizoens-gecorrigeerd (maand-centrering); minimaal n={MIN_N_DAILY}",
            "periodic": f"SBI naar periodegemiddelden; lag 0-1 periodes; minimaal n={MIN_N_PERIODS}",
            "best_selection": "grootste |r| binnen de seizoens-gecorrigeerde lags (dagbronnen); een louter ruwe correlatie kan gedeelde seizoensgang zijn",
        },
        "data_contract": {f: {"cadans": c, "kracht": k} for f, (c, k) in EXPECTED.items()},
        "confounder_note": CONFOUNDER_NOTE,
        "validation_calendar": {
            "dagelijks": "Tele-Onthaal (106) + Zelfmoordlijn 1813 (oproepvolumes)",
            "kwartaal": "Sciensano BELHEALTH (GAD-7, PHQ-9)",
            "jaarlijks": "RIZIV psychosociale arbeidsongeschiktheid; werkgeversabsenteïsme (bv. Securex/SD Worx)",
            "vierjaarlijks": "Sciensano Gezondheidsenquête (GHQ-12)",
        },
        "results": {},
        "missing": [],
    }

    data_dir.mkdir(parents=True, exist_ok=True)
    computed = 0
    for fname, (cadans, _kracht) in EXPECTED.items():
        path = data_dir / fname
        if not path.exists():
            report["missing"].append(fname)
            continue
        ext = load_csv(path)
        if cadans == "dagelijks":
            report["results"][fname] = cross_correlate_daily(sbi, ext)
        else:
            report["results"][fname] = cross_correlate_periodic(sbi, ext, cadans)
        computed += 1

    # Status eerlijk: "computed" alleen als er ook echt een correlatie uit kwam.
    # De publiek verzamelde jaaraggregaten (GATHERED-DATA.md) hebben geen
    # dagresolutie en geen overlap met de SBI-reeks: dan is "partial" de waarheid.
    primary_present = [f for f in ("tele_onthaal.csv", "zelfmoordlijn_1813.csv") if f not in report["missing"]]
    has_any_best = any(res.get("best") for res in report["results"].values())
    report["status"] = (
        "computed" if has_any_best and primary_present else ("partial" if computed else "stub")
    )
    return report


def main() -> int:
    report = run()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Criteriumvalidatie ({report['status']}). SBI-bron: {report['sbi_source']}; punten: {report['sbi_points']}.")
    for fname, res in report["results"].items():
        best = res.get("best")
        if best:
            lagk = "lag_days" if "lag_days" in best else "lag_periods"
            print(f"  {fname}: beste {lagk}={best[lagk]}  r={best['r']}  p≈{best['p_approx']}  n={best['n']}"
                  + ("" if res.get("sufficient_n") else "  [n te klein voor conclusie]"))
    if report["missing"]:
        print("Nog aan te leveren ijkbronnen (datadelingsprotocol nodig, zie DATA-REQUESTS.md):")
        for f in report["missing"]:
            c, k = EXPECTED[f]
            print(f"  - validation/data/{f}  ({c}, {k})")
    print(f"-> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
