"""
Belgisch pollensignaal (I-D1-010-sci) — Sciensano AirAllergy. SECUNDAIR, in opbouw.

Bron: de (ongedocumenteerde maar open, sleutel-vrije) Sciensano AirAllergy-API
`airallergy-api.sciensano.be/api/stationmeasurement`. Echte Belgische metingen
(grains/m³ per soort) van de vijf telstations: Brussel, Genk, De Haan, Marche-en-
Famenne, Baudour. Eén call geeft alle vijf terug.

WAAROM SECUNDAIR (Peter 2026-06-04): er bestaat geen Belgische pollen-API mét
historie — deze geeft alleen de meting van vandaag, dus we kunnen de baseline niet
backfillen. Daarom bouwen we de Belgische meetlat hier VOORUIT op (via
append_to_history). Zodra ze vol is (~60 dagen) kan dit het Europese CAMS-model
(I-D1-010) in het cijfer vervangen. Tot dan blijft CAMS ín het cijfer (eerlijk
gelabeld als EU-model) en stroomt de echte Belgische data hier al binnen.

Detail: een waarde −1 betekent "geen meting" (sentinel) → eruit gefilterd. Soms
rapporteert maar één station (de andere op −1); we nemen het gemiddelde van de
stations die wél meten. Ambrosia wordt door het Belgische net niet gemeten.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

API = "https://airallergy-api.sciensano.be/api/stationmeasurement"
# Eén geldige GUID is verplicht in de URL, maar de API geeft sowieso alle 5 stations.
_ANY_STATION = "0ff00a3c-c4b8-4061-9814-6568347ea42b"  # Brussel


def _station_pollen_total(station: dict) -> float | None:
    """Som van de pollen-categorie-metingen (grains/m³) voor één station, of None
    als het station vandaag niets meet (alle waarden de −1-sentinel)."""
    vals = []
    for m in station.get("measurements", []):
        allergen = m.get("allergen") or {}
        if allergen.get("allergenCategory") != "Pollen":
            continue
        v = m.get("valueInNumber")
        if isinstance(v, (int, float)) and v >= 0:  # −1 = geen meting
            vals.append(v)
    return sum(vals) if vals else None


def fetch_sciensano_pollen(target_date: date) -> FetchResult:
    ok, body = safe_request(
        f"{API}?stationId={_ANY_STATION}&language=nl", timeout=20,
        headers={"User-Agent": "lhaa-sbi-server"},
    )
    if ok and isinstance(body, list) and body:
        totals, latest = [], ""
        for st in body:
            tot = _station_pollen_total(st)
            if tot is not None:
                totals.append(tot)
                md = (st.get("measurementDate") or "")[:10]
                if md > latest:
                    latest = md
        if totals:
            value = round(sum(totals) / len(totals), 1)  # gem. over rapporterende stations
            source = (
                f"Sciensano AirAllergy (Belgisch pollennetwerk, "
                f"{len(totals)}/5 stations, grains/m³)"
            )
            cache_put("I-D1-010-sci", value, source, latest or target_date.isoformat())
            return FetchResult(
                "I-D1-010-sci", value, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=latest or target_date.isoformat(),
            )

    cached = cache_get("I-D1-010-sci")
    if cached:
        cval, prev = cached
        return FetchResult(
            "I-D1-010-sci", cval, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev})",
            observation_date=target_date.isoformat(),
        )

    value = max(0.0, seasonal_noise(target_date, 20.0, 25.0, 10.0, 0.0))
    return FetchResult(
        "I-D1-010-sci", value, target_date.isoformat(),
        simulated=True, source="mock (Sciensano AirAllergy-API onbereikbaar + cache leeg)",
    )
