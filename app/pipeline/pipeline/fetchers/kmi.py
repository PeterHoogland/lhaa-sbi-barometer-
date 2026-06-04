"""
KMI/RMI weer-data fetcher.
Doc 03_Laag-4 §2.1: I-D1-002 Hitte, I-D1-003 Kou.

Bron: open-meteo.com — gratis proxy voor Belgisch weer dat de KMI-data
voedt (geen API-key nodig). Vervangt directe KMI-toegang waar die
registratie vereist.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request

# Brussel (doc 03 §1.2)
_LAT, _LON = 50.85, 4.35
# KMI/RMI synop-station Ukkel (volledig Belgische primaire bron, opendata.meteo.be).
_KMI_BE_STATION = "6447"
# MET Norway vereist een beschrijvende, identificeerbare User-Agent (hun ToS).
_MET_NO_UA = "lhaa-sbi-barometer/1.0 github.com/PeterHoogland (peter@hoogland.be)"


def _kmi_be_extremes(target_date: date) -> tuple[float, float] | None:
    """PRIMAIRE, volledig Belgische bron: KMI/RMI synop via de open WFS van
    opendata.meteo.be (gratis, geen sleutel, geen registratie). Station Ukkel (6447).
    Tmax/Tmin uit de uurlijkse temp-metingen van vandaag (de vorige dag wordt meegevraagd
    zodat een vroege-ochtend-run toch een nachtminimum heeft; we filteren op vandaag)."""
    day = target_date.isoformat()
    since = (target_date - timedelta(days=1)).isoformat()
    url = (
        "https://opendata.meteo.be/service/wfs?service=WFS&version=2.0.0"
        "&request=GetFeature&typeNames=synop:synop_data&outputFormat=application/json"
        "&sortBy=timestamp+D&count=200"
        f"&cql_filter=code%3D{_KMI_BE_STATION}%20AND%20timestamp%20AFTER%20{since}T00:00:00Z"
    )
    ok, body = safe_request(url, timeout=25)
    if not (ok and isinstance(body, dict)):
        return None
    temps: list[float] = []
    for f in body.get("features", []):
        p = f.get("properties", {})
        if str(p.get("timestamp", "")).startswith(day):
            t = p.get("temp")
            if isinstance(t, (int, float)):
                temps.append(float(t))
    if len(temps) < 2:
        return None
    return max(temps), min(temps)


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
    """Hitte-/koude-overschrijding voor Brussel, met een keten van ECHTE bronnen op
    dezelfde delta-schaal: (1) KMI/RMI synop Ukkel = de volledig Belgische primaire bron
    (opendata.meteo.be, geen sleutel); (2) open-meteo; (3) MET Norway / Yr. Valt de ene
    weg (open-meteo is recurrent flaky, 502), dan grijpen we METEEN naar de volgende.
    Pas als ze ALLE drie plat liggen → een neutrale 0. Zo blijft het weer echt en
    Belgisch-eerst, ook bij een bronstoring."""
    for provider, label in (
        (_kmi_be_extremes, "KMI/RMI synop Ukkel (opendata.meteo.be, Belgisch)"),
        (_open_meteo_extremes, "open-meteo (KMI proxy, fallback)"),
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
