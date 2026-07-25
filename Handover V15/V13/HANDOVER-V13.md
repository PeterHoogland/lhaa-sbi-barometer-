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


---

> # === Volledige HANDOVER-V12-inhoud hieronder (ongewijzigde achtergrond, blijft geldig). De V13-updates hierboven hebben voorrang. ===

# HANDOVER-V12 — Les Hautes Alpes SBI-barometer

**Lees dit eerst in een nieuwe sessie.** Vervangt `Handover V11/HANDOVER-V11.md`. Uitgevoerd: 2026-06-03 (grote bron- en cijfer-uitbreidingssessie).
Begeleidende docs in deze map: **CODE-V12** (architectuur), **MASTERDOCUMENT-V12** (methodologie), **TOEGANG-V12** (toegang/infra/valkuilen), **MEDIA-OVERZICHT-V12** (medialandschap).
Oudere achtergrond blijft geldig: `Handover V11/` (en de V3-verbeterplan-status daarin). De externe wetenschappelijke review die het oorspronkelijke werk stuurde staat in `_PROJECTEN/.../SBI_VERBETERPLAN_CLAUDE_CODE.md`.

- **Live (primair):** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · **PUBLIEK** · `gh` ingelogd als PeterHoogland.
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- **Triggers:** `mode: test` (vuren niets automatisch; `require_manual_approval` reist mee). Auto-campagnes gaan pas aan met de Zapier-hook + bevroren drempels.
- 🎯 **GO-LIVE-DEADLINE: 22 juni 2026.** Dan moet `mode: live` aan en moet ALLE data actief en betrouwbaar zijn.

---

## 🆕 UPDATE 2026-06-03 (avond): bron-gezondheid-canary + actieplan-fixes

Na de V12-package is er een extra sessie geweest (commits `0703956`, `cc421a7` + de actieplan-batch). Alles live gedeployed en geverifieerd.

**1. Dagelijkse bron-gezondheidstest ("canary") — NIEUW, LIVE.** `app/pipeline/pipeline/healthcheck.py` (+ `tests/test_healthcheck.py`, 18 tests). Draait elke CI-run na `generate-fixture` en controleert drie dingen: (a) CONNECTIE — levert elke bron (18 primair + 10 secundair) verse ECHTE data; leest de `simulated`-vlag uit `raw-values.json`, NIET de waarde; (b) VERWERKING — draaide de fetch vandaag; (c) VOEDING — composiet + percentiel + 25 indicatoren aanwezig. Verdict `ok`/`degraded`/`critical`. **Kernregel: een waarde 0 is nooit op zich alarm** (Google Trends op een sportdag, Kou in de zomer). Vangt ook de A8-cache-terugval (`source` begint met "cache" → degraded). Schrijft `health-report.json` → live op **`/data/health-report.json`**. De oude demo-fallback-stap (die ~16 vals-alarm-issues/dag spamde over de benigne I-D1-003-nul) is vervangen door de canary + **één rollende GitHub-issue** (opent bij probleem, sluit bij herstel) + run-rood-bij-critical (GitHub mailt dan automatisch).
- **Eerste live run ving meteen iets echts:** `I-D5-003` ("Grote gebeurtenis") draaide stil op **cache** (`simulated=false`, datum vandaag, in de publieke breakdown gemaskeerd als "Nieuwsmonitoring + menselijke codering"). `data_quality.indicators_simulated` was leeg, dus de oude check zag het niet. Dit is exact het A8-lek, nu zichtbaar. Rollende issue #33 opende; sluit vanzelf bij herstel.

**2. Actieplan-fixes gedaan (uit `V12 SBI_ACTIEPLAN_CLAUDE_CODE_V12.md`):**
- **Publieke cijfer-zin begrijpelijker (15-jarige).** `ConditionLevelDisplay` + `PercentileDisplay`: "Vandaag hoger dan op X% van de dagen rond deze tijd van het jaar." (jargon weg).
- **A6** stale `latest.json` (+ `signal.json`, `sparkline-30d.json`, web/public-kopieën, health-report) uit tracking + in `.gitignore`. Een verse clone toont geen stale "3/100" meer.
- **C1** dead code `fetchers/entsoe.py` weg. **C2** README I-D5-002 = Wikipedia-aandacht. **C6** stale "20/24 indicatoren"-comments → 25. **B5** I-D1-009-bronlabel → "open-meteo Flood API (GloFAS)".
- Eerdere UI-fixes deze sessie: footer "methodologische verantwoording" weg; secundaire-sectiekop "Onderstroom-peiling" → "Signalen naast het cijfer".

**3. Diagnostische vondsten (voor Peter):**
- **CPI (I-D3-001) staat stil op observation_date 2025-12** (~6 maanden terug); de ECB SDW HICP-reeks schuift niet op. CPI voedt het cijfer → checken vóór go-live. Canary toont het als zachte "stale"-notitie.
- **Pollen (I-D1-010) = `applyStl: false`** → leest élk hoogseizoen "uitzonderlijk hoog" (open-meteo CAMS). Echt veel pollen, maar seizoens- niet anomalie-extreem.
- **"Grote gebeurtenis" reageert niet op een busongeval** want het is een GDELT-VOLUME-aggregaat (7d-decay), geen losse-incident-detector. Rouw hoort bij de verdriet→brand-safety-laag (staat `normal`: verdriet-meter heeft nog 1 historiepunt, valt op cold-start-vloer 0.5; vandaag 0.173 < 0.5).

**4. Nog OPEN (jouw beslissing / vervolg):**
- **✅ BESLIST (Peter, 2026-06-04): 22 juni gaat live met v0.2 (test, eerlijk getoond).** A1 (v0.4-schaarste) + B1/B2 vallen van het kritieke pad. Resteert op het pad: A5 (testfase eerlijk tonen — Peters keuze HOE; hij haalde de badge bewust weg), A7 (imputed-vlag), A8 (fetcher-cache-vlag), en de CPI-caveat documenteren.
- **CPI-caveat:** I-D3-001 staat op dec 2025 omdat ECB SDW én Eurostat beide niet verder publiceren (BE HICP 2,2%). De fetcher haalt al de verste waarde op; niets is verser beschikbaar. Bewust accepteren + documenteren voor go-live, of een snellere bron (Statbel direct) overwegen.
- HARDE-EIS-vervolg: **A7** (I-D2-001 jaarconstante als `imputed` vlaggen), **A8** (fetcher-niveau: cache-leeftijd eerlijk vlaggen in de breakdown, niet enkel in de canary), **A9** (I-D1-003 "missing" = benigne zomer-nul-variantie, documenteren), CPI vers krijgen.
- Methodologie: **A2** (I-D3-007 formeel pre-registreren — jij gaf de inclusie-GO al; doc-bijwerking 20→25 rest), **A3** (OSF-datum + SHA-256, wacht op jouw publicatie), **A4** (interne validatie-toetsen draaien), **B2/B3/B4**.
- De ~32 oude "SBI demo-fallback"-spam-issues sluiten (geblokkeerd door de safety-laag; wacht op jouw expliciete OK).

**Test-commando's (zodat je extra tests kan runnen):**
```bash
# Canary-unittests (18)
python3 app/pipeline/tests/test_healthcheck.py
# Canary handmatig draaien op de lokale data (schrijft app/data/health-report.json)
cd app/pipeline && python3 -m pipeline.healthcheck
# Live canary-uitkomst
curl -s "https://les-hautes-alpes-sbi.brainwolves.workers.dev/data/health-report.json?cb=$(date +%s)" | python3 -m json.tool
# Engine + web (ongewijzigd, moeten groen blijven)
cd app/engine && npx tsc --noEmit && npm test       # 99
cd app/web && npm run build
```

---

## ⚠️ LEES DIT EERST: wat er sinds V11 veranderd is (grote uitbreiding)

Deze sessie heeft de barometer fors verbreed. Kort samengevat, alles **live gedeployed en geverifieerd**:

- **Blinde vlek nationale rouw opgelost.** Een verdriet-/rouwpiek in het nieuws pauzeert nu de commerciële CTA (brand-safety), NIET het cijfer. Drempels provisoir, kalibratie ingepland (24 juni).
- **Lexicons fors uitgebreid + negatie-laag.** NL valentie 181→362 negatief, emoties 171→289, plus "niet slecht"-negatie en versterkers.
- **Franstalig België weegt nu mee op toon.** Nieuw FR-lexicon (Pattern-fr + nieuws-overlay + negatie) + 5 FR-feeds.
- **Onderstroom gerepareerd + uitgebreid.** Reddit draaide stil op mock (`.json` = 403 sinds eind 2024) → gefixt via `.rss` + 3 extra subs. Mastodon erbij.
- **Tussenstroom toegevoegd.** Google Trends (stress-aandeel van de Belgische trending searches) als zoekgedrag-signaal.
- **Reach-weging zichtbaar gemaakt.** Poststratified reach-gewogen RSS-negativiteit als eigen signaal.
- **Openbaar vervoer compleet.** Trein (iRail, URL gefixt) + Brussel (STIB) + Vlaanderen (De Lijn real-time, met sleutel).
- **NIEUWE GESCOORDE INDICATOR in het cijfer:** consumentenvertrouwen (NBB/Eurostat, I-D3-007). Nu **25 indicatoren** i.p.v. 24. Pre-registratie-amendement (Peters GO).
- **CI draait nu UURLIJKS 6-21u BE** i.p.v. 1x/dag (gratis, publieke repo).
- **DATEX intra-dag-collector** bouwt dichte verkeersdata op (voorbereiding op de verkeer-proxy).
- **Badge "campagnes: handmatig" verwijderd** uit de expert-weergave (Peters vraag).

Commits deze sessie (chronologisch): `a1bbd03` (rouw + lexicon + media-fixes), `ebde952` (Google Trends + Reddit), `851494e` (badge + TV Oost + Mastodon + iRail/STIB), `8e40e4b`+`ace570e` (De Lijn), `0cefc23` (NBB I-D3-007), `f006fef` (cron uurlijks), `7f429c6` (FR-lexicon), `fa2f135` (DATEX-collector).

---

## ▶️ EERSTE OPDRACHT / kritiek pad (START HIER)

Het kritieke pad naar 22 juni is **onveranderd**: de echte go-live van de campagne-kant. Plus één nieuw, gefaseerd item (verkeer).

1. **(KRITIEK, wacht op Peter) Go-live campagne-kant.** (a) Zapier-hook (`hooks.zapier.com`-URL → `gh secret set CAMPAIGN_WEBHOOK_URL`); (b) drempels bevriezen via backtest (`npx tsx src/cli/backtest.ts`, lookahead-vrij, pre-registratie, Peters call op de waarden); (c) `mode: test` → `live` in `triggers.ts` + `generate-fixture.ts`, pas na genoeg historie + de webhook + Peters go.
2. **(GEFASEERD, Peter koos "eerst verzamelen") Verkeer-proxy in het cijfer.** STAP 1 is gedaan: de DATEX intra-dag-collector draait (`I-D2-001-rt-intraday.json`, ~16 punten/dag). STAP 2 (de proxy zelf, met dagtype-baseline ma-vs-ma + spits-vs-spits) kan pas eerlijk rond **eind juni**, zodra er ~2-3 weken dichte data is. NIET halsoverkop met de paar ruisende snapshots van nu (dat vervuilt het publieke cijfer).
3. **(INGEPLAND) Brand-safety verdriet-drempel-kalibratie.** Eenmalige `/schedule`-taak staat voor **24 juni** (`kalibratie-brand-safety-verdriet`): haalt de opgebouwde verdriet-historie, berekent de verdeling, en legt een drempelvoorstel voor. Wijzigt niets autonoom.
4. **(Wacht op Peter) YouTube-comment-bron.** Vereist een gratis Google Cloud API-key → `gh secret set YOUTUBE_API_KEY`. Dan bouw ik de fetcher (NL+FR comment-sentiment). Zie MEDIA-OVERZICHT-V12.

**Niet doen tenzij Peter er expliciet om vraagt:** de verkeer-proxy halsoverkop (zonder de dichte data), demping van het cijfer (Peter wil het rauw), FEEL-FR-emoties (licentie-grijs).

---

## 0. De allerbelangrijkste dingen (TL;DR)

1. **Het publieke cijfer is gezond en live.** Score op 100 = seizoens-bewust percentiel. Vandaag rond 71. Nu **25 gescoorde indicatoren** (consumentenvertrouwen I-D3-007 erbij). Alle data echt (`simulated: []`).
2. **Brand-safety pauzeert de CTA bij een verdriet-/rouwpiek, NIET het cijfer.** Rouw is geen omgevingsdruk, dus het getal blijft eerlijk; alleen de commerciële boodschap gaat op pauze (CN5, "EVEN OP PAUZE"). Drempels provisoir (`methodology/brand-safety.ts`), kalibratie 24 juni.
3. **De engine staat bewust nog `mode: test`.** Niets vuurt automatisch een campagne af; triggers vragen handmatige goedkeuring. De badge die dat toonde is weg (Peters vraag), maar de eerlijke staat blijft.
4. **CI draait UURLIJKS 6-21u BE** (cron `0 * * * *` + tijd-guard). Gratis want publieke repo. 0 tokens (geen AI in de pijplijn).
5. **Git-valkuil (ONVERANDERD):** `app/data/sbi-cache.json` heeft `skip-worktree` en origin schuift op door CI-cache-commits. Bij elke push: `git update-index --no-skip-worktree app/data/sbi-cache.json` → `git checkout -- app/data/sbi-cache.json` → `git rebase origin/main` → `git update-index --skip-worktree app/data/sbi-cache.json` → push. Zie TOEGANG-V12 §4.
6. **Schrijfstijl Peter:** publieke UI-copy + je antwoorden = neutraal correct Nederlands, je-vorm, **geen em-dashes (—)**, specifiek en verantwoord.
7. **Diagnosticeer NOOIT op het gecommitte `latest.json`** (kan stale zijn). Gebruik de live URL `/data/latest.json?cb=$(date +%s)` of regenereer lokaal.

---

## 1. Wat er NU live staat (na deze V12-sessie)

**Cijfer-laag (publiek, v0.2):** seizoens-bewust percentiel, **25 gescoorde indicatoren** (I-D3-003 ontslagen-proxy blijft grade-D en buiten het cijfer; media-toon I-D5-001 + wikipedia I-D5-002 blijven op Peters override grade-C, ín het cijfer). Brand-safety als CN5-override (banner + CTA-pauze, niet het getal).

**De 25 indicatoren** (domein-overzicht): D1 weer (daglicht, hitte, kou, lucht, wateroverlast, pollen = 6), D2 mobiliteit (filezwaarte-jaar, brandstof, trein = 3), D3 economie (CPI, energie, ontslagen-proxy[D], werkloosheid, hypotheek, **consumentenvertrouwen NIEUW**, stroomnet = 7), D4 werk/gezin (deadlines, schoolvakantie = 2), D5 nieuws (nieuwsnegativiteit, wikipedia, gebeurtenissen = 3), D6 kalender (vakantie, weekdag, klok, examens = 4). Totaal 25.

**Trigger/secundaire laag (NIET in het cijfer), 10 signalen:**
- `I-D5-006S` Reddit-sentiment (GEFIXT via `.rss`, 5 subs)
- `I-D5-mastodon` Mastodon-sentiment (NIEUW, no-auth)
- `I-D3-003S` Ontslag-radar
- `I-D5-emotie` Emotie-lading (woede/angst/verdriet/walging, lexicon 289 woorden)
- `I-D5-verdriet` Verdriet-deel (NIEUW, voedt brand-safety; uit de publieke lijst gefilterd)
- `I-D5-001-rss` Reach-gewogen poststratified RSS-negativiteit (NIEUW, controle naast GDELT)
- `I-D5-trends` Google Trends stress-aandeel (NIEUW, tussenstroom)
- `I-D2-001-rt` DATEX dagverkeer (file-km) + intra-dag-collector (NIEUW)
- `I-D2-stib` STIB Brussel OV-verstoringen (NIEUW)
- `I-D2-delijn` De Lijn real-time verstoringen (NIEUW, GTFS-RT, met sleutel)

**Media gescand: 22 RSS-feeds** (17 NL + 5 FR), plus GDELT (het gescoorde nieuws-aggregaat). Zie MEDIA-OVERZICHT-V12 voor de volledige lijst.

---

## 2. Wat deze V12-sessie gebouwd + gedeployed is (per gebied)

### 2.1 Blinde vlek nationale rouw → brand-safety (commit a1bbd03)
- `app/pipeline/pipeline/fetchers/events.py`: `KEYWORDS_MAG_1/3` uitgebreid met ongeval/verkeers-/bus-ongeval, omgekomen, dodelijk(e), slachtoffer(s), dodentol, minuut/moment stilte, rouwdag. Verbetert kandidaat-detectie voor `pending_events.json`; de I-D5-003-score blijft GDELT-volume (geen directe cijfer-impact).
- `gdelt.py`: nieuw secundair `I-D5-verdriet` (verdriet-intensiteit apart van de emotie-som).
- `app/engine/src/methodology/brand-safety.ts` (NIEUW): `decideBrandSafety()` → vlag `elevated` bij verdriet-piek met twee remmen: (1) AANDEEL verdriet/totaal ≥ 0.40 (rouw, geen woede/angst), (2) PIEK = percentiel ≥ 90 in eigen historie, of cold-start absolute vloer ≥ 0.5. Nooit auto-`block`. Gewired in `generate-fixture.ts` (alleen vandaag). Drempels PROVISOIR → kalibratie 24 juni.
- 13 tests (`test/brand-safety.test.ts`). Geverifieerd in de browser: rouwdag → CTA verborgen + banner + kicker "EVEN OP PAUZE", cijfer blijft eerlijk.

### 2.2 Lexicon-uitbreiding + linguïstische negatie (commit a1bbd03)
- `lexicon_nl.py`: NEGATIVE 181→362, POSITIVE 118→149. **Negatie + versterker-laag** in `tone_of_text` (De Smedt & Daelemans / VADER-familie): negatoren keren+dempen het volgende polaire woord ("niet slecht" → licht positief), versterkers/verzwakkers schalen de magnitude. Basis blijft Pattern.nl (CLiPS, 2722 woorden).
- `lexicon_emotion_nl.py`: emoties 171→289 (woede/angst/verdriet/walging).
- Tests `tests/test_lexicon_nl.py` (8). **Veilig t.o.v. pre-registratie:** raakt alleen de controle-lezing + trigger-laag, NIET het GDELT-cijfer (I-D5-001 = GDELT-toon).

### 2.3 Media-bronnen gelijkgetrokken + reach-signaal (commit a1bbd03)
- `events.py` scant nu dezelfde feeds als de toon-scan (één bron van waarheid via `gdelt.RSS_FEEDS` + `media_profiles`).
- `gdelt.py`: nieuw secundair `I-D5-001-rss` = poststratified reach-gewogen RSS-negativiteit (`media_profiles.poststratify`, bereik × publieksprofiel). Antwoord op Peters reach-vraag; bouwt historie op voor eventuele promotie.

### 2.4 Google Trends (tussenstroom) + Reddit-fix (commit ebde952)
- `google_trends.py` (herbruik dode pytrends-stub): nieuw secundair `I-D5-trends` = stress-aandeel van de Belgische trending searches via `trends.google.com/trending/rss?geo=BE` (werkt vanaf server-IP, anders dan pytrends). Scoort trends tegen het stress-lexicon.
- `reddit.py` **FIX**: de `.json`-route gaf sinds eind 2024 HTTP 403 → stille terugval op mock (verborgen degradatie!). Nu de publieke `.rss` (Atom) + browser-UA. Subs: belgium, Vlaanderen, **brussels, Antwerpen, BEFire** (nieuw).

### 2.5 Badge weg + TV Oost + Mastodon (commit 851494e)
- `V04Technical.tsx`: de "campagnes: handmatig"-badge rechtsboven verwijderd (Peters vraag).
- TV Oost (`tvoost.be/rss`, NL hyperlokaal) toegevoegd — vangt lokale incidenten/rouw (ving het bus-ongeval-rouwsignaal).
- `mastodon.py` (NIEUW): `I-D5-mastodon`, no-auth publieke timeline mastodon.vlaanderen.

### 2.6 Openbaar vervoer compleet (commits 851494e, 8e40e4b, ace570e)
- `irail.py`: URL gefixt naar `/v1/disturbances` (oude gaf 303-redirect, fragiel).
- `stib.py` (NIEUW): `I-D2-stib` Brusselse OV-verstoringen via de no-auth STIB/MIVB JSON-API.
- `delijn.py` (NIEUW): `I-D2-delijn`. Eerst Kern Open Data `/omleidingen`, daarna overgeschakeld naar **GTFS Realtime v3** (`gtfs/v3/realtime?json=true`, real-time geannuleerde + vertraagde ritten) toen Peter de GTFS-RT-key leverde. Key als secret `DELIJN_API_KEY` (env in daily.yml). TEC/Wallonië geparkeerd (protobuf + handmatige aanvraag).

### 2.7 NBB consumentenvertrouwen — NIEUWE GESCOORDE INDICATOR (commit 0cefc23) ⭐
- `consumer_confidence.py` (NIEUW): NBB-eigen API faalt vanaf server-IP → **Eurostat ei_bsco_m** (BS-CSMCI, BE, seizoens-gecorrigeerd) = EC-geharmoniseerd consumentenvertrouwen.
- Gescoorde indicator **I-D3-007**, grade B, **inverse-coded** (hoog vertrouwen = lage stress). Toegevoegd aan `types.ts` (union), `registry.ts`, `plain-language.ts`, `demographic-reach.ts`, `run.py`. Gewichten herbalanceren automatisch.
- **Backfill** `data/history/I-D3-007.json` (197 maandpunten 2010-2026) → echte baseline vanaf dag 1.
- 24→25 indicatoren (copy bijgewerkt: `Methodology.tsx`, `copy.ts`). **PRE-REGISTRATIE-AMENDEMENT** (Peters GO). Live: -20 saldo (mediaan -9.4) = "extreem" → terecht stress-bijdrage.

### 2.8 CI uurlijks + DATEX-collector (commits f006fef, fa2f135)
- `daily.yml`: cron van 1x/dag → `0 * * * *` (elk uur) + tijd-guard die alleen 06-21u BE doorlaat (DST-proof). 16 runs/dag. Gratis.
- `datex_traffic.py`: bij elke (uurlijkse) run een getimestampte snapshot in `data/history/I-D2-001-rt-intraday.json` (~16/dag). Bouwt de dichte data op voor de latere verkeer-proxy. **Bewust geen aparte Cloudflare-Worker** (uurlijkse cron levert de data al; eenvoudiger/robuuster). Inert voor de engine.

### 2.9 FR-lexicon — Franstalig BE op toon (commit 7f429c6)
- `lexicon_pattern_fr.py` (NIEUW, Pattern.fr CLiPS, BSD, 3673 woorden) + `lexicon_fr.py` (NIEUW: nieuws-overlay voor stress-zelfstandige-naamwoorden die Pattern.fr mist — guerre/accident/morts/grève — + FR negatie/versterkers + `tone_of_text_fr`).
- 5 geverifieerde FR-feeds (La Libre, La DH, L'Avenir, BX1, 7sur7) met `lang=fr` in `media_profiles`. `gdelt.py` routeert de toon per bron-taal (22 feeds). Emoties blijven NL (FEEL = licentie-grijs). Geen cijfer-impact (controle-lezing, niet GDELT).

---

## 3. Open wachtrij / volgende stappen

1. **(KRITIEK PAD) Go-live campagne-kant** — Zapier-hook + drempel-freeze + `mode: live`. Zie EERSTE OPDRACHT §1.
2. **Verkeer-proxy STAP 2** — rond eind juni, zodra de intra-dag-collector ~2-3 weken dichte data heeft. Dagtype-baseline (ma-vs-ma, spits-vs-spits). Lees `data/history/I-D2-001-rt-intraday.json`.
3. **Brand-safety verdriet-kalibratie** — `/schedule`-taak 24 juni (auto). Daarna de drempels in `methodology/brand-safety.ts` met Peter bevriezen.
4. **YouTube-comment-bron** — wacht op `YOUTUBE_API_KEY` van Peter (Google Cloud, gratis). Dan fetcher voor NL+FR comment-sentiment.
5. **FR-emoties** (optioneel) — FEEL (`advanse.lirmm.fr/FEEL.csv`) heeft een licentie-grijszone (erft NRC, commercieel = fee) → trigger-laag houden of de NRC-licentie kopen. Schoon alternatief = al gedekt door Pattern-fr (toon).
6. **NL-emotie-upgrade** (optioneel, laaghangend) — Speed & Brysbaert 2023 (CC-BY, 24k NL-woorden, 6 emoties, `osf.io/9htuv`) kan de handgemaakte emotielijst vervangen.
7. **TEC/Wallonië OV** — protobuf + handmatige sleutel-aanvraag, lage prioriteit.
8. **`emotie.spike`-trigger** — bouwt nog historie op (`MIN_EMOTIE_HISTORY=20`); komt rond eind juni online. Overweeg de drempel naar ~14 voor marge.
9. **Criteriumvalidatie** — Sciensano Gezondheidsenquête (2023-2024, HISIA) = sterkste BE-ijkbron; Test-Aankoop/Solidaris/Armoedebarometer als jaarlijkse benchmarks (zie `app/pipeline/validation/`). Niet live, wel voor de wetenschappelijke verdediging.

---

## 4. Operationeel (zie TOEGANG-V12 voor details + valkuilen)
- **Deploy:** code committen + `git push origin main` + `gh workflow run daily.yml --ref main` (CI fetcht echte data → bouwt → Cloudflare, ~7 min). Verifieer live met `/data/latest.json?cb=$(date +%s)`.
- **Git-valkuil `sbi-cache.json` (skip-worktree):** zie §0 punt 5 + TOEGANG-V12 §4. Komt nu vaker voor (uurlijkse CI-cache-commits).
- **Secrets (GitHub):** `DELIJN_API_KEY` (gezet, GTFS-RT-key), `CAMPAIGN_WEBHOOK_URL`/`CAMPAIGN_WEBHOOK_TOKEN` (nog te zetten door Peter), `ALERT_WEBHOOK_URL` (optioneel), `CLOUDFLARE_API_TOKEN` (deploy), `YOUTUBE_API_KEY` (nog te zetten). `gh secret list`.
- **Lokale data-gen** (verificatie): `cd app/engine && npm run generate-fixture`. **Daarna reverten:** `git checkout -- app/data app/web/public` + `rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json`. (Untracked nieuwe history-bestanden blijven; let op wat je commit.)
- **Tests:** engine `cd app/engine && npx tsc --noEmit && npm test` (99 groen). Web `cd app/web && npm run build`. Python `python3 app/pipeline/tests/test_lexicon_nl.py` (8) + `test_lexicon_emotion.py` (5).
- **Nieuwe bron lokaal testen:** `cd app/pipeline && python3 -c "from datetime import date; from pipeline.fetchers import <module>; print(<module>.<fn>(date.today()))"`.

## 5. Geheugen (auto-memory)
`~/.claude/projects/.../memory/`: **`project-media-architectuur.md`** (de volledige bron-architectuur + alle V12-toevoegingen + open beslissingen), `project-blinde-vlek-rouw.md` (brand-safety), `project-weer-verkeer-meetgrens.md` (waarom weer/verkeer traag bewegen), `build-status.md`, `methodology-discipline.md`, `feedback-schrijfstijl-peter.md`. MEMORY.md is de index.
