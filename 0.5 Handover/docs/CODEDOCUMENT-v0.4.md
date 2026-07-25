# CODEDOCUMENT v0.4 — code-kaart SBI-barometer

Uitgevoerd 2026-06-01 · `main` @ `afd9811`. Géén volledige code-dump (de repo is de bron);
dit is een **kaart**: welke module wat doet, sleutelfuncties + signatures, en de dataflow.
Open de genoemde files voor de details.

## Dataflow (één dagcyclus)

```
Python pipeline (app/pipeline)                 TS-engine (app/engine)              Web (app/web)
fetchers/*.py  → raw-values.json   ──►  runtime.computeDaily(input)  ──►  latest.json  ──►  React
   + data/history/<CODE>.json (echte baselines, door pipeline + backfills opgebouwd)
```
- `python -m pipeline.run` → schrijft `app/data/raw-values.json` + appendt echte dagwaarden aan
  `app/data/history/<CODE>.json` (`append_to_history`, cap 1100 punten).
- `npm run generate-fixture` (engine CLI) → laadt history + raw-values, roept `computeDaily` per
  dag aan over een **730-dagen-venster** (voor de percentielen) + vandaag, schrijft
  `latest.json`/`sparkline-30d.json`/`signal.json` naar `app/data/` én `app/web/public/data/`.
- `npm run build` (web) → Vite-bundel → `surge ./dist`.

## Engine (`app/engine/src/`)

**`runtime.ts` — `computeDaily(input: DailyComputeInput): DailyOutput`.** Het hart.
- v0.2-pad (ongewijzigd): STL → MAD-Z (24m) → winsorize → composite equal/evidence/demographic
  → percentiel → tier → condition_level → `indicator_breakdown` (24 indicatoren).
- v0.4-pad: helper **`computeV04(...)`** (onderaan het bestand). Per kern-code:
  `windowedZ` voor z_kort (18m) + z_lang (120m), `delta_1d` (z_kort t − t-1), `percentile_lang`
  (rank van today's effectieve waarde in het lange venster), `baseline_lang_jaren`, `state`.
  Dan `compositeMeting`/`achtergrond`/`loadFactor`, v0.4-tier (`computeV04Tier`), en
  `evaluateTriggers`. Resultaat → `output.v04` (type `V04Output`).
- Nieuwe input-velden: `realBaselineCodes` (alleen deze codes tellen in v04 — synthetische
  fixture-historie uitgesloten), `compositeMetingHistory`, `priorTriggerState`,
  `confirmationSignals`, `nowISO`.
- Helpers: `mergeToday`, `lastBefore`, `sortByDate`, `round2/round3`.

**`indicators/kern.ts`** — kern-config (bron van waarheid voor de reken-laag):
`KERN_CODES` (9 codes), `klasse(code)` (direct/snel/traag), `SNELHEIDSFACTOR`,
`ACHTERGROND_CODES` (energie/brandstof/inflatie — let op: ≠ klasse==traag, §3.3),
`bewijslast(code)` (grade A→3/B→2), `reikwijdte(code)` (= demographic_reach).

**`methodology/baseline-window.ts`** — `sliceTrailing(series, asOf, months)` (lookahead-vrij,
datum ≤ asOf), `windowedZ(value, series, asOf, months, meta) → {z, n, jaren, applied,
effectiveValue, distribution}` (MAD-Z + STL waar `applyStl`), `spanYears`. `MIN_POINTS_FOR_Z=8`.

**`methodology/kern-weights.ts`** — `wMeting(code)` = bewijslast×reikwijdte (genorm.),
`wTrigger(code)` = ×snelheidsfactor (genorm.). Beide sommeren tot 1 over de 9 kern.

**`methodology/kern-composite.ts`** — `compositeMeting(zLang)`, `achtergrond(zLang)`,
`loadFactor(achtergrond)` = clamp(1−0.15·a, 0.6, 1.0). **`computeV04Tier(percHist)`** =
de ZICHTBARE v0.4-tier: oranje 1d≥P60, rood 2d≥P90, afschaling na 2d (constants
`V04_AMBER_P/RED_P/AMBER_SUSTAIN/RED_SUSTAIN/DECAY`). LET OP: de kop gebruikt het INSTANT
percentiel (zie web), niet deze sustained tier — die laatste staat alleen in het tech-paneel.

**`methodology/triggers.ts`** — `evaluateTriggers(input) → {triggers, newState, mode}`.
T1 spike (delta_1d ≥ SPIKE_DREMPEL×load_factor, alleen ⚡/🔆), T2 rood (percentile_lang ≥
`INDICATOR_RED_P=95` × load_factor), T3 composiet (≥P70 amber / ≥P90 rood). Remmen: cooldown
(`COOLDOWN_H` 48/72u per `type:code`), confirmatie→severity, brand-safety→require_manual_approval.
`campaign_hint`-mapping (oorlog/nieuws→brede_geruststelling, D3/brandstof→financieel, D1→gericht_weer).
Puur via `nowISO` (deterministisch → herbruikbaar in backtest).

**`methodology/stl.ts`** — `stlResidual` + een **datum-parse-cache** (string→{year,doy}); die
cache bracht generate-fixture van 268s → ~27s (vóór het 730-venster).

**`types.ts`** — `V04Output` (composite{meting,achtergrond,load_factor}, baseline, percentile
{lang,kort,fixed}, tier, `kern_breakdown: KernBreakdown[]`, `triggers: TriggerEvent[]`,
`trigger_state`), `KernBreakdown`, `TriggerEvent`, `TriggerState`. `DailyOutput.v04?`.

**`cli/generate-fixture.ts`** — orkestreert de dagrun. Bouwt 730-dagen `compositeHistory` +
`compositeMetingHistory` (sparkline = laatste 60), laadt/schrijft `trigger-state.json`, geeft
`realBaselineCodes` (≥60 echte punten) door. **`cli/backtest.ts`** — draait `computeDaily` dag-
na-dag over de echte historie, telt tier-verdeling + triggers (kalibratie-tool, §8).

## Web (`app/web/src/`) — kern-als-kop

- **`lib/explainer.ts`** — `buildContext(data)` kiest v04 (kern) als `data.v04` bestaat, anders
  v0.2-fallback. **`v04ConditionLevel(percentile, brandSafety)`** = de CN-bands (instant). De
  tellingen ("X van de Y kern-signalen") zijn DYNAMISCH (was hardgecodeerd "10"). `enrichKern(k,
  v02)` mapt een KernBreakdown naar IndicatorBreakdown (haalt `why` uit de v0.2-breakdown op code).
- **`components/ConditionLevelDisplay.tsx`** — leest `ctx.cn` (kern, instant). Grote cijfer +
  kicker + percentiel-regel. (De beschrijvende zin + de "Dag X op rij" zijn verwijderd.)
- **`components/TopInfluences.tsx`** — top-3 kern (App geeft `kern_breakdown.map(enrichKern)`).
- **`components/KernIndicators.tsx`** + **`V04Technical.tsx`** — kern-detail + de volledige
  v0.4-tabel/triggers; beide onder klap-knoppen in **`ButtonPanels.tsx`** (samen met de sparkline).
- **`App.tsx`** — paginastroom (zie HANDOVER §1). `PlainExplainer` is verwijderd (dode file blijft).
- **`types.ts`** — mirror van `V04Output`/`KernBreakdown`/`TriggerEvent`.

## Pipeline (`app/pipeline/`)

- **`fetchers/fod_economie.py`** — `ecb_fuel_eur_per_l_series()` (ECB HICP-index CP07.2.2 verankerd
  op be.STAT → maandelijkse €/l, 1996→nu) + `_parse_ecb_index_series`. (be.STAT geeft maar 1 rij.)
- **`fetchers/gdelt.py`** — `gdelt_tone_series` (toon, I-D5-001) + **`gdelt_event_series(start,end)`**
  (mode=timelinevol, thema's WAR/TERROR/KILL/NATURAL_DISASTER/… → I-D5-003).
- **`fetchers/events.py`** — `fetch_collective_events` GEHERDEFINIEERD: score = GDELT-volume
  (cache/mock-fallback), RSS-scan blijft voor pending_events (menselijke review).
- **`scripts/backfill_fuel_baseline.py`** / **`backfill_event_baseline.py`** — draaien via
  `.github/workflows/backfill.yml` op CI. Schrijven `data/history/I-D2-004.json` / `I-D5-003.json`.

## Tests — `app/engine/test/v04.test.ts` (25) + `engine.test.ts` (29) = 54 groen.
Dekt: window-slicing, gewichten=1, composiet, loadFactor-clamp, computeV04Tier (P60/P90),
T1/T2(P95)/T3 + remmen, integratie. Bestaande v0.2-primitieven onveranderd.
