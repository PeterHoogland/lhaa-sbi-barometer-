"""
Backfill-script: echte 24-maanden-baseline voor het wateroverlast-signaal
(I-D1-009) uit de open-meteo Flood API (GloFAS-rivierafvoer).

Schrijft app/data/history/I-D1-009.json — zelfde transformatie als de
dagfetcher (som van de rivierafvoer over 4 Belgische stroomgebieden).

Run:  python scripts/backfill_flood_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.waterinfo import discharge_sum_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Flood-backfill rivierafvoer BE: {start} → {today}", file=sys.stderr)

    series = discharge_sum_series(start, today)
    if len(series) < 60:
        print(f"FOUT: te weinig data ({len(series)} dagen).", file=sys.stderr)
        return 1

    rows = [{"date": d, "value": v} for d, v in series]
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D1-009.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.1f}, "
          f"min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
