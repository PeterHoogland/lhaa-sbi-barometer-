"""
Standalone tests voor pipeline/alert.py (laatste-lijn alarmering) — geen pytest.
Run: python3 tests/test_alert.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pipeline.alert import alert_to, build_message, configured_channels, dispatch, main, smtp_port  # noqa: E402

PASSED = 0


def ok(name: str, cond: bool, detail: str = "") -> None:
    global PASSED
    if cond:
        PASSED += 1
        print(f"  ✓ {name}")
    else:
        print(f"  ✗ {name} {detail}")
        sys.exit(1)


def main_test() -> int:
    print("test_alert (laatste-lijn alarmering)")

    # --- kanaal-detectie -----------------------------------------------------
    ok("geen secrets = geen kanalen", configured_channels({}) == [])
    ok("onvolledige SMTP telt niet", configured_channels({"SMTP_HOST": "x"}) == [])
    smtp_env = {"SMTP_HOST": "smtp.x.be", "SMTP_USER": "u", "SMTP_PASS": "p"}
    ok("volledige SMTP = smtp-kanaal", configured_channels(smtp_env) == ["smtp"])
    both = {**smtp_env, "ALERT_WEBHOOK_URL": "https://hook"}
    ok("beide secrets = beide kanalen (redundantie)", configured_channels(both) == ["smtp", "webhook"])
    ok("Telegram (token+chat_id) = telegram-kanaal",
       configured_channels({"TELEGRAM_BOT_TOKEN": "t", "TELEGRAM_CHAT_ID": "c"}) == ["telegram"])
    ok("onvolledige Telegram telt niet", configured_channels({"TELEGRAM_BOT_TOKEN": "t"}) == [])
    ok("CallMeBot (phone+apikey) = whatsapp-kanaal",
       configured_channels({"CALLMEBOT_PHONE": "+32", "CALLMEBOT_APIKEY": "k"}) == ["whatsapp"])
    ok("onvolledige CallMeBot telt niet", configured_channels({"CALLMEBOT_PHONE": "+32"}) == [])
    all_env = {**both, "TELEGRAM_BOT_TOKEN": "t", "TELEGRAM_CHAT_ID": "c",
               "CALLMEBOT_PHONE": "+32", "CALLMEBOT_APIKEY": "k"}
    ok("alle vier kanalen tegelijk", configured_channels(all_env) == ["smtp", "webhook", "telegram", "whatsapp"])

    # --- bericht-opbouw --------------------------------------------------------
    msg = build_message("ond", "body", smtp_env)
    ok("default ontvanger = peter@hoogland.be", msg["To"] == "peter@hoogland.be")
    msg2 = build_message("ond", "body", {**smtp_env, "ALERT_TO": "ander@x.be"})
    ok("ALERT_TO overschrijft de ontvanger", msg2["To"] == "ander@x.be")
    ok("onderwerp en inhoud staan erin", msg["Subject"] == "ond" and "body" in msg.get_content())
    ok("lege ALERT_TO -> default (regressie)", alert_to({"ALERT_TO": ""}) == "peter@hoogland.be")
    ok("ontbrekende ALERT_TO -> default", alert_to({}) == "peter@hoogland.be")
    ok("meerdere ontvangers (komma) blijven behouden", alert_to({"ALERT_TO": "a@x.be,b@y.be"}) == "a@x.be,b@y.be")

    # --- SMTP-poort: lege string mag niet crashen (regressie 18/6: int("") bug) --
    ok("lege SMTP_PORT -> 587 (regressie)", smtp_port({"SMTP_PORT": ""}) == 587)
    ok("ontbrekende SMTP_PORT -> 587", smtp_port({}) == 587)
    ok("gezette SMTP_PORT wordt gebruikt", smtp_port({"SMTP_PORT": "465"}) == 465)

    # --- dispatch (dry-run: nooit echt versturen in tests) ----------------------
    r0 = dispatch("s", "b", {}, dry_run=True)
    ok("zonder secrets: expliciete 'geen kanalen'-melding met vangnet-verwijzing",
       "none" in r0 and "vangnet" in r0["none"])
    r1 = dispatch("s", "b", both, dry_run=True)
    ok("dry-run probeert beide kanalen zonder te versturen",
       r1 == {"smtp": "dry-run: niet verstuurd", "webhook": "dry-run: niet verstuurd"})

    # --- dispatch crasht nooit (kanaal faalt -> gerapporteerd, niet fataal) -----
    bad = {"ALERT_WEBHOOK_URL": "http://127.0.0.1:1/onbestaand"}
    r2 = dispatch("s", "b", bad, dry_run=False)
    ok("falend kanaal wordt gerapporteerd i.p.v. te crashen",
       "webhook" in r2 and r2["webhook"].startswith("FAALDE:"))

    # --- main: exit altijd 0 (alarmering maskeert de oorspronkelijke fout nooit) -
    ok("main exit 0 in dry-run", main(["--subject", "s", "--body", "b", "--dry-run"]) == 0)

    print(f"\n{PASSED}/{PASSED} geslaagd")
    return 0


if __name__ == "__main__":
    raise SystemExit(main_test())
