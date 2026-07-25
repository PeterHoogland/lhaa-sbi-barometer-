"""
Backfill-script: haalt ~24 maanden Wikipedia-pageviews voor de stress-
artikelset op en schrijft die als app/data/history/I-D5-002.json.

Dat bestand geeft de zoekinteresse-indicator (I-D5-002) een ECHTE
24-maanden-baseline, op exact dezelfde schaal als de dagwaarde
(voortschrijdend 7d-gemiddelde van gesommeerde weergaven).

Baseline-venster: ~11 maanden (340 dagen). Wikipedia-aandachts-indexen
kennen structurele drift (artikels winnen of verliezen relatief verkeer
over jaren). Een venster van ~24 maanden zou de meetlat scheeftrekken naar
een verouderd regime; ~11 maanden volgt het recente niveau beter en houdt
toch ruim voldoende datapunten voor een robuuste mediaan + MAD.
Periodiek herdraaien volstaat.

Run:  python scripts/backfill_wikipedia_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.wikipedia import daily_attention_index, trailing_mean_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=340)
    print(f"Wikipedia-backfill zoekinteresse: {start} → {today}", file=sys.stderr)

    index = daily_attention_index(start, today)
    if len(index) < 60:
        print(f"FOUT: te weinig data ({len(index)} dagen).", file=sys.stderr)
        return 1

    series = trailing_mean_series(index, window=7)
    # de eerste 6 dagen hebben een onvolledig venster — laat ze weg
    series = series[6:]

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-002.json"
    out_path.write_text(json.dumps(series, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in series)
    median = vals[len(vals) // 2]
    print(f"✓ {len(series)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {series[0]['date']} … {series[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {median:.1f}, min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
