# TOEGANG-V11 — Infra, deploy, secrets & valkuilen

Begeleidt HANDOVER-V11. Praktisch: hoe deploy je, welke toegang, welke valkuilen. Deltas t.o.v. TOEGANG-V10 met **(V11)**.

## 1. Toegang
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · `gh` ingelogd als **PeterHoogland**.
- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers static assets).
- **Cloudflare:** wrangler-account "brainwolves". Config `app/web/wrangler.jsonc` (account_id ingebakken). CF API-token = repo-secret **`LESHAUTES`** (NIET `CLOUDFLARE_API_TOKEN`; de workflow mapt het).
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`.

## 2. Deploy-flow (standaard)
```
# 1. code wijzigen + lokaal verifiëren (tsc/test/build)
git add <alleen code-bestanden>           # NOOIT app/data of dist
git commit -m "..."
git update-index --no-skip-worktree app/data/sbi-cache.json   # zie §4
git pull --rebase origin main             # origin schuift op door CI-cache-commit
git update-index --skip-worktree app/data/sbi-cache.json
git push origin main
gh workflow run daily.yml --ref main      # CI: fetch echte data → build → Cloudflare (~7 min)
```
- **(V11) Verifieer de live-stand altijd met cache-bust:** `curl -s "https://les-hautes-alpes-sbi.brainwolves.workers.dev/data/latest.json?cb=$(date +%s)"`. Zonder `?cb=` kan je een gecachte versie zien.
- `daily.yml` doet: Python pipeline → engine `npm run generate-fixture` → web `npm run build` → wrangler deploy. Plus time-guard (08:00 BE of handmatige trigger) en demo-fallback-mailstap.
- **(V11) Elke deploy haalt verse data op**, dus het cijfer verschuift tussen deploys (bv. 59 → 64 → 71 op dezelfde dag). Dat is normaal, geen bug.
- **Push-race:** de CI-"persist cache"-stap pusht ook. Doe je een tweede push terwijl een deploy loopt, dan kan je push afgewezen worden (non-fast-forward). Gewoon opnieuw `git pull --rebase` + push. Concurrency-group is `deploy-${ref}` met `cancel-in-progress: false`, dus deploys queuen netjes.

## 3. Lokale data-gen (verificatie) + reverten
```
cd app/engine && npm run generate-fixture       # schrijft app/data/* + app/web/public/data/*
# ... verifieer ...
git checkout -- app/data app/web/public         # ALTIJD reverten
git checkout -- app/data/trigger-state.json     # (V11) deze is tracked, ook reverten
rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json
```
Commit NOOIT lokaal-gegenereerde data.

- **(V11) ⚠️ Preview-server-valkuil.** `barometer`-config in `.claude/launch.json` (poort 5173), of `cd app/web && npm run dev`. **De preview leest de LOKALE data** (vaak het stale gecommitte `latest.json`), NIET de live data. Deze sessie zag Peter de stale 3/100 van een preview-tab aan voor de live site. **Stop de preview na gebruik** en wijs naar de live URL met harde ververs (Cmd+Shift+R).

## 4. ⚠️ Git-valkuil: `app/data/sbi-cache.json` (skip-worktree)
`sbi-cache.json` is tracked **én** heeft `skip-worktree`. `git status` toont het niet, maar `git rebase`/`pull`/`checkout` weigeren met *"would be overwritten"* / *"could not detach HEAD"* zodra de CI-cache-commit het bestand wijzigde (wat bij elke deploy gebeurt).

**Fix (in deze volgorde):**
```
git update-index --no-skip-worktree app/data/sbi-cache.json
git pull --rebase origin main
git update-index --skip-worktree app/data/sbi-cache.json
```
Skip-worktree staat ook op `.claude/settings.local.json`. Check met `git ls-files -v | grep '^S'`.

## 5. ⚠️ (V11) Diagnosticeer nooit op het gecommitte `latest.json`
`daily.yml` commit `latest.json` **bewust nooit** terug (alleen history/cache/trigger-state via "[skip ci]"). Het gecommitte `app/data/latest.json` is dus een **stale leftover** (stond deze sessie nog op 21 mei, 3/100). De live site is altijd vers via CI. **De V10-handover stelde een foute diagnose ("3/100, verkeer-backfill nodig") door op dit stale bestand te kijken.** Gebruik altijd de live URL (`?cb=...`) of regenereer lokaal.

## 6. Sandbox-beperkingen
- **Werkt vanaf de sandbox (getest):** RSS (alle 16), DATEX II v3, Google Trending-RSS, `curl`. **(V11)** Python `urllib`/`requests` faalt op SSL (geen CA-bundle); gebruik `curl` met `/usr/bin/curl`. Vermijd shell-`for`-loops die soms PATH verliezen; gebruik losse `curl`-calls of Python met subprocess.
- **Werkt NIET:** be.STAT/GDELT-rate-limits, pytrends, Itsme-gated DATEX-registratie. → echte data + backfills via **CI**.
- **Python:** geen pytest in de pipeline. Emotie-test standalone: `python3 app/pipeline/tests/test_lexicon_emotion.py`.

## 7. Secrets / nog te zetten
- ✅ `LESHAUTES` (Cloudflare API-token) — gezet.
- ❌ **`CAMPAIGN_WEBHOOK_URL` / `ALERT_WEBHOOK_URL`** — NOG NIET gezet. **Peter levert de Zapier-hook** (Catch Hook → mail naar peter@hoogland.be). **Nodig vóór `mode: live`** (de echte go-live). Zetten: `gh secret set CAMPAIGN_WEBHOOK_URL`.

## 8. Test- & verificatie-commando's
```
cd app/engine && npx tsc --noEmit && npm test        # (V11) 86 groen
cd app/engine && npx tsx src/cli/backtest.ts          # lookahead-vrije backtest (voor drempel-freeze)
cd app/web && npm run build                            # tsc -b + vite
python3 app/pipeline/tests/test_lexicon_emotion.py     # 5 groen
```

## 9. Workflows
- **`.github/workflows/daily.yml`** — dagelijkse fetch + build + deploy (08:00 BE-cron + workflow_dispatch). Scheduled runs vuren wel (geverifieerd).
- **`.github/workflows/backfill.yml`** — historische baselines (workflow_dispatch).

## 10. Snelle "waar is wat"
- Live-stand + de stale-file-vondst + de seizoens-fix: auto-memory `project-percentiel-kwaliteit.md` + `build-status.md`.
- Methodologie + beslissingen: MASTERDOCUMENT-V11. Code-navigatie: CODE-V11. Medialandschap: MEDIA-OVERZICHT-V11.
- De review die alles stuurde: `_PROJECTEN/Client-Werk/LES HAUTES ALPES/perplexit verbetering /SBI_VERBETERPLAN_CLAUDE_CODE.md`.
