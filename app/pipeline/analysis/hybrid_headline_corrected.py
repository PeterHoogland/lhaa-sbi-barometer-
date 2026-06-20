#!/usr/bin/env python3
"""
PROTOTYPE (niet-gedeployed) - HYBRIDE KOP, GECORRIGEERD.

Twee correcties t.o.v. de eerdere variant-prototypes:
  1) ANKER-LABELFOUT GEDICHT. Het economische anker is 6 indicatoren (niet 5):
     I-D3-001 CPI, I-D2-004 brandstof, I-D3-002 energieprijs, I-D3-005 werkloosheid,
     I-D3-006 hypotheekrente, I-D3-007 consumentenvertrouwen (was per onguk weggelaten).
     -> z_slow=1.437 -> anker 92.5 (was foutief 87).
  2) CONSTRUCTIE: van additief (anker + M*tanh) naar de zuivere Phi-BLEND. Bij het
     juiste hogere anker verzadigt het additieve model tegen 100; de blend mapt EEN
     samengestelde z-score via Phi en ademt netjes. Wetenschappelijk coherenter.

  KOP = 100 * Phi( (1-w_fast)*z_slow + w_fast*z_fast )
    z_slow = gem. abs. z van de 6 economische, vs 2010-2019            (traag, anker)
    z_fast = gem. z van de snelle factoren, elk vs zijn NORMALE-jaren-referentie:
             hitte/koude -> seizoens-ECDF vs 2010-2019 (echte historie)
             nieuws      -> z vs 2017-2019 (live)
             verkeer     -> ECDF vs eigen 2 weken DATEX (dagsignaal, bouwt op)
    w_fast = ademknop (groter = beweeglijker)

Raakt de live kop NIET (harde regel 4). Live z's: broad_pressure 19/6.
"""
import json, os, math, datetime as dt
H=os.path.join(os.path.dirname(__file__),"..","..","data","history")
def load(c):
    with open(os.path.join(H,f"{c}.json")) as f: return json.load(f)
def doy(s):
    y,m,d=map(int,s.split('-')); return dt.date(y,m,d).timetuple().tm_yday
def probit(p):
    a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924]
    b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857]
    c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878]
    dd=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742]; pl=0.02425
    if p<pl: q=math.sqrt(-2*math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((dd[0]*q+dd[1])*q+dd[2])*q+dd[3])*q+1)
    if p<=1-pl: q=p-0.5; r=q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    q=math.sqrt(-2*math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((dd[0]*q+dd[1])*q+dd[2])*q+dd[3])*q+1)
def win(z): return max(-3,min(3,z))
def Phi(z): return 0.5*(1+math.erf(z/math.sqrt(2)))
def pr(v,r): return (sum(1 for x in r if x<v)+0.5*sum(1 for x in r if x==v))/len(r)
def ez(v,r): n=len(r); fl=1/(2*n); return win(probit(min(1-fl,max(fl,pr(v,r)))))
HEAT=load("I-D1-002"); td=doy(HEAT[-1]['date'])
hn=[x['value'] for x in HEAT if int(x['date'][:4]) in set(range(2010,2020)) and min(abs(doy(x['date'])-td),366-abs(doy(x['date'])-td))<=45]
def hz(h): return ez(h,hn+[h])
DX=[x['value'] for x in load("I-D2-001-rt")]
def tz(v): return ez(v,DX+[v])
ECON={"CPI":1.85,"brandstof":1.27,"energieprijs":3.0,"werkloosheid":-1.26,"hypotheek":0.76,"vertrouwen":3.0}
zslow=sum(ECON.values())/len(ECON)
SCEN={"vandaag (33C, verkeer 5.6)":(3.3,0.66,5.6),"hittegolf breekt (27C)":(0.0,0.66,5.6),
      "+verkeer rustig (2km)":(0.0,0.66,2.0),"+kalm nieuws":(0.0,-1.5,2.0),"zware dag (file+oorlog+hitte)":(3.3,2.5,110.0)}
def zfast(s): h,n,t=s; return (hz(h)+0.0+n+tz(t))/4
def band(k): return "UITZONDERLIJK" if k>=90 else "VERHOOGD" if k>=70 else "NORMAAL" if k>=50 else "RUSTIG"
print("="*86)
print("HYBRIDE KOP - GECORRIGEERD (6-econ anker, Phi-blend)")
print("="*86)
print(f"\nANKER z_slow={zslow:.3f} -> {100*Phi(zslow):.1f} | traffic z: vandaag={tz(5.6):+.2f} laag={tz(2.0):+.2f} spike={tz(110):+.2f}")
WF=[("rustig .20",.20),("middel .30",.30),("ademend .40",.40)]
print("\n"+f"{'scenario':34}"+"".join(f"{w[0]:>14}" for w in WF))
for name,s in SCEN.items():
    zf=zfast(s); cells=[]
    for _,wf in WF:
        cells.append(f"{100*Phi((1-wf)*zslow+wf*zf):5.1f}")
    print(f"  {name:32}"+"".join(f"{c:>14}" for c in cells)+f"   zf={zf:+.2f}")
print("\nbanden: <70 NORMAAL · <90 VERHOOGD · >=90 UITZONDERLIJK")
print("AANRADER: w_fast=.30 (vandaag ~89.5, ademt ~79-93, kalme dag blijft eerlijk VERHOOGD).")
