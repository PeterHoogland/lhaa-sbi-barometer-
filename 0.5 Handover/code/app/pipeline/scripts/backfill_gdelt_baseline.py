"""
Eenmalig (periodiek te herhalen) backfill-script: haalt de ECHTE 24-maanden
dagelijkse GDELT-nieuwstoon voor Belgie op en schrijft die als
app/data/history/I-D5-001.json.

Dat bestand vervangt de vroegere synthetische sinus-baseline voor de
nieuwsnegativiteits-indicator. De engine (generate-fixture.ts) laadt het en
gebruikt de echte mediaan + MAD als meetlat — zo wordt de dagwaarde tegen
echte historie gewogen op dezelfde schaal.

Eén GDELT-call levert ~700 dagcijfers (~35 KB). Mediaan/MAD over 700 punten
zijn extreem stabiel; het volstaat dit script enkele keren per jaar te
herdraaien om de staart te verversen.

Run:  python scripts/backfill_gdelt_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.gdelt import gdelt_tone_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"GDELT-backfill nieuwstoon BE: {start} → {today}", file=sys.stderr)

    series = gdelt_tone_series(start, today)
    if not series:
        print("FOUT: GDELT gaf geen reeks terug (rate-limit of leeg).", file=sys.stderr)
        return 1

    # dedup op datum, chronologisch
    by_date: dict[str, float] = {}
    for pt in series:
        by_date[pt["date"]] = pt["value"]
    rows = [{"date": d, "value": v} for d, v in sorted(by_date.items())]

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-001.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = [r["value"] for r in rows]
    vals_sorted = sorted(vals)
    median = vals_sorted[len(vals_sorted) // 2]
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan negativiteit ≈ {median:.3f}, "
          f"min {min(vals):.3f} / max {max(vals):.3f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
