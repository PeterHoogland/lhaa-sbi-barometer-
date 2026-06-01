"""
Backfill-script: bouwt de historie van I-D5-003 (grote collectieve gebeurtenis) uit
GDELT-volume-intensiteit van zware negatieve thema's (oorlog/geweld/ramp/terreur) in
het Belgische nieuws. Schrijft app/data/history/I-D5-003.json.

Waarom: de oude indicator was mensen-gecodeerd → geen historie, niet backfillbaar.
GDELT levert wél een echte, lange (tot ~2017), automatische reeks (zelfde API als de
nieuwstoon #1). Dit herdefinieert I-D5-003 — pre-registratie-amendement (doc 00 §13 A2),
eerlijk gedocumenteerd in de bron-string van de fetcher.

Draait op GitHub's schone netwerk (GDELT rate-limit me lokaal). Chunkt per jaar met
pauzes tegen de rate-limit; schrijft NIETS bij < 60 dagen.

Run:  python scripts/backfill_event_baseline.py
"""
from __future__ import annotations
import json
import sys
import time
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.gdelt import gdelt_event_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402

# Eén GDELT-call over een meerjarige reeks (dekt energiecrisis 2022 + recent),
# zoals de werkende toon-backfill — veel minder rate-limit-hits dan jaar-chunks.
START = date(2021, 1, 1)
MIN_DAYS = 60
ATTEMPTS = 6
RETRY_DELAY_S = 20


def main() -> int:
    rows = None
    for attempt in range(1, ATTEMPTS + 1):
        rows = gdelt_event_series(START, date.today())
        if rows and len(rows) >= MIN_DAYS:
            break
        print(
            f"  poging {attempt}/{ATTEMPTS}: {len(rows or [])} punten — GDELT rate-limit/leeg, opnieuw…",
            file=sys.stderr,
        )
        if attempt < ATTEMPTS:
            time.sleep(RETRY_DELAY_S + attempt * 5)

    out = sorted(rows or [], key=lambda r: r["date"])
    if len(out) < MIN_DAYS:
        print(f"✗ slechts {len(out)} punten uit GDELT — niets weggeschreven.", file=sys.stderr)
        return 1

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-003.json"
    out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    vals = [r["value"] for r in out]
    print(f"✓ {len(out)} dagen geschreven: {out[0]['date']} → {out[-1]['date']}")
    print(f"  intensiteit-bereik: {min(vals)} – {max(vals)}")
    print(f"  {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
