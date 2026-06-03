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
from .fetchers import kmi, irceline, verkeerscentrum, fod_economie, statbel, energy_charts, fod_waso, nbb, gdelt, wikipedia, events, reddit, layoff_radar, irail, elia, waterinfo, pollen, datex_traffic, google_trends, mastodon, stib, delijn


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
    # Ook secundaire signalen (bv. I-D5-emotie) bouwen historie op — die baseline
    # heeft de trigger-laag nodig (headlines hebben geen extern archief).
    for r in [*batch.results, *batch.secondary]:
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
    # Tweede onderstroom-peiling naast Reddit (no-auth publieke Mastodon-timeline).
    batch.add_secondary(mastodon.fetch_mastodon_sentiment(d))
    batch.add_secondary(layoff_radar.fetch_layoff_radar(d))
    # Emotionele lading van de nieuws-headlines — hergebruikt de RSS-meting van
    # fetch_news_negativity hierboven (V6 increment 2). Trigger-laag, niet het cijfer.
    batch.add_secondary(gdelt.news_emotion_secondary(d))
    # Verdriet-/rouw-deel apart — voedt de brand-safety-CTA-pauze bij een rouwdag
    # (2026-06-03, blinde vlek nationale rouw). Ook trigger-laag, niet het cijfer.
    batch.add_secondary(gdelt.news_sadness_secondary(d))
    # Reach-gewogen RSS-negativiteit (poststratified) — controle naast GDELT die
    # historie opbouwt (Peters reach-vraag). Niet in het cijfer.
    batch.add_secondary(gdelt.news_negativity_rss_secondary(d))
    # Google Trends — stress-aandeel van de Belgische trending searches (tussenstroom
    # = zoekgedrag op schaal, 2026-06-03). Bouwt historie op. Niet in het cijfer.
    batch.add_secondary(google_trends.fetch_google_trends_stress(d))
    # Real-time filezwaarte (km file) via DATEX v3 — dagmaat verkeersdruk; bouwt
    # historie op tot het de jaar-I-D2-001 kan vervangen (V6, Peters keuze).
    batch.add_secondary(datex_traffic.fetch_traffic_realtime(d))
    # STIB/MIVB Brusselse OV-verstoringen (no-auth) — naast de trein (iRail). Bouwt
    # historie op tot het mee in een OV-verstoringsindicator kan (2026-06-03).
    batch.add_secondary(stib.fetch_stib_disruptions(d))
    # De Lijn Vlaamse bus/tram-omleidingen (vereist DELIJN_API_KEY-secret). Bouwt historie.
    batch.add_secondary(delijn.fetch_delijn_disruptions(d))

    return batch


# Map indicator-code → fetcher, voor de self-repair-pass. D4/D6 zijn
# deterministisch (engine) en horen er niet in.
def _fetcher_for(code: str):
    table = {
        "I-D1-002": lambda d: kmi.fetch_temperature_extremes(d)[0],
        "I-D1-003": lambda d: kmi.fetch_temperature_extremes(d)[1],
        "I-D1-004": irceline.fetch_air_quality,
        "I-D1-009": waterinfo.fetch_flood_signal,
        "I-D1-010": pollen.fetch_pollen,
        "I-D2-001": verkeerscentrum.fetch_traffic_load,
        "I-D2-004": fod_economie.fetch_fuel_prices,
        "I-D2-009": irail.fetch_train_disruptions,
        "I-D3-001": statbel.fetch_cpi,
        "I-D3-002": energy_charts.fetch_energy_prices,
        "I-D3-003": fod_waso.fetch_collective_layoffs,
        "I-D3-005": statbel.fetch_unemployment,
        "I-D3-006": nbb.fetch_mortgage_rate,
        "I-D3-009": elia.fetch_grid_stress,
        "I-D5-001": gdelt.fetch_news_negativity,
        "I-D5-002": wikipedia.fetch_stress_searches,
        "I-D5-003": events.fetch_collective_events,
    }
    return table.get(code)


def repair_failed(batch: FetchBatch, d: date) -> list[str]:
    """Self-repair: elke indicator die op mock viel (simulated=True) krijgt nog
    één verse ophaalpoging. Veel uitval is tijdelijk (timeout, 429, bron even
    plat). Slaagt de retry (echte waarde of verse cache), dan vervangt die het
    mock-resultaat, zodat de dagdata zo volledig mogelijk is. Lukt het nog niet,
    dan blijft de mock staan en vuurt de bestaande demo-fallback-mailmelding."""
    repaired: list[str] = []
    for i, r in enumerate(batch.results):
        if not r.simulated:
            continue
        fn = _fetcher_for(r.code)
        if fn is None:
            continue
        try:
            retry = fn(d)
        except Exception:  # noqa: BLE001
            continue
        if retry is not None and not retry.simulated:
            batch.results[i] = retry
            repaired.append(r.code)
    return repaired


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
        repaired = repair_failed(batch, d)
        if repaired:
            print(f"  ↻ [{d}] self-repair geslaagd: {', '.join(repaired)}", file=sys.stderr)
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
