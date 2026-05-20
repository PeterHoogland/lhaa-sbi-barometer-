"""
SBI Pipeline — hoofdorkestrator.
Doc 03_Laag-4 §5.3 stappen [1] EXTRACT en [2] VALIDATE.
De engine (TS) doet daarna [3]-[7] (transform → harmonize → decorrelate
→ aggregate → signal).

Run: python -m pipeline.run [--date YYYY-MM-DD] [--history-days N]
Output: app/data/raw-values.json
"""
from __future__ import annotations
import argparse
import sys
from datetime import date, timedelta
from pathlib import Path

from .util import FetchBatch, DATA_DIR, write_json, daterange, iso
from .fetchers import kmi, irceline, verkeerscentrum, fod_economie, statbel, energy_charts, fod_waso, nbb, gdelt, google_trends, events


def fetch_one_day(d: date) -> FetchBatch:
    """Roept alle non-deterministische fetchers aan voor één dag."""
    batch = FetchBatch(target_date=iso(d))

    # D1 — Omgeving (Tier B: weer via open-meteo, Tier C: luchtkwaliteit mock)
    heat, cold = kmi.fetch_temperature_extremes(d)
    batch.add(heat)
    batch.add(cold)
    batch.add(irceline.fetch_air_quality(d))

    # D2 — Mobiliteit
    batch.add(verkeerscentrum.fetch_traffic_load(d))
    batch.add(fod_economie.fetch_fuel_prices(d))

    # D3 — Economie
    batch.add(statbel.fetch_cpi(d))
    batch.add(energy_charts.fetch_energy_prices(d))
    batch.add(fod_waso.fetch_collective_layoffs(d))
    batch.add(statbel.fetch_unemployment(d))
    batch.add(nbb.fetch_mortgage_rate(d))

    # D5 — Media (D4 + D6 zijn deterministisch en worden in de engine berekend)
    batch.add(gdelt.fetch_news_negativity(d))
    batch.add(google_trends.fetch_stress_searches(d))
    batch.add(events.fetch_collective_events(d))

    return batch


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SBI Pipeline — fetch raw indicator values")
    parser.add_argument("--date", type=str, default=None,
                        help="Target date YYYY-MM-DD (default: today)")
    parser.add_argument("--history-days", type=int, default=0,
                        help="Aantal historische dagen ook fetchen (default: 0)")
    args = parser.parse_args(argv)

    target = date.fromisoformat(args.date) if args.date else date.today()
    start = target - timedelta(days=args.history_days)

    print(f"SBI Pipeline — fetch window {start} → {target}", file=sys.stderr)

    history: list[dict] = []
    today_batch: FetchBatch | None = None

    for d in daterange(start, target):
        print(f"  [{d}] fetching…", file=sys.stderr)
        batch = fetch_one_day(d)
        history.append(batch.to_dict())
        if d == target:
            today_batch = batch

    assert today_batch is not None

    write_json(DATA_DIR / "raw-values.json", today_batch.to_dict())
    if args.history_days > 0:
        write_json(DATA_DIR / "raw-history.json", history)

    sim = today_batch.simulated_codes
    print(f"✓ wrote {DATA_DIR / 'raw-values.json'}", file=sys.stderr)
    print(f"  simulated: {len(sim)}/{len(today_batch.results)} indicators", file=sys.stderr)
    if sim:
        print(f"  → {', '.join(sim)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
