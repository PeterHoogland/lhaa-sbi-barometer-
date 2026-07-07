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
from datetime import datetime, timedelta, timezone

BASE = "https://les-hautes-alpes-sbi.brainwolves.workers.dev"
EXPECTED_INDICATORS = 21  # 25 registry-codes - 4 D6-kalendercontext (A6: context_signals, niet gescoord)
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

    # 2) COMPLEETHEID — alle gemeten indicatoren aanwezig (EXPECTED_INDICATORS, registry)
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

    # 6) DATA-KWALITEIT + HARDE EIS — gesimuleerd is bron-degradatie; de canary
    #    alarmeert dit al (degraded). In test-modus blijft het hier een notitie,
    #    zodat een tijdelijke mock niet dubbel alarmeert. HARDE EIS (go-live):
    #    zodra de live output mode "live" voert (v04-blok staat dan publiek in
    #    latest.json, zie engine/src/publish.ts), mag indicators_simulated NIET
    #    meer gevuld zijn — dan faalt de run hier hard.
    sim = (latest.get("data_quality") or {}).get("indicators_simulated") or []
    mode = (latest.get("v04") or {}).get("mode") or latest.get("mode")
    if sim:
        if mode == "live":
            problems.append(
                f"HARDE EIS geschonden: mode=live maar gesimuleerde indicatoren in het cijfer: {sim}"
            )
        else:
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

    # 10) BREDE-BASELINE-INTEGRITEIT — de absolute meting (broad_pressure) belooft publiek
    #     "vs normale tijden 2010-2019". De doorlopende-historie-snoei (run.py _HISTORY_CAP)
    #     at die baseline vroeger telkens weg voor de DAGELIJKSE reeksen (weer/energie), waardoor
    #     "2010-2019" onwaar werd (bug 2026-06-19; gedicht via _cap_history + amendement §4.1.12).
    #     Deze regel vangt die regressie autonoom: elke broad_pressure-indicator moet zijn
    #     geregistreerde venster nog dekken.
    bp = latest.get("broad_pressure") or {}
    if bp.get("status") == "computed":
        bp_inds = {i.get("code"): i for i in (bp.get("indicators") or [])}
        baseline_floor = {
            # code: (max toegestane baseline_start, min n_baseline)
            "I-D1-002": ("2012-01-01", 3000),  # hitte: 2010-2019 dagdata
            "I-D1-003": ("2012-01-01", 3000),  # koude: 2010-2019 dagdata
            "I-D3-002": ("2017-06-01", 1000),  # energie: 2016-2019 (energy-charts bronlimiet)
            "I-D5-001": ("2018-01-01", 800),   # nieuws: GDELT 2017-2019 (§4.1.13)
        }
        for code, (max_start, min_n) in baseline_floor.items():
            ind = bp_inds.get(code)
            if not ind:
                problems.append(f"broad_pressure mist {code} (baseline-integriteit)")
                continue
            start, n = ind.get("baseline_start"), ind.get("n_baseline")
            if not (isinstance(start, str) and start <= max_start):
                problems.append(
                    f"{code}: baseline_start={start!r} > {max_start} — 2010-2019-baseline gesnoeid "
                    "(publieke 'vs normale tijden'-belofte onwaar)"
                )
            if not (isinstance(n, int) and n >= min_n):
                problems.append(f"{code}: n_baseline={n!r} < {min_n} — baseline te dun (gesnoeid?)")

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


def _is_fresh(latest: dict, now: datetime) -> bool:
    """Is de live timestamp binnen de verse-drempel? Een ongeldige/ontbrekende
    timestamp geeft True terug — dan stoppen we met pollen en laat assess() het als
    hard probleem melden (i.p.v. eindeloos wachten op iets dat nooit vers wordt)."""
    ts = latest.get("timestamp")
    try:
        t = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        return (now - t).total_seconds() / 60 <= FRESH_MAX_MIN
    except (ValueError, TypeError, AttributeError):
        return True


def _get_fresh(
    path: str = "/data/latest.json",
    *,
    max_wait: int = 180,
    interval: int = 15,
    fetch=_get,
    now_fn=lambda: datetime.now(timezone.utc),
    sleep=time.sleep,
) -> dict | None:
    """Haal de live latest.json op, maar geef de edge tijd om de ZOJUIST gedeployde
    build te propageren. Cloudflare/Surge serveren vlak na een deploy soms nog kort
    de vórige versie; die in één keer lezen gaf een vals-rode verse-gate — hij mat de
    leeftijd van de VORIGE deploy i.p.v. van deze run (2026-07: uitsluitend
    off-cadence workflow_dispatch-runs faalden zo, terwijl de data feitelijk correct
    en vers gedeployd was). We pollen daarom tot de verse build zichtbaar is
    (timestamp ≤ FRESH_MAX_MIN oud) of tot de deadline verstrijkt. Propageert de build
    echt niet binnen de deadline, dan geven we de laatste (mogelijk stale) respons
    terug zodat assess() eerlijk rood gaat — een echte propagatie-/deploy-fout blijft
    dus zichtbaar; alleen de race met de edge-propagatie is weg."""
    deadline = now_fn() + timedelta(seconds=max_wait)
    last: dict | None = None
    while True:
        latest = fetch(path)
        if latest:
            last = latest
            if _is_fresh(latest, now_fn()):
                return latest
        if now_fn() >= deadline:
            return last
        sleep(interval)


def main() -> int:
    latest = _get_fresh("/data/latest.json")     # pollt tot de verse build gepropageerd is
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
