"""
Luchtkwaliteit-fetcher.
Doc 03_Laag-4 §2.1: I-D1-004 — PM2.5, O₃, NO₂ ratio tov WHO 2021.

Bron: Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api).
Open en gratis, geen token, geen registratie. Open-Meteo aggregeert publieke
luchtkwaliteits-data van europese meetnetten (CAMS, EEA), inclusief Brussel/BE.

Composite_AQ = max(PM25/15, O3/100, NO2/25) — ratio tov WHO 2021 grenswaarden.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=50.85&longitude=4.35"
    "&hourly=pm2_5,ozone,nitrogen_dioxide"
    "&timezone=Europe%2FBrussels&forecast_days=1"
)

# WHO 2021 grenswaarden (μg/m³)
WHO_PM25 = 15.0   # 24-hour mean
WHO_O3 = 100.0    # 8-hour daily max
WHO_NO2 = 25.0    # 24-hour mean


def _safe_mean(xs):
    vals = [x for x in xs if isinstance(x, (int, float))]
    return sum(vals) / len(vals) if vals else None


def _safe_max(xs):
    vals = [x for x in xs if isinstance(x, (int, float))]
    return max(vals) if vals else None


def fetch_air_quality(target_date: date) -> FetchResult:
    ok, body = safe_request(URL, timeout=20)
    if ok and isinstance(body, dict):
        try:
            hourly = body.get("hourly", {})
            pm25 = _safe_mean(hourly.get("pm2_5", []))
            o3 = _safe_max(hourly.get("ozone", []))
            no2 = _safe_mean(hourly.get("nitrogen_dioxide", []))
            ratios = []
            if pm25 is not None: ratios.append(pm25 / WHO_PM25)
            if o3 is not None:   ratios.append(o3 / WHO_O3)
            if no2 is not None:  ratios.append(no2 / WHO_NO2)
            if ratios:
                composite_aq = max(ratios)
                return FetchResult(
                    "I-D1-004", composite_aq, target_date.isoformat(),
                    simulated=False, source="Open-Meteo Air Quality (CAMS, EEA-data)",
                )
        except (KeyError, TypeError):
            pass
    ratio = max(0.0, seasonal_noise(target_date, 0.8, 0.3, 0.2, 0.0))
    return FetchResult(
        "I-D1-004", ratio, target_date.isoformat(),
        simulated=True, source="mock (Open-Meteo Air Quality endpoint faalde)",
    )
