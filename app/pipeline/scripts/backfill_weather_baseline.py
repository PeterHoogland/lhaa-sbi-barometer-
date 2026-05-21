"""
Backfill-script: haalt ~24 maanden ECHTE dagelijkse weer- en luchtkwaliteits-
data voor Brussel op en schrijft die als drie historiebestanden:

  app/data/history/I-D1-002.json  (Hitte)
  app/data/history/I-D1-003.json  (Kou)
  app/data/history/I-D1-004.json  (Luchtkwaliteit, ratio tov WHO 2021)

Die bestanden vervangen de SYNTHETISCHE sinus-baseline die de engine
(generate-fixture.ts) anders voor deze drie indicatoren gebruikt. Met een
echte historie wordt de dagwaarde tegen een echte mediaan + MAD gewogen.

KRITISCH — schaal-overeenkomst:
De historische waarde MOET op exact dezelfde schaal staan als wat de live
fetchers (pipeline/fetchers/kmi.py en irceline.py) vandaag produceren,
anders is de Z-score onzin. Daarom past dit script EXACT dezelfde
transformaties toe:

  I-D1-002 Hitte  = max(0, Tmax - 30)            — graden boven 30 °C
  I-D1-003 Kou    = max(0, -5 - Tmin)            — graden onder -5 °C
  I-D1-004 AQ     = max(PM25/15, O3/100, NO2/25) — ratio tov WHO 2021

De live luchtkwaliteits-fetcher rekent op UUR-data: PM2.5 en NO2 als
dag-GEMIDDELDE, O3 als dag-MAXIMUM. Dit script repliceert dat door de
open-meteo air-quality-archief-API met uur-velden te bevragen en per dag
te aggregeren op exact dezelfde manier.

Bronnen (open, gratis, geen token):
  - Weer:            https://archive-api.open-meteo.com/v1/archive
  - Luchtkwaliteit:  https://air-quality-api.open-meteo.com/v1/air-quality
                     (met start_date/end_date — archief-modus)

Run:  python scripts/backfill_weather_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.util import DATA_DIR, safe_request  # noqa: E402

# Brussel — identiek aan de live fetchers (doc 03 §1.2)
LAT = 50.85
LON = 4.35

# WHO 2021 grenswaarden (μg/m³) — identiek aan irceline.py
WHO_PM25 = 15.0   # 24-hour mean
WHO_O3 = 100.0    # 8-hour daily max (hier dag-max van uurwaarden, zoals de fetcher)
WHO_NO2 = 25.0    # 24-hour mean

# Aantal dagen historie. open-meteo-archief loopt enkele dagen achter op
# 'vandaag'; we vragen tot 5 dagen terug en gaan ~755 dagen verder terug.
HISTORY_DAYS = 755
ARCHIVE_LAG_DAYS = 5


# ── transformaties: EXACT gelijk aan de live fetchers ──────────────────────

def heat_excess(tmax: float | None) -> float | None:
    """I-D1-002 — kmi.py: max(0.0, tmax - 30)."""
    if tmax is None:
        return None
    return max(0.0, tmax - 30)


def cold_excess(tmin: float | None) -> float | None:
    """I-D1-003 — kmi.py: max(0.0, -5 - tmin)."""
    if tmin is None:
        return None
    return max(0.0, -5 - tmin)


def composite_aq(pm25: float | None, o3: float | None, no2: float | None) -> float | None:
    """I-D1-004 — irceline.py: max(PM25/15, O3/100, NO2/25)."""
    ratios = []
    if pm25 is not None:
        ratios.append(pm25 / WHO_PM25)
    if o3 is not None:
        ratios.append(o3 / WHO_O3)
    if no2 is not None:
        ratios.append(no2 / WHO_NO2)
    return max(ratios) if ratios else None


# ── hulp ───────────────────────────────────────────────────────────────────

def _safe_mean(xs):
    """Identiek aan irceline._safe_mean."""
    vals = [x for x in xs if isinstance(x, (int, float))]
    return sum(vals) / len(vals) if vals else None


def _safe_max(xs):
    """Identiek aan irceline._safe_max."""
    vals = [x for x in xs if isinstance(x, (int, float))]
    return max(vals) if vals else None


def _round(v: float) -> float:
    return round(v, 4)


# ── fetchers (archief) ──────────────────────────────────────────────────────

def fetch_weather(start: date, end: date) -> dict[str, dict[str, float]]:
    """Dagelijkse Tmax/Tmin uit het open-meteo weer-archief.

    Geeft {YYYY-MM-DD: {"tmax": ..., "tmin": ...}}.
    """
    url = (
        "https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={LAT}&longitude={LON}"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
        "&daily=temperature_2m_max,temperature_2m_min"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url, timeout=60)
    if not ok or not isinstance(body, dict):
        raise RuntimeError(f"weer-archief faalde: {body}")
    daily = body.get("daily", {})
    times = daily.get("time", [])
    tmaxs = daily.get("temperature_2m_max", [])
    tmins = daily.get("temperature_2m_min", [])
    out: dict[str, dict[str, float]] = {}
    for i, d in enumerate(times):
        out[d] = {
            "tmax": tmaxs[i] if i < len(tmaxs) else None,
            "tmin": tmins[i] if i < len(tmins) else None,
        }
    return out


def fetch_air_quality(start: date, end: date) -> dict[str, float]:
    """Dagelijkse Composite_AQ uit het open-meteo air-quality-archief.

    Bevraagt UUR-data en aggregeert per dag EXACT zoals de live fetcher:
    PM2.5 en NO2 → dag-gemiddelde, O3 → dag-maximum.

    Geeft {YYYY-MM-DD: composite_aq}.
    """
    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={LAT}&longitude={LON}"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
        "&hourly=pm2_5,ozone,nitrogen_dioxide"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url, timeout=90)
    if not ok or not isinstance(body, dict):
        raise RuntimeError(f"air-quality-archief faalde: {body}")
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    pm = hourly.get("pm2_5", [])
    o3 = hourly.get("ozone", [])
    no2 = hourly.get("nitrogen_dioxide", [])

    # bundel uurwaarden per dag (datum-prefix van de ISO-tijdstring)
    by_day: dict[str, dict[str, list]] = {}
    for i, t in enumerate(times):
        day = t[:10]
        b = by_day.setdefault(day, {"pm": [], "o3": [], "no2": []})
        if i < len(pm):
            b["pm"].append(pm[i])
        if i < len(o3):
            b["o3"].append(o3[i])
        if i < len(no2):
            b["no2"].append(no2[i])

    out: dict[str, float] = {}
    for day, b in by_day.items():
        # zelfde aggregatie als irceline.fetch_air_quality
        pm25_d = _safe_mean(b["pm"])
        o3_d = _safe_max(b["o3"])
        no2_d = _safe_mean(b["no2"])
        aq = composite_aq(pm25_d, o3_d, no2_d)
        if aq is not None:
            out[day] = aq
    return out


def _write(code: str, rows: list[dict]) -> Path:
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{code}.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return out_path


def _report(code: str, label: str, rows: list[dict]) -> None:
    vals = sorted(r["value"] for r in rows)
    median = vals[len(vals) // 2]
    print(
        f"  {code} ({label}): {len(rows)} dagen, "
        f"{rows[0]['date']} … {rows[-1]['date']} | "
        f"min {vals[0]:.4f} / mediaan {median:.4f} / max {vals[-1]:.4f}",
        file=sys.stderr,
    )


def main() -> int:
    end = date.today() - timedelta(days=ARCHIVE_LAG_DAYS)
    start = end - timedelta(days=HISTORY_DAYS)
    print(
        f"Weer-/AQ-backfill Brussel: {start} → {end} (~{HISTORY_DAYS} dagen)",
        file=sys.stderr,
    )

    # ── weer → I-D1-002 (hitte), I-D1-003 (kou) ──
    weather = fetch_weather(start, end)
    heat_rows: list[dict] = []
    cold_rows: list[dict] = []
    for d in sorted(weather.keys()):
        rec = weather[d]
        h = heat_excess(rec.get("tmax"))
        c = cold_excess(rec.get("tmin"))
        if h is not None:
            heat_rows.append({"date": d, "value": _round(h)})
        if c is not None:
            cold_rows.append({"date": d, "value": _round(c)})

    # ── luchtkwaliteit → I-D1-004 ──
    aq = fetch_air_quality(start, end)
    aq_rows = [{"date": d, "value": _round(aq[d])} for d in sorted(aq.keys())]

    if len(heat_rows) < 60 or len(cold_rows) < 60 or len(aq_rows) < 60:
        print(
            f"FOUT: te weinig data (hitte {len(heat_rows)}, kou {len(cold_rows)}, "
            f"AQ {len(aq_rows)}).",
            file=sys.stderr,
        )
        return 1

    p1 = _write("I-D1-002", heat_rows)
    p2 = _write("I-D1-003", cold_rows)
    p3 = _write("I-D1-004", aq_rows)

    print(f"✓ geschreven: {p1}", file=sys.stderr)
    print(f"✓ geschreven: {p2}", file=sys.stderr)
    print(f"✓ geschreven: {p3}", file=sys.stderr)
    _report("I-D1-002", "Hitte = max(0,Tmax-30)", heat_rows)
    _report("I-D1-003", "Kou = max(0,-5-Tmin)", cold_rows)
    _report("I-D1-004", "AQ = max(PM25/15,O3/100,NO2/25)", aq_rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
