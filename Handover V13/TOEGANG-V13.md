# TOEGANG-V13 — Toegang, infrastructuur & valkuilen (deltas sinds V12)

Begeleidt `HANDOVER-V13.md`. TOEGANG-V12 blijft geldig; dit doc = wat deze sessie veranderde.

## 1. Cloudflare Cron-Worker (NIEUW — de betrouwbare uurlijkse trigger)
- **Worker:** `lhaa-sbi-cron` → `https://lhaa-sbi-cron.brainwolves.workers.dev`. Bron: `app/cron-worker/`. Cron `0 4-20 * * *` UTC (= 06-21u BE, zomer+winter; de tijd-guard in daily.yml filtert exact). Trapt `daily.yml` af via `workflow_dispatch`.
- **Deploy:** `cd app/cron-worker && npx wrangler@4 deploy`. (wrangler is lokaal OAuth-ingelogd; account_id `90650c9157a45b740546805924c8c42e`.)
- **Secret `GITHUB_DISPATCH_TOKEN`** (GEZET door Peter): GitHub fine-grained PAT, enkel Actions:Read+Write op de repo. Zetten/roteren: `cd app/cron-worker && npx wrangler@4 secret put GITHUB_DISPATCH_TOKEN`. Aanmaken: https://github.com/settings/personal-access-tokens/new. Check: `npx wrangler@4 secret list`; `curl https://lhaa-sbi-cron.brainwolves.workers.dev/` → "secret gezet".
- **Waarom:** GitHub's `schedule`-cron is best-effort en sloeg uren over → cijfer ververste niet. De Worker is exact + computer-onafhankelijk. De GitHub-schedule (`30 * * * *`) blijft enkel als dead-man's-switch.

## 2. De autonome lus (elke run, computer-uit)
Worker → daily.yml → pipeline (fetch) → generate-fixture → **canary** (bron-gezondheid) → build → deploy → persist → **alarm** (rollende issue + run-rood-bij-critical) → **verify_live** (eindresultaat, faalt run bij fout). Peter krijgt enkel een mail/issue als er iets stuk is.

## 3. Lokale verificatie (uitgebreid)
- Engine: `cd app/engine && npx tsc --noEmit && npm test` (99).
- Web: `cd app/web && npm run build`.
- **Canary:** `python3 app/pipeline/tests/test_healthcheck.py` (18) + handmatig `cd app/pipeline && python3 -m pipeline.healthcheck`.
- **Live-eindresultaat:** `cd app/pipeline && python3 -m pipeline.verify_live`.
- Eén fetcher: `cd app/pipeline && python3 -c "from datetime import date; from pipeline.fetchers import <module>; print(<module>.<fn>(date.today()))"`.

## 4. ⚠️ VALKUILEN (nieuw/extra deze sessie)
- **Git-dans + `tail`:** pipe `git rebase origin/main` NOOIT naar `tail`/iets — de pipe maskeert de conflict-exitcode en de `&&`-keten loopt door (push faalde stil, een stray run vuurde). Doe `git rebase origin/main` kaal en check de exit.
- **Conflict op her-backfilled history-bestand** (I-D1-004/I-D1-009): de CI append't dagelijks → rebase-conflict op die history. Oplossen: `cp /tmp/<backfill>.json app/data/history/<code>.json` (jouw versie), `git add`, `GIT_EDITOR=true git rebase --continue`.
- **Shell = zsh:** `for n in $VAR` splitst NIET op witruimte (zsh-gedrag). Gebruik `... | while read n; do ...; done` of `${=VAR}`. (Brak de bulk-issue-close.)
- **GitHub secondary rate-limit:** snelle bulk gh-mutaties (issues sluiten) falen; zet een `sleep` ertussen.
- **`-c` is geen short flag voor `gh issue close`** → gebruik `--comment`.
- **Push naar main = productie-deploy** → de safety-classifier kan om expliciete toestemming vragen.

## 5. /schedule-taken (geplande beoordelingen)
- `kalibratie-brand-safety-verdriet` — 24 juni 2026 (V12).
- **`promoveer-sciensano-pollen-cijfer` — 8 augustus 2026 09:00 (NIEUW):** beoordeelt of de Sciensano-pollen-baseline ≥60 dagen + seizoens-oké is om CAMS in het cijfer te vervangen. Bereidt voor, wijzigt niets autonoom. Beheer via `mcp__scheduled-tasks__list_scheduled_tasks` of de "Scheduled"-sectie. (Draait als de app open is / bij volgende start.)

## 6. Secrets (`gh secret list`)
DELIJN_API_KEY ✅, LESHAUTES (Cloudflare-deploy) ✅, SURGE_TOKEN ✅, CAMPAIGN_WEBHOOK_URL ⛔ (Peter, voor go-live campagne), ALERT_WEBHOOK_URL optioneel, YOUTUBE_API_KEY ⛔. **GITHUB_DISPATCH_TOKEN** = Cloudflare-Worker-secret (niet in GitHub).
