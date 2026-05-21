"""
Backfill-script voor de vijf macro-economische indicatoren. Haalt de ECHTE
historische reeksen op en schrijft per indicator app/data/history/{code}.json.

Tot nu toe draaiden deze indicatoren op een SYNTHETISCHE (sinus + ruis)
baseline in generate-fixture.ts. Daardoor werd de dagwaarde tegen een verzonnen
meetlat gewogen en was de stress-score vervalst. Dit script vervangt die
baseline door echte historie op exact dezelfde schaal als de dagwaarde.

Indicatoren en bronnen
----------------------
- I-D3-001  CPI / inflatie (yoy %)        ECB SDW ICP   — MAANDdata
- I-D3-002  Energieprijs (€/MWh)          Energy-Charts — DAGdata
- I-D3-005  Werkloosheid (%)              ECB SDW LFSI  — MAANDdata
- I-D3-006  Hypotheekrente (%)            ECB SDW MIR   — MAANDdata
- I-D3-003  Ontslagen-proxy (log1p)       ECB SDW LFSI  — MAANDdata (delta)

SCHAAL-DISCIPLINE
-----------------
Elke historische observatie krijgt EXACT dezelfde transformatie als de
bijhorende fetcher vandaag toepast:
- CPI / werkloosheid / hypotheekrente: de ECB-waarde wordt rechtstreeks
  gebruikt (geen eenheid-transformatie — de fetchers nemen `float(obs)` puur).
- Ontslagen-proxy: de fetcher neemt de maand-op-maand-delta van de BE-
  werkloosheidsRATE (procentpunt), zet die om naar geschatte extra
  werkzoekenden via `delta_pp / 100 * BE_WORKFORCE` en past dan
  `log1p(max(0, ...))` toe. Dit script repliceert die keten op de volledige
  LFSI-reeks: punt n krijgt waarde = log1p(max(0, (rate[n]-rate[n-1])/100*5e6)).

De engine (generate-fixture.ts → loadRealHistory) laadt deze bestanden en
gebruikt mediaan + MAD als robuuste meetlat. Hij heeft >=60 punten nodig om de
echte baseline te activeren; we leveren ruim meer (maanddata ~10 jaar,
energie-dagdata ~24 maanden).

Run:  python scripts/backfill_macro_baseline.py
"""
from __future__ import annotations
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.util import DATA_DIR, safe_request  # noqa: E402

# BE-beroepsbevolking (15-74) — identiek aan fod_waso.BE_WORKFORCE.
# Gebruikt om de werkloosheidsRATE-delta om te zetten naar werkzoekenden-count.
BE_WORKFORCE = 5_000_000

# --- ECB SDW endpoints met volledige reeks (geen lastNObservations-limiet) ---
# Zelfde series-keys als de fetchers; alleen het observatie-venster verschilt.
ECB_CPI_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.000000.4.ANR"
    "?format=jsondata&startPeriod=2008-01"
)
ECB_UNEMPLOYMENT_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&startPeriod=2008-01"
)
ECB_MORTGAGE_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/MIR/M.BE.B.A2C.A.R.A.2250.EUR.N"
    "?format=jsondata&startPeriod=2008-01"
)


def _parse_ecb_series(body) -> list[tuple[str, float]]:
    """Parse een volledige ECB SDW jsondata-reeks.

    Geeft een chronologisch gesorteerde lijst (period, value) terug, waarbij
    period het ECB-id is (bv. '2026-04' voor maanddata). Repliceert de
    indexering die _parse_ecb_latest_with_period in statbel.py gebruikt:
    de observatie-sleutel is een integer-index in de observation-dimensie.
    """
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
    except (KeyError, IndexError, StopIteration, TypeError):
        return []

    try:
        obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
        period_for = {i: obs_dim[i]["id"] for i in range(len(obs_dim))}
    except (KeyError, IndexError, TypeError):
        period_for = {}

    rows: list[tuple[str, float]] = []
    for key, obs in observations.items():
        try:
            idx = int(key)
            val = obs[0]
        except (ValueError, IndexError, TypeError):
            continue
        if val is None:
            continue
        period = period_for.get(idx, "")
        if not period:
            continue
        try:
            rows.append((period, float(val)))
        except (ValueError, TypeError):
            continue
    rows.sort(key=lambda r: r[0])
    return rows


def _month_to_date(period: str) -> str:
    """ECB-maandperiode 'YYYY-MM' → 'YYYY-MM-01'. Daterange-id's worden ongemoeid gelaten."""
    if len(period) == 7 and period[4] == "-":
        return f"{period}-01"
    return period


def _fetch_ecb_history(url: str, label: str) -> list[tuple[str, float]]:
    print(f"  {label}: GET {url}", file=sys.stderr)
    ok, body = safe_request(url, timeout=30, headers={"Accept": "application/json"})
    if not ok or not isinstance(body, dict):
        print(f"  FOUT: ECB-call faalde voor {label} ({body!r:.120})", file=sys.stderr)
        return []
    rows = _parse_ecb_series(body)
    if not rows:
        print(f"  FOUT: geen observaties in ECB-respons voor {label}.", file=sys.stderr)
    return rows


def _write_history(code: str, rows: list[dict]) -> int:
    """Schrijf rows naar app/data/history/{code}.json en log min/mediaan/max."""
    if len(rows) < 30:
        print(f"  WAARSCHUWING {code}: slechts {len(rows)} punten "
              f"(<30 — engine gebruikt deze baseline niet).", file=sys.stderr)
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{code}.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    median = vals[len(vals) // 2]
    print(f"  OK {code}: {len(rows)} punten → {out_path}", file=sys.stderr)
    print(f"     bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"     min {vals[0]:.4f} / mediaan {median:.4f} / max {vals[-1]:.4f}",
          file=sys.stderr)
    return len(rows)


def backfill_cpi() -> int:
    """I-D3-001 — ECB ICP BE HICP yoy %. Raw value, geen transformatie."""
    rows = _fetch_ecb_history(ECB_CPI_HISTORY_URL, "I-D3-001 CPI")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-001", out)


def backfill_unemployment() -> int:
    """I-D3-005 — ECB LFSI BE werkloosheidsrate %. Raw value, geen transformatie."""
    rows = _fetch_ecb_history(ECB_UNEMPLOYMENT_HISTORY_URL, "I-D3-005 werkloosheid")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-005", out)


def backfill_mortgage() -> int:
    """I-D3-006 — ECB MIR BE hypotheekrente nieuwe contracten %. Raw value."""
    rows = _fetch_ecb_history(ECB_MORTGAGE_HISTORY_URL, "I-D3-006 hypotheekrente")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-006", out)


def backfill_layoffs() -> int:
    """I-D3-003 — ontslagen-proxy = log1p(max(0, delta_pp/100 * BE_WORKFORCE)).

    Dezelfde keten als fod_waso.fetch_collective_layoffs: de fetcher neemt de
    delta tussen de twee laatste LFSI-werkloosheidsRATE-observaties. Wij
    repliceren dat op de hele reeks: elke maand n krijgt de delta t.o.v. n-1.
    """
    rate_rows = _fetch_ecb_history(ECB_UNEMPLOYMENT_HISTORY_URL, "I-D3-003 ontslagen-proxy")
    out: list[dict] = []
    for i in range(1, len(rate_rows)):
        prev_rate = rate_rows[i - 1][1]
        last_rate = rate_rows[i][1]
        delta_pp = last_rate - prev_rate
        effective_workers = max(0.0, delta_pp / 100 * BE_WORKFORCE)
        value = math.log1p(effective_workers)
        out.append({"date": _month_to_date(rate_rows[i][0]), "value": value})
    return _write_history("I-D3-003", out)


def backfill_energy() -> int:
    """I-D3-002 — Energy-Charts BE day-ahead €/MWh, dag-gemiddelde van uurprijzen.

    De fetcher neemt het gemiddelde van de uurprijzen van één dag. We halen
    ~24 maanden in jaarblokken op (de API geeft per call de uur-reeks +
    unix-timestamps terug) en aggregeren naar één dag-gemiddelde per dag —
    exact dezelfde aggregatie als energy_charts._fetch_avg_price.
    """
    today = date.today()
    start = today - timedelta(days=730)
    by_date: dict[str, list[float]] = {}

    # In jaarblokken ophalen — kleinere responses, robuuster tegen time-outs.
    block_start = start
    while block_start < today:
        block_end = min(block_start + timedelta(days=365), today)
        url = (
            f"https://api.energy-charts.info/price"
            f"?bzn=BE&start={block_start.isoformat()}&end={block_end.isoformat()}"
        )
        print(f"  I-D3-002 energie: GET {url}", file=sys.stderr)
        ok, body = safe_request(url, timeout=40)
        if ok and isinstance(body, dict):
            prices = body.get("price", []) or []
            stamps = body.get("unix_seconds", []) or []
            n = min(len(prices), len(stamps))
            for k in range(n):
                p = prices[k]
                ts = stamps[k]
                if not isinstance(p, (int, float)) or not isinstance(ts, (int, float)):
                    continue
                d = date.fromtimestamp(ts).isoformat()
                by_date.setdefault(d, []).append(float(p))
        else:
            print(f"  WAARSCHUWING energie-blok faalde: {body!r:.120}", file=sys.stderr)
        block_start = block_end + timedelta(days=1)

    rows = [
        {"date": d, "value": sum(v) / len(v)}
        for d, v in sorted(by_date.items())
        if v
    ]
    return _write_history("I-D3-002", rows)


def main() -> int:
    print("Macro-economische baseline-backfill (5 indicatoren)", file=sys.stderr)
    print("=" * 56, file=sys.stderr)
    counts = {
        "I-D3-001 (CPI, maanddata)": backfill_cpi(),
        "I-D3-005 (werkloosheid, maanddata)": backfill_unemployment(),
        "I-D3-006 (hypotheekrente, maanddata)": backfill_mortgage(),
        "I-D3-003 (ontslagen-proxy, maanddata)": backfill_layoffs(),
        "I-D3-002 (energieprijs, dagdata)": backfill_energy(),
    }
    print("=" * 56, file=sys.stderr)
    failed = [k for k, c in counts.items() if c < 30]
    for k, c in counts.items():
        print(f"  {k}: {c} punten", file=sys.stderr)
    if failed:
        print(f"FOUT: te weinig punten voor: {', '.join(failed)}", file=sys.stderr)
        return 1
    print("Klaar — alle vijf baselines weggeschreven.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
