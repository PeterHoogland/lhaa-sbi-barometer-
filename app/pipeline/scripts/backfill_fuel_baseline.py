"""
Eenmalig (periodiek te herhalen) backfill-script: haalt de volledige dag-historie
van Benzine 95 E10 (€/l) uit de be.STAT-view (FOD Economie / Statbel) en schrijft
die als app/data/history/I-D2-004.json.

Waarom: I-D2-004 (brandstof) had tot nu te weinig eigen historie en werd daardoor
uit het v0.4-kern-composiet gehouden (synthetische baseline = valse z-scores).
Met deze echte baseline telt brandstof wél mee.

LET OP — draai dit op een SCHOON netwerk (geen TLS-onderscheppende proxy). De
be.STAT-view is traag/groot (~60s). Het script schrijft NIETS weg als het minder
dan 30 dagcijfers terugkrijgt — dan klopt er iets niet met de bron en houden we
de bestaande (forward-geaccumuleerde) historie.

Run:  python scripts/backfill_fuel_baseline.py
"""
from __future__ import annotations
import json
import sys
import time
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.fod_economie import bestat_fuel_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402

# be.STAT is traag/groot — blijf doorproberen tot we een volwaardige reeks hebben.
MAX_ROUNDS = 6
ROUND_DELAY_S = 15


def main() -> int:
    rows: list[dict] = []
    for attempt in range(1, MAX_ROUNDS + 1):
        rows = bestat_fuel_series()
        if len(rows) >= 30:
            break
        print(
            f"  poging {attempt}/{MAX_ROUNDS}: {len(rows)} rijen — be.STAT traag/onbereikbaar, opnieuw…",
            file=sys.stderr,
        )
        if attempt < MAX_ROUNDS:
            time.sleep(ROUND_DELAY_S)

    if len(rows) < 30:
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

    print(f"✓ {len(rows)} dagcijfers geschreven: {rows[0]['date']} → {rows[-1]['date']}")
    print(f"  prijsbereik: €{min(r['value'] for r in rows)} – €{max(r['value'] for r in rows)}/l")
    print(f"  {out_path}")
    print("  → commit dit bestand; de engine pikt de echte baseline bij de volgende run op.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
