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
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

from .util import FetchBatch, DATA_DIR, write_json, daterange, iso
from .fetchers import kmi, irceline, verkeerscentrum, fod_economie, statbel, energy_charts, fod_waso, nbb, gdelt, wikipedia, events, reddit, layoff_radar, irail, elia, waterinfo, pollen


# Maximaal aantal punten dat we per indicator in de doorlopende historie houden
# (~3 jaar dagdata; voorkomt onbegrensd groeiende bestanden).
_HISTORY_CAP = 1100


def append_to_history(batch: FetchBatch) -> None:
    """Voeg de echte dagwaarden toe aan de doorlopende historie-bestanden in
    app/data/history/. Zo bouwt ELKE indicator over tijd een echte baseline op,
    ook indicatoren waarvoor geen historische API bestaat (verkeer, trein,
    gebeurtenissen). Backfill-snapshots worden er dagelijks mee bijgehouden.

    Gesimuleerde (mock) en ontbrekende waarden komen NIET in de echte historie.
    """
    hist_dir = DATA_DIR / "history"
    hist_dir.mkdir(parents=True, exist_ok=True)
    for r in batch.results:
        if r.simulated or r.value is None or not math.isfinite(r.value):
            continue
        # observatiedatum normaliseren naar YYYY-MM-DD (maandcijfers → dag 01)
        obs = (r.observation_date or batch.target_date).strip()
        if len(obs) == 7:
            obs = f"{obs}-01"
        if len(obs) != 10:
            obs = batch.target_date
        path = hist_dir / f"{r.code}.json"
        rows: list[dict] = []
        if path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    rows = loaded
            except (ValueError, OSError):
                rows = []
        rows = [row for row in rows if row.get("date") != obs]
        rows.append({"date": obs, "value": round(float(r.value), 4)})
        rows.sort(key=lambda x: str(x.get("date", "")))
        if len(rows) > _HISTORY_CAP:
            rows = rows[-_HISTORY_CAP:]
        path.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def fetch_one_day(d: date) -> FetchBatch:
    """Roept alle non-deterministische fetchers aan voor één dag."""
    batch = FetchBatch(target_date=iso(d))

    # D1 — Omgeving (Tier B: weer via open-meteo, Tier C: luchtkwaliteit mock)
    heat, cold = kmi.fetch_temperature_extremes(d)
    batch.add(heat)
    batch.add(cold)
    batch.add(irceline.fetch_air_quality(d))
    batch.add(waterinfo.fetch_flood_signal(d))
    batch.add(pollen.fetch_pollen(d))

    # D2 — Mobiliteit
    batch.add(verkeerscentrum.fetch_traffic_load(d))
    batch.add(fod_economie.fetch_fuel_prices(d))
    batch.add(irail.fetch_train_disruptions(d))

    # D3 — Economie
    batch.add(statbel.fetch_cpi(d))
    batch.add(energy_charts.fetch_energy_prices(d))
    batch.add(fod_waso.fetch_collective_layoffs(d))
    batch.add(statbel.fetch_unemployment(d))
    batch.add(nbb.fetch_mortgage_rate(d))
    batch.add(elia.fetch_grid_stress(d))

    # D5 — Media (D4 + D6 zijn deterministisch en worden in de engine berekend)
    batch.add(gdelt.fetch_news_negativity(d))
    batch.add(wikipedia.fetch_stress_searches(d))
    batch.add(events.fetch_collective_events(d))

    # Secundair — NIET in composiet (sensitiviteit, doc 02 §10)
    batch.add_secondary(reddit.fetch_reddit_sentiment(d))
    batch.add_secondary(layoff_radar.fetch_layoff_radar(d))

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

    # Doorlopende historie-opbouw: elke echte dagwaarde wordt bewaard zodat
    # iedere indicator over tijd tegen ECHTE historie gewogen wordt.
    append_to_history(today_batch)
    print(f"✓ historie bijgewerkt in {DATA_DIR / 'history'}", file=sys.stderr)

    sim = today_batch.simulated_codes
    print(f"✓ wrote {DATA_DIR / 'raw-values.json'}", file=sys.stderr)
    print(f"  simulated: {len(sim)}/{len(today_batch.results)} indicators", file=sys.stderr)
    if sim:
        print(f"  → {', '.join(sim)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
