# TOEGANG-V6 — Toegang & infrastructuur (SBI-barometer)

Begeleidt **HANDOVER-V6**. Actualiseert `TOEGANG-EN-INFRASTRUCTUUR.md`.

## Hosting
- **Primair: Cloudflare Workers static assets** — https://les-hautes-alpes-sbi.brainwolves.workers.dev
  - Config: `app/web/wrangler.jsonc` (`account_id` = `90650c9157a45b740546805924c8c42e` ingebakken; SPA-fallback; `assets.directory: ./dist`).
  - Honoreert `must-revalidate` + propageert instant (reden van de verhuizing van Surge, dat oude deploys ~27 min vastplakte).
- **Vangnet (uit te faseren): Surge** — les-hautes-alpes-sbi.surge.sh (`SURGE_LOGIN: peter@hoogland.be`). Stap mag uit `daily.yml` zodra Cloudflare volledig bevestigd is.

## Repo & toegang
- **GitHub:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main`.
- **`gh` CLI** ingelogd als `PeterHoogland` (gebruik voor deploy-trigger + PR's).
- **Lokale wrangler** login = account "brainwolves" (scope workers:write) voor snelle lokale deploy.

## Repo-secrets (GitHub Actions)
| Secret | Waarvoor | Status |
|---|---|---|
| `LESHAUTES` | Cloudflare API-token (workflow mapt → `CLOUDFLARE_API_TOKEN`) | gezet, werkt |
| `ENTSOE_TOKEN` | ENTSO-E energieprijzen | gezet (energie is echt live) |
| `SURGE_TOKEN` | Surge-vangnet | gezet |
| `CAMPAIGN_WEBHOOK_URL` / `_TOKEN` | campagne-trigger-uitgang (Zapier) | **leeg** → dry-run; Peter levert later de Zapier-URL |
| `ALERT_WEBHOOK_URL` | **NIEUW** — demo-fallback-mail naar peter@hoogland.be | **nog te zetten** (Zapier "Catch Hook → e-mail"); zonder = GitHub-issue-vangnet |

Een URL is geen credential → Claude mag webhook-URL-secrets zetten (afspraak Peter). API-tokens zet Peter zelf.

## CI-workflows (`.github/workflows/`)
- **`daily.yml`** — cron 06:00 + 07:00 UTC (= 08:00 BE, tijd-guard) + `workflow_dispatch`. Stappen: time-guard → `npm run generate-fixture` (echte fetch + build data) → `npm install` web → `npm run build` → **Cloudflare deploy** (token-guarded) → Surge (vangnet) → **persist** (commit `data/history`, cache, trigger-state met `[skip ci]`) → **Demo-fallback alert** (leest `data_quality.indicators_simulated/missing`; bij fallback → POST `ALERT_WEBHOOK_URL`, anders `gh issue create`; altijd in step-summary). `permissions: contents: write, issues: write`.
- **`backfill.yml`** — handmatig (`workflow_dispatch`); draait de Python-backfills in CI (schoon net; de sandbox kan be.STAT/GDELT/ENTSO-E niet bereiken).

## Deployen
- **Aanrader:** committen + `gh workflow run daily.yml --ref main` → CI bouwt + deployt (~7 min). Bevestig live: `curl -s $URL/ | grep -oE "index-[A-Za-z0-9_-]+\.js"` + grep de bundel/`/data/latest.json`.
- **Snelle lokale deploy** (~1 min): in `app/web` verse data trekken van live, `npm run build`, `npx wrangler@latest deploy`. **Daarna** `git checkout -- app/data app/web/public` + `rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json` (gegenereerde data niet committen).

## Datakanalen (wat de site serveert)
- `/data/latest.json` — **publiek** (v0.2-only in test-modus, geen `v04`).
- `/data/latest-expert.json` — **expert/test** (volledige output incl. `v04`); alleen de expert-panelen lezen dit.
- `/data/signal.json` + `/api/v1/signal.json` — embed-API (v04-getallen `null` in test-modus).
- `/data/sparkline-30d.json` — 60-daagse sparkline.
- `app/data/history/{code}.json` — doorlopende baselines (door CI gepersisteerd).

## Belangrijk
- **Sandbox/lokaal kan echte bronnen NIET ophalen** (TLS/rate-limit/tokens) → echte data + backfills draaien in CI.
- `.wrangler/`, `node_modules/`, gegenereerde `latest-expert.json` zijn (de-facto) niet voor code-commits.
