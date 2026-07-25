# CODE-V10 — Architectuur & waar alles zit

Begeleidt HANDOVER-V10. Doel: een nieuwe sessie navigeert hiermee de codebase zonder eerst alles te moeten herontdekken.

## 1. Drie lagen

```
app/
├── pipeline/   Python — fetcht echte databronnen → data/raw-values.json
├── engine/     TypeScript — rekent het cijfer + triggers (computeDaily/computeV04)
└── web/        React/Vite — leest /data/*.json, rendert de barometer
```

Dataflow: **pipeline (fetch) → `data/raw-values.json` → engine `generate-fixture.ts` (computeDaily) → `latest.json` + `latest-expert.json` → web**. CI (`daily.yml`) draait dit dagelijks en deployt naar Cloudflare.

## 2. Engine (`app/engine/src/`)

- **`runtime.ts`** — `computeDaily()` (v0.2-output: condition_level, composite, percentile, tier, `indicator_breakdown`) + `computeV04()` (v0.4 meet-/triggerlaag). **`IndicatorBreakdown` heeft sinds V10 een `grade`-veld** (D wordt verborgen in de UI-lijsten). De `confirmedBy`-lijst (r.~539) bepaalt trigger-severity; daar zit nu ook `I-D5-emotie`. `computeV04` ontvangt `emotieSignal` en geeft die door aan `evaluateTriggers`.
- **`indicators/registry.ts`** — de 24 indicatoren met `grade` (A/B/C/D). **Let op:** `I-D5-001` + `I-D5-002` staan op **C** (Peters override, in het cijfer); `I-D3-003` op D (uit cijfer). Grade-maps: `kern.ts GRADE_METING`/`GRADE_TRIGGER`, `weights.ts GRADE_WEIGHT` (alle A:3/B:2/C:1/D:0). `composite.ts` sluit alleen grade-D uit.
- **`indicators/plain-language.ts`** — publieke "why/reads"-copy per indicator (neutraal NL).
- **`indicators/kern.ts`** — de 9 kern-codes + `isKern()` + grade-naar-gewicht.
- **`methodology/triggers.ts`** — `evaluateTriggers()`. Trigger 1 (spike), 2 (indicator.red P95), 3 (composite P70/P90), **4 (`emotie.spike`, V10, gated op `MIN_EMOTIE_HISTORY=20`)**. `TriggerType` + `TriggerEvent.code` zijn verbreed met `emotie.spike`/`"I-D5-emotie"`.
- **`methodology/composite.ts` / `kern-composite.ts` / `weights.ts` / `zscore.ts` / `baseline-window.ts`** — de wiskunde.
- **`cli/generate-fixture.ts`** — bouwt de output uit pipeline-data + synthetische fallback. `SECONDARY_NAMES` (vriendelijke namen, incl. `I-D5-emotie`, `I-D2-001-rt`). `emotieStatsFromHistory()` levert percentiel + #punten voor de emotie-confirmation én -trigger. `confirmationSignals` (radar/reddit/emotie). `loadPipelineToday()` leest `raw-values.json`.
- **`cli/backtest.ts`** — `npx tsx src/cli/backtest.ts`, lookahead-vrij.
- **`webhook.ts`** — `buildWebhookPayload` + `dispatchTriggers` (dry-run zonder URL).
- **Tests:** `test/engine.test.ts`, `test/v04.test.ts` (incl. 4 emotie-spike-tests), `test/webhook.test.ts` → **76 groen**.

## 3. Pipeline (`app/pipeline/pipeline/`)

- **`run.py`** — orkestrator. `fetch_one_day()` roept alle fetchers (primair `batch.add`, secundair `batch.add_secondary`). **`repair_failed()` + `_fetcher_for`-map (V10 self-repair)**: her-ophaalpoging voor mock-gevallen. `append_to_history()` bouwt `data/history/<code>.json` op — **sinds V10 ook voor secundaire signalen** (emotie, datex). Output: `data/raw-values.json`.
- **`util.py`** — `FetchResult`/`FetchBatch`, `safe_request()` (retries), `seasonal_noise()` (mock).
- **`cache.py`** — `get`/`put` naar `data/sbi-cache.json` (let op: skip-worktree, zie TOEGANG-V10).
- **`lexicon_nl.py`** — Pattern.nl-valentielexicon (toon).
- **`lexicon_emotion_nl.py` (V10)** — discrete emotie-lexicon woede/angst/verdriet/walging; `emotions_of_text()` + `aggregate_emotions()`.
- **`media_profiles.py`** — bron-poststratificatie naar leeftijdspubliek (CIM-ramingen). 16 RSS-bronnen na V10-uitbreiding.
- **`fetchers/`** — per bron één module. Relevante V10:
  - `gdelt.py` — I-D5-001 (GDELT-toon + 13/16 RSS-corpus + emotie-profiel + `news_emotion_secondary()` voor `I-D5-emotie`); I-D5-003 (GDELT event-volume).
  - `events.py` — RSS-magnitude-kandidaten → `pending_events.json` (menselijke review); onrust-keywords (skeyes).
  - `datex_traffic.py` (V10) — `I-D2-001-rt`, DATEX v3 file-km.
  - `wikipedia.py` — actieve I-D5-002. `google_trends.py` — bestaat maar **niet gewired** (server blokkeert pytrends).
  - `reddit.py` (I-D5-006S), `layoff_radar.py` (I-D3-003S) — secundair/confirmation.
  - Overige: `kmi` (hitte/koude), `irceline` (lucht), `waterinfo`, `pollen`, `verkeerscentrum` (jaar-I-D2-001), `fod_economie` (brandstof), `irail` (trein), `statbel` (cpi/werkloosheid), `energy_charts` (energie), `fod_waso` (ontslag), `nbb` (hypotheek), `elia` (stroomnet).
- **`scripts/backfill_*.py`** — historische baselines, via `backfill.yml`. **TODO V10: `backfill_datex_traffic.py`.**
- **`tests/test_lexicon_emotion.py`** — `python3 app/pipeline/tests/test_lexicon_emotion.py` (5 groen). Geen pytest in de pipeline.

## 4. Web (`app/web/src/`)

- **`App.tsx`** — laadt `latest.json` (`data`) + `latest-expert.json` (`expertData`). Rendert `ConditionLevelDisplay`, `TopInfluences`, `ButtonPanels`.
- **`components/TopInfluences.tsx`** — "Wat speelt vandaag het meest mee" (top-3 naar |contribution|, trage/lege eruit) **+ V10 uitklap "Hoe kiezen we deze drie?"**.
- **`components/IndicatorList.tsx` / `IndicatorZView.tsx`** — expert-lijsten, **filteren grade-D** (V10), dynamische telling-copy.
- **`components/HeroBanner.tsx`** — eyebrow "Stressor-Blootstellings-Index" + subtitel (V10: rename teruggedraaid).
- **`components/ConditionLevelDisplay.tsx`** — het publieke getal als **score op 100** (`Math.round(ctx.percentile)`) + "/100" + 0-100-meter (`cn-score`/`cn-meter` in styles.css) met drempelzones + positie-stip. Label "STRESS-INDEX OP DIT MOMENT". Band-kleur via `cn-level-N` blijft. (V10; was 1-5-cijfer.)
- **`lib/explainer.ts`** — `buildContext` (v0.2 in test-modus), `enrichKern`.
- **`styles.css`** — `:root` kleur-variabelen. **Let op:** de `--lha-blue-*`-variabelen zijn historisch maar bevatten GROEN. `body::before` = hero-foto (`/hero.webp`, blur), `body::after` = **warme tint** (V10, `rgba 43,32,25`). Status-kleuren `--st-rust/--st-warn/--st-alert` (groen/amber/rood) = semantisch, niet aanraken.
- **`copy.ts`** — publieke copy-strings.
- **`types.ts`** — mirror van engine-typen (incl. `grade?`, `emotie.spike`).

## 5. Belangrijke conventies
- Publieke kop = v0.2 in test-modus (geen v04-lek). `latest.json` = v0.2-only; v04 → `latest-expert.json`.
- Grade-D = uit het cijfer + verborgen uit lijsten. Grade-C = in het cijfer, gereduceerd evidence-gewicht.
- Secundaire signalen bouwen óók historie op (voor toekomstige baselines).
- Pre-registratie-discipline: drempels/gewichten/formules vooraf vast; wijzigen = gedocumenteerd amendement.
