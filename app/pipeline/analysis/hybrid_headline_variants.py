#!/usr/bin/env python3
"""
PROTOTYPE (niet-gedeployed) - HYBRIDE KOP, VARIANTEN naast elkaar.

Peters rebase-correctie verwerkt: de snelle (bewegende) factoren worden gerankt
tegen de NORMALE jaren (2010-2019), niet tegen de afgelopen 60 dagen / crisisjaren.
Zo leest het cijfer eerlijk-hoog EN ademt het dagelijks.

  KOP = clamp( ANKER + M*tanh(beweging_z / S), ANKER-M, 100 )
    ANKER       = 100*Phi( gem. abs. z economie vs 2010-2019 )         [+ optioneel structureel jaarverkeer, Pad A]
    beweging_z  = gemiddelde z van de snelle factoren, elk vs zijn NORMALE-jaren-referentie:
                    hitte/koude -> seizoens-ECDF vs 2010-2019 (echte historie, 910 zomerpunten)
                    nieuws      -> z vs 2017-2019 (live)
                    verkeer     -> ECDF vs eigen 2 weken DATEX (geen 2010-2019; dagsignaal, bouwt historie op)

Varianten: V1 (M=8), V2 (M=12), V3 (M=8 + structureel jaarverkeer in anker, Pad A).
Raakt de live kop NIET (harde regel 4).
"""
import json, os, math, datetime as dt

HIST = os.path.join(os.path.dirname(__file__), "..", "..", "data", "history")
def load(c):
    with open(os.path.join(HIST,f"{c}.json")) as f: return json.load(f)
def doy(s):
    y,m,d=map(int,s.split('-')); return dt.date(y,m,d).timetuple().tm_yday

def probit(p):
    if not(0<p<1): return float('nan')
    a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924]
    b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857]
    c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878]
    dd=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742]; pl=0.02425
    if p<pl:
        q=math.sqrt(-2*math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((dd[0]*q+dd[1])*q+dd[2])*q+dd[3])*q+1)
    if p<=1-pl:
        q=p-0.5; r=q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    q=math.sqrt(-2*math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((dd[0]*q+dd[1])*q+dd[2])*q+dd[3])*q+1)
def winsor(z,k=3.0): return max(-k,min(k,z))
def Phi(z): return 0.5*(1+math.erf(z/math.sqrt(2)))
def pctrank(v,ref):
    lo=sum(1 for x in ref if x<v); eq=sum(1 for x in ref if x==v); return (lo+0.5*eq)/len(ref)
def ecdf_z(v,ref):
    n=len(ref); fl=1/(2*n); return winsor(probit(min(1-fl,max(fl,pctrank(v,ref)))))

# --- weer: seizoens-ECDF vs 2010-2019 ---
HEAT=load("I-D1-002"); td=doy(HEAT[-1]['date'])
def seasonal(series,years,win=45):
    out=[]
    for x in series:
        if int(x['date'][:4]) in years:
            dd=abs(doy(x['date'])-td); dd=min(dd,366-dd)
            if dd<=win: out.append(x['value'])
    return out
NORM=set(range(2010,2020))
heat_norm=seasonal(HEAT,NORM)
def heat_z(heat_excess): return ecdf_z(heat_excess, heat_norm+[heat_excess])

# --- verkeer: ECDF vs eigen 2 weken ---
DATEX=[x['value'] for x in load("I-D2-001-rt")]
def traffic_z(v): return ecdf_z(v, DATEX+[v])

# --- ANKER ---
ECON_Z={"CPI":1.85,"brandstof":1.27,"energie":3.00,"hypotheek":-1.26,"vertrouwen":0.76}
def anker(extra_struct=None):
    zs=list(ECON_Z.values())+([extra_struct] if extra_struct is not None else [])
    return 100*Phi(sum(zs)/len(zs)), sum(zs)/len(zs)

S=1.5
def kop(anker_val, M, bewz):
    return max(anker_val-M, min(100, anker_val + M*math.tanh(bewz/S)))
def band(k): return "UITZONDERLIJK" if k>=90 else "VERHOOGD" if k>=70 else "NORMAAL" if k>=50 else "RUSTIG"

# snelle factoren per scenario: [hitte_excess, koude, nieuws_z, verkeer_value]
SCEN={
 "vandaag (33C, verkeer normaal 5.6)": (3.3,0,0.66, 5.6),
 "hittegolf breekt (27C)":             (0.0,0,0.66, 5.6),
 "+ verkeer rustig (2 km)":            (0.0,0,0.66, 2.0),
 "+ kalm nieuws":                      (0.0,0,-1.5, 2.0),
 "zware dag: file-spike+oorlog+hitte": (3.3,0,2.5, 110.0),
}
def bewz(s):
    h,k,n,t=s
    zs=[heat_z(h), 0.0 if k==0 else ecdf_z(k,[0]), n, traffic_z(t)]
    return sum(zs)/len(zs), zs

A0,az0=anker()
A3,az3=anker(extra_struct=1.5)  # Pad A: structureel jaarverkeer (record filezwaarte; AANNAME z=+1.5, geen schone 2010-2019-z)

print("="*82)
print("HYBRIDE KOP - 3 VARIANTEN  (snelle factoren gerankt vs 2010-2019)")
print("="*82)
print(f"\nANKER economie (vs 2010-2019): gem z={az0:.3f} -> {A0:.1f}")
print(f"ANKER + structureel jaarverkeer (Pad A, z=+1.5 AANNAME): gem z={az3:.3f} -> {A3:.1f}")
print(f"\nReferentie-effect (waarom 'vs normaal' eerlijk-hoog leest, niet 23):")
print(f"  hitte vandaag 33C -> seizoens-ECDF vs 2010-2019 = P{100*pctrank(3.3,heat_norm):.0f} (z={heat_z(3.3):+.2f})")
print(f"  normale junidag 27C -> P{100*pctrank(0.0,heat_norm):.0f} (z={heat_z(0.0):+.2f})  <- daar zit de ademhaling")
print(f"  verkeer vandaag 5.6 km -> ECDF eigen 2wk = P{100*pctrank(5.6,DATEX):.0f} (z={traffic_z(5.6):+.2f})")

VARIANTS=[("V1: M=8",            A0, 8),
          ("V2: M=12 (meer adem)",A0,12),
          ("V3: M=8 + verkeer in anker (Pad A)", A3, 8)]
print("\n" + " "*40 + "".join(f"{v[0].split(':')[0]:>9}" for v in VARIANTS))
hdr=f"{'scenario':38}" + "".join(f"{v[0]:>0}" for v in [])
for name,s in SCEN.items():
    bz,_=bewz(s)
    cells=[]
    for _,Aval,M in VARIANTS:
        k=kop(Aval,M,bz); cells.append(f"{k:5.1f}")
    print(f"  {name:38}" + "".join(f"{c:>9}" for c in cells) + f"   (bew_z={bz:+.2f})")
print("\nbanden: <50 RUSTIG · <70 NORMAAL · <90 VERHOOGD · >=90 UITZONDERLIJK")
print("vandaag-banden:", ", ".join(f"{v[0].split(':')[0]}={band(kop(v[1],v[2],bewz(SCEN['vandaag (33C, verkeer normaal 5.6)'])[0]))}" for v in VARIANTS))
