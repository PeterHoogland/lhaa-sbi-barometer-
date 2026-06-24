"""
Backfill van pre-2020 "normale tijden"-baselines voor nieuws (I-D5-001) en
Wikipedia-aandacht (I-D5-002), voor de brede absolute meting (§4.1.11-uitbreiding).

SCHAALDISCIPLINE (harde regel 5): hergebruikt EXACT de live-fetcher-functies, dus
identieke maat en bron-schaal:
  - I-D5-001 = GDELT DOC 2.0 timelinetone, negativity = -AvgTone (gdelt_tone_series)
  - I-D5-002 = stress-artikel-aandeel x1e6, 7d-gemiddelde (daily_attention_index)

Lucht (I-D1-004) wordt NIET gebackfilld: de IRCELINE-meetstations hebben geen
diepe historie (2016 leeg), en een andere bron (open-meteo CAMS) mengen met de
IRCELINE-dagwaarde zou een Hitte-bug-schaalbreuk zijn. Eerlijke datagrens.

VEILIG: voegt alleen pre-2020-rijen toe; bestaande recente historie blijft staan.

Run: python3 app/pipeline/scripts/backfill_news_wiki_baselines.py
"""
from __future__ import annotations
import json
import sys
import time
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.gdelt import gdelt_tone_series  # noqa: E402
from pipeline.fetchers.wikipedia import daily_attention_index, trailing_mean_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402

HIST = DATA_DIR / "history"


def merge_into(code: str, new_rows: list[dict]) -> tuple[int, int, int]:
    path = HIST / f"{code}.json"
    existing = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    have = {r["date"] for r in existing}
    added = [r for r in new_rows if r["date"] < "2020-01-01" and r["date"] not in have]
    merged = sorted(existing + added, key=lambda r: r["date"])
    path.write_text(json.dumps(merged, indent=2), encoding="utf-8")
    return len(added), len(existing), len(merged)


def news_rows() -> list[dict]:
    by_date: dict[str, float] = {}
    # GDELT-call levert ~700 dagen; 2015-2019 in jaar-chunks met spacing (rate limit 5s).
    for i, (a, b) in enumerate([("2015-01-01", "2016-12-31"), ("2017-01-01", "2018-12-31"),
                                ("2019-01-01", "2019-12-31")]):
        if i > 0:
            time.sleep(7)
        series = gdelt_tone_series(date.fromisoformat(a), date.fromisoformat(b)) or []
        for pt in series:
            by_date[pt["date"]] = pt["value"]
    return [{"date": d, "value": round(v, 4)} for d, v in sorted(by_date.items())]


def wiki_rows() -> list[dict]:
    # Wikimedia heeft per-artikel data vanaf 2015-07; 2016-2019 als normaal-venster.
    series = daily_attention_index(date(2016, 1, 1), date(2019, 12, 31))
    smoothed = trailing_mean_series(series, window=7)
    return [{"date": r["date"], "value": round(r["value"], 4)} for r in smoothed]


def main() -> int:
    print("nieuws ophalen (GDELT 2015-2019)...", file=sys.stderr, flush=True)
    news = news_rows()
    print("wikipedia ophalen (Wikimedia 2016-2019)...", file=sys.stderr, flush=True)
    wiki = wiki_rows()

    import statistics as st
    for code, rows in (("I-D5-001", news), ("I-D5-002", wiki)):
        if not rows:
            print(f"  {code}: GEEN data (rate-limit/leeg) — overgeslagen", file=sys.stderr)
            continue
        added, kept, total = merge_into(code, rows)
        pre = [r for r in json.loads((HIST / f"{code}.json").read_text()) if r["date"] < "2020-01-01"]
        vals = [r["value"] for r in pre]
        med = st.median(vals) if vals else 0
        print(f"  {code}: +{added} pre-2020, {kept} behouden, totaal {total} "
              f"| pre-2020 n={len(pre)} mediaan={med:.3f} min={min(vals):.3f} max={max(vals):.3f}",
              file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
