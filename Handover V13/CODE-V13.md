# CODE-V13 — Architectuur & bestandskaart (deltas sinds V12)

Begeleidt `HANDOVER-V13.md`. CODE-V12 blijft geldig voor de ongewijzigde kern; dit doc beschrijft enkel wat deze sessie (2026-06-04) nieuw/gewijzigd is.

## Nieuwe modules / projecten
- **`app/pipeline/pipeline/healthcheck.py`** (canary) — pure `analyze(raw_values, index, today)` + `main()`. Leest `raw-values.json` (18 primair + 11 secundair, `simulated`-vlaggen + `source`) + `latest-expert.json`. Verdict ok/degraded/critical. Alarmeert op simulated / cache-terugval (`source` begint met "cache") / afwezig / stale — NOOIT op waarde 0. Schrijft `health-report.json` → app/data + web/public/data (`/data/health-report.json`). Inventaris EXPLICIET gedeclareerd (PRIMARY_SOURCES, SECONDARY_SOURCES). Tests: `tests/test_healthcheck.py` (18).
- **`app/pipeline/pipeline/verify_live.py`** (post-deploy eindresultaat-controle) — pure `assess(latest, health, now)` + `main()` (gebruikt `requests`, niet urllib — SSL/certifi). Controleert de LIVE site: vers (≤45 min), 25 indicatoren, **composiet = Σ contributies (COMPOSITE_TOL 0.06)**, elke indicator gescoord óf "ontbreekt" (geen stil-kapotte), percentiel [0,100], canary niet kritiek. Exit non-zero → run rood. Gesimuleerd = notitie. Tests: `tests/test_verify_live.py` (10).
- **`app/cron-worker/`** (NIEUW Cloudflare-project) — `wrangler.jsonc` (name `lhaa-sbi-cron`, account_id `90650c9157a45b740546805924c8c42e`, cron `0 4-20 * * *`) + `src/index.js` (scheduled-handler → GitHub `workflow_dispatch` van daily.yml; fetch-handler `/trigger?key=<token>` voor handmatige test). Secret `GITHUB_DISPATCH_TOKEN`.

## Gewijzigde Python-fetchers (bron-swaps naar Belgisch)
- **`fetchers/irceline.py`** — herschreven: IRCELINE SOS-API (geo.irceline.be) i.p.v. open-meteo CAMS. `daily_composite_series()` (gedeeld live+backfill), POLLUTANTS NO2 6504 / O3 6625 / PM10 6626, MIN_POLLUTANTS=2.
- **`fetchers/waterinfo.py`** — herschreven: VMM + SPW KiWIS i.p.v. open-meteo GloFAS. `discharge_sum_series()`, 4 STATIONS (ts_id's in MEDIA-V13), som dag-debiet.
- **`fetchers/sciensano_pollen.py`** (NIEUW) — secundair `I-D1-010-sci`, Sciensano AirAllergy-API, −1-sentinel eruit, gem. over rapporterende stations.
- **`fetchers/verkeerscentrum.py`** — `imputed=True` op I-D2-001 (A7).
- **`run.py`** — `sciensano_pollen` geïmporteerd + `add_secondary`.
- **`healthcheck.py`/`verify_live.py`** — zie boven.

## Engine (app/engine/src) — gewijzigd
- **`runtime.ts`** — (1) breakdown-entry krijgt `imputed` (uit `imputedIndicators`) + `inverseCoded` (uit `meta.inverseCoded`). (2) **v0.2-loop sluit niet-deterministische codes zonder echte baseline uit** (`!meta.deterministic && input.realBaselineCodes && !includes(code)` → `missing.push`) — geen scoren tegen synthetische historie (trein-fix).
- **`types.ts`** — IndicatorBreakdown += `imputed?`, `inverseCoded?`.
- **`cli/generate-fixture.ts`** — loadPipelineToday leidt `imputedCodes` af (`r.imputed` OF `source` begint met "cache"), today-computeDaily krijgt `imputedIndicators`; PipelineResult += `imputed?`; SECONDARY_NAMES += `I-D1-010-sci`.
- **`indicators/registry.ts` + `plain-language.ts`** — bronlabels I-D1-004 (IRCELINE), I-D1-009 (VMM+SPW), I-D1-010 (CAMS eerlijk EU-model); registry-comment 20→25.

## Web (app/web/src) — gewijzigd
- **`components/indicator-utils.ts`** — `stateLabelFor(state, inverseCoded)` (inverse-coded badge), "geen data"→"geen uitschieter".
- **`components/IndicatorList.tsx`** — provenance += "verouderd" (imputed/cache), summary; gebruikt stateLabelFor. **`TopInfluences.tsx`** idem.
- **`types.ts`** — IndicatorBreakdown += `imputed?`, `inverseCoded?`.
- **`App.tsx`** — A5 testmodus-footer (`!data.v04`). **`ConditionLevelDisplay.tsx`/`PercentileDisplay.tsx`** — 15-jarige zin. **`SecondarySignals.tsx`** — kop "Signalen naast het cijfer". **`ScienceReferences.tsx`** — methodologie-footer weg. **`CallToAction.tsx`/`PreviewPage.tsx`** — link → plus.hautes-alpes.net.

## .github/workflows/daily.yml
- schedule `0,20,40`→`30 * * * *` (dead-man's-switch; Worker is primair). Nieuwe stappen: **canary** (na generate-fixture, id `health`), **alarm** (rollende issue), **critical-marker**, **verify_live** (laatste stap, faalt run bij fout eindresultaat).

## ⛔ Open bug — zie HANDOVER-V13 §"EERSTE PRIORITEIT": Hitte I-D1-002 valse "extreem" (schaal-mismatch live-waarde vs delta-baseline).
