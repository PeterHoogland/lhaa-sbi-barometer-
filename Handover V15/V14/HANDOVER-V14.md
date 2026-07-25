# HANDOVER-V14 — Les Hautes Alpes SBI-barometer

**Lees dit eerst in een nieuwe sessie.** Vervolg op `Handover V13/` (HANDOVER-V13 + CODE-V13 + TOEGANG-V13 + MASTERDOCUMENT-V13 + MEDIA-OVERZICHT-V13 blijven geldig voor de diepere architectuur, methodologie en medialaag; die ketenen terug naar V12). Datum: 2026-06-04 (grote sessie: de open Hitte-bug gefixt + een volledig autonome, zelf-helende bewaking gebouwd + de weerketen Belgisch-eerst gemaakt + de AI-laag aangezet).

- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · PUBLIEK · `gh` als PeterHoogland.
- **Root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- 🎯 **GO-LIVE: 22 juni 2026** met v0.2 (test, eerlijk getoond).
- **Schrijfstijl Peter:** je-vorm, neutraal, GEEN em-dashes, eerlijk/specifiek.
- **HEAD na deze sessie:** `e1337f5`.

---

## 0. TL;DR — stand na deze sessie

1. **Het cijfer is gezond, eerlijk en draait VOLLEDIG AUTOMATISCH, computer-uit.** Vandaag rond 69-71 (seizoens-percentiel). 25 gescoorde indicatoren. Alle data echt; bij een bronstoring valt het systeem terug op een echte tweede bron of de eigen cache, altijd eerlijk gelabeld.
2. **De V13-Hitte-bug is GEFIXT** (valse "uitzonderlijk hoog"). Percentiel zakte van een vals opgeblazen 81 naar het eerlijke 69.
3. **De bewaking is nu een strakke, zelf-helende hartslag:** elk uur verversen van 06:00 t/m 20:00 BE, een gemiste update herstelt binnen ~20 min vanzelf, en je krijgt een mail als er echt iets stuk is. Vier onafhankelijke trigger-kansen per uur.
4. **De weerketen is Belgisch-eerst en drievoudig echt:** KMI/RMI synop (Belgisch, primair) → open-meteo → MET Norway → neutrale 0. Open-meteo is recurrent flaky (502); dat is nu onschadelijk.
5. **De AI-laag (Claude) staat AAN** (`ANTHROPIC_API_KEY` gezet) en draait computer-uit in de cloud-monitor. Kosten: praktisch €0, bovengrens ~€1-2/maand. De rest is gratis.
6. **Kritiek pad blijft de campagne-kant** (Zapier-hook + drempels bevriezen + mode:live). Wacht op Peter.

**Laatste live-eindcontrole deze sessie (`verify_live`): 🟢 groen** — percentiel 69, 25 indicatoren, composiet = som van de bijdragen (Δ=0), vers, alles verwerkt. Canary `degraded` (enkel GDELT op cache, bekend/benigne). 26 van 29 bronnen op verse echte data; 3 veilig opgevangen (CPI 185d oud want de bron publiceert niet sneller; GDELT-toon + -events op cache).

---

## 1. Wat deze sessie (V14) gebouwd + gedeployed is

### 1.1 Hitte-bug gefixt — RAAKTE HET CIJFER (commit `52487c1`)
Symptoom (Peter zag het): I-D1-002 (Hitte) toonde live "uitzonderlijk hoog" (z=3, raw 26) terwijl het 0°C-delta was. **Oorzaak:** open-meteo gaf 502 → `kmi.py` viel terug op mock → `generate-fixture` negeert simulated-waarden en vulde de fallback `syntheticRawValue("I-D1-002")` in, die de **rauwe Tmax** (~26 in juni) gaf i.p.v. de heat-excess `max(0, Tmax−30)`. Een temperatuur gescoord tegen een delta-baseline (mediaan 0, SD 0,35) = valse z=3 → +0,08 dat het cijfer opblies. **Fix:** `syntheticRawValue` voor I-D1-002/I-D1-003 mirror't nu de fetcher-delta (synth een Tmax/Tmin, pas dezelfde drempel toe) → vrijwel altijd 0. Ook de latente tweeling **I-D1-009 (water)** meegefixt (stond nog op GloFAS-schaal ~1.0 vs de nieuwe VMM+SPW-mediaan 23). Geverifieerd in beide paden (echt + simulated). Percentiel 81→69.

### 1.2 Kou "ontbreekt"→"normaal" + top-3 klikbaar (commit `2856773`)
- **Kou (I-D1-003):** de baseline heeft amper variatie (Brussel zakt zelden onder −5°C) → robuuste schaal NaN → las "ontbreekt" (alsof data mist). In `runtime.ts`: bij een platte baseline + dagwaarde ≤ mediaan scoor je nu z=0 ("normaal/geen uitschieter") i.p.v. "ontbreekt". **Cijfer-neutraal** (z=0, vaste domeingewichten 1/n). Een waarde BOVEN een platte baseline blijft "ontbreekt" (review §4.1 gerespecteerd).
- **Top-3 "Wat speelt vandaag het meest mee?"** is nu klikbaar en opent hetzelfde detailvenster als de volledige indicatorlijst. Detailblok geëxtraheerd naar een gedeelde component `IndicatorDetail.tsx` (DRY; `IndicatorList` gebruikt hem ook, met `hideWhy` in de top-3).

### 1.3 verify_live-vangrail tegen de hele schaal-bug-klasse (commit `68b904f`)
`verify_live.py` check #9: een `simulated` indicator met state `extreem` = schaal-bug (een fallback hoort climatologisch/neutraal te zijn) → faalt de run autonoom, elke uur → run rood → GitHub mailt. Vangt de Hitte-klasse ook bij toekomstige indicatoren/bron-swaps. Test `test_gesimuleerd_extreem_faalt` (11/11 verify_live-tests).

### 1.4 Belgisch-eerste, drievoudig-echte weerketen (commits `349f337` + `3e01221`)
Peter: "ga ervan uit dat open-meteo niet werkt en grijp meteen in" + "alle bronnen Belgisch". `kmi.py` heeft nu een keten van ECHTE bronnen op dezelfde delta-schaal:
1. **KMI/RMI synop Ukkel** = volledig Belgische primaire bron. Open WFS van opendata.meteo.be (`service/wfs`, typeName `synop:synop_data`, station Ukkel **6447**, `cql_filter=code=6447 AND timestamp AFTER <gisteren>`, `outputFormat=application/json`). **GEEN sleutel/registratie** (de oude "KMI vereist registratie"-aanname was achterhaald). Tmax/Tmin uit de uurlijkse `temp`.
2. **open-meteo** (fallback).
3. **MET Norway / Yr** (`api.met.no/weatherapi/locationforecast/2.0/compact`, gratis, geen sleutel, **User-Agent verplicht**, andere infrastructuur dan open-meteo).
4. Pas als alle drie plat liggen → neutrale 0 (simulated, delta-schaal).

Live bewezen tijdens een open-meteo-502: Ukkel 17,2/13,2 → Hitte/Kou 0, `simulated=False`, `indicators_simulated:[]` (100% echte data ondanks uitgevallen primair).

### 1.5 Autonome, zelf-helende bewaking (commits `85a0994` + `f904eb2` + `e1337f5`) — de kern van deze sessie
- **`.github/workflows/monitor.yml` (NIEUW):** een ONAFHANKELIJKE workflow op een eigen cron, los van daily.yml en de Cloudflare-Worker. Draait `app/pipeline/pipeline/agentic_monitor.py`.
- **`agentic_monitor.py` (NIEUW), twee lagen:**
  - DETERMINISTISCH (altijd, geen sleutel): hergebruikt `verify_live.assess()` voor de harde checks; bij stale data (>45 min) of een gefaalde run hertriggert hij daily.yml via de GitHub-API (eigen token, los van de Worker). Hertrigger begrensd tot **06-20u BE** (zoneinfo Europe/Brussels). Hard probleem → exit non-zero → mail.
  - AGENTISCH (optioneel, alleen mét `ANTHROPIC_API_KEY`): Claude (haiku-4-5) geeft een begrijpelijke gezondheidslezing + subtiele-anomalie-check. **Alleen aangeroepen bij een probleem of hertrigger** (kostenbesparing). Faalt de API → stil overslaan.
- **De strakke hartslag (`e1337f5`):** monitor draait nu **elke 20 min overdag** (`7,27,47 4-19 * * *` UTC ≈ 06-21u BE). Een gemiste update herstelt zo binnen ~20 min i.p.v. een vol uur. Reden: gratis schedulers (Cloudflare-Worker cron ÉN GitHub-schedule) zijn allebei best-effort en slaan af en toe een uur over. Er is geen gratis trigger die gegarandeerd elk uur vuurt; de oplossing is redundantie + snelle zelf-heling. De daily.yml-schedule ging `30`→`3,33` (2x/uur). Tests `test_agentic_monitor.py` (5/5).

### 1.6 Update-venster 06:00-20:00 BE (commit `41f2545`)
Peter wil de updates op het hele uur van 06:00 t/m 20:00. De tijd-guard in `daily.yml` ging van 06-21 naar **06-20** (skip schedule-events bij H>20). De Cloudflare-Worker trapt op :00 af; de verse cijfers landen enkele minuten later (fetch+rekenen+deploy).

### 1.7 AI-laag aan + campagne-trigger getest + klant-Word-doc
- **`ANTHROPIC_API_KEY` GEZET** (Peter leverde de key; gevalideerd, status 200, heeft krediet). De AI-laag draait nu computer-uit in monitor.yml. **De key stond in de chat → bij gelegenheid roteren** (console.anthropic.com). Eventueel een maandelijkse uitgavenlimiet zetten in de console.
- **Campagne-trigger getest (dry-run):** een tijdelijk `_campaign-test.ts` (opgeruimd) bouwde via de ECHTE `dispatchTriggers`-code de `lhaa-sbi-webhook/v1`-payload bij een gesimuleerde P92-piek. Resultaat: `requires_manual_approval: true` in test-modus → de rem werkt. De externe aflevering naar webhook.site werd door de safety-classifier geblokt → de echte aflevertest doe je tegen Peters eigen Zapier-Catch-Hook (zie §5).
- **Klant-uitleg V1 (eenvoudige taal, voor een 15-jarige):** `Handover V13/SBI-uitleg-voor-de-klant-V1.docx` (+ `.md`). Bevat: wat het meet, waar de data vandaan komt, hoe het één cijfer wordt, wat het NIET is, **de bewaking + het agentic systeem (de controlesystemen)**, en de methodologie kort. NIET gecommit (Peters communicatie, ter review). Gebouwd met de docx-skill (docx-js).

---

## 2. De autonome lus (computer-uit) — hoe alles draait

**Trigger (4 onafhankelijke kansen/uur):** Cloudflare cron-Worker `lhaa-sbi-cron` (`0 4-20 * * *` UTC, op :00) + GitHub-schedule daily.yml (`3,33 * * * *`, dead-man's-switch) + de monitor die elke 20 min hertriggert bij stilstand. Alles in de cloud, geen computer nodig.

**Pijplijn (`daily.yml`):** time-guard (06-20u BE) → checkout → Python deps → `python -m pipeline.run` (fetch echte data) → `npm run generate-fixture` (engine + 730d-reconstructie + vandaag) → **canary** (`healthcheck.py`) → web build → Cloudflare-deploy (+ Surge-vangnet) → persist cache+historie → **alarm** (rollende issue + run-rood-bij-critical) → **verify_live** (eindresultaat-controle op de LIVE site).

**Bewaking (3 checks/uur + de hartslag):** verify_live (einde van elke run) + de agentic monitor (elke 20 min, eigen klok, hertriggert + AI-lezing) + de canary (elke run). Echt probleem → mail. Verloren bron → echte tweede bron of cache (eerlijk gelabeld). Gemiste update → auto-hertrigger binnen ~20 min.

**Eén bewuste grens:** het systeem wijzigt NOOIT zelf code en past het publieke cijfer NOOIT autonoom aan. Het detecteert, hertriggert en alarmeert; een echte bug fixt een mens (met Claude) met zorg + deploy-verificatie.

---

## 3. Complete bestands- & componenten-inventaris

### 3.1 Python-pijplijn (`app/pipeline/pipeline/`)
**Fetchers (`fetchers/`):** kmi (weer, KMI-synop→open-meteo→MET Norway), irceline (lucht, Belgisch), waterinfo (water, VMM+SPW), pollen (CAMS) + sciensano_pollen (Belgisch secundair), verkeerscentrum (filezwaarte-jaar), datex_traffic (dagverkeer secundair + intra-dag), irail (trein), stib + delijn (OV secundair), fod_economie (brandstof), statbel (CPI/werkloosheid), energy_charts (energie), fod_waso (ontslagen-proxy, grade D), nbb (hypotheek), elia (stroomnet), consumer_confidence (NBB/Eurostat, I-D3-007), gdelt (nieuwstoon I-D5-001 + events I-D5-003 + emotie/verdriet/RSS-secundair), wikipedia (I-D5-002), events (gebeurtenis-kandidaten), reddit + mastodon + google_trends + layoff_radar (secundair).
**Modules:** `run.py` (orkestratie), `util.py` (safe_request, seasonal_noise), `cache.py`, `media_profiles.py` (reach + lang + poststratify), lexicons (`lexicon_nl/_pattern_nl/_emotion_nl/_fr/_pattern_fr`), **`healthcheck.py` (canary)**, **`verify_live.py` (eindcontrole + vangrail #9)**, **`agentic_monitor.py` (NIEUW V14, de waakhond)**.
**Tests (`tests/`):** test_healthcheck (18), test_verify_live (11, +vangrail), **test_agentic_monitor (5, NIEUW)**, test_lexicon_nl (8), test_lexicon_emotion (5).

### 3.2 TS-engine (`app/engine/src/`)
**Kern:** `runtime.ts` (computeDaily; V14: platte-baseline→z=0), `types.ts`, `index.ts`, `webhook.ts` (campagne-uitgang, `lhaa-sbi-webhook/v1`).
**`indicators/`:** registry, plain-language, kern, deterministic.
**`methodology/`:** zscore (MAD→IQR→SD-fallback), composite, weights, kern-weights/-composite, percentile, seasonal-percentile, stl, winsorize, tier, baseline-window, condition-level, demographic-reach, brand-safety, triggers.
**`cli/`:** **`generate-fixture.ts`** (HET live-pad; V14: syntheticRawValue delta-fix I-D1-002/003/009), compute-daily, backtest.
**`data/`:** calendar-be.ts.
**Tests (`test/`):** engine (34), v04 (30), brand-safety (13), webhook (12), seasonal (10) = 99 vitest.

### 3.3 Web (`app/web/src/`)
**Components:** ConditionLevelDisplay, PercentileDisplay, TopInfluences (V14: klikbaar), **IndicatorDetail (NIEUW V14, gedeeld)**, IndicatorList, IndicatorZView, KernIndicators, DomainContributions, SecondarySignals, AllSources, ScienceReferences, DataQuality, Methodology, BrandSafetyBanner, CallToAction, HeroBanner, LHALogo, MountainDivider, Sparkline, TierIndicator, PlainExplainer, PreviewPage, Sections, ButtonPanels, V04Technical.
**lib:** explainer, format-date, kern. **styles.css** (V14: `.top-summary/.top-aside/.top-toggle` voor de klikbare top-3).

### 3.4 Infra
**Workflows (`.github/workflows/`):** `daily.yml` (pijplijn, V14: venster 06-20, schedule 3,33), **`monitor.yml` (NIEUW V14)**, `backfill.yml` (baseline-backfills, workflow_dispatch).
**Cron-Worker (`app/cron-worker/`):** `wrangler.jsonc` (cron `0 4-20 * * *`, account_id `90650c9157a45b740546805924c8c42e`) + `src/index.js` (scheduled→workflow_dispatch; secret `GITHUB_DISPATCH_TOKEN`).
**Data:** `app/data/history/*.json` (30 baseline-bestanden), `app/data/sbi-cache.json` (skip-worktree, zie §4).

---

## 4. Operationeel

- **Deploy:** commit → git-dans → `git push origin main` → `gh workflow run daily.yml --ref main` (~7-14 min). Verifieer LIVE (`/data/latest.json?cb=$(date +%s)`), NOOIT op het gecommitte bestand.
- **Git-dans (skip-worktree `sbi-cache.json`, komt zeer vaak voor door de uurlijkse CI-commits):** `git fetch origin main` → `git update-index --no-skip-worktree app/data/sbi-cache.json` → `git checkout -- app/data/sbi-cache.json` → `git rebase origin/main` (KAAL, nooit naar tail piped) → `git update-index --skip-worktree app/data/sbi-cache.json` → push.
- **Tests:** engine `cd app/engine && npx tsc --noEmit && npm test` (99). Web `cd app/web && npm run build`. Python: `python3 app/pipeline/tests/test_healthcheck.py` (18) + `test_verify_live.py` (11) + `test_agentic_monitor.py` (5) + lexicons. Canary handmatig: `cd app/pipeline && python3 -m pipeline.healthcheck`. Live-eindcontrole: `python3 -m pipeline.verify_live`. Monitor live: `python3 -m pipeline.agentic_monitor`.
- **Shell = zsh:** quote URL's met `?` (anders glob-fout); `for n in $VAR` splitst niet op witruimte.
- **Secrets (`gh secret list`):** DELIJN_API_KEY ✅, LESHAUTES (Cloudflare-deploy) ✅, SURGE_TOKEN ✅, **ANTHROPIC_API_KEY ✅ (NIEUW V14, roteren want stond in chat)**, CAMPAIGN_WEBHOOK_URL ⛔ (Peter), YOUTUBE_API_KEY ⛔. **GITHUB_DISPATCH_TOKEN** = Cloudflare-Worker-secret (gezet; let op: fine-grained PAT kan ooit verlopen → dan vangen de andere lagen het op + mail).
- **Geplande taken (`mcp__scheduled-tasks__`, draaien in de app):** `sbi-uurlijkse-bewaking` (uurlijks 7-21u, app-open extra check), `kalibratie-brand-safety-verdriet` (24 juni), `promoveer-sciensano-pollen-cijfer` (8 aug), **`promoveer-belgische-nieuwstoon-fallback` (8 aug, NIEUW V14)**, `to-dos-en-afspraken` (Peters eigen).
- **Kosten/maand:** hosting + pijplijn + alle bronnen + canary + verify_live + deterministische monitor = **€0**. AI-laag (Claude Haiku, alleen bij probleem/hertrigger) = **~€0 tot €1-2**. De app-taak draait op Peters Claude-abonnement (geen aparte rekening).

---

## 5. Open / volgende stappen (prioriteit)

1. **(KRITIEK, wacht op Peter) Go-live campagne-kant.** (a) Zapier Catch-Hook maken (Webhooks by Zapier) → `gh secret set CAMPAIGN_WEBHOOK_URL`; Claude kan dan eerst een testpayload erheen vuren (echte aflevertest). (b) Drempels bevriezen via backtest (`npx tsx src/cli/backtest.ts`, lookahead-vrij). (c) `mode: test`→`live` in `triggers.ts` + `generate-fixture.ts`, pas na a+b + Peters go.
2. **Geplande beoordelingen** (auto): brand-safety verdriet-drempels (24 juni), Sciensano-pollen in het cijfer (8 aug), Belgische RSS-nieuwstoon als GDELT-fallback (8 aug, zodra ~60d baseline).
3. **CPI (I-D3-001) staat op dec 2025 / 185d oud** — ECB+Eurostat publiceren niet verder; overweeg Statbel-direct.
4. **Roteer `ANTHROPIC_API_KEY`** (stond in de chat) + eventueel een uitgavenlimiet in console.anthropic.com.
5. **Actieplan-rest** (`_PROJECTEN/.../V12 SBI_ACTIEPLAN_CLAUDE_CODE_V12.md`): A2/A3/A4, B2/B3/B4, C3/C4/C5/C7/C8.

---

## 6. Geheugen (auto-memory)
`~/.claude/projects/.../memory/`: **`project-bron-gezondheid-canary.md`** = de volledige rode draad van V13+V14 (canary, verify_live + vangrail, Worker, weerketen KMI/MET Norway, agentic monitor + hartslag, AI-laag, campagne-test, kosten, de eerlijke grenzen). `build-status.md` (index in MEMORY.md), `project-media-architectuur.md`, `project-blinde-vlek-rouw.md`, `project-weer-verkeer-meetgrens.md`, `methodology-discipline.md`, `feedback-schrijfstijl-peter.md`. MEMORY.md = index met de actuele V14-stand.

---

> Voor de diepere architectuur, methodologie en medialaag: zie `Handover V13/` (CODE-V13, MASTERDOCUMENT-V13, MEDIA-OVERZICHT-V13, TOEGANG-V13), die teruggrijpen op V12. Deze V14-handover dekt wat sinds V13 nieuw/gewijzigd is; de rest blijft geldig.
