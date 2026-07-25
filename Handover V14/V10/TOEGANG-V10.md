# TOEGANG-V10 — Infra, deploy, secrets & valkuilen

Begeleidt HANDOVER-V10. Praktisch: hoe deploy je, welke toegang, welke valkuilen.

## 1. Toegang
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · `gh` is ingelogd als **PeterHoogland**.
- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers static assets).
- **Cloudflare:** wrangler-account "brainwolves". Config `app/web/wrangler.jsonc` (account_id ingebakken). Lokale deploy mogelijk via `cd app/web && npx wrangler deploy` (~1 min), maar gebruik liever de CI.
- **CF API-token = repo-secret `LESHAUTES`** (NIET `CLOUDFLARE_API_TOKEN`; de workflow mapt het). `.wrangler/` is gegitignored.
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`.

## 2. Deploy-flow (standaard)
```
# 1. code wijzigen + lokaal verifiëren (tsc/test/build)
git add <alleen code-bestanden>
git commit -m "..."
git push origin main
gh workflow run daily.yml --ref main      # CI: fetch echte data → build → Cloudflare (~7 min)
```
- `daily.yml` doet: Python pipeline (`python -m pipeline.run`) → engine `npm run generate-fixture` → web `npm run build` → wrangler deploy. Plus een time-guard (alleen 08:00 BE of handmatige trigger) en een demo-fallback-mailstap.
- **De CI commit dagelijks data terug** ("persist cache + historie [skip ci]"). Daardoor schuift `origin/main` vaak op terwijl je werkt → `git pull --rebase` vóór push. Zie §4 voor de cache-valkuil.
- **Verkeerde/dubbele deploy?** `gh run cancel <id>`. Concurrency-group is `deploy-${ref}`.

## 3. Lokale data-gen (verificatie) + reverten
De engine kan lokaal een fixture maken zodat je in de preview kan checken:
```
cd app/engine && npm run generate-fixture       # schrijft app/data/* + app/web/public/data/*
# ... verifieer in preview ...
git checkout -- app/data app/web/public         # ALTIJD reverten (echte data komt via CI)
rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json
```
Commit NOOIT lokaal-gegenereerde mock-data. Preview-server: `cd app/web && npm run dev` (poort 5173) of de `barometer`-config in `.claude/launch.json`.

## 4. ⚠️ Git-valkuil: `app/data/sbi-cache.json` (skip-worktree)
`sbi-cache.json` is tracked **én** heeft de `skip-worktree`-vlag (zodat lokale cache-churn de tree niet vervuilt). Maar pipeline-/fetcher-**tests** schrijven ernaar via `cache_put`. Gevolg: `git status` toont het niet (vlag), maar `git rebase`/`checkout`/`merge` weigeren met *"Your local changes to app/data/sbi-cache.json would be overwritten"* / *"could not detach HEAD"*.

**Fix (in deze volgorde):**
```
git update-index --no-skip-worktree app/data/sbi-cache.json
git checkout -- app/data/sbi-cache.json
git pull --rebase origin main      # of git rebase origin/main
git push origin main
git update-index --skip-worktree app/data/sbi-cache.json   # vlag herstellen
```
Beter nog: draai geen fetcher-tests die `cache_put` aanroepen vóór een commit, of clear de vlag preventief.

## 5. Sandbox-beperkingen (wat lokaal wél/niet werkt)
- **Werkt vanaf de sandbox/server (getest):** RSS-feeds (alle 16), DATEX II v3 (`verkeerscentrum.be/uitwisseling/datex2v3`), Google Trending-RSS (`trends.google.com/trending/rss?geo=BE`), `requests` is geïnstalleerd.
- **Werkt NIET vanaf de sandbox:** be.STAT/GDELT-rate-limits, pytrends (server-IP-blokkade), Itsme-gated DATEX-registratie, de oude `miv.opendata.belfla.be`-host. → echte data + backfills komen via **CI** (`backfill.yml`, workflow_dispatch).
- **Python:** 3.13, geen pytest. Emotie-test draait standalone: `python3 app/pipeline/tests/test_lexicon_emotion.py`.

## 6. Secrets / nog te zetten
- ✅ `LESHAUTES` (Cloudflare API-token) — gezet.
- ❌ **`ALERT_WEBHOOK_URL` / `CAMPAIGN_WEBHOOK_URL`** — NOG NIET gezet. **Peter levert de Zapier-hook** (Catch Hook → mail naar peter@hoogland.be). Geparkeerd; zolang leeg blijven trigger-/demo-fallback-meldingen dry-run (loggen, versturen niet). **Nodig vóór `mode: live`.**
  - Zetten: `gh secret set CAMPAIGN_WEBHOOK_URL` (+ evt. `ALERT_WEBHOOK_URL`).

## 7. Test- & verificatie-commando's
```
cd app/engine && npx tsc --noEmit && npm test        # 76 groen
cd app/engine && npx tsx src/cli/backtest.ts          # lookahead-vrije backtest
cd app/web && npm run build                            # tsc -b + vite
python3 app/pipeline/tests/test_lexicon_emotion.py     # 5 groen (emotie-lexicon)
python3 -m py_compile app/pipeline/pipeline/**/*.py     # snelle syntax-check
```

## 8. Workflows
- **`.github/workflows/daily.yml`** — dagelijkse fetch + build + deploy (08:00 BE-cron + workflow_dispatch).
- **`.github/workflows/backfill.yml`** — historische baselines (workflow_dispatch). Hier komt de nieuwe `backfill_datex_traffic.py`-aanroep.

## 9. Snelle "waar is wat"
- Live-stand + V10-changes: auto-memory `build-status.md` (+ MEMORY.md index).
- Methodologie + beslissingen: MASTERDOCUMENT-V10.
- Code-navigatie: CODE-V10.
- De review die alles stuurde: `_PROJECTEN/Client-Werk/LES HAUTES ALPES/perplexit verbetering /SBI_VERBETERPLAN_CLAUDE_CODE.md`.
