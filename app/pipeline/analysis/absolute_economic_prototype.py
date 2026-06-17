"""
Absolute economische stress-meting — prototype "vs normale tijden" (2010-2019).

WAAROM (Peter, 2026-06). De brede index leest genuinely ~20 (de meeste
indicatoren zijn in 2026 kalm t.o.v. de 24-maands-referentie 2024-2025). Dat is
echt (zie verslag 07 + memory lage-scores-2026-genuine). De enige EERLIJKE
hogere-cijfer-hefboom is een ABSOLUTE meting: hoe staan de economische stressoren
ervoor t.o.v. een vaste "normale" periode (2010-2019), i.p.v. het rollende
relatieve percentiel. Inflatie, brandstof en consumentenvertrouwen zijn t.o.v.
dat decennium ECHT verhoogd.

HARDE GRENS (waarom economie-only). Alleen indicatoren met een echte 2010-2019-
historie kunnen "vs normale tijden" gemeten worden. Weer/nieuws/verkeer/pollen
bestaan pas sinds 2024 -> geen ijkpunt. Energieprijzen (I-D3-002) starten pas in
2024 en vallen er dus OOK uit. De vijf met een echt decennium-segment:
  I-D3-001 inflatie, I-D3-005 werkloosheid, I-D3-006 hypotheekrente,
  I-D3-007 consumentenvertrouwen (inverse), I-D2-004 brandstofprijs.

METHODE (scale-discipline, harde regel 5). Per indicator vergelijken we de
LAATSTE waarde met de 2010-2019-waarden van DEZELFDE reeks (zelfde bestand,
zelfde eenheid, geen STL): een absolute "vs normaal decennium"-meting hoort het
niveau te lezen, niet het seizoensresidu. MAD-z (mediaan + MAD x1.4826, identiek
aan engine/zscore.ts). Inverse-codering uit de registry toegepast (alleen
I-D3-007). Composiet = gewogen gemiddelde van de per-indicator z. Mapping naar
0-100 via de normale CDF: score = 100 * Phi(zbar), zodat zbar=0 (exact normaal
decennium) -> 50.

EERLIJK: dit is een prototype/analyse, GEEN score-keten. Het echt inbouwen is een
pre-registratie-amendement (harde regel 4). Dit script reproduceert alleen het
getal zodat de ontwerpkeuze op echte cijfers rust.

Input : app/data/history/I-D3-001.json, I-D3-005, I-D3-006, I-D3-007, I-D2-004
Output: stdout-tabel
Run   : python3 app/pipeline/analysis/absolute_economic_prototype.py
"""
from __future__ import annotations
import json
import math
import statistics as st
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HIST = ROOT / "data" / "history"

MAD_SCALE = 1.4826
BASELINE_START = "2010-01-01"
BASELINE_END = "2019-12-31"

# (code, naam, inverse-coded?, demografische reach uit demographic-reach.ts)
INDICATORS = [
    ("I-D3-001", "Inflatie (CPI YoY %)", False, 1.00),
    ("I-D2-004", "Brandstofprijs (EUR/L)", False, 0.78),
    ("I-D3-007", "Consumentenvertrouwen", True, 0.80),
    ("I-D3-005", "Werkloosheid (%)", False, 0.70),
    ("I-D3-006", "Hypotheekrente (%)", False, 0.32),
]


def median(xs):
    return st.median(xs)


def mad_scaled(xs):
    med = median(xs)
    return MAD_SCALE * median([abs(x - med) for x in xs])


def normal_cdf(z):
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def load(code):
    return json.loads((HIST / f"{code}.json").read_text())


def main():
    rows = []
    for code, name, inverse, reach in INDICATORS:
        series = load(code)
        baseline = [p["value"] for p in series if BASELINE_START <= p["date"] <= BASELINE_END]
        latest = series[-1]
        med = median(baseline)
        mad = mad_scaled(baseline)
        z_raw = (latest["value"] - med) / mad if mad > 1e-6 else float("nan")
        z = -z_raw if inverse else z_raw
        rows.append({
            "code": code, "name": name, "inverse": inverse, "reach": reach,
            "n_base": len(baseline), "base_med": med, "base_mad": mad,
            "latest_date": latest["date"], "latest_val": latest["value"], "z": z,
        })

    print(f"Absolute economische stress-meting — vs normale tijden ({BASELINE_START[:4]}-{BASELINE_END[:4]})")
    print("=" * 92)
    print(f"{'indicator':<26}{'n':>4}{'med':>9}{'mad':>9}{'laatste':>12}{'datum':>12}{'z':>9}")
    print("-" * 92)
    for r in rows:
        print(f"{r['name']:<26}{r['n_base']:>4}{r['base_med']:>9.3f}{r['base_mad']:>9.3f}"
              f"{r['latest_val']:>12.3f}{r['latest_date']:>12}{r['z']:>9.2f}"
              + ("  (inverse)" if r["inverse"] else ""))
    print("-" * 92)

    z_equal = sum(r["z"] for r in rows) / len(rows)
    total_reach = sum(r["reach"] for r in rows)
    z_reach = sum(r["z"] * r["reach"] for r in rows) / total_reach

    for label, zbar in (("equal-weight", z_equal), ("demografische reach", z_reach)):
        score = 100.0 * normal_cdf(zbar)
        print(f"{label:<22} zbar = {zbar:+.3f}   ->  score (100*Phi) = {score:5.1f} / 100")
    print("=" * 92)
    print("Mapping: 100*Phi(zbar). zbar=0 -> 50 (exact normaal decennium); +1 sigma -> 84; -1 sigma -> 16.")


if __name__ == "__main__":
    main()
