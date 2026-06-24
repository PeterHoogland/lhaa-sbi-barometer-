#!/usr/bin/env python3
"""
PROTOTYPE (niet-gedeployed, analysis/) - effect van het verbreden van de
RELATIEVE composiet met 5 secundaire OV/social-signalen.

Doel: Peters "verwerk het als test, benieuwd naar effect". Dit raakt de live
registry NIET (harde regel 4) en reproduceert de engine-rekenwijze:
  - MAD-z exact zoals app/engine/src/methodology/zscore.ts (mediaan + MAD x1.4826,
    fallback IQR/1.349 -> SD), gewinsoriseerd op +/-3.
  - equal-weight composiet exact zoals composite.ts/weights.ts:
    domeingewicht = 1/5, indicatorgewicht in domein = 1/n_domein.

De bestaande 20-indicator-composiet wordt NIET herrekend uit ruwe historie
(dat vergt STL + recency-vensters van de hele engine); in plaats daarvan worden
de live domeinscores gereconstrueerd uit het gepubliceerde expert-blok:
  composite(equal) = 0.45, contributies D1=0.14 D2=0.23 D3=0.21,
  D5 uit v04.kern_breakdown z_kort (-0.22,-0.77,-1.26) -> score -0.75 -> contrib -0.15,
  D4 = rest = +0.02. Som = 0.45 (klopt).

Bron-momentopname: live latest-expert.json + app/data/history/*.json (19/6 ~19:41).
"""

import json, os, statistics as st

HIST = os.path.join(os.path.dirname(__file__), "..", "..", "data", "history")

MAD_SCALE = 1.4826
MIN_SCALE = 1e-6

def median(xs): return st.median(xs)

def robust_scale(xs):
    """Engine robustScale: MAD x1.4826 -> IQR/1.349 -> SD -> NaN."""
    med = median(xs)
    mad = MAD_SCALE * median([abs(x - med) for x in xs])
    if mad >= MIN_SCALE: return mad
    s = sorted(xs)
    def q(p):
        pos = (len(s) - 1) * p; lo = int(pos); hi = min(lo + 1, len(s) - 1)
        return s[lo] + (pos - lo) * (s[hi] - s[lo])
    iqr = (q(0.75) - q(0.25)) / 1.349
    if iqr >= MIN_SCALE: return iqr
    if len(xs) >= 2:
        m = sum(xs) / len(xs)
        sd = (sum((x - m) ** 2 for x in xs) / (len(xs) - 1)) ** 0.5
        if sd >= MIN_SCALE: return sd
    return float("nan")

def winsor(z, cap=3.0): return max(-cap, min(cap, z))

def load(code):
    with open(os.path.join(HIST, f"{code}.json")) as f:
        return [r["value"] for r in json.load(f)]

# code -> (domein, inverse_coded, mensentaal richting)
SIGNALS = {
    "I-D2-delijn":   ("D2", False, "De Lijn verstoringen (meer = meer stress)"),
    "I-D2-stib":     ("D2", False, "STIB/MIVB verstoringen (meer = meer stress)"),
    "I-D5-006S":     ("D5", True,  "Reddit-toon (positiever = minder stress)"),
    "I-D5-mastodon": ("D5", True,  "Mastodon-toon (positiever = minder stress)"),
    "I-D5-trends":   ("D5", False, "Google Trends stress-aandeel (hoger = meer stress)"),
}

# Gereconstrueerde live domeinscores (= (1/n) * som winsor-z over scored indicatoren).
DOMAIN_SCORE = {"D1": 0.70, "D2": 1.15, "D3": 1.05, "D4": 0.10, "D5": -0.75}
DOMAIN_N     = {"D1": 6,    "D2": 3,    "D3": 7,    "D4": 2,    "D5": 3}  # registry-tellingen (D3 incl. grade-D gat)
# som winsor-z per domein = score * n
DOMAIN_SUMZ  = {d: DOMAIN_SCORE[d] * DOMAIN_N[d] for d in DOMAIN_SCORE}

def composite_equal(domain_score):
    return sum(domain_score[d] for d in ["D1","D2","D3","D4","D5"]) / 5.0

print("="*72)
print("PROTOTYPE: relatieve-laag-verbreding (5 OV/social-signalen)")
print("="*72)

# 1) z per nieuw signaal
print("\n[1] z-score per nieuw signaal (MAD-z over beschikbare historie):\n")
new_z = {}
added_sumz = {"D2": 0.0, "D5": 0.0}
added_n    = {"D2": 0,   "D5": 0}
for code, (dom, inv, label) in SIGNALS.items():
    xs = load(code); today = xs[-1]
    med = median(xs); scale = robust_scale(xs)
    z_raw = (today - med) / scale if scale == scale and scale != 0 else float("nan")
    z = winsor(-z_raw if inv else z_raw)
    new_z[code] = (dom, z)
    added_sumz[dom] += z; added_n[dom] += 1
    arrow = "stress UP" if z > 0.15 else ("stress DOWN" if z < -0.15 else "~neutraal")
    print(f"  {code:14} [{dom}] n={len(xs):2} today={today:7.3f} med={med:7.3f} "
          f"scale={scale:6.3f}  z={z:+5.2f}  -> {arrow}")
    print(f"                 {label}")

# 2) broadened domeinscores
new_domain_score = dict(DOMAIN_SCORE)
for dom in ["D2", "D5"]:
    n_new = DOMAIN_N[dom] + added_n[dom]
    sumz_new = DOMAIN_SUMZ[dom] + added_sumz[dom]
    new_domain_score[dom] = sumz_new / n_new

cur = composite_equal(DOMAIN_SCORE)
new = composite_equal(new_domain_score)

print("\n[2] domeinscore D2/D5 voor -> na (indicatorgewicht verschuift 1/n -> 1/n'):\n")
for dom in ["D2", "D5"]:
    print(f"  {dom}: {DOMAIN_N[dom]} -> {DOMAIN_N[dom]+added_n[dom]} indicatoren | "
          f"score {DOMAIN_SCORE[dom]:+.3f} -> {new_domain_score[dom]:+.3f} | "
          f"contrib {DOMAIN_SCORE[dom]/5:+.3f} -> {new_domain_score[dom]/5:+.3f}")

print("\n[3] EQUAL-WEIGHT COMPOSIET (z-ruimte, ruw, voor smoothing):\n")
print(f"  huidig (20 ind.)    : {cur:+.3f}   (reconstructie van live 0.45)")
print(f"  verbreed (25 ind.)  : {new:+.3f}")
print(f"  delta               : {new-cur:+.3f}")

print("\n[4] LET OP - waarom dit GEEN deployable percentiel is:")
print("  - de 5 signalen hebben 17-18 dagen historie; MAD-z heeft geen normaal-anker.")
print("  - het gepubliceerde percentiel (23) rankt de GESMOOTHE composiet tegen 24m")
print("    seizoenshistorie; die historie bevat alleen de 20-indicator-composiet.")
print("    Een 25-indicator-waarde daartegen ranken = schaalbreuk (harde regel 5).")
print("  - 7-daagse smoothing dempt het dag-effect bovendien fors (live: 0.45 -> 0.02).")
