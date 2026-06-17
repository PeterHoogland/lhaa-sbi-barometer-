"""
Breed-absolute-prototype — coherent hoger hoofdcijfer "vs normale tijden".

WAAROM (Peter, 2026-06-17). Het economie-only absolute cijfer (87, §4.1.9/§4.1.10)
en het brede relatieve percentiel (~19) gebruiken een ANDERE referentie en zijn
dus niet samenhangend. De enige wetenschappelijk zuivere weg naar een hoger
coherent cijfer: meet ZOVEEL MOGELIJK indicatoren absoluut "vs normale tijden",
niet alleen de economische. Dit prototype backfillt langjarige baselines voor
weer (open-meteo, gratis) en energie (energy-charts, gratis) en voegt ze bij de
5 economische (die al 2010-2019 hebben), om het echte brede absolute cijfer te
zien VOORDAT we de live kop wisselen.

EERLIJK: prototype/analyse, geen score-keten. Alle backfill-metingen gebruiken
exact dezelfde transformatie als de live-fetcher (schaaldiscipline, Hitte-bug-
klasse). Geen cherry-picking: ook indicatoren die LAAG vs normaal staan tellen mee.

Run: python3 app/pipeline/analysis/broad_absolute_prototype.py
"""
from __future__ import annotations
import json
import math
import statistics as st
import time
from datetime import date, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
HIST = ROOT / "data" / "history"
MAD_SCALE = 1.4826
LAT, LON = 50.85, 4.35  # Brussel
ECON_BASE = ("2010-01-01", "2019-12-31")
WEATHER_BASE = ("2010-01-01", "2019-12-31")
ENERGY_BASE_YEARS = (2016, 2017, 2018, 2019)  # energy-charts dekt BE betrouwbaar vanaf ~2016


def median(xs): return st.median(xs)

def mad_scaled(xs):
    m = median(xs); return MAD_SCALE * median([abs(x - m) for x in xs])

def robust_scale(xs):
    """MAD -> IQR/1.349 -> SD, zoals engine/zscore.ts."""
    mad = mad_scaled(xs)
    if mad > 1e-6: return mad
    s = sorted(xs); n = len(s)
    def q(p):
        pos = (n - 1) * p; lo = math.floor(pos); hi = math.ceil(pos)
        return s[lo] if lo == hi else s[lo] + (pos - lo) * (s[hi] - s[lo])
    iqr = (q(0.75) - q(0.25)) / 1.349
    if iqr > 1e-6: return iqr
    if n >= 2:
        sd = st.pstdev(xs) * math.sqrt(n / (n - 1))
        if sd > 1e-6: return sd
    return float("nan")

def madz(value, baseline, inverse=False):
    med = median(baseline); sc = robust_scale(baseline)
    if not math.isfinite(sc) or sc <= 0:
        return 0.0 if value <= med else float("nan")
    z = (value - med) / sc
    z = -z if inverse else z
    return max(-3.0, min(3.0, z))  # winsorize +/-3

def normal_cdf(z): return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def get(url, **kw):
    last = None
    for attempt in range(5):
        r = requests.get(url, timeout=60, **kw)
        if r.status_code == 429:
            last = r; time.sleep(8 * (attempt + 1)); continue
        r.raise_for_status(); return r.json()
    last.raise_for_status()


# ---- economische 5 (uit history-bestanden, zoals §4.1.9) ----
ECON = [
    ("I-D3-001", "Inflatie", False),
    ("I-D2-004", "Brandstof", False),
    ("I-D3-007", "Consumentenvertrouwen", True),
    ("I-D3-005", "Werkloosheid", False),
    ("I-D3-006", "Hypotheekrente", False),
]

def econ_rows():
    rows = []
    for code, name, inv in ECON:
        s = json.loads((HIST / f"{code}.json").read_text())
        base = [p["value"] for p in s if ECON_BASE[0] <= p["date"] <= ECON_BASE[1]]
        latest = s[-1]["value"]
        rows.append((name, latest, round(madz(latest, base, inv), 2), len(base)))
    return rows


def weather_rows():
    # 2010-2019 dagelijkse Tmax/Tmin Brussel
    base = get("https://archive-api.open-meteo.com/v1/archive",
               params={"latitude": LAT, "longitude": LON,
                       "start_date": WEATHER_BASE[0], "end_date": WEATHER_BASE[1],
                       "daily": "temperature_2m_max,temperature_2m_min",
                       "timezone": "Europe/Brussels"})["daily"]
    tmax = [t for t in base["temperature_2m_max"] if t is not None]
    tmin = [t for t in base["temperature_2m_min"] if t is not None]
    hitte_base = [max(0.0, t - 30) for t in tmax]   # zelfde maat als kmi-fetcher
    koude_base = [max(0.0, -5 - t) for t in tmin]
    # vandaag: recentste dag
    rec = get("https://archive-api.open-meteo.com/v1/archive",
              params={"latitude": LAT, "longitude": LON,
                      "start_date": (date.today() - timedelta(days=6)).isoformat(),
                      "end_date": date.today().isoformat(),
                      "daily": "temperature_2m_max,temperature_2m_min",
                      "timezone": "Europe/Brussels"})["daily"]
    tmax_now = [t for t in rec["temperature_2m_max"] if t is not None][-1]
    tmin_now = [t for t in rec["temperature_2m_min"] if t is not None][-1]
    hitte_now = max(0.0, tmax_now - 30); koude_now = max(0.0, -5 - tmin_now)
    return [
        ("Hitte", round(hitte_now, 2), round(madz(hitte_now, hitte_base), 2), len(hitte_base)),
        ("Koude", round(koude_now, 2), round(madz(koude_now, koude_base), 2), len(koude_base)),
    ]


def _energy_daily_means(year_start, year_end):
    out = []
    for i, y in enumerate(range(year_start, year_end + 1)):
        if i > 0:
            time.sleep(5)  # energy-charts rate limit
        d = get("https://api.energy-charts.info/price",
                params={"bzn": "BE", "start": f"{y}-01-01", "end": f"{y}-12-31"})
        secs = d.get("unix_seconds") or []
        price = d.get("price") or []
        # groepeer per dag
        from collections import defaultdict
        by_day = defaultdict(list)
        for s, p in zip(secs, price):
            if p is None: continue
            day = date.fromtimestamp(s).isoformat()
            by_day[day].append(p)
        out += [sum(v) / len(v) for v in by_day.values() if v]
    return out


def energy_rows():
    base = _energy_daily_means(ENERGY_BASE_YEARS[0], ENERGY_BASE_YEARS[-1])
    rec = get("https://api.energy-charts.info/price",
              params={"bzn": "BE",
                      "start": (date.today() - timedelta(days=10)).isoformat(),
                      "end": date.today().isoformat()})
    from collections import defaultdict
    by_day = defaultdict(list)
    for s, p in zip(rec.get("unix_seconds") or [], rec.get("price") or []):
        if p is not None:
            by_day[date.fromtimestamp(s).isoformat()].append(p)
    daily_now = [sum(v) / len(v) for v in by_day.values() if v]
    energy_now = daily_now[-1] if daily_now else float("nan")
    return [("Energieprijs", round(energy_now, 1), round(madz(energy_now, base), 2), len(base))]


def main():
    rows = []
    rows += econ_rows()
    print("weer ophalen (open-meteo 2010-2019)...", flush=True); rows += weather_rows()
    print("energie ophalen (energy-charts 2016-2019)...", flush=True); rows += energy_rows()

    print("\nBrede absolute meting — elke indicator vs zijn eigen normale tijden")
    print("=" * 78)
    print(f"{'indicator':<24}{'vandaag':>10}{'n_base':>8}{'z vs normaal':>14}")
    print("-" * 78)
    zs = []
    for name, now, z, n in rows:
        zs.append(z); print(f"{name:<24}{now:>10}{n:>8}{z:>14}")
    print("-" * 78)
    zbar = sum(zs) / len(zs)
    score = round(100 * normal_cdf(zbar))
    econ_only = round(100 * normal_cdf(sum(z for (_, _, z, _) in rows[:5]) / 5))
    print(f"\n  indicatoren in de meting : {len(rows)}")
    print(f"  z-gemiddelde (zbar)      : {zbar:+.3f}")
    print(f"  BREED ABSOLUUT CIJFER    : {score} / 100   (100*Phi(zbar))")
    print(f"  ter vergelijking economie-only (5): {econ_only} / 100")
    print(f"  ter vergelijking relatief percentiel (live): ~19 / 100")


if __name__ == "__main__":
    main()
