"""
Backfill: schrijft de echte filezwaarte-baseline voor I-D2-001 uit de officiële
jaargemiddelden van het Vlaams Verkeerscentrum. Schrijft app/data/history/I-D2-001.json.

GEEN netwerk. Er bestaat geen publiek machine-leesbare historische filezwaarte-
reeks (webtool is interactief, DATEX realtime, VDV vereist Itsme — bevestigd via
deep-research juni 2026). De jaargemiddelden uit het jaarrapport ZIJN citeerbaar;
die vormen de baseline. We projecteren ze maandelijks (piecewise-constant: elke
maand krijgt het jaargemiddelde van dat jaar) zodat de engine ≥ 60 punten heeft
en de dagwaarde tegen een echte ~12-jaars-verdeling weegt.

Eerlijk gelabeld: dit is een MAAND-projectie van een JAARMAAT, geen gemeten
dagreeks — fijnere data is niet machine-leesbaar beschikbaar. De bron-tabel staat
in pipeline/fetchers/verkeerscentrum.py (ANNUAL_FILEZWAARTE), één bron van waarheid.

Run:  python scripts/backfill_verkeer_baseline.py
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.verkeerscentrum import ANNUAL_FILEZWAARTE  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    rows: list[dict] = []
    for year in sorted(ANNUAL_FILEZWAARTE):
        value = float(ANNUAL_FILEZWAARTE[year])
        for month in range(1, 13):
            rows.append({"date": f"{year}-{month:02d}-01", "value": value})

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D2-001.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print(f"✓ {len(rows)} maandpunten (piecewise-constant jaargemiddelde) geschreven:")
    print(f"  {rows[0]['date']} ({rows[0]['value']}) → {rows[-1]['date']} ({rows[-1]['value']}) km·uur/werkdag")
    print(f"  jaarbereik: {min(ANNUAL_FILEZWAARTE.values())} – {max(ANNUAL_FILEZWAARTE.values())} km·uur/werkdag")
    print(f"  {out_path}")
    print("  → commit dit bestand; de engine pikt de echte baseline bij de volgende run op.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
