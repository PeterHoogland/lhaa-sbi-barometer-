"""
Brandstof-fetcher voor BE (I-D2-004).
Doc 03_Laag-4 §2.2.

Primaire bron: **be.STAT (Statbel / FOD Economie) — officiele dagelijkse
maximumprijzen aardolieproducten**. Statbel publiceert elke werkdag de
officiele maximumprijs (cliquetsysteem / programmaovereenkomst
petroleumproducten) als machine-leesbare JSON. We lezen "Benzine 95 RON E10"
(€/l, incl. btw) als de stress-relevante pompprijs.

Dit is een upgrade t.o.v. de vorige aanpak (ECB-HICP yoy → €/l-schatting):
de be.STAT-waarde is de ECHTE prijs van de dag zelf, geen maandschatting.

Fallback cascade: be.STAT → ECB HICP CP0722 → carbu scrape → mock.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest_with_period


# be.STAT API — officiele maximumprijzen aardolieproducten (FOD Economie)
# View-UUID is een mogelijk breekpunt: bij een lege/gewijzigde respons
# degraderen we netjes naar de ECB-fallback.
BESTAT_FUEL_URL = (
    "https://bestat.statbel.fgov.be/bestat/api/views/"
    "c42c9c16-9330-437b-9608-13781b795ec1/result/JSON"
)
BESTAT_PRODUCT = "Benzine 95 RON E10 (€/L)"

# ECB HICP key voor "Fuels and lubricants for personal transport equipment"
# Coicop 07.2.2, BE, monthly, annual rate of change
ECB_FUEL_HICP_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.072200.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

CARBU_URL = "https://carbu.com/belgie/index.php/laagsteprijs/EUROPE_95/-/-"

EURO95_PATTERN = re.compile(
    r"(?:Euro\s*95|euro95|E95)\D{0,40}?(\d[,.]\d{2,3})",
    re.IGNORECASE,
)
EURO95_BASELINE_PER_L = 1.85  # 2024-baseline voor BE Euro95

# Nederlandse maand-afkortingen zoals Statbel ze in het "Dag"-veld zet
# (bv. "22mei26" → 2026-05-22).
_NL_MONTHS = {
    "jan": 1, "feb": 2, "mrt": 3, "maa": 3, "apr": 4, "mei": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12,
}
_DAG_RE = re.compile(r"^(\d{1,2})([a-z]{3})(\d{2})$", re.IGNORECASE)


def _parse_bestat_dag(dag: str) -> str | None:
    """'22mei26' → '2026-05-22'. Return None bij onbekend formaat."""
    if not isinstance(dag, str):
        return None
    m = _DAG_RE.match(dag.strip())
    if not m:
        return None
    day, mon, yy = m.group(1), m.group(2).lower(), m.group(3)
    month = _NL_MONTHS.get(mon)
    if month is None:
        return None
    try:
        return f"20{yy}-{month:02d}-{int(day):02d}"
    except ValueError:
        return None


def _try_bestat() -> tuple[float, str] | None:
    """Return (euro_per_l, observation_date_iso) of None."""
    ok, body = safe_request(
        BESTAT_FUEL_URL, timeout=25,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None
    facts = body.get("facts")
    if not isinstance(facts, list):
        return None
    for fact in facts:
        if not isinstance(fact, dict):
            continue
        if fact.get("Product") != BESTAT_PRODUCT:
            continue
        price = fact.get("Prijs incl. BTW")
        try:
            val = float(price)
        except (TypeError, ValueError):
            continue
        if not (0.5 < val < 5.0):
            continue
        obs = _parse_bestat_dag(fact.get("Dag", "")) or None
        return round(val, 3), obs
    return None


def bestat_fuel_series() -> list[dict]:
    """Volledige dag-historie van 'Benzine 95 RON E10' (€/l incl. btw) uit de
    be.STAT-view — dezelfde officiele FOD-Economie-bron als de dagelijkse fetch.

    De view bevat één rij per dag; we lezen ze allemaal i.p.v. enkel de laatste.
    Gebruikt voor de eenmalige backfill (scripts/backfill_fuel_baseline.py) zodat
    I-D2-004 een ECHTE baseline krijgt i.p.v. forward te moeten accumuleren.

    Return [{date, value}], gesorteerd op datum. Lege lijst bij fout/leeg.
    """
    ok, body = safe_request(
        BESTAT_FUEL_URL, timeout=90, retries=2, retry_delay=5.0,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return []
    facts = body.get("facts")
    if not isinstance(facts, list):
        return []
    rows: dict[str, float] = {}
    for fact in facts:
        if not isinstance(fact, dict) or fact.get("Product") != BESTAT_PRODUCT:
            continue
        try:
            val = float(fact.get("Prijs incl. BTW"))
        except (TypeError, ValueError):
            continue
        if not (0.5 < val < 5.0):  # scale-sanity: pompprijs €/l
            continue
        iso = _parse_bestat_dag(fact.get("Dag", ""))
        if iso:
            rows[iso] = round(val, 3)
    return [{"date": d, "value": v} for d, v in sorted(rows.items())]


# ECB HICP brandstof-prijsINDEX (niveau, niet de yoy-rate), BE, maandelijks.
# Volledige reeks tot 1996 — de echte, lange backfill-bron voor I-D2-004.
ECB_FUEL_INDEX_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.072200.4.INX"
    "?format=jsondata"
)


def _parse_ecb_index_series(body: dict) -> list[tuple[str, float]]:
    """ECB SDMX-jsondata → [(periode 'YYYY-MM', indexwaarde)], gesorteerd."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        obs = series["observations"]
        periods = [v["id"] for v in body["structure"]["dimensions"]["observation"][0]["values"]]
    except (KeyError, IndexError, StopIteration, TypeError):
        return []
    out: list[tuple[str, float]] = []
    for idx, val in obs.items():
        try:
            i = int(idx)
            v = float(val[0])
        except (ValueError, TypeError, IndexError):
            continue
        if 0 <= i < len(periods):
            out.append((periods[i], v))
    out.sort(key=lambda x: x[0])
    return out


def ecb_fuel_eur_per_l_series() -> list[dict]:
    """Maandelijkse €/l brandstof-historie, afgeleid van de ECB HICP-brandstofindex
    (CP07.2.2, BE) en VERANKERD op het actuele be.STAT-pompprijsniveau. Zo krijgt
    I-D2-004 een echte, lange (tot 1996), schaal-consistente baseline i.p.v. een
    forward-geaccumuleerde of synthetische.

        €/l(maand) = anker_€/l × index(maand) / index(laatste)

    De historische €/l zijn HICP-afgeleide schattingen (geen geregistreerde
    pompprijzen) — eerlijk te labelen, maar reëel van vorm en schaal.
    Return [{date, value}] maandelijks, of [] bij fout.
    """
    ok, body = safe_request(
        ECB_FUEL_INDEX_URL, timeout=40, retries=2, retry_delay=5.0,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return []
    series = _parse_ecb_index_series(body)
    if len(series) < 24:
        return []
    latest_index = series[-1][1]
    if latest_index <= 0:
        return []

    # Anker: actuele be.STAT-pompprijs; val terug op de gecodeerde baseline.
    anchor = EURO95_BASELINE_PER_L
    bestat = _try_bestat()
    if bestat is not None:
        anchor = bestat[0]

    rows: list[dict] = []
    for period, idx_val in series:
        eur = anchor * idx_val / latest_index
        if 0.3 < eur < 6.0:  # scale-sanity €/l
            rows.append({"date": f"{period}-01", "value": round(eur, 3)})
    return rows


def _try_ecb_fuel_hicp() -> tuple[float, float, str] | None:
    """Return (yoy_pct, eur_per_l_estimate, period) of None."""
    ok, body = safe_request(
        ECB_FUEL_HICP_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None
    result = _parse_ecb_latest_with_period(body)
    if result is None:
        return None
    yoy, period = result
    estimate = EURO95_BASELINE_PER_L * (1 + yoy / 100)
    return yoy, round(estimate, 3), period


def _try_scrape(url: str) -> float | None:
    ok, body = safe_request(
        url, timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0 (SBI-pipeline)",
            "Accept-Language": "nl-BE,nl;q=0.9",
        },
    )
    if not ok or not isinstance(body, str):
        return None
    m = EURO95_PATTERN.search(body)
    if not m:
        return None
    try:
        val = float(m.group(1).replace(",", "."))
        if 0.5 < val < 5.0:
            return val
    except ValueError:
        pass
    return None


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # 1) be.STAT — officiele dagelijkse maximumprijs (FOD Economie)
    bestat = _try_bestat()
    if bestat is not None:
        value, obs = bestat
        return FetchResult(
            "I-D2-004", value, target_date.isoformat(),
            simulated=False,
            source="Statbel be.STAT — officiele maximumprijs Benzine 95 E10 (FOD Economie)",
            observation_date=obs or target_date.isoformat(),
        )

    # 2) ECB HICP CP0722 — methodologisch sterke maand-fallback
    hicp = _try_ecb_fuel_hicp()
    if hicp is not None:
        yoy, estimate, period = hicp
        return FetchResult(
            "I-D2-004", estimate, target_date.isoformat(),
            simulated=False,
            source=f"ECB HICP brandstof yoy {yoy:+.1f}% naar €{estimate}/l geschat (be.STAT onbereikbaar)",
            observation_date=period,
        )

    # 3) carbu.com fallback
    val = _try_scrape(CARBU_URL)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="carbu.com (BE pomp-prijzen)",
            observation_date=target_date.isoformat(),
        )

    # 4) Conservative mock
    value = 1.85 + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True,
        source="mock (be.STAT + ECB HICP + carbu alle drie faalden)",
    )
