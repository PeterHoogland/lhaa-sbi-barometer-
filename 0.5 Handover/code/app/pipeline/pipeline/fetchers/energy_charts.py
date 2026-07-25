"""
Energy-Charts.info — Belgische day-ahead elektriciteitsprijs.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Bron: api.energy-charts.info (Fraunhofer ISE, Belgische BZN-data).
Open, geen token, CC BY 4.0. Voedt zich met ENTSO-E + Bundesnetzagentur.

We nemen het gemiddelde van de uurprijzen van de recentste beschikbare dag.

Bron-ladder (Energy-Charts kan tijdelijk 503'en):
  1. Energy-Charts plain endpoint (laatste dagen, lichte respons)
  2. Energy-Charts dated endpoint (vandaag/gisteren)
  3. cache (laatst succesvolle waarde)
  4. laatst bekende echte prijs uit data/history/I-D3-002.json
  5. mock
Stap 4 zorgt dat de indicator een ECHTE prijs toont, ook bij API-uitval.
"""
from __future__ import annotations
import json
from datetime import date, datetime, timedelta, timezone
from ..util import FetchResult, safe_request, seasonal_noise, DATA_DIR
from ..cache import get as cache_get, put as cache_put

_PLAIN_URL = "https://api.energy-charts.info/price?bzn=BE"
_SOURCE = "Energy-Charts (Fraunhofer ISE, BE day-ahead)"


def _day_mean_from_plain() -> tuple[float, str] | None:
    """Gemiddelde uurprijs van de recentste volledige dag uit het plain endpoint."""
    ok, body = safe_request(_PLAIN_URL, timeout=25, retries=2, retry_delay=5)
    if not ok or not isinstance(body, dict):
        return None
    prices = body.get("price") or []
    stamps = body.get("unix_seconds") or []
    by_day: dict[str, list[float]] = {}
    for p, ts in zip(prices, stamps):
        if not isinstance(p, (int, float)) or not isinstance(ts, (int, float)):
            continue
        d = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        by_day.setdefault(d, []).append(float(p))
    if not by_day:
        return None
    latest = max(by_day)
    vals = by_day[latest]
    return sum(vals) / len(vals), latest


def _day_mean_dated(d: date) -> float | None:
    url = (
        f"https://api.energy-charts.info/price?bzn=BE"
        f"&start={d.isoformat()}&end={(d + timedelta(days=1)).isoformat()}"
    )
    ok, body = safe_request(url, timeout=20)
    if not ok or not isinstance(body, dict):
        return None
    valid = [p for p in (body.get("price") or []) if isinstance(p, (int, float))]
    return sum(valid) / len(valid) if valid else None


def _last_known_from_history() -> tuple[float, str] | None:
    """Laatst bekende echte prijs uit het baseline-historiebestand."""
    path = DATA_DIR / "history" / "I-D3-002.json"
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(rows, list) and rows:
            last = rows[-1]
            return float(last["value"]), str(last.get("date", ""))
    except (OSError, ValueError, KeyError, TypeError):
        pass
    return None


def fetch_energy_prices(target_date: date) -> FetchResult:
    # 1) Plain endpoint — recentste dag
    plain = _day_mean_from_plain()
    if plain is not None:
        value, obs = plain
        cache_put("I-D3-002", value, _SOURCE, obs)
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False, source=_SOURCE, observation_date=obs,
        )

    # 2) Dated endpoint — vandaag, dan gisteren
    for delta in (0, 1):
        d = target_date - timedelta(days=delta)
        val = _day_mean_dated(d)
        if val is not None:
            cache_put("I-D3-002", val, _SOURCE, d.isoformat())
            return FetchResult(
                "I-D3-002", val, target_date.isoformat(),
                simulated=False, source=_SOURCE, observation_date=d.isoformat(),
            )

    # 3) Cache
    cached = cache_get("I-D3-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 4) Laatst bekende echte prijs uit de historie — nog steeds echte data
    hist = _last_known_from_history()
    if hist is not None:
        value, obs = hist
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False,
            source=f"laatst bekende prijs uit historie ({_SOURCE})",
            observation_date=obs,
        )

    # 5) Mock — alleen als zelfs de historie ontbreekt
    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (Energy-Charts + cache + historie alle leeg)",
    )
