# HANDOVER-V13 — Les Hautes Alpes SBI-barometer

**Lees dit eerst in een nieuwe sessie.** Vervolg op `Handover V12/HANDOVER-V12.md` (dat blijft geldig voor de architectuur/achtergrond; CODE-V12 / TOEGANG-V12 / MASTERDOCUMENT-V12 / MEDIA-OVERZICHT-V12 ook). Datum: 2026-06-04 (grote sessie: autonome bewaking + Belgische bronnen).

- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · PUBLIEK · `gh` als PeterHoogland.
- **Root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- 🎯 **GO-LIVE: 22 juni 2026.** **BESLIST (Peter): 22 juni live met v0.2 (test, eerlijk getoond)** → A1/B1/B2 van het kritieke pad af.
- **Schrijfstijl Peter:** je-vorm, neutraal, GEEN em-dashes, eerlijk/specifiek.

---

## ⛔ EERSTE PRIORITEIT — OPEN BUG: "Hitte uitzonderlijk hoog" terwijl het niet warm is
Peter zag 2026-06-04: **I-D1-002 (Hitte) toont "uitzonderlijk hoog" (state=extreem, z=3), live raw_value = 26,08**, terwijl de echte hitte-delta **0,0** is (geen hitte >30°C in begin juni). De baseline `data/history/I-D1-002.json` zijn hitte-DELTAS (749/762 punten = 0, max 6,2). De live-waarde 26 is **temperatuur-schaal**, niet de delta-boven-30 → **schaal-mismatch → valse z=3 → valse "extreem"**. De lokale `kmi.fetch_temperature_extremes` geeft 0,0 (correct).
- **Vermoedelijke oorzaak:** in de CI viel de kmi-hitte-fetch op mock/synthetisch (temperatuur-schaal) OF gaf de temperatuur i.p.v. `max(0, temp−30)`; `generate-fixture.syntheticRawValue(I-D1-002)` is mogelijk temperatuur-schaal. Zelfde KLASSE als pollen/trein: verkeerd-geschaalde/niet-echte data die het cijfer vals beïnvloedt.
- **FIX VOLGENDE SESSIE:** check `curl .../latest.json` of I-D1-002 `simulated:true` is; vergelijk `app/pipeline/pipeline/fetchers/kmi.py` (geeft het de delta of de temp?) met `syntheticRawValue` in `app/engine/src/cli/generate-fixture.ts`. Zorg dat live-waarde + baseline op dezelfde schaal staan (delta-boven-30). Mogelijk ook Kou (I-D1-003) checken (zelfde fetcher). Raakt het cijfer → met zorg + deploy-verificatie.

---

## 🟢 WAT DEZE SESSIE GEBOUWD + LIVE IS (alles gedeployed + geverifieerd)

### 1. Autonome uurlijkse bewaking (Peters kernvraag: "elk uur, computer uit, alles controleren")
De lus draait nu volautomatisch, computer-onafhankelijk:
- **Cloudflare Cron-Worker `lhaa-sbi-cron`** (`app/cron-worker/`, live op `lhaa-sbi-cron.brainwolves.workers.dev`, cron `0 4-20 * * *` UTC = 06-21u BE). Trapt elk uur `daily.yml` af via `workflow_dispatch`. **Secret `GITHUB_DISPATCH_TOKEN` is GEZET** (Peters fine-grained PAT, Actions:write). Deploy: `cd app/cron-worker && npx wrangler@4 deploy`. Test-endpoint: `/trigger?key=<token>`. Cloudflare account_id `90650c9157a45b740546805924c8c42e` (wrangler lokaal OAuth-ingelogd).
- **Canary `app/pipeline/pipeline/healthcheck.py`** (+ `tests/test_healthcheck.py`, 18 tests): PRE-deploy. Controleert connectie (18 primair + **11 secundair**, simulated/cache/afwezig/stale), verwerking (verse dagrun), voeding (composiet+percentiel+25 indicatoren). Kernregel: waarde 0 ≠ alarm. Verdict ok/degraded/critical → `/data/health-report.json`. Rollende GitHub-issue (opent bij probleem, sluit bij herstel) + run-rood-bij-critical.
- **`app/pipeline/pipeline/verify_live.py`** (+ `tests/test_verify_live.py`, 10 tests): POST-deploy, **volledige eindresultaat-controle op de LIVE site** — vers (deploy gepropageerd, ≤45 min), 25 indicatoren, **composiet = som van de contributies (Δ≈0)**, elke indicator gescoord of eerlijk uitgesloten (geen stil-kapotte), percentiel in [0,100], canary niet kritiek. Faalt → run rood → GitHub mailt. Laatste stap in `daily.yml`. (Gesimuleerd = notitie, niet hard-fail; canary doet dat.)
- **`daily.yml`:** GitHub-schedule `0,20,40`→**`30 * * * *`** = enkel nog dead-man's-switch (Worker is de betrouwbare trigger). Stappen-volgorde: fetch → generate-fixture → **canary** → web build → deploy (Cloudflare+Surge) → persist → **alarm** → critical-marker → **verify_live**.

### 2. Bronnen Belgisch gemaakt (Peter: "alle bronnen Belgisch")
- **Lucht (I-D1-004): IRCELINE** (`fetchers/irceline.py`, geo.irceline.be SOS-API, geen sleutel, Brussel NO2/O3/PM10 tov WHO, O3-station 6625 Ukkel want 6517 ligt stil, ≥2 van 3). Baseline her-backfilled (774 dagen) → z-score klopt. `daily_composite_series()` deelt live+backfill.
- **Water (I-D1-009): VMM + SPW** (optie B; `fetchers/waterinfo.py`, KISTERS KiWIS, geen sleutel). VMM (download.waterinfo.be): Dijle@Wilsele `0168407042`, Demer@Bilzen `0168901042`. SPW (hydrometrie.wallonie.be/services/KiWIS/KiWIS): Vesdre@Verviers `284632010`, Ourthe@Tabreux `297962010` = 2021-flood. Som dag-debiet (`20-Debit.Jour.Moyen`/`DagGem`), alleen dagen met alle 4. Baseline backfilled (764 dagen). `discharge_sum_series()`.
- **Pollen (I-D1-010): geen Belgische historie-API** → CAMS blijft in het cijfer (eerlijk gelabeld "Copernicus CAMS, Europees model"). MAAR: **echte Belgische Sciensano-metingen komen nu binnen als SECUNDAIR signaal `I-D1-010-sci`** (`fetchers/sciensano_pollen.py`, verborgen open API `airallergy-api.sciensano.be/api/stationmeasurement?stationId=<guid>&language=nl`, geen sleutel, geeft alle 5 stations; −1=geen meting eruit; gem. over rapporterende stations). Bouwt baseline VOORUIT op (geen backfill mogelijk). **Geplande `/schedule`-taak `promoveer-sciensano-pollen-cijfer` op 8 aug 2026 09:00**: beoordeelt of ≥60 dagen + seizoens-oké → promoveer CAMS→Sciensano in het cijfer (bereidt voor, wijzigt niets autonoom).
- Station-GUIDs Sciensano: Brussel `0ff00a3c-c4b8-4061-9814-6568347ea42b`, Genk `b668468b-840c-4c1d-86e6-b79af5ac4ed7`, De Haan `30c5a5c1-d810-40b3-b453-807ef717d204`, Marche `ba84d601-43ba-4a88-bfb9-805357d975c2`, Baudour `083855b7-9734-41d0-aba0-b285de42a854`.

### 3. Eerlijkheid + perceptie-fixes (alles live)
- **A7 imputed:** I-D2-001 (jaarconstante) `imputed=True`; generate-fixture leidt `imputedCodes` af uit raw-values (`imputed` OF bron begint met "cache") → `imputedIndicators` in de today-computeDaily. Komt in `data_quality.indicators_with_imputed_data` + per-indicator `imputed` in de breakdown. **imputed is label-only (cijfer-neutraal).**
- **A8 cache zichtbaar:** cache-terugval (o.a. GDELT I-D5-001/003) toont nu **"verouderd"** in de indicatorlijst i.p.v. stil als vers. Eén detectiepunt in generate-fixture.
- **Perceptie inverse-coded:** consumentenvertrouwen (en daglicht) tonen het badge naar de richting van de METING. `stateLabelFor(state, inverseCoded)` in `indicator-utils.ts`; `inverseCoded` op de breakdown (types.ts + runtime.ts). Bv. −20 saldo → "uitzonderlijk laag" (rood), niet "hoog".
- **Synthetische-baseline-fix (trein):** `runtime.ts` v0.2-loop sluit niet-deterministische codes zonder echte baseline (`realBaselineCodes`, ≥60 echte punten) uit → state "ontbreekt" i.p.v. scoren tegen synthetische data. Trein (I-D2-009, 6 punten) nu uitgesloten. **Let op: dit is precies het mechanisme dat de Hitte-bug raakt — als de live-waarde fout-geschaald is, helpt dit niet (Hitte HEEFT een echte baseline).**
- **"geen data" → "geen uitschieter"** (Koude-zomer leest niet als kapot). **15-jarige cijfer-zin:** "Vandaag hoger dan op X% van de dagen rond deze tijd van het jaar". **A5:** nuchtere testmodus-footer (data-gedreven via `!data.v04`). Secundaire sectie-kop "Onderstroom-peiling"→"Signalen naast het cijfer". Methodologie-footer onder wetenschapsbronnen weg.
- **Links:** alle hautes-alpes-links → `https://plus.hautes-alpes.net/` (de CTA "Ontdek de bestemmingen" + embed-preview stonden op www; top-right + logo waren al goed).
- **Opruim:** A6 (latest.json/signal.json/sparkline uit tracking + .gitignore — geen stale 3/100 meer in een clone), C1 (entsoe.py dead code weg), C2 (README I-D5-002=Wikipedia), C6 (20/24→25 comments), B5 (I-D1-009-label). **32 oude "SBI demo-fallback"-spam-issues gesloten.**

### 4. Vondsten (niet-fix, voor Peter)
- **CPI (I-D3-001) staat op dec 2025** (publicatie-frontier: ECB SDW én Eurostat geven niet verder). Geen code-fix mogelijk; de fetcher haalt al de verste. Canary toont het als zachte stale-notitie. Documenteren voor go-live.
- GDELT-API (I-D5-001/003) is recurrent flaky → cache-terugval (nu zichtbaar "verouderd" + canary degraded).

---

## OPEN / VOLGENDE STAPPEN (prioriteit)
1. **De Hitte-bug** (zie boven) — eerst. Mogelijk ook Kou.
2. **Go-live campagne-kant (22 juni):** Zapier-hook (`gh secret set CAMPAIGN_WEBHOOK_URL`), drempel-freeze (backtest), `mode: test`→`live`. Wacht op Peter.
3. **Sciensano-promotie** — auto-beoordeling 8 aug (geplande taak). Pollen-cijfer dan CAMS→Sciensano.
4. **CPI vers** — overweeg Statbel-directe bron (ECB/Eurostat zitten vast op dec 2025).
5. **Actieplan-rest** (`_PROJECTEN/.../V12 SBI_ACTIEPLAN_CLAUDE_CODE_V12.md`): A2/A3 (I-D3-007 pre-reg formeel + OSF-datum/SHA), A4 (interne validatie draaien), B2/B3/B4, C3/C4/C5/C7/C8.
6. **Brand-safety verdriet-kalibratie** — geplande taak 24 juni (`kalibratie-brand-safety-verdriet`).

---

## OPERATIONEEL
- **Deploy:** commit + git-dans + `git push origin main` + `gh workflow run daily.yml --ref main` (~7 min). Verifieer LIVE (`/data/latest.json?cb=$(date +%s)`), NOOIT op het gecommitte bestand.
- **Git-dans (skip-worktree `sbi-cache.json`, komt nu vaak voor):** `git fetch origin main` → `git update-index --no-skip-worktree app/data/sbi-cache.json` → `git checkout -- app/data/sbi-cache.json` → `git rebase origin/main` → `git update-index --skip-worktree app/data/sbi-cache.json` → push. **Valkuil:** pipe `git rebase` NOOIT naar `tail` (maskeert conflict-exit). Bij conflict op een her-backfilled history-bestand: `cp /tmp/<backfill>.json` terug, `git add`, `GIT_EDITOR=true git rebase --continue`.
- **Tests:** engine `cd app/engine && npx tsc --noEmit && npm test` (99). Web `cd app/web && npm run build`. Canary `python3 app/pipeline/tests/test_healthcheck.py` (18) + `test_verify_live.py` (10) + lexicons. Canary handmatig: `cd app/pipeline && python3 -m pipeline.healthcheck`. Live-check: `python3 -m pipeline.verify_live`.
- **Shell = zsh:** `for n in $VAR` splitst NIET op witruimte; gebruik `while read` of `${=VAR}`.
- **Secrets (`gh secret list`):** DELIJN_API_KEY ✅, LESHAUTES (Cloudflare) ✅, CAMPAIGN_WEBHOOK_URL ⛔ (Peter), YOUTUBE_API_KEY ⛔. GITHUB_DISPATCH_TOKEN = Cloudflare-Worker-secret (gezet).

## COMMITS DEZE SESSIE (chronologisch, main)
`0703956` canary + secundaire-kop · `cc421a7` footer weg · `cc4f674` A6/C1/C2/C6/B5 + 15-jarige-zin · `ac08a96` docs · `512adc0` imputed/cache/inverse/A5 · `c73e306` IRCELINE-lucht + pollen-label + geen-uitschieter · `69f8d66` cron 3x/uur · `f53d9b4` cron-Worker · `b6ce1de` trein-synthetische-baseline-fix · `405c594` verify_live + Worker primair · `957141a` VMM+SPW-water · `63e23c7` CTA→plus.hautes-alpes.net · `9b0b17c` Sciensano-pollen-secundair.

## GEHEUGEN (auto-memory)
`project-bron-gezondheid-canary.md` = de volledige rode draad van deze sessie (canary, verify_live, Worker, IRCELINE/VMM+SPW/Sciensano, alle fixes, de open beslissingen). MEMORY.md = index.
