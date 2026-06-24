#!/usr/bin/env python3
"""
PROTOTYPE v2 (niet-gedeployed) - EERLIJKE normalisatie voor de relatieve-laag-test.

v1 liet zien dat MAD-z het Google-Trends-signaal naar +3 blies (near-zero-baseline
-> minuscule schaal -> elke niet-nul-dag knalt tegen de winsor-kap). Dat is de
Hitte-bug-klasse (harde regel 5), nu in een 0-1-aandeel.

v2 vergelijkt twee normalisaties per signaal:
  (A) MAD-z        - app/engine/src/methodology/zscore.ts  (de huidige, breekt bij zero-inflatie)
  (B) ECDF-probit  - app/engine/src/methodology/ecdf.ts    (de eigen robuuste methode van het
                     project: empirische CDF-positie -> probit -> z, geklemd, winsor +/-3).
                     Robuust tegen zero-inflatie en outliers; per constructie nooit +/-oneindig.

Plus een aparte OV-blik (De Lijn / STIB) zoals gevraagd.

Bron: app/data/history/*.json (committed 19/6 ~19:41) + live-gereconstrueerde domeinscores.
Raakt de live registry/composiet NIET (harde regel 4).
"""

import json, os, math, statistics as st

HIST = os.path.join(os.path.dirname(__file__), "..", "..", "data", "history")
MAD_SCALE = 1.4826
MIN_SCALE = 1e-6

def median(xs): return st.median(xs)

def robust_scale(xs):
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

# --- Acklam probit, identiek aan ecdf.ts ---
def probit(p):
    if not (0 < p < 1): return float("nan")
    a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924]
    b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857]
    c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878]
    d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742]
    pLow=0.02425
    if p<pLow:
        q=math.sqrt(-2*math.log(p))
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    if p<=1-pLow:
        q=p-0.5; r=q*q
        return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    q=math.sqrt(-2*math.log(1-p))
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)

def percentile_rank(value, ref):  # identiek aan percentile.ts (midrank)
    lower = sum(1 for x in ref if x < value)
    equal = sum(1 for x in ref if x == value)
    return ((lower + 0.5*equal)/len(ref))*100

def ecdf_z(value, ref):  # identiek aan ecdf.ts: probit(clamp(p,[1/2n,1-1/2n])), winsor
    n=len(ref); p=percentile_rank(value,ref)/100
    floor=1/(2*n); clamped=min(1-floor,max(floor,p))
    return winsor(probit(clamped))

def mad_z(value, ref):
    med=median(ref); scale=robust_scale(ref)
    if scale!=scale or scale==0: return float("nan")
    return winsor((value-med)/scale)

def load(code):
    with open(os.path.join(HIST, f"{code}.json")) as f:
        return [r["value"] for r in json.load(f)]

# code -> (domein, inverse_coded, label)
SIGNALS = {
    "I-D2-delijn":   ("D2", False, "De Lijn verstoringen"),
    "I-D2-stib":     ("D2", False, "STIB/MIVB verstoringen"),
    "I-D5-006S":     ("D5", True,  "Reddit-toon"),
    "I-D5-mastodon": ("D5", True,  "Mastodon-toon"),
    "I-D5-trends":   ("D5", False, "Google Trends stress-aandeel"),
}

DOMAIN_SCORE = {"D1": 0.70, "D2": 1.15, "D3": 1.05, "D4": 0.10, "D5": -0.75}
DOMAIN_N     = {"D1": 6, "D2": 3, "D3": 7, "D4": 2, "D5": 3}
DOMAIN_SUMZ  = {d: DOMAIN_SCORE[d]*DOMAIN_N[d] for d in DOMAIN_SCORE}

def z_for(code, method):
    dom, inv, _ = SIGNALS[code]
    xs = load(code); today = xs[-1]
    z = (ecdf_z if method=="ecdf" else mad_z)(today, xs)
    return -z if inv else z   # inverse-coding: stress = -toon

def broadened_composite(method):
    new = dict(DOMAIN_SCORE)
    add_sumz = {"D2":0.0,"D5":0.0}; add_n={"D2":0,"D5":0}
    for code,(dom,inv,_) in SIGNALS.items():
        add_sumz[dom]+=z_for(code,method); add_n[dom]+=1
    for dom in ["D2","D5"]:
        new[dom]=(DOMAIN_SUMZ[dom]+add_sumz[dom])/(DOMAIN_N[dom]+add_n[dom])
    return sum(new[d] for d in ["D1","D2","D3","D4","D5"])/5.0, new

cur = sum(DOMAIN_SCORE[d] for d in ["D1","D2","D3","D4","D5"])/5.0

print("="*78)
print("PROTOTYPE v2 - EERLIJKE normalisatie (MAD-z vs ECDF-probit)")
print("="*78)

print("\n[1] z per signaal: MAD-z (huidig) vs ECDF-probit (eerlijk):\n")
print(f"  {'signaal':30}{'today':>8}{'MAD-z':>8}{'ECDF-z':>8}   opmerking")
for code,(dom,inv,label) in SIGNALS.items():
    xs=load(code); today=xs[-1]
    zm=z_for(code,"mad"); ze=z_for(code,"ecdf")
    note = "MAD-z gekapt door near-zero-baseline" if abs(zm)>=2.99 and abs(ze)<2.5 else ""
    print(f"  {label+' ['+dom+']':30}{today:>8.3f}{zm:>8.2f}{ze:>8.2f}   {note}")

cm,_  = broadened_composite("mad")
ce,nd = broadened_composite("ecdf")
print("\n[2] EQUAL-WEIGHT COMPOSIET (ruw, z-ruimte):\n")
print(f"  huidig (20 ind.)            : {cur:+.3f}   (= live 0.45)")
print(f"  verbreed - MAD-z   (v1)     : {cm:+.3f}   delta {cm-cur:+.3f}")
print(f"  verbreed - ECDF    (eerlijk): {ce:+.3f}   delta {ce-cur:+.3f}")

print("\n[3] Waar zit het effect (ECDF)? domeinbijdragen voor -> na:\n")
for dom in ["D2","D5"]:
    print(f"  {dom}: score {DOMAIN_SCORE[dom]:+.3f} -> {nd[dom]:+.3f} | contrib {DOMAIN_SCORE[dom]/5:+.3f} -> {nd[dom]/5:+.3f}")

print("\n[4] OV apart (De Lijn + STIB) - gevraagde aparte blik:\n")
for code in ["I-D2-delijn","I-D2-stib"]:
    xs=load(code)
    print(f"  {SIGNALS[code][2]:22} n={len(xs)} min={min(xs):.0f} med={median(xs):.0f} max={max(xs):.0f} "
          f"today={xs[-1]:.0f}  MAD-z={z_for(code,'mad'):+.2f} ECDF={z_for(code,'ecdf'):+.2f}")
# OV-only effect op de composiet (alleen D2 verbreed, D5 ongemoeid)
ov_sumz = z_for("I-D2-delijn","ecdf")+z_for("I-D2-stib","ecdf")
d2_ov = (DOMAIN_SUMZ["D2"]+ov_sumz)/(DOMAIN_N["D2"]+2)
comp_ov = (DOMAIN_SCORE["D1"]+d2_ov+DOMAIN_SCORE["D3"]+DOMAIN_SCORE["D4"]+DOMAIN_SCORE["D5"])/5.0
print(f"\n  Alleen OV toevoegen (D2: 3->5): composiet {cur:+.3f} -> {comp_ov:+.3f}  (delta {comp_ov-cur:+.3f})")
print("  -> D2 is al verzadigd (file z+3, brandstof z+3); de twee OV-tellers worden")
print("     weggemiddeld door de 1/3->1/5-verdunning. OV beweegt de ABSOLUTE kop ~niet.")
print("     Hun waarde ligt in de RELATIEVE laag (breedte/context), niet in dit cijfer.")
