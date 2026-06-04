"""
KMI/RMI weer-data fetcher.
Doc 03_Laag-4 §2.1: I-D1-002 Hitte, I-D1-003 Kou.

Bron: open-meteo.com — gratis proxy voor Belgisch weer dat de KMI-data
voedt (geen API-key nodig). Vervangt directe KMI-toegang waar die
registratie vereist.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request

# Brussel (doc 03 §1.2)
_LAT, _LON = 50.85, 4.35
# MET Norway vereist een beschrijvende, identificeerbare User-Agent (hun ToS).
_MET_NO_UA = "lhaa-sbi-barometer/1.0 github.com/PeterHoogland (peter@hoogland.be)"


def _heat_cold(tmax: float, tmin: float) -> tuple[float, float]:
    """De gescoorde grootheden: Heat_excess = max(0, Tmax−30) en Cold_excess =
    max(0, −5−Tmin) (doc 03 §2.1). ALTIJD op deze delta-schaal, exact zoals de baseline,
    ongeacht welke bron de temperatuur leverde."""
    return max(0.0, tmax - 30.0), max(0.0, -5.0 - tmin)


def _open_meteo_extremes(target_date: date) -> tuple[float, float] | None:
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={_LAT}&longitude={_LON}"
        "&daily=temperature_2m_max,temperature_2m_min"
        f"&start_date={target_date.isoformat()}&end_date={target_date.isoformat()}"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url)
    if ok and isinstance(body, dict):
        try:
            tmax = body["daily"]["temperature_2m_max"][0]
            tmin = body["daily"]["temperature_2m_min"][0]
            if tmax is not None and tmin is not None:
                return float(tmax), float(tmin)
        except (KeyError, IndexError, TypeError):
            pass
    return None


def _met_no_extremes(target_date: date) -> tuple[float, float] | None:
    """Onafhankelijke fallback: MET Norway / Yr (api.met.no) — gratis, geen sleutel,
    ANDERE infrastructuur dan open-meteo (zelden tegelijk plat). Leidt Tmax/Tmin af uit
    de uurlijkse temperaturen van vandaag."""
    url = f"https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={_LAT}&lon={_LON}"
    ok, body = safe_request(url, headers={"User-Agent": _MET_NO_UA})
    if not (ok and isinstance(body, dict)):
        return None
    try:
        series = body["properties"]["timeseries"]
    except (KeyError, TypeError):
        return None
    day = target_date.isoformat()
    temps: list[float] = []
    for pt in series:
        if str(pt.get("time", "")).startswith(day):
            try:
                temps.append(float(pt["data"]["instant"]["details"]["air_temperature"]))
            except (KeyError, TypeError, ValueError):
                continue
    if len(temps) < 2:
        return None
    return max(temps), min(temps)


def fetch_temperature_extremes(target_date: date) -> tuple[FetchResult, FetchResult]:
    """Hitte-/koude-overschrijding voor Brussel. open-meteo is recurrent flaky (502),
    dus bij uitval grijpen we METEEN naar een tweede, ONAFHANKELIJKE echte bron
    (MET Norway) vóór we op een neutrale waarde terugvallen. Zo blijft het weer ECHT,
    ook als open-meteo plat ligt."""
    for provider, label in (
        (_open_meteo_extremes, "open-meteo (KMI proxy)"),
        (_met_no_extremes, "MET Norway / Yr (fallback, echte meting)"),
    ):
        res = provider(target_date)
        if res is not None:
            tmax, tmin = res
            heat, cold = _heat_cold(tmax, tmin)
            return (
                FetchResult("I-D1-002", heat, target_date.isoformat(), simulated=False, source=label),
                FetchResult("I-D1-003", cold, target_date.isoformat(), simulated=False, source=label),
            )

    # Beide echte bronnen plat (zeldzaam) → neutrale waarde 0 = "geen overschrijding", op
    # DEZELFDE delta-schaal als de baseline. simulated=True zodat de canary het meldt; de
    # engine vervangt dit sowieso door zijn eigen delta-geschaalde fallback.
    return (
        FetchResult("I-D1-002", 0.0, target_date.isoformat(), simulated=True,
                    source="mock (KMI fallback, beide weerbronnen plat)"),
        FetchResult("I-D1-003", 0.0, target_date.isoformat(), simulated=True,
                    source="mock (KMI fallback, beide weerbronnen plat)"),
    )
