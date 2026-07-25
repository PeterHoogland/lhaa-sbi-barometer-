# CODEV6 — Architectuur & code (SBI-barometer)

Begeleidt **HANDOVER-V6**. Beschrijft de codebase zoals die ná de V6-sessie staat.

## Repo-structuur
```
app/engine/    TypeScript-rekenkern (z-scores, composiet, kern, triggers, output-generatie)
app/pipeline/  Python-fetchers (echte bronnen) + backfill-scripts
app/web/       React/Vite SPA (Cloudflare Workers static assets)
.github/workflows/daily.yml   dagelijkse cron: fetch → build → deploy → persist → demo-alert
.github/workflows/backfill.yml  handmatige backfills (CI = schoon net)
00_Pre-Registratie.md         de pre-registratie (doc 00); amendementen via §13 grond A2
```

## Engine (`app/engine/src/`)
- **`runtime.ts` — `computeDaily(input)`**: dé kern. Bouwt v0.2 (condition_level, composite equal/evidence, percentile.short_24m, tier, indicator_breakdown, secondary_signals) **én** `v04` (computeV04). Belangrijke plekken:
  - z-loop (~r.110): per indicator STL→z; `hist.length < MIN_HISTORY_FOR_Z (30)` → naar `missing` (state "ontbreekt", uit composiet, NIET 0); `!isFinite(z)` (geen schaal) → ook `missing`.
  - `weight_sensitivity` (~r.163): `correlation_inverse_vs_equal_12w` en `bootstrap_95_ci_around_equal` = `null` + `status: not_computed` (geen verzonnen getallen).
  - `percentile.fixed_2010_2019` = `null` + `_status` (geen kopie van short_24m).
  - **`buildPercentileHistory` (geëxporteerd, ~r.361)**: lookahead-vrij — dag t weegt enkel tegen punten t/m t (`values.slice(0, i+1)`). Voedt de tier (v0.2 + v04).
  - indicator_breakdown-map (~r.211/300): `contribution = 0` als `isMissing || meta.grade === "D"` (D telt niet mee).
- **`methodology/zscore.ts`**: `median`, `madScaled` (×1,4826 = 1/0,6745), **`robustScale`** (MAD → IQR/1.349 → SD → NaN), `zscore` (sigma=0/NaN → **NaN**, aanroeper markeert als ontbreekt). Geen ±∞ mogelijk; winsor ±3 in `winsorize.ts`.
- **`methodology/composite.ts`**: `computeComposite(zScores, "equal"|"evidence")`. Slaat **grade-D** indicatoren over (uit het cijfer). Idem `computeCompositeWithoutD5`, `computeDemographicComposite`.
- **`methodology/weights.ts`**: `GRADE_WEIGHT = {A:3,B:2,C:1,D:0}`. Schema 1 = equal (1/6 domein, 1/N indicator); Schema 2 = evidence (SCHEMA_2_DOMAIN_WEIGHTS × grade). Publieke kop gebruikt **equal**.
- **`indicators/registry.ts`**: de 24 indicator-meta's (code, domein, **grade A/B/C/D**, inverseCoded, applyStl, source). Grade-D nu: I-D5-001, I-D5-002, I-D3-003.
- **`indicators/kern.ts`**: `KERN_CODES` (9: nieuws, verkeer, gebeurtenis, wikipedia, hitte, koude, energie, brandstof, inflatie), `klasse` (direct/snel/traag), `ACHTERGROND_CODES` (grondlast). **`bewijslast`** (A:3,B:2,C:1,D:0 → w_meting) en **`triggerGewicht`** (A:3,B:2,C:1,**D:1** → w_trigger): losgekoppeld zodat D uit de meting maar in de trigger blijft. `snelheidsfactor`, `reikwijdte` (= demographic_reach).
- **`methodology/kern-weights.ts`**: `wMeting = bewijslast×reikwijdte` (genormaliseerd over de 9); `wTrigger = triggerGewicht×reikwijdte×snelheidsfactor`.
- **`methodology/baseline-window.ts`**: `windowedZ` (z_kort ~18m, z_lang ~120m), `sliceTrailing` neemt enkel datum ≤ asOf (lookahead-veilig); NaN-z → applied:false.
- **`methodology/triggers.ts`**: T1 `indicator.spike` (per-indicator `delta_1d ≥ 1.5×loadFactor`, alleen direct/snel), T2 `indicator.red` (`percentile_lang ≥ 95×loadFactor`, **grondlast uitgesloten** §3.3), T3 `composite.amber/red` (P70/P90). **Triggers vuren per-indicator, niet via w_meting** → media-spikes blijven vuren ook al is hun w_meting 0.
- **`cli/generate-fixture.ts`** (= de productie-generator, ~2,5 min): leest echte historie (`data/history/*.json`) + de pipeline-output van vandaag (`data/raw-values.json`), draait `computeDaily` over ~730 dagen voor de percentiel-historie, en schrijft:
  - **`latest.json`** (publiek): in test-modus de v0.2-projectie **zonder** `v04` (`delete publicOutput.v04`).
  - **`latest-expert.json`**: de volledige output incl. `v04`.
  - **`signal.json` / `api/v1/signal.json`** (embed): v04-getallen `null` in test-modus.
  - **`sparkline-30d.json`**. Roept aan het eind de campagne-webhook aan (dry-run als leeg).
- **`webhook.ts`**: `buildWebhookPayload` + `dispatchTriggers` (POST met time-out, breekt nooit de build).
- **`cli/backtest.ts`**: 742-dagen-backtest (tier-verdeling, percentielen, trigger-tellingen). Lookahead-vrij.

## Pipeline (`app/pipeline/`)
- **`pipeline/run.py`**: `fetch_one_day` (alle fetchers) → `append_to_history` (echte dagwaarden naar `data/history/{code}.json`, deduped op observation_date; mock/missing NIET in historie). Schrijft `data/raw-values.json`.
- **`pipeline/fetchers/*.py`**: elke fetcher = echte API + mock-fallback (`simulated=True` bij falen). Echte bronnen (zie pipeline/README.md): KMI/open-meteo (weer, lucht, pollen), Waterinfo, iRail, ENTSO-E (energie, `ENTSOE_TOKEN`), Elia (stroomnet), GDELT+RSS (nieuws), Wikimedia (wikipedia), ECB SDW (inflatie), Eurostat (werkloosheid), ECB MIR (hypotheek), be.STAT+ECB ICP (brandstof). Verkeer = jaarcijfer (geen net), YoY.
- **`scripts/backfill_*.py`**: verkeer (YoY-groei-historie), brandstof (ECB), gebeurtenis (GDELT). Geen netwerk waar mogelijk; bron-tabellen in de fetchers = één bron van waarheid.

## Web (`app/web/src/`)
- **`App.tsx`**: laadt `latest.json` (publiek) → `data`; laadt **optioneel** `latest-expert.json` → `expertData`. Publieke componenten krijgen `data` (v0.2); `ButtonPanels` krijgt `expertData ?? data` (expert-panelen).
- **`lib/explainer.ts`**: `buildContext` — v0.4-kern stuurt de kop **alleen in live-modus**; in test (of zonder v04) = v0.2 (`buildContextV02`). `buildPercentileLine`, `enrichKern`.
- **Componenten**: `ConditionLevelDisplay` (CN-cijfer/dots/kleur-per-niveau + melding rechtsonder), `TopInfluences` (top-3, trage codes weggefilterd), `ButtonPanels` (klap-panelen; kern "(v0.4 — testfase)", technisch, expert-lijst, bronnen, wetenschap), `IndicatorList` (24-lijst per domein + provenance-label echt/vertraagd/demo), `KernIndicators`, `PercentileDisplay` (2010–2019-regel verborgen bij null), `HeroBanner`.
- **`indicators/plain-language.ts`** (engine): per indicator plain/why/reads/unit/dataSource/references — de eerlijke bronlabels.

## Datastroom
`run.py` (echte fetch) → `raw-values.json` + `history/*.json` → `generate-fixture.ts` (engine) → `latest.json` (publiek) + `latest-expert.json` (expert) + `signal.json` (embed) + `sparkline-30d.json` → `App.tsx` (web).

## Bouwen / testen / deployen
```
cd app/engine && npx tsc --noEmit && npm test        # 72 tests
cd app/engine && npx tsx src/cli/backtest.ts          # backtest ~1 min
cd app/web && npm run build                            # tsc -b && vite build
git add <code> && git commit && git push && gh workflow run daily.yml --ref main   # deploy ~7 min
```

## Invarianten (NIET breken)
- Test-modus: publiek = v0.2; **geen v04-waarde in `latest.json`/`signal.json`** (alleen `latest-expert.json`).
- Grade-D telt niet mee in het cijfer (composiet skip + contribution 0) maar blijft trigger-relevant.
- Verkeer = YoY %. Robuuste z (geen ±∞, MAD=0→NaN→ontbreekt). Percentiel/tier lookahead-vrij.
- Bronlabels eerlijk (echte toegangsweg). Geen verzonnen "diagnostiek"-getallen.
