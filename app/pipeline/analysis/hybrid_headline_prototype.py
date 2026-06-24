#!/usr/bin/env python3
"""
PROTOTYPE (niet-gedeployed) - HYBRIDE KOP "niveau x beweging".

Peters wens (19/6): een dagelijks getal dat de korte termijn (verkeer/weer/nieuws)
INTEGREERT met de lange termijn (inflatie/energie), eerlijk-hoog leest EN zichtbaar
beweegt. broad_pressure (91) beweegt niet met verkeer (zit er niet in); relatief
(~23) ademt maar leest misleidend laag. Deze hybride lost beide op:

  ANKER (traag, structureel)  = 100*Phi( gemiddelde absolute z van de economische
                                blok vs 2010-2019 )   -> hoog & stabiel
  BEWEGING (snel, dagelijks)  = begrensde nudge uit de snelle factoren
                                (hitte/koude/nieuws/DATEX-verkeer) t.o.v. hun
                                EIGEN recente norm (ECDF-probit, robuust)
  KOP = clamp( anker + M*tanh(beweging_z / s), anker-M, 100 )

Zo blijft het cijfer eerlijk-hoog verankerd op de structurele druk, maar ademt het
dagelijks mee: hittegolf/file/zwaar-nieuws duwen omhoog, verlichting omlaag.
Verkeer (DATEX-dag) doet expliciet mee in de beweging.

Raakt de live registry/kop NIET (harde regel 4). Bron: app/data/history/*.json +
live-gereconstrueerde economische z's (vs 2010-2019).
"""
import json, os, math, statistics as st

HIST = os.path.join(os.path.dirname(__file__), "..", "..", "data", "history")

# ---------- ECDF-probit (identiek aan ecdf.ts) ----------
def probit(p):
    if not (0 < p < 1): return float("nan")
    a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924]
    b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857]
    c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878]
    d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742]
    pLow=0.02425
    if p<pLow:
        q=math.sqrt(-2*math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    if p<=1-pLow:
        q=p-0.5; r=q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    q=math.sqrt(-2*math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)

def winsor(z,c=3.0): return max(-c,min(c,z))

def ecdf_z(value, ref):
    n=len(ref); lower=sum(1 for x in ref if x<value); equal=sum(1 for x in ref if x==value)
    p=(lower+0.5*equal)/n; floor=1/(2*n); return winsor(probit(min(1-floor,max(floor,p))))

def Phi(z): return 0.5*(1+math.erf(z/math.sqrt(2)))

def load(code, last=None):
    with open(os.path.join(HIST,f"{code}.json")) as f:
        xs=[r["value"] for r in json.load(f)]
    return xs[-last:] if last else xs

# ---------- ANKER: economische blok, absolute z vs 2010-2019 (live, vandaag) ----------
SLOW_Z = {"CPI/inflatie":1.85, "brandstof":1.27, "energie":3.00, "hypotheekrente":-1.26, "consumentenvertrouwen":0.76}
anker_z = sum(SLOW_Z.values())/len(SLOW_Z)
ANKER = 100*Phi(anker_z)

# ---------- BEWEGING: snelle factoren t.o.v. eigen recente norm ----------
WINDOW = 60   # dagen recente-norm-venster voor weer
M = 8.0       # max swing in punten (te ijken)
S = 1.5       # tanh-schaal

# snelle factoren vandaag (ECDF over recente historie); nieuws = live z_kort (recency)
hitte_recent = load("I-D1-002", WINDOW)
koude_recent = load("I-D1-003", WINDOW)
datex = load("I-D2-001-rt")
FAST = {
    "hitte":   ecdf_z(hitte_recent[-1], hitte_recent),
    "koude":   ecdf_z(koude_recent[-1], koude_recent),
    "nieuws":  -0.22,                       # I-D5-001 z_kort (live v04, recency)
    "verkeer (DATEX-dag)": ecdf_z(datex[-1], datex),
}
def headline(fast_dict):
    mz = sum(fast_dict.values())/len(fast_dict)
    return max(ANKER-M, min(100, ANKER + M*math.tanh(mz/S))), mz

kop, mz = headline(FAST)

print("="*74)
print("HYBRIDE KOP-PROTOTYPE  'niveau x beweging'")
print("="*74)
print(f"\n[ANKER] structureel (economie, abs. z vs 2010-2019):")
for k,v in SLOW_Z.items(): print(f"    {k:24} z={v:+.2f}")
print(f"    -> gemiddelde z={anker_z:+.3f} -> ANKER = 100*Phi = {ANKER:.1f}")

print(f"\n[BEWEGING] snelle factoren vandaag (ECDF vs eigen recente {WINDOW}d-norm):")
for k,v in FAST.items():
    tag = "(vandaag {:.1f})".format(load('I-D2-001-rt')[-1]) if k.startswith('verkeer') else ""
    print(f"    {k:24} z_short={v:+.2f} {tag}")
print(f"    -> beweging_z={mz:+.3f}  (M={M}, tanh-schaal s={S})")

print(f"\n[KOP VANDAAG]  {kop:.1f}   (anker {ANKER:.0f} {'+' if kop>=ANKER else ''}{kop-ANKER:+.1f} beweging)")
print(f"   vergelijk: broad_pressure live = 91  ->  hybride leest ~gelijk vandaag, MAAR ademt nu.")

print("\n[HOE HET ADEMT] scenario's (zelfde anker, andere snelle factoren):\n")
scenarios = {
    "vandaag (hittegolf 33C, verkeer normaal)": FAST,
    "hittegolf breekt (hitte->0)":              {**FAST, "hitte":0.0},
    "+ verkeer ook rustig (file laag)":         {**FAST, "hitte":0.0, "verkeer (DATEX-dag)":-0.8},
    "+ kalm nieuws (z -1.5)":                   {**FAST, "hitte":0.0, "verkeer (DATEX-dag)":-0.8, "nieuws":-1.5},
    "zware dag: file-spike + oorlog + hitte":   {"hitte":3.0,"koude":0.0,"nieuws":2.5,"verkeer (DATEX-dag)":2.5},
}
for name, fd in scenarios.items():
    k,m = headline(fd)
    band = "UITZONDERLIJK" if k>=90 else "VERHOOGD" if k>=70 else "NORMAAL" if k>=50 else "RUSTIG"
    print(f"    {k:5.1f}  {band:13} <- {name}")

print("\n[TE IJKEN met Peter, voor amendement] anker-set | snelle set | M (swing) |")
print("   venster | tanh-schaal | of yearly-verkeer OOK in het anker (v0.4 Pad A).")
