"""
verify_live.py — VOLLEDIGE eindresultaat-controle NÁ de deploy.

Waar de canary (healthcheck.py) de bronnen + de bouw PRE-deploy controleert,
controleert dit of het EINDRESULTAAT op de LIVE site klopt: vers, compleet, intern
consistent en correct verwerkt. Draait als laatste CI-stap (na de Cloudflare-deploy).
Faalt de controle → exit non-zero → de run wordt rood → GitHub mailt automatisch.

Volledig autonoom: de Cloudflare Cron-Worker trapt daily.yml elk uur af (computer-uit),
de pipeline + canary + deze live-verificatie draaien zonder enige hulp of commando.

Gebruik:  python -m pipeline.verify_live
"""
from __future__ import annotations

import os
import sys
import time
from datetime import datetime, timezone

BASE = "https://les-hautes-alpes-sbi.brainwolves.workers.dev"
EXPECTED_INDICATORS = 25
FRESH_MAX_MIN = 45          # live timestamp moet hierbinnen vallen (deploy gepropageerd)
COMPOSITE_TOL = 0.06        # |composiet - som(contributies)| tolerantie


def assess(latest: dict, health: dict | None, now: datetime) -> tuple[list[str], list[str]]:
    """Pure controle: gegeven de live latest.json + health-report.json, geef
    (problemen, notities). Een probleem = de run faalt; een notitie = info."""
    problems: list[str] = []
    notes: list[str] = []

    if not latest:
        return (["geen latest.json van de live site"], notes)

    # 1) VERSHEID — staat het verse resultaat van deze run écht live?
    ts = latest.get("timestamp")
    try:
        t = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        age_min = (now - t).total_seconds() / 60
        notes.append(f"live leeftijd {int(age_min)} min")
        if age_min > FRESH_MAX_MIN:
            problems.append(f"live data {int(age_min)} min oud (> {FRESH_MAX_MIN}) — deploy niet gepropageerd of run draaide niet")
    except (ValueError, TypeError, AttributeError):
        problems.append(f"ongeldige timestamp: {ts!r}")

    # 2) COMPLEETHEID — alle 25 indicatoren aanwezig
    bd = latest.get("indicator_breakdown") or []
    if len(bd) != EXPECTED_INDICATORS:
        problems.append(f"{len(bd)} indicatoren in de breakdown, verwacht {EXPECTED_INDICATORS}")

    # 3) HET GETAL ZELF — composiet + percentiel geldig en in bereik
    comp = (latest.get("composite") or {}).get("equal")
    if not isinstance(comp, (int, float)):
        problems.append(f"composiet ongeldig: {comp!r}")
    pct = (latest.get("percentile") or {}).get("short_24m")
    if not (isinstance(pct, (int, float)) and 0 <= pct <= 100):
        problems.append(f"percentiel buiten [0,100] of ontbreekt: {pct!r}")

    # 4) CORRECT VERWERKT — elke indicator is óf gescoord óf eerlijk uitgesloten;
    #    geen enkele mag stil kapot zijn (state gescoord maar z/contributie weg).
    contrib_sum = 0.0
    for e in bd:
        code, state = e.get("code"), e.get("state")
        z, c = e.get("z_short"), e.get("contribution")
        if state == "ontbreekt":
            continue                                   # eerlijk uitgesloten — ok
        if not isinstance(z, (int, float)):
            problems.append(f"{code}: state={state!r} maar geen z_short (stil kapot)")
        if isinstance(c, (int, float)):
            contrib_sum += c
        else:
            problems.append(f"{code}: contributie ontbreekt")

    # 5) INTERNE CONSISTENTIE — het getal moet de som van zijn delen zijn
    if isinstance(comp, (int, float)):
        delta = abs(comp - contrib_sum)
        if delta > COMPOSITE_TOL:
            problems.append(f"composiet {round(comp,4)} ≠ som contributies {round(contrib_sum,4)} (Δ={round(delta,4)} > {COMPOSITE_TOL})")
        else:
            notes.append(f"composiet=Σcontributies (Δ={round(delta,4)})")

    # 6) DATA-KWALITEIT — gesimuleerd is bron-degradatie; de canary alarmeert dit al
    #    (degraded). Hier enkel als notitie, zodat een tijdelijke mock niet dubbel
    #    alarmeert. (Op go-live met mode:live hoort simulated leeg te zijn — dat
    #    bewaakt de aparte HARDE-EIS-check.)
    sim = (latest.get("data_quality") or {}).get("indicators_simulated") or []
    if sim:
        notes.append(f"gesimuleerd (canary meldt dit als degraded): {sim}")

    # 7) SECUNDAIRE SIGNALEN aanwezig
    ss = latest.get("secondary_signals") or []
    if len(ss) < 9:
        notes.append(f"slechts {len(ss)} secundaire signalen (verwacht ~9)")

    # 8) CANARY — de bron-gezondheid mag niet kritiek zijn
    if health is not None:
        v = health.get("verdict")
        notes.append(f"canary={v}")
        if v == "critical":
            problems.append(f"canary KRITIEK: {'; '.join(health.get('messages', [])[:2])}")

    # 9) FALLBACK-SANITEIT — een gesimuleerde (fallback-)indicator hoort climatologisch/
    #    neutraal te zijn: bij een bronstoring valt hij terug op een normaalwaarde rond de
    #    baseline-mediaan, dus mag hij NOOIT "extreem" lezen. Doet hij dat toch, dan staat
    #    de fallback-waarde op een ANDERE schaal dan zijn baseline. Dat is exact de Hitte-bug
    #    van 2026-06-04 (rauwe temperatuur ~26 i.p.v. de delta-boven-30 → valse z=3 → vals
    #    "uitzonderlijk hoog"). Deze regel vangt die hele bug-klasse autonoom, elke run.
    for e in bd:
        if e.get("simulated") and e.get("state") == "extreem":
            problems.append(
                f"{e.get('code')}: gesimuleerd én 'extreem' (raw={e.get('raw_value')}) — "
                "fallback-waarde staat op een verkeerde schaal t.o.v. de baseline"
            )

    return problems, notes


def _get(path: str, tries: int = 6, wait: int = 10) -> dict | None:
    import requests  # bundelt certifi → geen SSL-issues, lokaal en in de CI
    last = ""
    for i in range(tries):
        try:
            url = f"{BASE}{path}?cb={int(time.time())}-{i}"
            r = requests.get(url, timeout=20, headers={"User-Agent": "lhaa-sbi-verify"})
            r.raise_for_status()
            return r.json()
        except Exception as e:  # noqa: BLE001
            last = str(e)
            if i < tries - 1:
                time.sleep(wait)
    print(f"  (waarschuwing) {path} onbereikbaar na {tries} pogingen: {last}", file=sys.stderr)
    return None


def main() -> int:
    latest = _get("/data/latest.json")          # met retries → wacht op Cloudflare-propagatie
    health = _get("/data/health-report.json", tries=2, wait=5)
    now = datetime.now(timezone.utc)

    problems, notes = assess(latest or {}, health, now)

    pct = ((latest or {}).get("percentile") or {}).get("short_24m")
    n_ind = len((latest or {}).get("indicator_breakdown") or [])
    print(f"LIVE-VERIFICATIE — percentiel={pct} indicatoren={n_ind}")
    for n in notes:
        print(f"  · {n}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if problems:
        print("🔴 EINDRESULTAAT NIET CORRECT:")
        for p in problems:
            print(f"  ✗ {p}")
        if summary:
            with open(summary, "a", encoding="utf-8") as f:
                f.write("## 🔴 Live-eindresultaat-verificatie faalde\n")
                f.write("\n".join(f"- {p}" for p in problems) + "\n")
        return 2

    print("🟢 eindresultaat correct: vers, compleet, intern consistent, alles verwerkt.")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(f"## 🟢 Live-eindresultaat correct (percentiel {pct}, {n_ind} indicatoren)\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
