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
  2. Telegram Bot API (gratis). Vereist TELEGRAM_BOT_TOKEN (@BotFather) + TELEGRAM_CHAT_ID.
  3. WhatsApp via de gratis CallMeBot-relay. Vereist CALLMEBOT_PHONE + CALLMEBOT_APIKEY.
  4. WhatsApp via Twilio (betaald, betrouwbaar). Vereist TWILIO_ACCOUNT_SID,
     TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_WHATSAPP_TO.
  5. ALERT_WEBHOOK_URL (bv. Zapier/Make "Catch Hook -> e-mail"); bestond al voor
     de healthcheck-canary en wordt hier hergebruikt.
  6. (buiten dit script) rollende GitHub-issue + rode run -> GitHub-notificatie-
     mail. Dat vangnet blijft altijd staan, ook zonder secrets.

EERLIJK: zonder SMTP-/webhook-secrets kan dit script niet mailen; het zegt dat
dan expliciet in de log en de workflows vallen terug op het issue-/rode-run-pad.

Gebruik: python -m pipeline.alert --subject "..." --body "..." [--dry-run]
Exit altijd 0: alarmering mag de oorspronkelijke fout nooit maskeren.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import smtplib
import ssl
import sys
import urllib.error
import urllib.parse
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
    if env.get("TELEGRAM_BOT_TOKEN") and env.get("TELEGRAM_CHAT_ID"):
        channels.append("telegram")
    if env.get("CALLMEBOT_PHONE") and env.get("CALLMEBOT_APIKEY"):
        channels.append("whatsapp")
    if (
        env.get("TWILIO_ACCOUNT_SID") and env.get("TWILIO_AUTH_TOKEN")
        and env.get("TWILIO_WHATSAPP_FROM") and env.get("TWILIO_WHATSAPP_TO")
    ):
        channels.append("twilio")
    return channels


def alert_to(env: dict[str, str]) -> str:
    """Ontvanger(s) van de alarm-mail; meerdere adressen mogen komma-gescheiden
    (smtplib stuurt dan naar elk). `or DEFAULT_TO` vangt zowel een ontbrekende ALS
    een lege ALERT_TO op (een workflow die ${{ secrets.ALERT_TO }} doorgeeft zonder
    die secret levert een lege string, en een leeg To-veld zou de verzending breken)."""
    return env.get("ALERT_TO") or DEFAULT_TO


def build_message(subject: str, body: str, env: dict[str, str]) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = env.get("SMTP_USER", "sbi-monitor")
    msg["To"] = alert_to(env)
    msg.set_content(body)
    return msg


def smtp_port(env: dict[str, str]) -> int:
    """SMTP-poort uit de env. `or "587"` vangt zowel een ONTBREKENDE als een LEGE
    SMTP_PORT op: een workflow die `${{ secrets.SMTP_PORT }}` doorgeeft terwijl die
    secret niet bestaat levert een lege string (niet "afwezig"), en int("") zou
    crashen. Default = 587 (STARTTLS)."""
    return int(env.get("SMTP_PORT") or "587")


def send_smtp(subject: str, body: str, env: dict[str, str]) -> str:
    host = env["SMTP_HOST"]
    port = smtp_port(env)
    msg = build_message(subject, body, env)
    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(env["SMTP_USER"], env["SMTP_PASS"])
        smtp.send_message(msg)
    return f"mail verstuurd naar {msg['To']} via {host}"


def _http(req: urllib.request.Request) -> int:
    """Voer een HTTP-request uit; bij een foutstatus de RESPONSE-BODY meenemen in de
    fout. Telegram en CallMeBot zetten de echte reden in de body (bv. 'Forbidden: bot
    can't initiate conversation with a user') — zonder dit zie je enkel 'HTTP Error 403'
    en kun je een alarm-kanaal niet diagnosticeren."""
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace").strip()[:300]
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e


def send_webhook(subject: str, body: str, env: dict[str, str]) -> str:
    payload = json.dumps(
        {"to": alert_to(env), "subject": subject, "message": body}
    ).encode("utf-8")
    req = urllib.request.Request(
        env["ALERT_WEBHOOK_URL"], data=payload, headers={"Content-Type": "application/json"}
    )
    return f"webhook geaccepteerd (HTTP {_http(req)})"


def send_telegram(subject: str, body: str, env: dict[str, str]) -> str:
    """Telegram Bot API (gratis, geen tussenpartij). Vereist TELEGRAM_BOT_TOKEN
    (van @BotFather) + TELEGRAM_CHAT_ID (jouw chat met de bot)."""
    token = env["TELEGRAM_BOT_TOKEN"]
    payload = json.dumps(
        {"chat_id": env["TELEGRAM_CHAT_ID"], "text": f"{subject}\n\n{body}"}
    ).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    return f"telegram geaccepteerd (HTTP {_http(req)})"


def send_whatsapp(subject: str, body: str, env: dict[str, str]) -> str:
    """WhatsApp via de gratis CallMeBot-relay. Vereist CALLMEBOT_PHONE (met landcode,
    bv. +324...) + CALLMEBOT_APIKEY (eenmalig bij CallMeBot opgevraagd). Externe dienst:
    best-effort, draait naast de andere kanalen (een falen blokkeert de rest niet)."""
    url = "https://api.callmebot.com/whatsapp.php?" + urllib.parse.urlencode(
        {"phone": env["CALLMEBOT_PHONE"], "text": f"{subject}\n\n{body}", "apikey": env["CALLMEBOT_APIKEY"]}
    )
    return f"whatsapp (callmebot) geaccepteerd (HTTP {_http(urllib.request.Request(url))})"


def send_twilio_whatsapp(subject: str, body: str, env: dict[str, str]) -> str:
    """WhatsApp via Twilio (betaald, betrouwbaar; geen 24u-sandbox-verval bij een
    goedgekeurde sender). Vereist TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM (de Twilio-sender) en TWILIO_WHATSAPP_TO (ontvanger). Nummers
    met of zonder 'whatsapp:'-prefix mogen; we normaliseren."""
    sid = env["TWILIO_ACCOUNT_SID"]
    token = env["TWILIO_AUTH_TOKEN"]

    def _wa(n: str) -> str:
        return n if n.startswith("whatsapp:") else "whatsapp:" + n

    data = urllib.parse.urlencode(
        {
            "From": _wa(env["TWILIO_WHATSAPP_FROM"]),
            "To": _wa(env["TWILIO_WHATSAPP_TO"]),
            "Body": f"{subject}\n\n{body}",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json", data=data
    )
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{sid}:{token}".encode()).decode())
    return f"twilio-whatsapp geaccepteerd (HTTP {_http(req)})"


def dispatch(subject: str, body: str, env: dict[str, str], dry_run: bool = False) -> dict[str, str]:
    """Probeer alle geconfigureerde kanalen; rapporteer per kanaal het resultaat.
    Gooit nooit: een alarmkanaal dat faalt wordt gerapporteerd, niet fataal."""
    results: dict[str, str] = {}
    channels = configured_channels(env)
    if not channels:
        results["none"] = (
            "geen kanalen geconfigureerd (SMTP_*, ALERT_WEBHOOK_URL, TELEGRAM_*, "
            "CALLMEBOT_*, of TWILIO_*); vangnet = rollende GitHub-issue + rode run"
        )
        return results
    senders = {
        "smtp": send_smtp,
        "webhook": send_webhook,
        "telegram": send_telegram,
        "whatsapp": send_whatsapp,
        "twilio": send_twilio_whatsapp,
    }
    for ch in channels:
        if dry_run:
            results[ch] = "dry-run: niet verstuurd"
            continue
        try:
            results[ch] = senders[ch](subject, body, env)
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
