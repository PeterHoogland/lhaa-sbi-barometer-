"""
Elia — netstress op het Belgische hoogspanningsnet.
Doc 03_Laag-4: I-D3-009 — netbelasting tov forecast (domein D3 energie/economie).

Bron: Elia Open Data (https://opendata.elia.be/), OpenDataSoft Explore API v2.1.
Open, gratis, geen token. Elia is de Belgische transmissienetbeheerder.

Dataset ods001 = "Measured and forecasted total load on the Belgian grid".
Per kwartier publiceert Elia de gemeten totale belasting (MW) én een
day-ahead-forecast van diezelfde belasting.

Netstress-maat = ratio gemeten / voorspelde belasting voor het recentste
kwartier waarvoor BEIDE waarden bestaan:
  ratio ≈ 1.0  → het net draait zoals gepland
  ratio > 1.0  → meer vraag dan voorspeld → krapper net → meer stress
  ratio < 1.0  → minder vraag dan voorspeld → ruimer net

De OpenDataSoft-veldnamen variëren licht tussen Elia-datasetversies. We
detecteren ze daarom dynamisch: het gemeten veld bevat "measured" of "load"
zonder "forecast"/"most"; het forecast-veld bevat "forecast" of "dayahead".
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

# where=totalload IS NOT NULL filtert toekomstige forecast-rijen weg
# (ods001 bevat ook week-ahead-rijen zonder gemeten belasting).
URL = (
    "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods001/records"
    "?limit=100&order_by=datetime%20desc"
    "&where=totalload%20is%20not%20null"
)


def _is_number(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def aggregate_ratio(records: list) -> float | None:
    """Geaggregeerde ratio Σ gemeten / Σ day-ahead-forecast over alle records.
    Aggregeren i.p.v. één kwartier nemen dempt de kwartier-ruis (≈ dagcijfer).
    Wordt door zowel de dagfetcher als het backfill-script gebruikt."""
    if not isinstance(records, list) or not records:
        return None
    tl_sum = 0.0
    fc_sum = 0.0
    for rec in records:
        if not isinstance(rec, dict):
            continue
        measured = rec.get("totalload")
        # day-ahead is de echte "wat verwachtten we"-prognose; mostrecent als fallback
        forecast = rec.get("dayaheadforecast")
        if not _is_number(forecast) or forecast <= 0:
            forecast = rec.get("mostrecentforecast")
        if _is_number(measured) and _is_number(forecast) and forecast > 0 and measured > 0:
            tl_sum += float(measured)
            fc_sum += float(forecast)
    return tl_sum / fc_sum if fc_sum > 0 else None


def _extract_ratio(body: dict) -> float | None:
    return aggregate_ratio(body.get("results"))


def fetch_grid_stress(target_date: date) -> FetchResult:
    """Netstress = gemeten/voorspelde belasting Belgische net (I-D3-009)."""
    ok, body = safe_request(URL, timeout=25)

    if ok and isinstance(body, dict):
        ratio = _extract_ratio(body)
        if ratio is not None:
            source = "Elia Open Data ods001 (gemeten/forecast totale netbelasting)"
            cache_put("I-D3-009", ratio, source, target_date.isoformat())
            return FetchResult(
                "I-D3-009", ratio, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D3-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock rond 1.0 (forecast doorgaans accuraat, kleine afwijking).
    value = max(0.0, 1.0 + seasonal_noise(target_date, 0.0, 0.03, 0.05, 0.0))
    return FetchResult(
        "I-D3-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (Elia Open Data onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
        error=body if not ok else None,
    )
