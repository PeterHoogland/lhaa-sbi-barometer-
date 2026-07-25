# ARCHITECTUUR-EN-BOUWEN-V15 (voor de programmeur)

Alles wat een ontwikkelaar nodig heeft om het systeem te begrijpen, lokaal te draaien, te testen en te deployen. Geen em-dashes, je-vorm.

## 1. Wat het is, in één zin

Een dagelijkse samengestelde index (0-100) over de maatschappelijke omstandigheden in Belgie, berekend uit ongeveer 20 publieke databronnen, gepubliceerd als JSON plus een React-site op een Cloudflare Worker, en 6x/dag automatisch ververst door CI.

## 2. Stack en repo-structuur

Repo: `~/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/` (branch `main`, GitHub `PeterHoogland/lhaa-sbi-barometer-`). Let op de spaties in het pad: quote het altijd in de shell.

```
app/
  pipeline/        Python: haalt ruwe data op, bouwt per-indicator historie
    pipeline/
      run.py           entrypoint: fetch alle bronnen -> raw-values.json + history/*.json
      fetchers/        per-bron fetchers (incl. delijn.py, stib.py, verkeer/DATEX, ...)
      cache.py, util.py, healthcheck.py, verify_live.py, alert.py, agentic_monitor.py
      lexicon_*.py     NL/FR sentiment-lexicons (Pattern.nl e.a.) voor de nieuwstoon
    tests/             12 standalone suites: python3 tests/test_<naam>.py
    requirements.txt
  engine/          TypeScript: rekenkern (normaliseren, aggregeren, publiceren)
    src/
      index.ts, runtime.ts, publish.ts, types.ts, webhook.ts
      indicators/      registry.ts (single source of truth) + per-indicator defs
      methodology/     de wiskunde (hybrid-headline.ts = het hoofdcijfer, zie onder)
      cli/             compute-daily.ts, generate-fixture.ts, backtest.ts
    test/              14 vitest-bestanden (206 tests)
  web/             React + Vite SPA, geserveerd door een Cloudflare Worker
    src/
      App.tsx, main.tsx, copy.ts, types.ts
      components/      alle UI (ConditionLevelDisplay, HeroBanner, ButtonPanels, ...)
      lib/             explainer.ts, kern.ts, format-date.ts
      styles.css
    public/            statische assets, incl. embed/ (banner.js + index.html)
    index.html, wrangler.jsonc
  cron-worker/     Cloudflare Worker die op schema daily.yml triggert (workflow_dispatch)
  data/            CI-beheerde data (history/, raw-values.json, latest*.json, sbi-cache.json)
.github/workflows/   daily.yml (fetch-build-deploy), monitor.yml (20 min), backfill.yml
00_..09_*.md         de pre-registratie + Laag-documenten (de bindende specificatie)
CHANGELOG.md         audit-trail (nieuwste bovenaan)
OSF_PUBLICATIE/      bevroren publicatiepakket + SHA256-MANIFEST.txt
```

## 3. Dataflow (hoe een cijfer ontstaat)

1. **Pipeline (Python)** `app/pipeline/pipeline/run.py`: haalt elke bron op via fetcher-ladders (live, dan cache, dan mock-fallback, alles gevlagd). Schrijft `app/data/raw-values.json` en groeit per indicator `app/data/history/<code>.json`.
2. **Engine (TS)** `app/engine/src/cli/generate-fixture.ts`: leest de historie, doet MAD-z/eCDF-normalisatie plus winsorisatie, berekent `daily_pressure` (hybride dagkop), `broad_pressure`, `economic_pressure`, het relatieve percentiel, onzekerheid (bootstrap) en de tier. Schrijft de publieke output: `latest.json`, `latest-expert.json`, `sparkline-30d.json`.
3. **Web (React)** `app/web`: leest die JSON en toont het cijfer. De Cloudflare Worker serveert zowel de SPA als de JSON onder `/data/`.
4. **CI** `daily.yml`: doet 1, 2, 3 plus deploy van de Worker. De `cron-worker` triggert dit op schema; een push naar `main` triggert het ook (en deployt meteen).

De rekenkern is deterministisch: geseed op de observatiedatum, geen `Date.now()`/`Math.random()` in de kern. Zelfde input geeft hetzelfde getal.

## 4. Lokaal draaien, bouwen, testen

```bash
# Engine (TypeScript)
cd app/engine
npm install
npx tsc --noEmit          # typecheck
npm test                  # vitest, verwacht 206/206 (14 bestanden)
npm run generate-fixture  # de dag-compute (duurt ongeveer 150s door de grote historie)

# Pipeline (Python)
cd app/pipeline
pip install -r requirements.txt
for t in tests/test_*.py; do python3 "$t" >/dev/null || echo "FAAL: $t"; done   # 12 suites
python3 pipeline/run.py   # haalt de bronnen op (sommige vereisen een API-key, anders mock)

# Web (React/Vite)
cd app/web
npm install
npm run dev               # lokale dev-server
npm run build             # tsc -b && vite build -> dist/
npm run preview           # serveert de productie-build lokaal
```

Belangrijke env/secrets (GitHub Actions secrets; lokaal optioneel, anders mock-fallback): `DELIJN_API_KEY` (De Lijn), `CLOUDFLARE_API_TOKEN` (deploy, gemapt vanuit repo-secret LESHAUTES), SMTP_* of `ALERT_WEBHOOK_URL` (alerting), `CAMPAIGN_WEBHOOK_URL/TOKEN` (campagne-trigger), `SBI_STRICT_REAL` (de go-live-schakelaar, zie sectie 6).

## 5. Deploy

- **Automatisch:** push naar `main` -> `daily.yml` (job `fetch-build-deploy`) draait pipeline plus engine, bouwt `app/web`, deployt via `npx wrangler@4 deploy`. Een Surge.sh-stap loopt als tijdelijk vangnet mee.
- **Cron:** de `cron-worker` (Cloudflare) roept `daily.yml` aan op de geplande tijden (07/08/12/15/17:30/20u BE). De GitHub-cron in daily.yml is een best-effort fallback.
- **monitor.yml** draait elke 20 min als onafhankelijke bewaker (compute/deployt niet zelf; hertriggert daily.yml zo nodig).

## 6. De automatische go-live (SBI_STRICT_REAL, datum-gegrendeld)

In `daily.yml` staat vlak voor de `generate-fixture`-step een gate-step die `SBI_STRICT_REAL=1` in `$GITHUB_ENV` zet zodra de Brusselse datum >= 2026-06-22. De engine leest die vlag in `app/engine/src/cli/generate-fixture.ts` (`process.env.SBI_STRICT_REAL === "1"`): in strict-real worden synthetische fallback-waarden NIET geinjecteerd (codes zonder echte dagwaarde tellen als "ontbreekt", `indicators_simulated` wordt leeg). Het laat de build niet falen. Terugdraaien = de gate-step verwijderen.

## 7. De rekenkern-bestanden (`app/engine/src/methodology/`)

- `hybrid-headline.ts`: de hybride dagkop (het hoofdcijfer). `HYBRID_W_FAST = 0.30`.
- `economic-pressure.ts`: broad_pressure/economic_pressure (Phi, MAD-z vs vaste baseline).
- `zscore.ts`, `winsorize.ts`, `ecdf.ts`, `stl.ts`, `baseline-window.ts`: normalisatie.
- `seasonal-percentile.ts`, `percentile.ts`, `composite.ts`, `weights.ts`: relatieve laag.
- `kern-composite.ts`, `kern-weights.ts`, `tier.ts`, `triggers.ts`: v0.4 kern/trigger-laag.
- `bootstrap.ts`: onzekerheid. `reference-audit.ts`: zelf-reproductie-canary.
- `condition-level.ts`, `brand-safety.ts`, `smoothing.ts`, `demographic-reach.ts`.

## 8. Conventies en valkuilen (HARDE regels, zie ook CLAUDE.md)

1. **Geen nepdata als echte meting.** Ontbrekend = `null` + `*_status: "not_computed"`, of expliciet gevlagd (`simulated`/`imputed`). Geen stille forward-fill.
2. **Pre-registratie-discipline:** geen indicator toevoegen, herdefiniëren of herwegen zonder amendement in `00_Pre-Registratie.md` §4.1 + CHANGELOG-entry. `registry.test.ts` faalt bewust bij een stille wijziging.
3. **Schaaldiscipline (Hitte-bug-klasse):** een baseline en zijn dagwaarde moeten exact dezelfde transformatie plus meetset hebben. Meng nooit reeksen van verschillende maten. Check ook de synthetische fallbacks in `generate-fixture.ts`.
4. **Verificatie verplicht na elke engine-wijziging:** `npx tsc --noEmit && npm test` groen (206). Pipeline-wijziging: alle `tests/test_*.py`. Web-wijziging: `npm run build` plus visuele check.
5. **Diagnosticeer nooit op gecommitte JSON.** Altijd de live URL met cache-bust; lokale `app/data/*.json` zijn meestal stale.
6. **Git:** één taak = één commit + CHANGELOG-regel. CI-beheerde bestanden na lokale smoketests terugzetten met `git checkout --` (bewuste backfills uitgezonderd). `sbi-cache.json` heeft skip-worktree. Altijd `git pull --rebase origin main` vóór push.
7. **Geen em-dash in user-facing copy** (gepind door `test/evidence.test.ts` + `test/brand-safety.test.ts`). JSX-witruimteval: tekst na `{expr}` op een nieuwe regel verliest zijn spatie, gebruik `{" "}`.
8. **Geen overspannen claims:** meet blootstelling, niet individueel ervaren stress; geen causale of fysiologische claim.
9. **GDELT (I-D5-001) en `data/history/I-D5-001.json` bevroren** zonder expliciete goedkeuring van Peter.
10. **OSF-manifest-discipline:** zolang `OSF_PUBLICATIE/` niet geüpload is, hoort elke wijziging aan docs 00-09 bij een herberekening van `SHA256-MANIFEST.txt` (zelfde commit).

## 9. Verder lezen

- Bindende specificatie: `00_Pre-Registratie.md` (§4.1 amendementen t/m 4.1.15) + Laag-docs 01-09.
- Wetenschappelijke uitleg: `10_METHODOLOGIE_EN_VALIDATIE_VOOR_WETENSCHAPPERS.md` (repo) of de 2 .docx in `~/Desktop/Voor Jelle - Nationale Stress Index/`.
- Audit-trail: `CHANGELOG.md`. Werkcontext + harde regels: `CLAUDE.md`.
- Dagelijkse sessieverslagen van de 0.3.x/0.4.x-evolutie: `~/Desktop/De Nationale Stress Barometer/`.
