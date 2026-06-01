"""
Backfill-script: bouwt de maandelijkse €/l brandstof-historie voor I-D2-004 uit de
ECB HICP-brandstofindex (CP07.2.2, BE — volledige reeks tot 1996), verankerd op het
actuele be.STAT-pompprijsniveau. Schrijft app/data/history/I-D2-004.json.

Waarom: be.STAT geeft enkel de prijs van VANDAAG (geen historie — bevestigd via CI:
1 rij). De ECB-index levert wél een lange, betrouwbare, schaal-consistente reeks.
Daarmee krijgt brandstof een echte baseline en telt het mee in het v0.4-kern-composiet.

De historische €/l zijn HICP-afgeleide schattingen (geen geregistreerde pompprijzen),
maar reëel van vorm en schaal — eerlijk gelabeld in de bron-string van de fetcher.
Schrijft NIETS weg bij < 24 maandcijfers (dan klopt er iets niet met de bron).

Run:  python scripts/backfill_fuel_baseline.py   (ECB SDMX, snel/stabiel)
"""
from __future__ import annotations
import json
import sys
import time
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.fod_economie import ecb_fuel_eur_per_l_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402

MAX_ROUNDS = 6
ROUND_DELAY_S = 15
MIN_ROWS = 24


def main() -> int:
    rows: list[dict] = []
    for attempt in range(1, MAX_ROUNDS + 1):
        rows = ecb_fuel_eur_per_l_series()
        if len(rows) >= MIN_ROWS:
            break
        print(
            f"  poging {attempt}/{MAX_ROUNDS}: {len(rows)} rijen — ECB traag/onbereikbaar, opnieuw…",
            file=sys.stderr,
        )
        if attempt < MAX_ROUNDS:
            time.sleep(ROUND_DELAY_S)

    if len(rows) < MIN_ROWS:
        print(
            f"✗ na {MAX_ROUNDS} pogingen slechts {len(rows)} rijen uit be.STAT — bron "
            f"onbereikbaar of view gewijzigd. Niets weggeschreven (bestaande historie blijft staan).",
            file=sys.stderr,
        )
        return 1

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D2-004.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print(f"✓ {len(rows)} maandcijfers geschreven: {rows[0]['date']} → {rows[-1]['date']}")
    print(f"  prijsbereik: €{min(r['value'] for r in rows)} – €{max(r['value'] for r in rows)}/l")
    print(f"  {out_path}")
    print("  → commit dit bestand; de engine pikt de echte baseline bij de volgende run op.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
