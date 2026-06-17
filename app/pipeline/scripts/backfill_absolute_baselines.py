"""
Backfill van pre-2020 "normale tijden"-baselines voor de brede absolute meting
(amendement §4.1.11, Peter GO 2026-06-17).

WAAROM. De brede absolute hoofdmeting vergelijkt elke indicator met zijn eigen
normale decennium. De economische 5 hebben die historie al; weer (hitte/koude)
en energie hadden alleen 2024+. Dit script backfillt hun 2010-2019- (weer) en
2016-2019- (energie) historie met EXACT dezelfde maat als de live-fetcher
(schaaldiscipline, harde regel 5):
  - I-D1-002 Hitte  = max(0, Tmax - 30)   (kmi.py _heat_cold)
  - I-D1-003 Koude  = max(0, -5 - Tmin)   (kmi.py _heat_cold)
  - I-D3-002 Energie = dag-gemiddelde uurprijs EUR/MWh, UTC-dag (energy_charts.py)

Bronnen (gratis, geen sleutel): open-meteo archive (ERA5) voor Tmax/Tmin;
energy-charts.info voor BE day-ahead.

VEILIG: voegt alleen pre-2020-rijen toe; bestaande 2024+-rijen blijven staan
(geen overlap). De rolling MAD-z-vensters (§4.1.7, 24/60m) en de eCDF-cap (5 jaar)
zien pre-2020 niet, dus de relatieve keten verandert niet; alleen de absolute
meting (filtert <2020) gebruikt deze punten.

Run: python3 app/pipeline/scripts/backfill_absolute_baselines.py
"""
from __future__ import annotations
import json
import time
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
HIST = ROOT / "data" / "history"
LAT, LON = 50.85, 4.35  # Brussel (doc 03 §1.2)


def _get(url, params, tries=5):
    last = None
    for i in range(tries):
        r = requests.get(url, params=params, timeout=90)
        if r.status_code == 429:
            last = r; time.sleep(8 * (i + 1)); continue
        r.raise_for_status(); return r.json()
    last.raise_for_status()


def weather_rows() -> tuple[list[dict], list[dict]]:
    d = _get("https://archive-api.open-meteo.com/v1/archive",
             {"latitude": LAT, "longitude": LON,
              "start_date": "2010-01-01", "end_date": "2019-12-31",
              "daily": "temperature_2m_max,temperature_2m_min",
              "timezone": "Europe/Brussels"})["daily"]
    times = d["time"]; tmax = d["temperature_2m_max"]; tmin = d["temperature_2m_min"]
    hitte, koude = [], []
    for t, mx, mn in zip(times, tmax, tmin):
        if mx is not None:
            hitte.append({"date": t, "value": round(max(0.0, mx - 30.0), 4)})
        if mn is not None:
            koude.append({"date": t, "value": round(max(0.0, -5.0 - mn), 4)})
    return hitte, koude


def energy_rows() -> list[dict]:
    by_day: dict[str, list[float]] = defaultdict(list)
    for i, y in enumerate(range(2016, 2020)):
        if i > 0:
            time.sleep(6)
        d = _get("https://api.energy-charts.info/price",
                 {"bzn": "BE", "start": f"{y}-01-01", "end": f"{y}-12-31"})
        for s, p in zip(d.get("unix_seconds") or [], d.get("price") or []):
            if p is None:
                continue
            day = datetime.fromtimestamp(s, tz=timezone.utc).date().isoformat()
            by_day[day].append(float(p))
    return [{"date": day, "value": round(sum(v) / len(v), 4)} for day, v in sorted(by_day.items()) if v]


def merge_into(code: str, new_rows: list[dict]) -> tuple[int, int, int]:
    """Voeg pre-2020-rijen toe aan het historiebestand; bestaande rijen winnen
    bij datumbotsing (we raken 2024+ niet aan). Return (toegevoegd, behouden, totaal)."""
    path = HIST / f"{code}.json"
    existing = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    have = {r["date"] for r in existing}
    added = [r for r in new_rows if r["date"] < "2020-01-01" and r["date"] not in have]
    merged = sorted(existing + added, key=lambda r: r["date"])
    path.write_text(json.dumps(merged, indent=2), encoding="utf-8")
    return len(added), len(existing), len(merged)


def main():
    print("weer ophalen (open-meteo 2010-2019)...", flush=True)
    hitte, koude = weather_rows()
    print("energie ophalen (energy-charts 2016-2019)...", flush=True)
    energy = energy_rows()

    for code, rows in (("I-D1-002", hitte), ("I-D1-003", koude), ("I-D3-002", energy)):
        added, kept, total = merge_into(code, rows)
        pre2020 = [r for r in json.loads((HIST / f"{code}.json").read_text()) if r["date"] < "2020-01-01"]
        vals = [r["value"] for r in pre2020]
        import statistics as st
        med = st.median(vals) if vals else 0
        print(f"  {code}: +{added} pre-2020 toegevoegd, {kept} behouden, totaal {total} "
              f"| pre-2020 n={len(pre2020)} mediaan={med:.3f} "
              f"min={min(vals):.2f} max={max(vals):.2f}")
    print("\nKlaar. Validatie: bestaande 2024+ rijen onaangeroerd; alleen pre-2020 toegevoegd.")


if __name__ == "__main__":
    main()
