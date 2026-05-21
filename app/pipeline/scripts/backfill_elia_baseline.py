"""
Backfill-script: echte 24-maanden-baseline voor de stroomnet-druk-indicator
(I-D3-009) uit de Elia Open Data (dataset ods001).

Schrijft app/data/history/I-D3-009.json — per dag de geaggregeerde ratio
Σ gemeten belasting / Σ day-ahead-forecast, exact dezelfde transformatie
als de dagfetcher (elia.aggregate_ratio).

Run:  python scripts/backfill_elia_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.elia import aggregate_ratio  # noqa: E402
from pipeline.util import safe_request, DATA_DIR  # noqa: E402

EXPORT_URL = "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods001/exports/json"


def _fetch_block(start: date, end: date) -> list[dict]:
    where = (
        f"datetime>=date'{start.isoformat()}' and "
        f"datetime<date'{end.isoformat()}' and totalload is not null"
    )
    url = (
        f"{EXPORT_URL}?select=datetime,totalload,dayaheadforecast"
        f"&where={where.replace(' ', '%20').replace(chr(39), '%27')}&limit=-1"
    )
    ok, body = safe_request(url, timeout=90, retries=2, retry_delay=5)
    return body if ok and isinstance(body, list) else []


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Elia-backfill stroomnet-druk: {start} → {today}", file=sys.stderr)

    by_day: dict[str, list[dict]] = {}
    block_start = start
    while block_start < today:
        block_end = min(block_start + timedelta(days=90), today)
        recs = _fetch_block(block_start, block_end)
        print(f"  blok {block_start} … {block_end}: {len(recs)} records", file=sys.stderr)
        for rec in recs:
            dt = str(rec.get("datetime", ""))[:10]
            if len(dt) == 10:
                by_day.setdefault(dt, []).append(rec)
        block_start = block_end

    rows = []
    for day in sorted(by_day):
        ratio = aggregate_ratio(by_day[day])
        if ratio is not None:
            rows.append({"date": day, "value": round(ratio, 4)})

    if len(rows) < 60:
        print(f"FOUT: te weinig dagen ({len(rows)}).", file=sys.stderr)
        return 1

    out_path = DATA_DIR / "history" / "I-D3-009.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.4f}, "
          f"min {vals[0]:.4f} / max {vals[-1]:.4f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
