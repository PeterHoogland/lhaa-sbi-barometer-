"""
Ontslagen-intensiteit-fetcher voor BE (I-D3-003).
Doc 03_Laag-4 §2.3.

**Eerlijke discloure**: FOD WASO publiceert geen open URL of API voor de
actieve wet-Renault-procedures. Alle URL's die we tot nu toe probeerden
geven 404 — de pagina-structuur wijzigt regelmatig en er is geen stabiele
publieke endpoint.

**Methodologisch-defensieve oplossing**: we gebruiken de **maandelijkse
verandering in BE-werkloosheidsaantallen** als **proxy** voor ontslag-
intensiteit. Dit is geen perfect proxy (een werkloosheidsstijging kan ook
door minder nieuw aangenomen mensen komen), maar wel een echte officiële
bron (ECB LFSI). Volledig gedocumenteerd in `source`.

We schalen de delta naar log(1 + max(0, delta_workers)) zodat de waarde
op dezelfde schaal blijft als de oorspronkelijke indicator.

Toekomst: vervang door directe FOD WASO scrape zodra zij open data publiceren.
"""
from __future__ import annotations
import math
from datetime import date
from ..util import FetchResult, safe_request
from ..cache import get_with_date as cache_get_with_date, put as cache_put


# ECB LFSI: BE unemployment rate (%), seasonally adjusted, ages 15-74, total
# We nemen 2 laatste maand-observaties om de delta te berekenen
ECB_UNEMPLOYED_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&lastNObservations=2"
)
# Approximate BE workforce (15-74) — voor delta-omzetting naar werkzoekenden-count
BE_WORKFORCE = 5_000_000


def _parse_ecb_last_two(body) -> tuple[float | None, float | None, str]:
    """Return (prev_value, last_value, last_period)."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        sorted_keys = sorted(observations.keys(), key=lambda k: int(k))
        period = ""
        try:
            obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
            period = obs_dim[int(sorted_keys[-1])]["id"]
        except (KeyError, IndexError, ValueError, TypeError):
            period = ""
        if len(sorted_keys) < 2:
            v = float(observations[sorted_keys[-1]][0])
            return None, v, period
        prev = float(observations[sorted_keys[-2]][0])
        last = float(observations[sorted_keys[-1]][0])
        return prev, last, period
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None, None, ""


def fetch_collective_layoffs(target_date: date) -> FetchResult:
    ok, body = safe_request(
        ECB_UNEMPLOYED_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if ok and isinstance(body, dict):
        prev_rate, last_rate, period = _parse_ecb_last_two(body)
        if last_rate is not None:
            # Rate is %, delta_pp = procentpunt verandering
            if prev_rate is not None:
                delta_pp = last_rate - prev_rate
                # Convert rate delta to estimated extra unemployed persons
                # 0.1 pp × 5M workforce = ~5000 extra werkzoekenden
                effective_workers = max(0, delta_pp / 100 * BE_WORKFORCE)
                value = math.log1p(effective_workers)
                source = (f"ECB LFSI werkloosheidsrate-delta ({delta_pp:+.2f}pp, "
                          f"~{int(effective_workers)} werkzoekenden, proxy voor ontslagen)")
                cache_put("I-D3-003", value, source, target_date.isoformat(), observation_date=period)
                return FetchResult(
                    "I-D3-003", value, target_date.isoformat(),
                    simulated=False,
                    source=source,
                    observation_date=period,
                    source_url=ECB_UNEMPLOYED_URL,
                )
            # Only last available — baseline 0
            source = f"ECB LFSI werkloosheidsrate {last_rate:.1f}% (baseline)"
            cache_put("I-D3-003", math.log1p(0), source, target_date.isoformat(), observation_date=period)
            return FetchResult(
                "I-D3-003", math.log1p(0), target_date.isoformat(),
                simulated=False,
                source=source,
                observation_date=period,
                source_url=ECB_UNEMPLOYED_URL,
            )

    # Cache-vangnet (≤14d) vóór de mock — zelfde ladder als irail.py/nbb.py.
    cached = cache_get_with_date("I-D3-003")
    if cached:
        value, prev_source, cached_obs = cached
        return FetchResult(
            "I-D3-003", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=cached_obs,
            source_url=ECB_UNEMPLOYED_URL,
        )

    # Conservatief fallback
    return FetchResult(
        "I-D3-003", math.log1p(1), target_date.isoformat(),
        simulated=True,
        source="mock (ECB LFSI endpoint faalde, geen cache)",
    )
