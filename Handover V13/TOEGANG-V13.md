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


---

> # === Volledige TOEGANG-V12-inhoud hieronder (ongewijzigde achtergrond, blijft geldig). De V13-updates hierboven hebben voorrang. ===

# TOEGANG-V12 — Toegang, infrastructuur & valkuilen

Begeleidt `HANDOVER-V12.md`. Alles wat je nodig hebt om te deployen + de valkuilen.

## 1. Toegang
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · **PUBLIEK** (→ GitHub Actions gratis/onbeperkt). `gh` ingelogd als PeterHoogland.
- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers, static assets).
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- **E-mail Peter:** peter@hoogland.be.

## 2. GitHub Actions secrets (`gh secret list`)
| Secret | Status | Waarvoor |
|---|---|---|
| `DELIJN_API_KEY` | ✅ gezet (GTFS-RT v3-key) | De Lijn real-time verstoringen |
| `CLOUDFLARE_API_TOKEN` | ✅ gezet | Cloudflare-deploy (wrangler) |
| `CAMPAIGN_WEBHOOK_URL` | ⛔ nog te zetten (Peter levert de Zapier-hook) | campagne-trigger-uitgang; zonder = dry-run |
| `CAMPAIGN_WEBHOOK_TOKEN` | optioneel | auth voor de webhook |
| `ALERT_WEBHOOK_URL` | optioneel | demo-fallback-mailalert |
| `YOUTUBE_API_KEY` | ⛔ nog te zetten (Peter, Google Cloud gratis) | YouTube-comment-sentiment-bron |

Een secret zetten (Peter hoeft niets te typen, jij doet het): `gh secret set NAAM --body "..."` of `gh secret set NAAM` (interactief). **Nieuwe secrets die de Python-pijplijn moet zien → ook als `env:` toevoegen aan de "Fetch real data"-stap in `daily.yml`** (zoals `DELIJN_API_KEY` nu).

## 3. Deploy-flow
1. Code committen (zie §4 voor de git-dans).
2. `git push origin main`.
3. `gh workflow run daily.yml --ref main` (handmatige trigger; de cron draait sowieso uurlijks 6-21u BE).
4. Wachten ~7 min: `gh run watch <run-id> --exit-status`.
5. Verifiëren op de LIVE URL (nooit op het gecommitte bestand): `curl -s "https://les-hautes-alpes-sbi.brainwolves.workers.dev/data/latest.json?cb=$(date +%s)"`.

De CI: time-guard → checkout → Python deps → `python -m pipeline.run` → engine deps → `npm run generate-fixture` → web deps → `npm run build` → Cloudflare-deploy (+ Surge-vangnet) → persist cache + historie.

## 4. ⚠️ VALKUIL: `sbi-cache.json` skip-worktree (komt nu VAKER voor)
`app/data/sbi-cache.json` heeft `skip-worktree`. De CI commit elke run een cache-/historie-commit, dus `origin/main` schuift constant op — met de **uurlijkse runs nu ~16x/dag**. Bij elke push moet je dus rebasen, en de rebase struikelt over de skip-worktree-vlag + lokale stale cache. **Vaste dans:**
```bash
git fetch origin main
git update-index --no-skip-worktree app/data/sbi-cache.json
git checkout -- app/data/sbi-cache.json     # gooi de lokale stale cache weg (CI regenereert hem)
git rebase origin/main
git update-index --skip-worktree app/data/sbi-cache.json
git push origin main
```
`.claude/settings.local.json` heeft ook skip-worktree maar wordt zelden door de CI geraakt → meestal geen probleem.

## 5. ⚠️ VALKUIL: diagnosticeer NOOIT op het gecommitte `latest.json`
Het gecommitte `app/data/latest.json` kan **stale** zijn (V10 zat hier ooit fout met "3/100"). Gebruik altijd de live URL met cache-bust (`?cb=$(date +%s)`) of regenereer lokaal. `daily.yml` commit `latest.json` bewust nooit terug; CI regenereert het vers.

## 6. Lokale verificatie
- **Engine:** `cd app/engine && npx tsc --noEmit && npm test` (99 vitest-tests).
- **Web:** `cd app/web && npm run build`.
- **Python lexicons:** `cd app/pipeline && python3 tests/test_lexicon_nl.py` (8) + `python3 tests/test_lexicon_emotion.py` (5).
- **Bron-gezondheid-canary (NIEUW):** `python3 app/pipeline/tests/test_healthcheck.py` (18 tests) + handmatig draaien met `cd app/pipeline && python3 -m pipeline.healthcheck` (leest `app/data/raw-values.json` + `latest-expert.json`, schrijft `app/data/health-report.json`, verdict ok/degraded/critical). Live: `curl -s "<live>/data/health-report.json?cb=$(date +%s)"`.
- **Eén fetcher live testen:** `cd app/pipeline && python3 -c "from datetime import date; from pipeline.fetchers import <module>; print(<module>.<fn>(date.today()))"`. Voor De Lijn: `DELIJN_API_KEY=... python3 -c "..."`.
- **Volledige data-gen lokaal:** `cd app/engine && npm run generate-fixture`. **DAARNA reverten:** `git checkout -- app/data app/web/public` + `rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json`. ⚠ Untracked NIEUWE history-bestanden (bv. een lokaal `I-D2-001-rt-intraday.json`) overleven `git checkout` — `rm` ze als je een schone werkboom wil, of laat de CI ze beheren.
- **Preview-server:** `barometer`-config in `.claude/launch.json` (poort 5173) — leest LOKALE (vaak stale) data, niet de live. Stop hem na gebruik; laat geen tab openstaan (verwart).

## 7. Cron / frequentie (V12)
`daily.yml` draait nu `0 * * * *` (elk uur) met een tijd-guard die alleen 06-21u BE doorlaat (`H=$((10#$BE_HOUR)); door bij 6..21`). 16 runs/dag. **Kost: €0** (publieke repo = gratis Actions; alle bronnen gratis; Cloudflare gratis tier). **0 tokens** (geen AI in de pijplijn). Wil je fijnere DATEX-data dan uurlijks: een Cloudflare Cron-Worker (ook gratis) i.p.v. Actions — maar de uurlijkse collector volstaat voor piekdetectie.

## 8. Cloudflare
Deploy via wrangler in de CI (`CLOUDFLARE_API_TOKEN`). De config staat in `app/web/wrangler.jsonc` (account_id erin). Een eventuele aparte cron-Worker (voor 5-15min DATEX) zou een nieuw wrangler-project + KV vereisen; bewust NIET gedaan in V12 (de uurlijkse collector is eenvoudiger). Of de bestaande token dat mag (Workers Scripts + KV edit, account-scope) is onbevestigd — check vooraf als je het ooit bouwt.

## 9. /schedule-taken
Eén actieve geplande taak: `kalibratie-brand-safety-verdriet` (eenmalig, **24 juni 2026 09:00**). Beheer via `mcp__scheduled-tasks__list_scheduled_tasks` of de "Scheduled"-sectie in de app. Draait alleen als de app open is (anders bij de volgende start).
