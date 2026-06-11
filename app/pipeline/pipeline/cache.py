"""
File-based cache voor laatst-succesvolle fetch-waarden.
Wordt door GitHub Actions workflow gecommit terug naar de repo, zodat
volgende runs een fallback hebben bij API-uitval.

Schema:
{
  "<indicator_code>": {
    "value": float,
    "date": ISO date,
    "source": string,
    "fetched_at": ISO datetime
  }
}

Een cache-entry wordt als "geldig" beschouwd wanneer fetched_at < 14 dagen oud.
Daarna wordt mock-fallback verkozen om geen vertekening te veroorzaken.
"""
from __future__ import annotations
import json
from datetime import datetime, timedelta
from pathlib import Path
from .util import DATA_DIR

CACHE_PATH = DATA_DIR / "sbi-cache.json"
CACHE_TTL = timedelta(days=14)


def _load() -> dict:
    if not CACHE_PATH.exists():
        return {}
    try:
        with open(CACHE_PATH, encoding="utf-8") as f:
            return json.load(f) or {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False, sort_keys=True)


def get(code: str) -> tuple[float, str] | None:
    """Return (value, source) als cache hit, anders None."""
    hit = get_with_date(code)
    if hit is None:
        return None
    value, source, _obs = hit
    return value, source


def get_with_date(code: str) -> tuple[float, str, str] | None:
    """Als get(), maar met de observatiedatum/-periode van de gecachte waarde.

    Een gecachte waarde verwijst naar zijn OORSPRONKELIJKE periode, niet naar de
    dag waarop de cache wordt uitgelezen (review A4: een fetch-fallback mag geen
    verse waarneming suggereren). Oudere cache-entries zonder observation_date
    vallen terug op hun fetch-datum ("date") — dichter bij de waarheid dan vandaag.
    """
    cache = _load()
    entry = cache.get(code)
    if not entry:
        return None
    try:
        fetched_at = datetime.fromisoformat(entry["fetched_at"])
    except (KeyError, ValueError):
        return None
    if datetime.utcnow() - fetched_at > CACHE_TTL:
        return None
    obs = entry.get("observation_date") or entry.get("date", "")
    return entry["value"], entry.get("source", "cache"), obs


def put(code: str, value: float, source: str, target_date: str, observation_date: str | None = None) -> None:
    """Sla succesvolle fetch op (incl. de periode waarnaar de waarde verwijst)."""
    cache = _load()
    cache[code] = {
        "value": value,
        "date": target_date,
        "observation_date": observation_date or target_date,
        "source": source,
        "fetched_at": datetime.utcnow().isoformat(),
    }
    _save(cache)
