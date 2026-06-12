"""
Backfill van de I-D2-009-baseline (vertragingsgraad spoor) uit de maandelijkse
ruwe Infrabel-stiptheidsbestanden.

Run:  python3 app/pipeline/scripts/backfill_infrabel_baseline.py [--months 13] [--force]

Reconstrueert per dag EXACT dezelfde maat als de live fetcher
(pipeline/fetchers/infrabel.py): aandeel treinmetingen met >= DELAY_THRESHOLD_S
aankomstvertraging, officiële-meetset-benadering (per trein de eerste
Brussel-aankomst, anders de eindbestemming), aankomsten vóór CUTOFF_HOUR lokale
tijd. De drempel- en cutoff-constanten worden geïmporteerd uit de fetcher —
schaaldiscipline by construction (Hitte-bug-klasse).

VALIDATIE: per maand wordt de reconstructie ZONDER cutoff vergeleken met het
officiële maandcijfer (nationale-stiptheid-per-maand, vertragingsgraad =
100 − regelmaat). Bij een afwijking > TOLERANCE_PP procentpunt stopt het script
(tenzij --force): dan klopt de meetset-benadering niet meer en mag er geen
baseline uit vertrekken. IJking 2026-06-12 op mei 2026: reconstructie 7,63%
vs officieel 7,61%.

LET OP: dit script OVERSCHRIJFT app/data/history/I-D2-009.json. De oude inhoud
(iRail-verstoringsteller, andere schaal) mag niet gemengd worden met de nieuwe
maat; de teller leeft voort als secundair signaal I-D2-009S.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline.fetchers.infrabel import CUTOFF_HOUR, DELAY_THRESHOLD_S  # noqa: E402

MONTHLY_FILE_URL = (
    "https://fr.ftp.opendatasoft.com/infrabel/PunctualityHistory/"
    "Data_raw_punctuality_{yyyymm}.csv"
)
MONTHLY_INDEX_URL = (
    "https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets/"
    "stiptheid-gegevens-maandelijksebestanden/records?limit=100&order_by=mois%20desc"
)
OFFICIAL_MONTHLY_URL = (
    "https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets/"
    "nationale-stiptheid-per-maand/records?limit=100&order_by=maand%20desc"
)
OUT_PATH = Path(__file__).resolve().parents[2] / "data" / "history" / "I-D2-009.json"

BXL = {"BRUSSEL-ZUID", "BRUSSEL-CENTRAAL", "BRUSSEL-NOORD"}

# Empirisch onderbouwde tolerantie (2026-06-12): over de eerste 6 gevalideerde
# maanden (mei-okt 2025) lagen de maanddelta's tussen -0,53 en +0,27 pp zonder
# systematische richting (gem. |delta| 0,32 pp; relatieve fout <= 5,5%). De
# reconstructie is een 75%-subsample van de officiële telling met vrijwel exact
# hetzelfde niveau (mei 2026: 7,63% vs 7,61%); een ruimere Brussel-set
# (+Schuman/Luxemburg) verbeterde de dekking niet noemenswaardig (75,7%, 7,64%).
# 0,75 pp vangt de waargenomen subsample-ruis; een ECHTE meetset-drift valt er
# nog steeds buiten.
TOLERANCE_PP = 0.75

# DATDEP gebruikt Engelse maandafkortingen ("01MAY2026") — locale-onafhankelijk mappen.
MONTHS = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}


def parse_datdep(s: str) -> str | None:
    """'01MAY2026' → '2026-05-01'."""
    if len(s) != 9:
        return None
    m = MONTHS.get(s[2:5].upper())
    if not m:
        return None
    return f"{s[5:9]}-{m:02d}-{s[0:2]}"


def hour_of(t: str) -> int | None:
    try:
        return int(t.split(":")[0])
    except (ValueError, AttributeError, IndexError):
        return None


def process_month(yyyymm: str) -> tuple[dict[str, float], float | None]:
    """Stream één maandbestand → ({dag: vertragingsgraad% met cutoff},
    maandgemiddelde ZONDER cutoff voor de validatie tegen het officiële cijfer)."""
    url = MONTHLY_FILE_URL.format(yyyymm=yyyymm)
    print(f"  download {url} ...", flush=True)
    # Per (dag, trein): eerste Brussel-aankomst wint van de terminus-aankomst.
    # We bewaren per variant (met/zonder cutoff) de gekozen vertraging.
    state: dict[tuple[str, str], dict] = defaultdict(
        lambda: {"bxl": None, "term": None, "bxl_nc": None, "term_nc": None}
    )
    with requests.get(url, stream=True, timeout=300) as resp:
        resp.raise_for_status()
        resp.encoding = "utf-8"

        def _lines():
            first = True
            for ln in resp.iter_lines(decode_unicode=True):
                if ln is None:
                    continue
                if first:
                    ln = ln.lstrip("﻿")  # BOM
                    first = False
                yield ln

        for row in csv.DictReader(_lines()):
            d = row.get("DELAY_ARR")
            if d in (None, ""):
                continue
            try:
                delay = float(d)
            except ValueError:
                continue
            day = parse_datdep(row.get("DATDEP", ""))
            if not day:
                continue
            pt = (row.get("PTCAR_LG_NM_NL") or "").strip()
            rd = row.get("RELATION_DIRECTION") or ""
            term = rd.split("->")[-1].strip() if "->" in rd else ""
            arr = row.get("REAL_TIME_ARR") or row.get("PLANNED_TIME_ARR") or ""
            h = hour_of(arr)
            key = (day, row.get("TRAIN_NO", ""))
            t = state[key]
            is_bxl = pt in BXL
            is_term = bool(term) and pt == term
            if not (is_bxl or is_term):
                continue
            # zonder cutoff (validatie)
            if is_bxl and (t["bxl_nc"] is None or arr < t["bxl_nc"][0]):
                t["bxl_nc"] = (arr, delay)
            elif is_term and t["term_nc"] is None:
                t["term_nc"] = (arr, delay)
            # met cutoff (de baseline-reeks)
            if h is not None and h < CUTOFF_HOUR:
                if is_bxl and (t["bxl"] is None or arr < t["bxl"][0]):
                    t["bxl"] = (arr, delay)
                elif is_term and t["term"] is None:
                    t["term"] = (arr, delay)

    per_day = defaultdict(lambda: [0, 0])  # dag → [n, vertraagd]
    nc_n = nc_late = 0
    for (day, _train), t in state.items():
        chosen = t["bxl"] or t["term"]
        if chosen is not None:
            per_day[day][0] += 1
            if chosen[1] >= DELAY_THRESHOLD_S:
                per_day[day][1] += 1
        chosen_nc = t["bxl_nc"] or t["term_nc"]
        if chosen_nc is not None:
            nc_n += 1
            if chosen_nc[1] >= DELAY_THRESHOLD_S:
                nc_late += 1

    days = {
        day: round(100.0 * late / n, 3)
        for day, (n, late) in per_day.items()
        if n > 0
    }
    nocutoff_mean = round(100.0 * nc_late / nc_n, 3) if nc_n else None
    return days, nocutoff_mean


def official_monthly() -> dict[str, float]:
    """maand ('YYYY-MM') → officiële vertragingsgraad % (100 − regelmaat)."""
    r = requests.get(OFFICIAL_MONTHLY_URL, timeout=60)
    r.raise_for_status()
    out = {}
    for rec in r.json().get("results", []):
        maand = rec.get("maand")
        reg = rec.get("regelmaat")
        if maand and isinstance(reg, (int, float)):
            out[str(maand)[:7]] = round(100.0 - reg, 3)
    return out


def available_months() -> list[str]:
    """Beschikbare maandbestanden, nieuwste eerst, als 'YYYYMM'."""
    r = requests.get(MONTHLY_INDEX_URL, timeout=60)
    r.raise_for_status()
    return [str(rec["mois"])[:7].replace("-", "") for rec in r.json().get("results", [])]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--months", type=int, default=13, help="aantal maanden terug (default 13)")
    ap.add_argument("--force", action="store_true", help="doorgaan ondanks validatie-afwijking")
    args = ap.parse_args()

    months = available_months()[: args.months]
    if not months:
        print("✗ geen maandbestanden gevonden")
        return 1
    official = official_monthly()

    all_days: dict[str, float] = {}
    print(f"Backfill I-D2-009 over {len(months)} maanden ({months[-1]} → {months[0]})")
    for yyyymm in sorted(months):
        # Grote downloads (~300 MB/maand): tot 3 pogingen bij netwerk-haperingen.
        days = nocutoff = None
        for attempt in range(1, 4):
            try:
                days, nocutoff = process_month(yyyymm)
                break
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                print(f"  poging {attempt}/3 mislukt voor {yyyymm}: {e}")
        if days is None:
            print(f"✗ {yyyymm} bleef onbereikbaar na 3 pogingen — geen baseline geschreven")
            return 1
        maand_key = f"{yyyymm[:4]}-{yyyymm[4:6]}"
        off = official.get(maand_key)
        delta = None if (off is None or nocutoff is None) else round(nocutoff - off, 3)
        print(
            f"  {maand_key}: {len(days)} dagen | reconstructie (zonder cutoff) "
            f"{nocutoff}% vs officieel {off}% | delta {delta} pp"
        )
        if delta is not None and abs(delta) > TOLERANCE_PP and not args.force:
            print(
                f"✗ afwijking > {TOLERANCE_PP} pp voor {maand_key} — meetset-benadering "
                "klopt niet meer; geen baseline geschreven (--force om te overrulen)"
            )
            return 1
        all_days.update(days)

    rows = [{"date": d, "value": v} for d, v in sorted(all_days.items())]
    old_n = 0
    if OUT_PATH.exists():
        try:
            old_n = len(json.loads(OUT_PATH.read_text()))
        except (ValueError, OSError):
            pass
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(
        f"✓ {len(rows)} dagpunten → {OUT_PATH} (verving {old_n} oude punten — "
        "de oude iRail-tellerreeks leeft voort als secundair I-D2-009S)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
