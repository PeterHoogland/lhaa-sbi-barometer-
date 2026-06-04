"""
agentic_monitor.py — de computer-ONAFHANKELIJKE bewaker-van-de-bewaker.

Draait als een EIGEN GitHub Actions-workflow (.github/workflows/monitor.yml) op een
eigen cron, los van daily.yml en de Cloudflare cron-Worker. Reden: als de Worker EN
daily.yml's eigen schedule allebei zouden uitvallen, merkt niemand dat het dashboard
niet meer ververst. Deze workflow is de onafhankelijke achtervang: hij kijkt naar de
LIVE site, en trapt de update opnieuw af als ze stil is gevallen — zonder dat er ook
maar één computer aan hoeft te staan (alles draait in GitHub's cloud).

Twee lagen:

1) DETERMINISTISCH (altijd, geen sleutel nodig). Haalt de live latest.json +
   health-report.json op, hergebruikt `verify_live.assess()` voor exact dezelfde
   structurele checks (vers, 25 indicatoren, composiet = som contributies, geen
   stil-kapotte, percentiel in bereik, canary niet kritiek, en de fallback-vangrail
   "gesimuleerd + extreem"). Is de data stale of faalde de laatste run -> hertrigger
   daily.yml via de GitHub-API. Blijft er een echt probleem -> exit non-zero (de run
   wordt rood -> GitHub mailt Peter).

2) AGENTISCH (optioneel, alleen als ANTHROPIC_API_KEY gezet is). Laat Claude een
   begrijpelijke gezondheidslezing + een subtiele-anomalie-check doen bovenop de harde
   checks, en schrijft die in de samenvatting. Faalt de API -> stil overslaan; de
   deterministische laag blijft volledig staan. Dit is de "koppeling aan een agentic
   AI": het oordeel bovenop de meting, niet in plaats van de meting.

Belangrijk: deze monitor wijzigt NOOIT code en raakt het publieke cijfer NIET. Hij
bewaakt, hertriggert en rapporteert. Een echte bug fixt een mens (met Claude) met zorg.

Gebruik:  python -m pipeline.agentic_monitor
Env:      GITHUB_TOKEN (vereist voor hertrigger/run-status), GITHUB_REPOSITORY,
          ANTHROPIC_API_KEY (optioneel, zet de agentische laag aan).
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

from pipeline import verify_live as vl

STALE_MIN = 90                       # ouder dan dit -> de uurlijkse update is overgeslagen
AGENTIC_MODEL = "claude-haiku-4-5-20251001"
GH_API = "https://api.github.com"


def latest_run(repo: str, token: str) -> dict | None:
    """Status van de recentste daily.yml-run (conclusion + url + tijd)."""
    try:
        r = requests.get(
            f"{GH_API}/repos/{repo}/actions/workflows/daily.yml/runs?per_page=1",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            timeout=20,
        )
        r.raise_for_status()
        runs = r.json().get("workflow_runs") or []
        if not runs:
            return None
        w = runs[0]
        return {"status": w.get("status"), "conclusion": w.get("conclusion"), "url": w.get("html_url")}
    except Exception as e:  # noqa: BLE001
        print(f"  (waarschuwing) kon run-status niet ophalen: {e}", file=sys.stderr)
        return None


def retrigger(repo: str, token: str) -> bool:
    """Trap daily.yml opnieuw af via workflow_dispatch."""
    try:
        r = requests.post(
            f"{GH_API}/repos/{repo}/actions/workflows/daily.yml/dispatches",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            json={"ref": "main"},
            timeout=20,
        )
        return r.status_code == 204
    except Exception as e:  # noqa: BLE001
        print(f"  (waarschuwing) hertrigger mislukte: {e}", file=sys.stderr)
        return False


def agentic_review(latest: dict, problems: list[str], notes: list[str], api_key: str) -> str | None:
    """Optioneel: laat Claude een begrijpelijke gezondheidslezing geven. Geeft None
    terug als de sleutel ontbreekt of de API faalt (de monitor draait dan gewoon door)."""
    if not api_key:
        return None
    pct = (latest.get("percentile") or {}).get("short_24m")
    comp = (latest.get("composite") or {}).get("equal")
    brief = [
        {"code": e.get("code"), "state": e.get("state"), "raw": e.get("raw_value"),
         "contribution": e.get("contribution"), "simulated": e.get("simulated")}
        for e in (latest.get("indicator_breakdown") or [])
    ]
    payload = {
        "model": AGENTIC_MODEL,
        "max_tokens": 600,
        "system": [{
            "type": "text",
            "text": (
                "Je bent de gezondheidsbewaker van een publiek stress-dashboard (de Les Hautes Alpes "
                "SBI-barometer). Je krijgt het live-eindresultaat + de uitkomst van de harde checks. "
                "Beoordeel kort, nuchter en in het Nederlands (je-vorm, geen em-dashes): is het cijfer "
                "plausibel? Zie je een subtiele anomalie die de harde checks misten (bv. een indicator "
                "die 'extreem' staat zonder reden, of een waarde die niet bij het seizoen past)? Je raakt "
                "het cijfer NIET aan en stelt GEEN code-wijziging voor; je signaleert alleen. Antwoord in "
                "maximaal 4 zinnen."
            ),
            "cache_control": {"type": "ephemeral"},
        }],
        "messages": [{
            "role": "user",
            "content": (
                f"Percentiel: {pct}. Composiet: {comp}.\n"
                f"Harde checks - problemen: {problems or 'geen'}; notities: {notes}.\n"
                f"Indicatoren: {json.dumps(brief, ensure_ascii=False)}"
            ),
        }],
    }
    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json=payload, timeout=40,
        )
        r.raise_for_status()
        blocks = r.json().get("content") or []
        text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
        return text or None
    except Exception as e:  # noqa: BLE001
        print(f"  (info) agentische laag overgeslagen: {e}", file=sys.stderr)
        return None


def decide(latest: dict, problems: list[str], run: dict | None, now: datetime) -> tuple[bool, list[str]]:
    """Beslis of we daily.yml moeten hertriggeren en welke problemen HARD alarmeren.
    Staleness en een gefaalde/uitgebleven run = zelf-herstel (hertrigger, geen alarm op
    zich). Structurele problemen (inconsistent cijfer, kritieke canary, fallback-vangrail)
    = hard alarm. Pure functie zodat ze testbaar is."""
    stale = any("oud" in p for p in problems)
    run_failed = bool(run and run.get("status") == "completed" and run.get("conclusion") not in (None, "success"))
    should_retrigger = stale or run_failed or (run is None and not latest)
    hard = [p for p in problems if "oud" not in p]
    return should_retrigger, hard


def main() -> int:
    token = os.environ.get("GITHUB_TOKEN", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "PeterHoogland/lhaa-sbi-barometer-")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    latest = vl._get("/data/latest.json", tries=3, wait=8)
    health = vl._get("/data/health-report.json", tries=2, wait=5)
    now = datetime.now(timezone.utc)
    problems, notes = vl.assess(latest or {}, health, now)
    run = latest_run(repo, token) if token else None

    should_retrigger, hard = decide(latest or {}, problems, run, now)

    lines: list[str] = []
    pct = ((latest or {}).get("percentile") or {}).get("short_24m")
    print(f"AGENTIC MONITOR — percentiel={pct}, problemen={problems or 'geen'}")
    for n in notes:
        print(f"  · {n}")

    retriggered = False
    if should_retrigger and token:
        retriggered = retrigger(repo, token)
        lines.append(f"Update stond stil (of laatste run faalde) -> daily.yml {'opnieuw afgetrapt' if retriggered else 'hertrigger MISLUKT'}.")
        print(f"  {'↻ hertriggerd' if retriggered else '✗ hertrigger mislukt'}")

    review = agentic_review(latest or {}, problems, notes, api_key)
    if review:
        lines.append(f"**Agentische lezing (Claude):** {review}")
        print(f"  🧠 {review}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    status = "🟢 gezond" if not hard else "🔴 probleem"
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(f"## {status} — agentic monitor (percentiel {pct})\n")
            if hard:
                f.write("**Harde problemen:**\n" + "\n".join(f"- {p}" for p in hard) + "\n")
            for ln in lines:
                f.write(f"- {ln}\n")
            if not hard and not lines:
                f.write("- Dashboard vers, compleet en intern consistent. Niets te doen.\n")

    if hard:
        print("🔴 HARD PROBLEEM:")
        for p in hard:
            print(f"  ✗ {p}")
        return 2
    print("🟢 alles in orde (of zelf-hersteld via hertrigger).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
