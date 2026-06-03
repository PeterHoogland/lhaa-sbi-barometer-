"""
Real-time filezwaarte (I-D2-001-rt) — dagelijkse verkeersdruk via DATEX II v3.

WAAROM (V6, Peters vraag: "verkeer continu inrekenen, files zijn even impactvol")
---------------------------------------------------------------------------------
De primaire verkeer-indicator I-D2-001 draait op een JAARcijfer (officiële
filezwaarte uit de Verkeerscentrum-jaarrapporten) — goed voor het niveau, maar
het beweegt niet van dag tot dag, dus het hoort niet in een "wat speelt vandaag"-
lijstje. Deze fetcher levert wél een DAGmaat: de totale filelengte (km) op het
Vlaamse hoofdwegennet, gesnapshot bij de dagelijkse run.

BRON
----
DATEX II v3-feed van het Vlaams Verkeerscentrum (Europese standaard voor
verkeersdata). De officiële catalogus vermeldt "registratie vereist", maar het
uitwisselings-endpoint levert de XML rechtstreeks (geen sleutel/Itsme) onder de
modellicentie gratis hergebruik. We tellen de `queueLength` over alle
file-records (`abnormalTraffic`, type queuingTraffic).

PLAATS IN HET MODEL (voorlopig)
-------------------------------
Secundair signaal dat vanaf nu HISTORIE opbouwt (`data/history/I-D2-001-rt.json`).
Zodra er ~3-4 weken dagdata is, kan deze dagmaat de jaar-I-D2-001 vervangen
(pre-registratie-amendement, Peters keuze). Tot dan: meelopend + zichtbaar.

Bron-ladder: 1) DATEX v3 live · 2) cache (laatste succesvolle) · 3) mock.
"""
from __future__ import annotations
import json
import re
from datetime import date, datetime, timezone
from ..util import FetchResult, safe_request, DATA_DIR
from ..cache import get as cache_get, put as cache_put

DATEX_V3_URL = "https://www.verkeerscentrum.be/uitwisseling/datex2v3"
# queueLength staat in meters, met of zonder namespace-prefix (ns4:queueLength).
_QUEUE_RE = re.compile(r"<(?:\w+:)?queueLength>(\d+)</", re.IGNORECASE)

CODE = "I-D2-001-rt"

# Intra-dag snapshots: de pijplijn draait uurlijks (6-21u BE), dus elke run legt
# een getimestampte DATEX-meting vast. Dat bouwt de DICHTE dagdata op die later
# een eerlijke dagtype-baseline (ma vs ma, spits vs spits) voor de verkeer-proxy
# mogelijk maakt (Peters gefaseerde plan, 2026-06-03). Geen aparte Cloudflare-Worker
# nodig — de uurlijkse cron levert ~16 punten/dag, ruim voor piekdetectie.
_INTRADAY_FILE = DATA_DIR / "history" / "I-D2-001-rt-intraday.json"
_INTRADAY_CAP = 2000  # ~4 maanden aan uurlijkse punten


def _append_intraday(total_km: float, n_files: int, longest_km: float) -> None:
    """Voeg een getimestampte snapshot toe aan het intra-dag-bestand. Faalt nooit
    de fetch (alles in try/except). Dedupe op timestamp (minuut-resolutie)."""
    try:
        ts = datetime.now(timezone.utc).isoformat(timespec="minutes")
        rows: list[dict] = []
        if _INTRADAY_FILE.exists():
            loaded = json.loads(_INTRADAY_FILE.read_text(encoding="utf-8"))
            if isinstance(loaded, list):
                rows = loaded
        merged = {r.get("ts"): r for r in rows if isinstance(r, dict)}
        merged[ts] = {"ts": ts, "km": total_km, "files": n_files, "longest_km": longest_km}
        out = sorted(merged.values(), key=lambda r: str(r.get("ts", "")))[-_INTRADAY_CAP:]
        _INTRADAY_FILE.parent.mkdir(parents=True, exist_ok=True)
        _INTRADAY_FILE.write_text(json.dumps(out, indent=2), encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass


def fetch_traffic_realtime(target_date: date) -> FetchResult:
    """Dagmaat verkeersdruk = totale filelengte (km) uit de DATEX v3-feed."""
    ok, body = safe_request(
        DATEX_V3_URL, timeout=30, retries=2, retry_delay=8,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if ok and isinstance(body, str) and "queueLength" in body:
        lengths_m = [int(x) for x in _QUEUE_RE.findall(body)]
        total_km = round(sum(lengths_m) / 1000.0, 2)
        n_files = len(lengths_m)
        longest_km = round(max(lengths_m) / 1000.0, 2) if lengths_m else 0.0
        source = (
            f"Verkeerscentrum DATEX II v3 — {n_files} files, {total_km} km totale "
            f"filelengte (langste {longest_km} km), snapshot {target_date.isoformat()}"
        )
        cache_put(CODE, total_km, source, target_date.isoformat())
        _append_intraday(total_km, n_files, longest_km)  # dichte dagdata opbouwen
        return FetchResult(
            CODE, total_km, target_date.isoformat(), simulated=False, source=source,
        )

    cached = cache_get(CODE)
    if cached:
        value, prev_source = cached
        return FetchResult(
            CODE, value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # Mock: een plausibele file-km voor de fallback (DATEX onbereikbaar + cache leeg).
    return FetchResult(
        CODE, 45.0, target_date.isoformat(),
        simulated=True, source="mock (DATEX v3 onbereikbaar + cache leeg)",
    )
