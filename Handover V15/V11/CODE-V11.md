# CODE-V11 — Architectuur & waar alles zit

Begeleidt HANDOVER-V11. Doel: een nieuwe sessie navigeert hiermee de codebase zonder alles te herontdekken. Deltas t.o.v. CODE-V10 zijn gemarkeerd met **(V11)**.

## 1. Drie lagen

```
app/
├── pipeline/   Python — fetcht echte databronnen → data/raw-values.json
├── engine/     TypeScript — rekent het cijfer + triggers (computeDaily/computeV04)
└── web/        React/Vite — leest /data/*.json, rendert de barometer
```

Dataflow: **pipeline (fetch) → `data/raw-values.json` → engine `generate-fixture.ts` (computeDaily) → `latest.json` + `latest-expert.json` → web**. CI (`daily.yml`) draait dit dagelijks en deployt naar Cloudflare.

## 2. Engine (`app/engine/src/`)

- **`runtime.ts`** — `computeDaily()` (v0.2-output) + `computeV04()` (v0.4 meet-/triggerlaag). **(V11)** Het publieke percentiel `percShort` draait nu via **`seasonalPercentile(...)`** i.p.v. een platte rang tegen het hele venster; de tier-percentiel-historie via **`buildSeasonalPercentileHistory(...)`**; de media-diagnostiek-percentiel idem. `IndicatorBreakdown` heeft een `grade`-veld (D verborgen in de UI-lijsten).
- **`methodology/seasonal-percentile.ts` (V11, NIEUW)** — `seasonalPercentile()`, `buildSeasonalPercentileHistory()`, helpers (`dayOfYear`, `seasonalDistance` cyclisch, `withinSeason`, `seasonalReference`). Constanten `SEASONAL_WINDOW_DAYS=45`, `MIN_SEASONAL_POINTS=30`. Vergelijkt vandaag tegen dezelfde tijd van het jaar over alle beschikbare jaren (max 730 dagen). Lookahead-vrij; terugval op het volledige venster bij te weinig seizoenspunten. Lege referentie → 50 (zelfde conventie als `percentileRank`).
- **`indicators/registry.ts`** — de 24 indicatoren met `grade` (A/B/C/D). `I-D5-001` + `I-D5-002` op **C** (Peters override, in het cijfer); `I-D3-003` op D (uit cijfer). `I-D2-001` = filezwaarte jaar-op-jaar % (YoY), `applyStl=false`, grade A, `+0,03`-bijdrage (geen probleem, V10's "−0,17" was stale data).
- **`indicators/plain-language.ts` / `kern.ts`** — publieke "why/reads"-copy + de 9 kern-codes.
- **`methodology/triggers.ts`** — `evaluateTriggers()`. T1 spike, T2 indicator.red P95, T3 composite P70/P90, T4 `emotie.spike` (gated `MIN_EMOTIE_HISTORY=20`). **`mode` staat hier op `test`.**
- **`methodology/condition-level.ts`** — CN 1-5 (banner-activatie). **Pre-geregistreerd, niet vrij wijzigbaar.** CN ≥ 3 = banner aan (sustained amber/red). De DISPLAY-kicker (V11) is hiervan losgekoppeld, zie web.
- **`methodology/composite.ts` / `zscore.ts` / `baseline-window.ts` / `percentile.ts` / `stl.ts` / `winsorize.ts`** — de wiskunde. `percentileRank(x, [])` geeft 50.
- **`cli/generate-fixture.ts`** — bouwt de output. **(V11)** `mulberry32`+`hashStr` gezaaide synthese (reproduceerbaar); **carry-forward** van echte-baseline-codes in de 730-dagen-reconstructie (`realSorted` + `cfPtr`, chronologische pointer) i.p.v. synthetische ruis op niet-maandgrens-dagen. `SECONDARY_NAMES` incl. `I-D2-001-rt`, `I-D5-emotie`.
- **`cli/backtest.ts`** — `npx tsx src/cli/backtest.ts`, lookahead-vrij. Voor de drempel-freeze.
- **`webhook.ts`** — `buildWebhookPayload` + `dispatchTriggers` (dry-run zonder URL).
- **Tests:** `test/engine.test.ts`, `test/v04.test.ts`, `test/webhook.test.ts`, **`test/seasonal.test.ts` (V11, 10 tests)** → **86 groen**.

## 3. Pipeline (`app/pipeline/pipeline/`) — ongewijzigd in V11

- **`run.py`** — orkestrator. `repair_failed()` self-repair, `append_to_history()` (ook secundaire signalen). Output `data/raw-values.json`.
- **`fetchers/`** — per bron één module. `gdelt.py` (I-D5-001 + emotie-secundair), `events.py` (I-D5-003 + onrust-keywords), `datex_traffic.py` (I-D2-001-rt, DATEX v3 file-km, secundair), `verkeerscentrum.py` (jaar-I-D2-001 YoY), `wikipedia.py` (I-D5-002), `reddit.py`/`layoff_radar.py` (secundair), plus kmi/irceline/waterinfo/pollen/fod_economie/irail/statbel/energy_charts/fod_waso/nbb/elia.
- **`lexicon_emotion_nl.py`** — discrete emotie woede/angst/verdriet/walging. **`scripts/backfill_*.py`** — historische baselines via `backfill.yml`.
- **(V11) `analysis/multicollinearity.py`** — Spearman-redundantie-audit op `data/history` (verbeterplan §4.6, pure Python, draait). **(V11) `validation/criterion_validity.py`** — criteriumvalidatie-stub met datacontract tegen Belgische ijkbronnen (§2.4/6-bis.4). Output naar `data/analysis/*.json` (gegenereerd, niet committen). Volledige status: `Handover V11/VERBETERPLAN-V3-STATUS.md`.

## 4. Web (`app/web/src/`)

- **`App.tsx`** — laadt `latest.json` (`data`) + `latest-expert.json` (`expertData`).
- **`components/ConditionLevelDisplay.tsx`** — het publieke getal (score op 100) + 0-100-meter + **(V11) `kickerWord(cn, score)`**: het kicker-woord volgt de percentiel-band (`<50 LAAG / 50-69 GEMIDDELD / 70-89 VERHOOGD / ≥90 HOOG`, CN5 = "EVEN OP PAUZE"), niet langer het conditie-niveau. **(V11)** copy: "vergelijkbare dagen (zelfde tijd van het jaar) in de voorbije twee jaar".
- **`components/TierIndicator.tsx`** — **(V11)** status-kaart ("BAND … / Vandaag is …") volgt nu de **DAG-band** via `scoreBand(score)` (50/70/90), niet langer de sustained-tier. Krijgt `score` (was `tier`/`daysInTier`) uit `ButtonPanels`. Zo klopt de kop met het getal. Banner/campagne-activatie blijft elders op de sustained-tier.
- **`copy.ts` band-copy (V11)** — `scoreBand()`, `BAND_LABEL` (LAAG/GEMIDDELD/VERHOOGD/HOOG, = de kicker-woorden), `BAND_HEADLINE`, `BAND_SUBLINE`, `BAND_COLOR` (laag/gemiddeld→green, verhoogd→amber, hoog→red). De oude `TIER_HEADLINE/TIER_SUBLINE` zijn ongebruikt (mogen weg). `METHODOLOGY_DISCLAIMER` ingekort. **"Wat we doen" = 6 thema's en 24 elementen** (de tool heeft 6 domeinen; Peter opperde 9 → open vraag, voorlopig 6).
- **`components/AllSources.tsx`** — **(V11)** alleen nog de Databronnen-kolom; de wetenschappelijke artikels staan in het aparte `ScienceReferences`-paneel.
- **`components/DomainContributions.tsx`** — domein-balken. **(V11)** negatief = `--lha-clay` (#b87d58, leesbaar) i.p.v. `--lha-sky` (bijna-wit).
- **`components/PercentileDisplay.tsx`** — expert-percentiel-paneel. **(V11)** copy "vergelijkbare periode ... voorbije twee jaar".
- **`components/ButtonPanels.tsx` / `V04Technical.tsx` / `KernIndicators.tsx`** — **(V11)** version-/test-jargon weg ("De kern van de meting", "Meet- en trigger-laag", badge "campagnes: handmatig"). Honest substance ("vereisen handmatige goedkeuring, er vuurt niets automatisch") behouden.
- **`components/TopInfluences.tsx`** — top-3 indicatoren naar |contribution|, trage eruit + uitklap "Hoe kiezen we deze drie?".
- **`components/Methodology.tsx`** — bevat al "een zomerdag wordt vergeleken met zomerdagen" (de seizoens-copy die de engine nu eindelijk waarmaakt).
- **`copy.ts`** — **(V11)** footer "Dagelijks automatisch bijgewerkt." (was "Werkt nu nog in test-modus."), methodologyRef zonder "v0.2".
- **`styles.css`** — `:root` kleuren. **(V11) `--lha-clay: #b87d58`** toegevoegd (negatieve balken). **(V11) `.footer` background = `#2b2019`** (warm charcoal uit het hero-foto-palet, was `--lha-blue-deep`-groen). `--lha-blue-*` bevatten historisch GROEN. Status-kleuren `--st-*` niet aanraken.

## 5. Belangrijke conventies
- Publieke kop = v0.2 in test-modus (geen v04-lek; `latest.json` = v0.2-only, geverifieerd live `'v04' in d == False`).
- Grade-D = uit het cijfer + verborgen uit lijsten. Grade-C = in het cijfer, gereduceerd evidence-gewicht.
- **Seizoens-bewust percentiel (V11):** vandaag vs dezelfde tijd van het jaar (max 730 dagen). Lookahead-vrij. Geen demping (rauw dag-cijfer, Peters keuze).
- Pre-registratie-discipline: drempels/gewichten/formules vooraf vast; wijzigen = gedocumenteerd amendement. De seizoens-omschakeling + carry-forward + determinisme zijn zulke amendementen (gedocumenteerd in de module-docstrings en commit-messages).
- **Diagnosticeer nooit op het gecommitte `latest.json`** (stale, V10-valkuil). Gebruik de live URL of regenereer.
