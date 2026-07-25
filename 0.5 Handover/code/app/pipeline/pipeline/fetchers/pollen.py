"""
Pollen-fetcher — totale pollenbelasting boven Brussel.
Doc 03_Laag-4: I-D1-010 — pollenbelasting (domein D1 fysieke leefomgeving).

Bron: Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api).
Open en gratis, geen token. Open-Meteo levert de pollen-velden uit CAMS
(Copernicus Atmosphere Monitoring Service), het Europese referentiemodel
voor pollen-verspreiding.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).

Pollensoorten (korrels/m³): alder_pollen (els), birch_pollen (berk),
grass_pollen (gras), mugwort_pollen (bijvoet), ragweed_pollen (ambrosia).

Waarde = totale pollenbelasting = som van de vijf pollensoorten, gemiddeld
over de recentste beschikbare dag. Hogere waarde = meer pollen in de lucht =
meer hooikoorts-/allergiestress.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

POLLEN_SPECIES = [
    "alder_pollen",
    "birch_pollen",
    "grass_pollen",
    "mugwort_pollen",
    "ragweed_pollen",
]

URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=50.85&longitude=4.35"
    f"&hourly={','.join(POLLEN_SPECIES)}"
    "&timezone=Europe%2FBrussels&forecast_days=1"
)


def _day_mean(values: list) -> float | None:
    """Daggemiddelde van één pollensoort over de uurwaarden (None negeren)."""
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return None
    return sum(nums) / len(nums)


def fetch_pollen(target_date: date) -> FetchResult:
    """Totale pollenbelasting boven Brussel (I-D1-010)."""
    ok, body = safe_request(URL, timeout=20)

    if ok and isinstance(body, dict):
        hourly = body.get("hourly")
        if isinstance(hourly, dict):
            total = 0.0
            covered = 0
            for species in POLLEN_SPECIES:
                mean = _day_mean(hourly.get(species, []) or [])
                if mean is not None:
                    total += mean
                    covered += 1
            # Open-Meteo levert pollen enkel binnen het CAMS-domein (Europa);
            # buiten het seizoen kunnen waarden 0 zijn — dat is een geldige 0,
            # geen ontbrekende data. We accepteren zodra ≥1 soort data gaf.
            if covered > 0:
                source = (
                    f"Open-Meteo Air Quality (CAMS-pollen, {covered}/"
                    f"{len(POLLEN_SPECIES)} soorten; som korrels/m³)"
                )
                cache_put("I-D1-010", total, source, target_date.isoformat())
                return FetchResult(
                    "I-D1-010", total, target_date.isoformat(),
                    simulated=False, source=source,
                    observation_date=target_date.isoformat(),
                )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D1-010")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D1-010", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock. Pollen piekt in de lente (els/berk maart-april,
    # gras mei-juli); fase zo gekozen dat de piek rond april-mei valt.
    value = max(0.0, seasonal_noise(target_date, 35, 60, 20, -1.0))
    return FetchResult(
        "I-D1-010", value, target_date.isoformat(),
        simulated=True,
        source="mock (Open-Meteo pollen onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
    )
