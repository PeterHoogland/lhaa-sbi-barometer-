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

START_YEAR = 2018
MIN_DAYS = 60
CHUNK_ATTEMPTS = 4
RATE_DELAY_S = 10


def main() -> int:
    today = date.today()
    merged: dict[str, float] = {}

    for yr in range(START_YEAR, today.year + 1):
        start = date(yr, 1, 1)
        end = date(yr, 12, 31) if yr < today.year else today
        rows = None
        for attempt in range(1, CHUNK_ATTEMPTS + 1):
            rows = gdelt_event_series(start, end)
            if rows:
                break
            print(f"  {yr} poging {attempt}/{CHUNK_ATTEMPTS}: geen data (GDELT rate-limit?), opnieuw…", file=sys.stderr)
            time.sleep(RATE_DELAY_S + attempt * 5)
        if rows:
            for r in rows:
                merged[r["date"]] = r["value"]
            print(f"  {yr}: {len(rows)} dagen", file=sys.stderr)
        else:
            print(f"  {yr}: geen data", file=sys.stderr)
        time.sleep(RATE_DELAY_S)  # rate-limit tussen chunks

    out = [{"date": d, "value": v} for d, v in sorted(merged.items())]
    if len(out) < MIN_DAYS:
        print(f"✗ slechts {len(out)} dagen uit GDELT — niets weggeschreven.", file=sys.stderr)
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
