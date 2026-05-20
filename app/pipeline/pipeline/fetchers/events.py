"""
Collectieve gebeurtenissen — menselijke codering.
Doc 03_Laag-4 §2.5: I-D5-003. Twee onafhankelijke codeurs, κ ≥ 0.75 vereist
voor livegang. Magnitude-niveaus 1/3/5 met 7-daags exponentieel decay.

STATUS: skeleton. Voor MVP wordt event-input gelezen uit een lokaal
JSON-bestand `events.json` (geen open API mogelijk voor deze indicator).
"""
from __future__ import annotations
import json
import math
from datetime import date, datetime
from pathlib import Path
from ..util import FetchResult, ROOT


EVENTS_FILE = ROOT / "pipeline" / "events.json"


def fetch_collective_events(target_date: date) -> FetchResult:
    if not EVENTS_FILE.exists():
        return FetchResult(
            "I-D5-003", 0.0, target_date.isoformat(),
            simulated=True, source="empty events.json — no event input file",
        )

    try:
        with open(EVENTS_FILE, encoding="utf-8") as f:
            events = json.load(f)
    except json.JSONDecodeError:
        return FetchResult(
            "I-D5-003", 0.0, target_date.isoformat(),
            simulated=True, source="invalid events.json",
        )

    # Som van magnitude × exp(-(d - d_event)/3) voor events binnen 7d window
    total = 0.0
    for ev in events:
        ev_date = datetime.fromisoformat(ev["date"]).date()
        delta = (target_date - ev_date).days
        if 0 <= delta <= 7:
            magnitude = ev.get("magnitude", 1)
            total += magnitude * math.exp(-delta / 3)
    return FetchResult(
        "I-D5-003", min(total, 15.0), target_date.isoformat(),
        simulated=False, source="events.json (human-coded)",
    )
