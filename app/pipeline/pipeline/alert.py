"""
alert.py — laatste-lijn alarmering naar een mens (eis Peter 2026-06-12:
"mail peter@hoogland.be als iets faalt en niet automatisch hersteld kan worden").

WAT DIT IS. Eén verzendmodule die door de workflows wordt aangeroepen op het
moment dat de gelaagde zelfcontrole (fetcher-ladders -> healthcheck-canary ->
verify_live -> agentic_monitor-hertrigger) een probleem NIET zelf kon herstellen.
Dit script beslist niet wanneer er alarm is; dat blijft deterministisch in
daily.yml / monitor.yml / healthcheck / agentic_monitor. Het bezorgt alleen.

KANAAL-LADDER (alle geconfigureerde kanalen worden geprobeerd; falen van het ene
kanaal blokkeert het andere niet):
  1. SMTP-mail, direct naar ALERT_TO (default peter@hoogland.be).
     Vereist secrets: SMTP_HOST, SMTP_USER, SMTP_PASS (optioneel SMTP_PORT,
     default 587 STARTTLS). Bv. Gmail: smtp.gmail.com + app-wachtwoord.
  2. ALERT_WEBHOOK_URL (bv. Zapier/Make "Catch Hook -> e-mail"); bestond al voor
     de healthcheck-canary en wordt hier hergebruikt.
  3. (buiten dit script) rollende GitHub-issue + rode run -> GitHub-notificatie-
     mail. Dat vangnet blijft altijd staan, ook zonder secrets.

EERLIJK: zonder SMTP-/webhook-secrets kan dit script niet mailen; het zegt dat
dan expliciet in de log en de workflows vallen terug op het issue-/rode-run-pad.

Gebruik: python -m pipeline.alert --subject "..." --body "..." [--dry-run]
Exit altijd 0: alarmering mag de oorspronkelijke fout nooit maskeren.
"""
from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
import sys
import urllib.request
from email.message import EmailMessage

DEFAULT_TO = "peter@hoogland.be"


def configured_channels(env: dict[str, str]) -> list[str]:
    """Welke kanalen zijn met de huidige env/secrets bruikbaar? (pure functie)"""
    channels: list[str] = []
    if env.get("SMTP_HOST") and env.get("SMTP_USER") and env.get("SMTP_PASS"):
        channels.append("smtp")
    if env.get("ALERT_WEBHOOK_URL"):
        channels.append("webhook")
    return channels


def build_message(subject: str, body: str, env: dict[str, str]) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = env.get("SMTP_USER", "sbi-monitor")
    msg["To"] = env.get("ALERT_TO", DEFAULT_TO)
    msg.set_content(body)
    return msg


def send_smtp(subject: str, body: str, env: dict[str, str]) -> str:
    host = env["SMTP_HOST"]
    port = int(env.get("SMTP_PORT", "587"))
    msg = build_message(subject, body, env)
    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(env["SMTP_USER"], env["SMTP_PASS"])
        smtp.send_message(msg)
    return f"mail verstuurd naar {msg['To']} via {host}"


def send_webhook(subject: str, body: str, env: dict[str, str]) -> str:
    payload = json.dumps(
        {"to": env.get("ALERT_TO", DEFAULT_TO), "subject": subject, "message": body}
    ).encode("utf-8")
    req = urllib.request.Request(
        env["ALERT_WEBHOOK_URL"], data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return f"webhook geaccepteerd (HTTP {resp.status})"


def dispatch(subject: str, body: str, env: dict[str, str], dry_run: bool = False) -> dict[str, str]:
    """Probeer alle geconfigureerde kanalen; rapporteer per kanaal het resultaat.
    Gooit nooit: een alarmkanaal dat faalt wordt gerapporteerd, niet fataal."""
    results: dict[str, str] = {}
    channels = configured_channels(env)
    if not channels:
        results["none"] = (
            "geen mail-/webhook-secrets gezet (SMTP_HOST/SMTP_USER/SMTP_PASS of "
            "ALERT_WEBHOOK_URL); vangnet = rollende GitHub-issue + rode run"
        )
        return results
    for ch in channels:
        if dry_run:
            results[ch] = "dry-run: niet verstuurd"
            continue
        try:
            results[ch] = send_smtp(subject, body, env) if ch == "smtp" else send_webhook(subject, body, env)
        except Exception as e:  # noqa: BLE001 — alarmering mag nooit zelf crashen
            results[ch] = f"FAALDE: {e}"
    return results


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="SBI alarm-verzender (laatste lijn)")
    ap.add_argument("--subject", required=True)
    ap.add_argument("--body", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    env = dict(os.environ)
    results = dispatch(args.subject, args.body, env, dry_run=args.dry_run)
    for channel, outcome in results.items():
        print(f"alert[{channel}]: {outcome}")
    # Exit 0, altijd: dit script draait in een failure-pad; de run is al rood en
    # een crash hier zou alleen de diagnose vertroebelen.
    return 0


if __name__ == "__main__":
    sys.exit(main())
