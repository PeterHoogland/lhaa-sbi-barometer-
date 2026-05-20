"""Pipeline-helpers: datum-conversie, mock-data, output-writing."""
from __future__ import annotations
import json
import math
import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
WEB_PUBLIC = ROOT / "web" / "public" / "data"


@dataclass
class FetchResult:
    """Eén indicator-fetch — succes of mock-fallback."""
    code: str
    value: float
    date: str
    simulated: bool = False
    imputed: bool = False
    source: str = ""
    error: str | None = None


@dataclass
class FetchBatch:
    """Bundel van fetch-resultaten voor één datum."""
    target_date: str
    results: list[FetchResult] = field(default_factory=list)

    def add(self, r: FetchResult) -> None:
        self.results.append(r)

    @property
    def simulated_codes(self) -> list[str]:
        return [r.code for r in self.results if r.simulated]

    @property
    def imputed_codes(self) -> list[str]:
        return [r.code for r in self.results if r.imputed]

    def to_dict(self) -> dict:
        return {
            "target_date": self.target_date,
            "results": [r.__dict__ for r in self.results],
            "simulated_codes": self.simulated_codes,
            "imputed_codes": self.imputed_codes,
        }


def daterange(start: date, end: date) -> Iterable[date]:
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def iso(d: date) -> str:
    return d.isoformat()


def seasonal_noise(d: date, baseline: float, seasonal_amp: float, noise: float, phase: float = 0.0) -> float:
    """Synthetische dag-waarde met seizoenscomponent + ruis — voor mock-fallback."""
    doy = d.timetuple().tm_yday
    progression = 2 * math.pi * doy / 365.0 + phase
    return baseline + seasonal_amp * math.sin(progression) + random.uniform(-noise, noise)


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False, default=str)


def safe_request(
    url: str,
    timeout: int = 15,
    headers: dict | None = None,
    retries: int = 2,
    retry_delay: float = 3.0,
) -> tuple[bool, str | dict | None]:
    """HTTP-GET met fail-safe + auto-retry voor transient failures.

    Parseert JSON wanneer:
      - content-type bevat 'json' (vangt application/json, application/vnd.sdmx.data+json, etc.)
      - of body lijkt op JSON (begint met { of [)
    """
    try:
        import requests
        import json as _json
        import time as _time
    except ImportError:
        return False, "requests not installed"

    last_err = "no attempts"
    for attempt in range(retries + 1):
        if attempt > 0:
            _time.sleep(retry_delay * attempt)
        try:
            r = requests.get(url, timeout=timeout, headers=headers or {})
            r.raise_for_status()
            ct = r.headers.get("content-type", "").lower()
            if "json" in ct:
                try:
                    return True, r.json()
                except _json.JSONDecodeError:
                    return True, r.text
            text = r.text
            stripped = text.lstrip()
            if stripped.startswith(("{", "[")):
                try:
                    return True, _json.loads(text)
                except _json.JSONDecodeError:
                    pass
            return True, text
        except Exception as e:  # noqa: BLE001
            last_err = str(e)
            continue
    return False, last_err
