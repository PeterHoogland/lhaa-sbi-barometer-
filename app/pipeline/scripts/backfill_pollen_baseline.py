"""
Backfill-script: echte 24-maanden-baseline voor de pollen-indicator
(I-D1-010) uit de open-meteo Air-Quality-API (CAMS-pollen).

Schrijft app/data/history/I-D1-010.json — exact dezelfde transformatie als
de dagfetcher (som van 5 pollensoorten, daggemiddelde uit uurwaarden).

Run:  python scripts/backfill_pollen_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.pollen import POLLEN_SPECIES  # noqa: E402
from pipeline.util import safe_request, DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Pollen-backfill Brussel: {start} → {today}", file=sys.stderr)

    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        "?latitude=50.85&longitude=4.35"
        f"&hourly={','.join(POLLEN_SPECIES)}"
        "&timezone=Europe%2FBrussels"
        f"&start_date={start.isoformat()}&end_date={today.isoformat()}"
    )
    ok, body = safe_request(url, timeout=60, retries=2, retry_delay=5)
    if not ok or not isinstance(body, dict):
        print(f"FOUT: air-quality-API onbereikbaar ({body!r:.120}).", file=sys.stderr)
        return 1
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        print("FOUT: geen uurdata in respons.", file=sys.stderr)
        return 1

    # per dag: per soort de uurwaarden verzamelen
    by_day: dict[str, dict[str, list[float]]] = {}
    for sp in POLLEN_SPECIES:
        vals = hourly.get(sp, []) or []
        for t, v in zip(times, vals):
            day = str(t)[:10]
            if isinstance(v, (int, float)):
                by_day.setdefault(day, {}).setdefault(sp, []).append(float(v))

    rows = []
    for day in sorted(by_day):
        species = by_day[day]
        total = 0.0
        for sp in POLLEN_SPECIES:
            vv = species.get(sp)
            if vv:
                total += sum(vv) / len(vv)
        rows.append({"date": day, "value": round(total, 3)})

    if len(rows) < 60:
        print(f"FOUT: te weinig dagen ({len(rows)}).", file=sys.stderr)
        return 1

    out_path = DATA_DIR / "history" / "I-D1-010.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.1f}, "
          f"min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
