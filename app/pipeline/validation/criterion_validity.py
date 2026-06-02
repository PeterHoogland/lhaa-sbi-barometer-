"""
Criteriumvalidatie tegen Belgische grondwaarheid (verbeterplan §2.4 + §6-bis.4).

WAAROM. Zonder externe validatie is er geen bewijs dat de SBI meet wat hij claimt.
Deze module correleert de SBI-tijdreeks met ONAFHANKELIJKE, klinisch gevalideerde
uitkomstmaten. Die data is NIET vrij beschikbaar (vereist datadelingsprotocollen),
dus dit is bewust een STUB met een expliciet datacontract en duidelijke TODO's,
precies zoals het plan toestaat ("Bij ontbrekende dataprotocollen: stub").

DATACONTRACT (verwachte invoer in validation/data/, elk een CSV met kolommen
`date` (YYYY-MM-DD) en `value`):
  - dagelijks (sterkste): tele_onthaal.csv (oproepvolume 106), zelfmoordlijn_1813.csv
      → methode: kruiscorrelatie lag 0-3 dagen, ARIMA met seizoen als confounder.
  - maandelijks: riziv_psychosociaal.csv (arbeidsongeschiktheid burn-out/depressie),
      sciensano_belhealth.csv (GAD-7 / PHQ-9).
  - bijkomend/zwak: google_trends_stress.csv (secundair signaal, niet de hoofdscore).

CONFOUNDER-EIS (plan §6-bis.4): administratieve stijgingen (bv. +44% RIZIV-burn-out,
GGZ-gebruik na terugbetalingshervorming 2022) weerspiegelen deels beleid/aanbod,
niet zuivere stress. Nooit één proxy = stress; combineer subjectief-klinisch +
uitkomst + gedrag + extreem. Dit hoort in het validatie-rapport vermeld te worden.

De SBI-zijde gebruikt de composiet-historie (data/sparkline-30d.json en, zodra
beschikbaar, een langere export). De correlatie-rekenkern is pure Python (geen
numpy), zodat de stub overal draait.

Run:  python3 app/pipeline/validation/criterion_validity.py
"""
from __future__ import annotations
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../app
DATA_DIR = Path(__file__).resolve().parent / "data"   # validation/data/ (extern aan te leveren)
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


def _pearson(a: list[float], b: list[float]) -> float:
    n = len(a)
    if n < 3:
        return float("nan")
    ma, mb = sum(a) / n, sum(b) / n
    num = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    da = sum((x - ma) ** 2 for x in a) ** 0.5
    db = sum((x - mb) ** 2 for x in b) ** 0.5
    return num / (da * db) if da > 0 and db > 0 else float("nan")


def load_sbi() -> dict[str, float]:
    if not SBI_SPARKLINE.exists():
        return {}
    rows = json.loads(SBI_SPARKLINE.read_text(encoding="utf-8"))
    return {r["date"]: float(r["composite"]) for r in rows if "date" in r and "composite" in r}


def load_csv(path: Path) -> dict[str, float]:
    out: dict[str, float] = {}
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            try:
                out[row["date"]] = float(row["value"])
            except (KeyError, ValueError):
                continue
    return out


def cross_correlate(sbi: dict[str, float], ext: dict[str, float], max_lag: int = MAX_LAG_DAYS):
    """Kruiscorrelatie SBI(t) vs externe-maat(t+lag) voor lag 0..max_lag (dagen)."""
    from datetime import date, timedelta
    results = []
    for lag in range(0, max_lag + 1):
        xs, ys = [], []
        for d, v in sbi.items():
            try:
                d0 = date.fromisoformat(d)
            except ValueError:
                continue
            dl = (d0 + timedelta(days=lag)).isoformat()
            if dl in ext:
                xs.append(v)
                ys.append(ext[dl])
        if len(xs) >= 3:
            results.append({"lag_days": lag, "r": round(_pearson(xs, ys), 3), "n": len(xs)})
    return results


def main() -> int:
    sbi = load_sbi()
    report: dict = {
        "status": "stub",
        "sbi_points": len(sbi),
        "data_contract": {f: {"cadans": c, "kracht": k} for f, (c, k) in EXPECTED.items()},
        "confounder_note": "Administratieve stijgingen (RIZIV-burn-out, GGZ-gebruik na hervorming 2022) zijn deels beleid/aanbod, niet zuivere stress. Combineer altijd meerdere onafhankelijke maten.",
        "results": {},
        "missing": [],
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for fname in EXPECTED:
        path = DATA_DIR / fname
        if not path.exists():
            report["missing"].append(fname)
            continue
        ext = load_csv(path)
        report["results"][fname] = cross_correlate(sbi, ext)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Criteriumvalidatie (stub). SBI-punten: {len(sbi)}.")
    if report["missing"]:
        print("Nog aan te leveren ijkbronnen (datadelingsprotocol nodig):")
        for f in report["missing"]:
            c, k = EXPECTED[f]
            print(f"  - validation/data/{f}  ({c}, {k})")
        print("Zodra een bestand er staat, rekent deze module automatisch de kruiscorrelatie (lag 0-3 dagen).")
    else:
        print("Alle ijkbronnen aanwezig; correlaties berekend.")
    print(f"-> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
