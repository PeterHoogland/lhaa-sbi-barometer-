# CODEDOCUMENT — Stressor-Blootstellings-Index (SBI)

**Project:** Les Hautes Alpes · Anti-Stress Activator (barometer)
**Versie:** SBI v0.2
**Live:** https://les-hautes-alpes-sbi.surge.sh
**Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer-
**Uitgevoerd:** 2026-05-31
**Laatste commit:** `36702fc · 2026-05-21 22:05:08 +0200 · Header groter logo + scheidingslijn; domeinen als fotokaarten`

Dit document bundelt de volledige broncode van de barometer: de
TypeScript-engine, de Python-pipeline, de React-UI en de GitHub-Actions-
workflow. Bestemd voor code-review en wetenschappelijke verificatie.

Een apart `TOEGANG-EN-INFRASTRUCTUUR.md` document bevat alle praktische
informatie: links, accounts, secrets, externe bronnen, build-instructies.

Niet meegenomen (te groot of irrelevant voor code-review):
- `app/data/history/*.json` — echte historische baselines per indicator (in repo).
- `node_modules/`, `dist/`, `.git/`, cache-bestanden.

---

## Inhoud

- **Engine (TypeScript) — methodologie-rekenkern** — 19 bestanden
- **Engine — tests** — 1 bestanden
- **Data-pipeline (Python) — fetchers en orkestrator** — 34 bestanden
- **Web (React + Vite) — UI** — 31 bestanden
- **GitHub Actions — dagelijkse cron** — 1 bestanden
- **Top-level READMEs** — 4 bestanden

**Totaal:** 90 bestanden

---

# Engine (TypeScript) — methodologie-rekenkern

## `app/engine/src/cli/compute-daily.ts`

```ts
/**
 * Production-bridge: leest Python pipeline-output, draait engine, schrijft daily-output.json.
 *
 * Stappen (doc 03_Laag-4 §5.3):
 *   [1] EXTRACT     — pipeline heeft raw-values.json al geschreven
 *   [2] VALIDATE    — schema-check op input
 *   [3-7] runtime  — Z, STL, winsor, weight, aggregate, signal (engine doet dit)
 *
 * Run: tsx src/cli/compute-daily.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeDaily } from "../runtime.js";
import { INDICATORS, INDICATOR_CODES } from "../indicators/registry.js";
import type { IndicatorCode } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_VALUES = resolve(__dirname, "../../../data/raw-values.json");
const RAW_HISTORY = resolve(__dirname, "../../../data/raw-history.json");
const COMPOSITE_HISTORY = resolve(__dirname, "../../../data/composite-history.json");
const OUT_DATA = resolve(__dirname, "../../../data/latest.json");
const OUT_WEB = resolve(__dirname, "../../../web/public/data/latest.json");
const SPARK_DATA = resolve(__dirname, "../../../data/sparkline-30d.json");
const SPARK_WEB = resolve(__dirname, "../../../web/public/data/sparkline-30d.json");

interface PipelineResult {
  code: IndicatorCode;
  value: number;
  date: string;
  simulated: boolean;
  imputed: boolean;
  source: string;
  observation_date?: string;
}

interface PipelineBatch {
  target_date: string;
  results: PipelineResult[];
  secondary?: Array<{ code: string; value: number; simulated: boolean; source?: string; observation_date?: string }>;
  simulated_codes: IndicatorCode[];
  imputed_codes: IndicatorCode[];
}

const SECONDARY_NAMES: Record<string, string> = {
  "I-D5-006S": "Reddit-sentiment (onderstroom-peiling)",
};

function loadOrFail(path: string, what: string): string {
  if (!existsSync(path)) {
    console.error(`✗ ${what} ontbreekt: ${path}`);
    console.error("  → run eerst: cd ../pipeline && python -m pipeline.run --history-days 730");
    console.error("  → of, voor demo: npm run generate-fixture");
    process.exit(1);
  }
  return readFileSync(path, "utf-8");
}

function main() {
  const today = JSON.parse(loadOrFail(RAW_VALUES, "raw-values.json")) as PipelineBatch;

  // Bouw rawValues map + observation-dates
  const rawValues: Partial<Record<IndicatorCode, number>> = {};
  const observationDates: Partial<Record<IndicatorCode, string>> = {};
  for (const r of today.results) {
    rawValues[r.code] = r.value;
    if (r.observation_date) observationDates[r.code] = r.observation_date;
  }

  // Bouw historische archive per indicator
  const history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};
  if (existsSync(RAW_HISTORY)) {
    const histBatches = JSON.parse(readFileSync(RAW_HISTORY, "utf-8")) as PipelineBatch[];
    for (const code of INDICATOR_CODES) {
      if (INDICATORS[code].deterministic) continue;
      history[code] = histBatches.flatMap((b) =>
        b.results
          .filter((r) => r.code === code)
          .map((r) => ({ date: r.date, value: r.value })),
      );
    }
  }

  const compositeHistory = existsSync(COMPOSITE_HISTORY)
    ? (JSON.parse(readFileSync(COMPOSITE_HISTORY, "utf-8")) as Array<{ date: string; value: number }>)
    : [];

  const secondarySignals = (today.secondary ?? []).map((s) => ({
    code: s.code,
    name: SECONDARY_NAMES[s.code] ?? s.code,
    value: s.value,
    source: s.source ?? "",
    simulated: s.simulated,
    observation_date: s.observation_date ?? "",
  }));

  const output = computeDaily({
    date: today.target_date,
    rawValues,
    history,
    compositeHistory,
    simulatedIndicators: today.simulated_codes,
    imputedIndicators: today.imputed_codes,
    observationDates,
    secondarySignals,
  });

  // Update composite-history
  compositeHistory.push({ date: today.target_date, value: output.composite.equal });
  const trimmed = compositeHistory.slice(-730);

  // Update sparkline (last 60 entries)
  const spark = trimmed.slice(-60).map((c) => ({
    date: c.date,
    composite: c.value,
    percentile: 0,
    tier: "green" as const,
  }));

  for (const target of [OUT_DATA, OUT_WEB]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(output, null, 2));
  }
  for (const target of [SPARK_DATA, SPARK_WEB]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(spark, null, 2));
  }
  writeFileSync(COMPOSITE_HISTORY, JSON.stringify(trimmed, null, 2));

  console.log(`✓ daily-output:  ${OUT_DATA}`);
  console.log(`  Tier:        ${output.tier.current}`);
  console.log(`  Percentile:  P${output.percentile.short_24m}`);
  console.log(`  Composite:   ${output.composite.equal} (equal), ${output.composite.evidence_graded} (evidence)`);
  console.log(`  Simulated:   ${output.data_quality.indicators_simulated.length}/${INDICATOR_CODES.length} indicators`);
}

main();
```

## `app/engine/src/cli/generate-fixture.ts`

```ts
/**
 * Fixture-generator: produceert een realistische daily-output.json plus 60 dagen
 * sparkline-historie, op basis van gesimuleerde indicator-waarden.
 *
 * Wordt gebruikt als fallback wanneer de Python pipeline nog niet gedraaid heeft.
 * Alle gesimuleerde indicatoren worden expliciet als `simulated: true` gemarkeerd.
 *
 * Run: npm run compute -- --out ../../data/latest.json
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { INDICATOR_CODES, INDICATORS } from "../indicators/registry.js";
import { computeAllDeterministic } from "../indicators/deterministic.js";
import { computeDaily } from "../runtime.js";
import type { IndicatorCode } from "../types.js";

/** Optioneel: pipeline-output kan vandaag's waarden leveren (echt-tijd). */
interface PipelineResult {
  code: string;
  value: number;
  simulated: boolean;
  source?: string;
  observation_date?: string;
}
interface PipelineBatch {
  target_date: string;
  results: PipelineResult[];
  secondary?: PipelineResult[];
}

/** Vriendelijke namen voor secundaire signalen. */
const SECONDARY_NAMES: Record<string, string> = {
  "I-D5-006S": "Reddit-sentiment (onderstroom-peiling)",
  "I-D3-003S": "Ontslag-radar (nieuws-detectie)",
};

function loadPipelineToday(path: string): {
  realValues: Partial<Record<IndicatorCode, number>>;
  realCodes: Set<IndicatorCode>;
  observationDates: Partial<Record<IndicatorCode, string>>;
  secondarySignals: Array<{ code: string; name: string; value: number; source: string; simulated: boolean; observation_date: string }>;
} {
  const realValues: Partial<Record<IndicatorCode, number>> = {};
  const realCodes = new Set<IndicatorCode>();
  const observationDates: Partial<Record<IndicatorCode, string>> = {};
  let secondarySignals: Array<{ code: string; name: string; value: number; source: string; simulated: boolean; observation_date: string }> = [];
  if (!existsSync(path)) return { realValues, realCodes, observationDates, secondarySignals };
  try {
    const batch = JSON.parse(readFileSync(path, "utf-8")) as PipelineBatch;
    for (const r of batch.results) {
      if (r.observation_date) observationDates[r.code as IndicatorCode] = r.observation_date;
      if (!r.simulated) {
        realValues[r.code as IndicatorCode] = r.value;
        realCodes.add(r.code as IndicatorCode);
      }
    }
    secondarySignals = (batch.secondary ?? []).map((s) => ({
      code: s.code,
      name: SECONDARY_NAMES[s.code] ?? s.code,
      value: s.value,
      source: s.source ?? "",
      simulated: s.simulated,
      observation_date: s.observation_date ?? "",
    }));
  } catch {
    // pipeline output is corrupt — fallback naar volledig synthetisch
  }
  return { realValues, realCodes, observationDates, secondarySignals };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(__dirname, "../../../data/latest.json");
const SPARKLINE_OUT = resolve(__dirname, "../../../data/sparkline-30d.json");
const SIGNAL_OUT = resolve(__dirname, "../../../data/signal.json");
const WEB_OUT = resolve(__dirname, "../../../web/public/data/latest.json");
const WEB_SPARKLINE_OUT = resolve(__dirname, "../../../web/public/data/sparkline-30d.json");
const WEB_SIGNAL_OUT = resolve(__dirname, "../../../web/public/data/signal.json");
const WEB_API_OUT = resolve(__dirname, "../../../web/public/api/v1/signal.json");
const PIPELINE_OUT = resolve(__dirname, "../../../data/raw-values.json");
const HISTORY_DIR = resolve(__dirname, "../../../data/history");

const TODAY = new Date();

/**
 * Echte historische reeksen per indicator (bv. de GDELT 24m-nieuwstoon-backfill
 * voor I-D5-001, zie app/pipeline/scripts/backfill_gdelt_baseline.py).
 * Waar zo'n bestand bestaat, vervangt het de synthetische baseline — de
 * dagwaarde wordt dan tegen ECHTE historie gewogen op dezelfde schaal.
 */
function loadRealHistory(): Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> {
  const out: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};
  if (!existsSync(HISTORY_DIR)) return out;
  for (const code of INDICATOR_CODES) {
    const p = resolve(HISTORY_DIR, `${code}.json`);
    if (!existsSync(p)) continue;
    try {
      const rows = JSON.parse(readFileSync(p, "utf-8")) as Array<{ date: string; value: number }>;
      if (Array.isArray(rows) && rows.length > 0) out[code] = rows;
    } catch {
      // corrupt historiebestand — negeer, val terug op synthetisch
    }
  }
  return out;
}

/** Realistische ruw-waarde-generatie met seizoens-modulatie. */
function syntheticRawValue(code: IndicatorCode, date: Date): number {
  const doy = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000;
  const yearProg = (doy / 365) * 2 * Math.PI;

  // Deterministische indicatoren komen niet uit deze synthese — die rekent de engine zelf
  switch (code) {
    case "I-D1-002": // Hitte
      return Math.max(0, 18 + 10 * Math.sin(yearProg - Math.PI / 2) + (Math.random() - 0.5) * 6);
    case "I-D1-003": // Kou
      return Math.max(0, 5 - 8 * Math.cos(yearProg) + (Math.random() - 0.5) * 4);
    case "I-D1-004": // Luchtkwaliteit (ratio tov WHO)
      return 0.8 + 0.3 * Math.cos(yearProg) + (Math.random() - 0.5) * 0.3;
    case "I-D2-001": // Filezwaarte (km·min)
      return 6500 + 1500 * Math.cos(yearProg - 0.5) + (Math.random() - 0.5) * 1500;
    case "I-D2-004": // Brandstofprijs (€/l)
      return 1.85 + 0.15 * Math.sin(yearProg) + (Math.random() - 0.5) * 0.08;
    case "I-D3-001": // CPI yoy %
      return 2.5 + 0.5 * Math.sin(yearProg / 2) + (Math.random() - 0.5) * 0.4;
    case "I-D3-002": // Energie €/MWh
      return 80 + 25 * Math.cos(yearProg) + (Math.random() - 0.5) * 15;
    case "I-D3-003": // log(1 + ontslagen)
      return Math.log(1 + 100 + 50 * Math.cos(yearProg + 1) + (Math.random() - 0.5) * 80);
    case "I-D3-005": // Werkloosheid %
      return 6.2 + (Math.random() - 0.5) * 0.4;
    case "I-D3-006": // Hypotheekrente %
      return 3.4 + (Math.random() - 0.5) * 0.2;
    case "I-D5-001": // Nieuwsneg (GDELT tone — fallback rond echte mediaan ~1.4)
      return Math.max(0, 1.4 + 0.6 * Math.sin(yearProg * 1.5) + (Math.random() - 0.5) * 0.9);
    case "I-D5-002": // Wikipedia-aandachts-index (per miljoen, fallback ~28)
      return Math.max(0, 28 + 6 * Math.sin(yearProg) + (Math.random() - 0.5) * 8);
    case "I-D5-003": // Collectieve gebeurtenissen 0-15
      return Math.random() < 0.05 ? Math.floor(Math.random() * 6) : 0;
    case "I-D1-009": // Wateroverlast-index (~1.0)
      return Math.max(0, 1.05 + (Math.random() - 0.5) * 0.3);
    case "I-D1-010": // Pollen (seizoensgebonden, lente-piek)
      return Math.max(0, 2 + 4 * Math.max(0, Math.sin(yearProg - 1)) + (Math.random() - 0.5) * 2);
    case "I-D2-009": // Treinverstoringen (aantal)
      return Math.max(0, 3 + (Math.random() - 0.5) * 4);
    case "I-D3-009": // Stroomnet-druk (ratio gemeten/voorspeld ~1.0)
      return Math.max(0, 1.0 + (Math.random() - 0.5) * 0.08);
    default:
      return 0;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function generate(): void {
  // Bouw 24 maanden historie per niet-deterministische indicator
  const historyDays = 730;
  const history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};

  // Echte historische reeksen (GDELT-backfill e.d.) + snelle datum→waarde-lookup
  const realHistory = loadRealHistory();
  const realHistMaps: Partial<Record<IndicatorCode, Map<string, number>>> = {};
  for (const code of INDICATOR_CODES) {
    const rows = realHistory[code];
    if (rows) realHistMaps[code] = new Map(rows.map((r) => [r.date, r.value]));
  }

  const simulatedCodes: IndicatorCode[] = [];
  const realBaselineCodes: IndicatorCode[] = [];
  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    if (meta.deterministic) continue;
    simulatedCodes.push(code);
    const real = realHistory[code];
    if (real && real.length >= 60) {
      history[code] = real;
      realBaselineCodes.push(code);
      continue;
    }
    const series: Array<{ date: string; value: number }> = [];
    for (let i = historyDays; i > 0; i--) {
      const d = new Date(TODAY.getTime() - i * 86400000);
      series.push({ date: isoDate(d), value: syntheticRawValue(code, d) });
    }
    history[code] = series;
  }

  // Deterministische indicatoren krijgen een ECHTE historie: hun waarde is een
  // reproduceerbare functie van de datum (daglicht, kalender), dus we berekenen
  // ze gewoon voor elke dag in het venster. Zo wegen ook deze indicatoren tegen
  // echte historie i.p.v. een lege baseline (z=0) zoals voorheen.
  for (let i = historyDays; i > 0; i--) {
    const d = new Date(TODAY.getTime() - i * 86400000);
    const iso = isoDate(d);
    const det = computeAllDeterministic(d);
    for (const [code, value] of Object.entries(det)) {
      (history[code as IndicatorCode] ??= []).push({ date: iso, value });
    }
  }

  // Bouw composiet-historie laatste 60 dagen door engine ineen-te-roepen per dag
  const compositeHistory: Array<{ date: string; value: number }> = [];
  const sparkline: Array<{ date: string; composite: number; percentile: number; tier: string }> = [];

  for (let i = 60; i > 0; i--) {
    const d = new Date(TODAY.getTime() - i * 86400000);
    const iso = isoDate(d);

    const rawValues: Partial<Record<IndicatorCode, number>> = {};
    for (const code of simulatedCodes) {
      // Echte historie waar beschikbaar, anders synthetisch
      rawValues[code] = realHistMaps[code]?.get(iso) ?? syntheticRawValue(code, d);
    }

    const out = computeDaily({
      date: iso,
      rawValues,
      history,
      compositeHistory,
      simulatedIndicators: simulatedCodes,
    });

    compositeHistory.push({ date: iso, value: out.composite.equal });
    sparkline.push({
      date: iso,
      composite: out.composite.equal,
      percentile: out.percentile.short_24m,
      tier: out.tier.current,
    });
  }

  // Vandaag — eerst synthetisch invullen, dan ECHTE waarden van de pipeline overschrijven
  const todayIso = isoDate(TODAY);
  const { realValues, realCodes, observationDates, secondarySignals } = loadPipelineToday(PIPELINE_OUT);

  const todayRaw: Partial<Record<IndicatorCode, number>> = {};
  for (const code of simulatedCodes) {
    todayRaw[code] = realValues[code] ?? syntheticRawValue(code, TODAY);
  }

  // Update simulated-lijst: indicatoren waarvoor pipeline ECHTE data leverde, zijn niet meer simulated
  const stillSimulatedToday = simulatedCodes.filter((c) => !realCodes.has(c));

  const detToday = computeAllDeterministic(TODAY);
  const todayOutput = computeDaily({
    date: todayIso,
    rawValues: { ...todayRaw, ...detToday } as Partial<Record<IndicatorCode, number>>,
    history,
    compositeHistory,
    simulatedIndicators: stillSimulatedToday,
    observationDates,
    secondarySignals,
  });

  if (realCodes.size > 0) {
    console.log(`  Real-time overrides van pipeline: ${[...realCodes].join(", ")}`);
  }
  if (realBaselineCodes.length > 0) {
    console.log(`  Echte historische baseline: ${realBaselineCodes.join(", ")}`);
  }

  sparkline.push({
    date: todayIso,
    composite: todayOutput.composite.equal,
    percentile: todayOutput.percentile.short_24m,
    tier: todayOutput.tier.current,
  });

  for (const target of [DEFAULT_OUT, WEB_OUT]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(todayOutput, null, 2));
  }
  for (const target of [SPARKLINE_OUT, WEB_SPARKLINE_OUT]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(sparkline, null, 2));
  }

  // Minimale signal-API (doc 06 §4.2) — voor lichte clients (banner-embed)
  const signal = {
    timestamp: todayOutput.timestamp,
    week_iso: todayOutput.week_iso,
    condition_level: todayOutput.condition_level,
    tier: todayOutput.tier.current,
    percentile_24m: todayOutput.percentile.short_24m,
    brand_safety_flag: todayOutput.brand_safety.flag,
    valid_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    methodology_version: todayOutput.data_quality.methodology_version,
  };
  for (const target of [SIGNAL_OUT, WEB_SIGNAL_OUT, WEB_API_OUT]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(signal, null, 2));
  }

  console.log(`✓ Daily output:  ${DEFAULT_OUT}`);
  console.log(`✓ Sparkline 60d: ${SPARKLINE_OUT}`);
  console.log(`✓ Signal API:    ${WEB_API_OUT}`);
  console.log(`✓ Web copy:      ${WEB_OUT}`);
  console.log(`  CN level:    ${todayOutput.condition_level.value} (${todayOutput.condition_level.name})`);
  console.log(`  Tier: ${todayOutput.tier.current}`);
  console.log(`  Percentile (short_24m): ${todayOutput.percentile.short_24m}`);
  console.log(`  Composite equal: ${todayOutput.composite.equal}`);
  console.log(`  Composite evidence-graded: ${todayOutput.composite.evidence_graded}`);
}

generate();
```

## `app/engine/src/data/calendar-be.ts`

```ts
/**
 * Belgische kalender — feestdagen, schoolvakanties, examenperiodes, fiscale deadlines.
 * Bron: doc 03_Laag-4 §2.4 + §2.6.
 *
 * Bevroren data 2024-2030. Bij update buiten dit venster: log een ontbrekende-data-vlag.
 */

/** Federale feestdagen — ISO YYYY-MM-DD. */
export const FEDERAL_HOLIDAYS: string[] = [
  // 2024
  "2024-01-01", "2024-04-01", "2024-05-01", "2024-05-09", "2024-05-20",
  "2024-07-21", "2024-08-15", "2024-11-01", "2024-11-11", "2024-12-25",
  // 2025
  "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-29", "2025-06-09",
  "2025-07-21", "2025-08-15", "2025-11-01", "2025-11-11", "2025-12-25",
  // 2026
  "2026-01-01", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25",
  "2026-07-21", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-25",
  // 2027
  "2027-01-01", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-17",
  "2027-07-21", "2027-08-15", "2027-11-01", "2027-11-11", "2027-12-25",
  // 2028
  "2028-01-01", "2028-04-17", "2028-05-01", "2028-05-25", "2028-06-05",
  "2028-07-21", "2028-08-15", "2028-11-01", "2028-11-11", "2028-12-25",
];

/** Schoolvakanties Vlaanderen, ranges [start, end] inclusief. */
export const VL_SCHOOL_HOLIDAYS: Array<{ start: string; end: string; name: string }> = [
  { start: "2024-10-28", end: "2024-11-03", name: "Herfstvakantie" },
  { start: "2024-12-23", end: "2025-01-05", name: "Kerstvakantie" },
  { start: "2025-02-24", end: "2025-03-02", name: "Krokusvakantie" },
  { start: "2025-04-07", end: "2025-04-20", name: "Paasvakantie" },
  { start: "2025-07-01", end: "2025-08-31", name: "Zomervakantie" },
  { start: "2025-10-27", end: "2025-11-02", name: "Herfstvakantie" },
  { start: "2025-12-22", end: "2026-01-04", name: "Kerstvakantie" },
  { start: "2026-02-16", end: "2026-02-22", name: "Krokusvakantie" },
  { start: "2026-04-06", end: "2026-04-19", name: "Paasvakantie" },
  { start: "2026-07-01", end: "2026-08-31", name: "Zomervakantie" },
  { start: "2026-10-26", end: "2026-11-01", name: "Herfstvakantie" },
  { start: "2026-12-21", end: "2027-01-03", name: "Kerstvakantie" },
  { start: "2027-02-15", end: "2027-02-21", name: "Krokusvakantie" },
  { start: "2027-03-29", end: "2027-04-11", name: "Paasvakantie" },
  { start: "2027-07-01", end: "2027-08-31", name: "Zomervakantie" },
];

/** Examenperiodes hoger onderwijs + CSE secundair. Doc 03 §2.6. */
export const EXAM_PERIODS: Array<{ start: string; end: string; level: "ho1" | "ho2" | "cse" }> = [
  { start: "2025-01-05", end: "2025-01-30", level: "ho1" },
  { start: "2025-05-19", end: "2025-06-14", level: "ho2" },
  { start: "2025-06-01", end: "2025-06-30", level: "cse" },
  { start: "2026-01-05", end: "2026-01-30", level: "ho1" },
  { start: "2026-05-19", end: "2026-06-14", level: "ho2" },
  { start: "2026-06-01", end: "2026-06-30", level: "cse" },
  { start: "2027-01-05", end: "2027-01-30", level: "ho1" },
  { start: "2027-05-19", end: "2027-06-14", level: "ho2" },
  { start: "2027-06-01", end: "2027-06-30", level: "cse" },
];

/** Belastingaangifte-weken (FOD Financiën — papieren + Tax-on-web aangifte). */
export const TAX_DEADLINE_WEEKS: Array<{ start: string; end: string }> = [
  // Aangifte typisch eind juni (papier) en mid-juli (digitaal)
  { start: "2025-06-23", end: "2025-07-15" },
  { start: "2026-06-22", end: "2026-07-15" },
  { start: "2027-06-21", end: "2027-07-15" },
];

/** DST-overgangen — laatste zondag maart + laatste zondag oktober. */
export const DST_TRANSITIONS: string[] = [
  "2024-03-31", "2024-10-27",
  "2025-03-30", "2025-10-26",
  "2026-03-29", "2026-10-25",
  "2027-03-28", "2027-10-31",
  "2028-03-26", "2028-10-29",
];
```

## `app/engine/src/index.ts`

```ts
/**
 * SBI Engine — publieke API.
 * Bron-documenten: 01_Anker-Paper.md t/m 09_Brand-Message-Style-Guide.md.
 */

export * from "./types.js";
export { INDICATORS, INDICATOR_CODES, DOMAIN_NAMES, indicatorsByDomain, allDomains } from "./indicators/registry.js";
export { computeAllDeterministic, daylightHours } from "./indicators/deterministic.js";
export { computeBaseline, zscore, median, madScaled } from "./methodology/zscore.js";
export { stlResidual, dayOfYear } from "./methodology/stl.js";
export { winsorize, WINSOR_BOUND } from "./methodology/winsorize.js";
export {
  SCHEMA_2_DOMAIN_WEIGHTS,
  indicatorWeight,
  domainWeight,
  verifyWeightsSumToOne,
} from "./methodology/weights.js";
export {
  computeComposite,
  computeCompositeWithoutD5,
  computeDemographicComposite,
  pearsonCorrelation,
} from "./methodology/composite.js";
export {
  DEMOGRAPHIC_REACH,
  TOTAL_REACH,
  demographicWeight,
} from "./methodology/demographic-reach.js";
export { percentileRank } from "./methodology/percentile.js";
export {
  computeTier,
  AMBER_THRESHOLD,
  RED_THRESHOLD,
  SUSTAINED_DAYS,
} from "./methodology/tier.js";
export {
  computeConditionLevel,
  CONDITION_NAMES,
  type ConditionLevel as MethodologyConditionLevel,
  type ConditionState,
} from "./methodology/condition-level.js";
export { computeDaily, type DailyComputeInput } from "./runtime.js";
```

## `app/engine/src/indicators/deterministic.ts`

```ts
/**
 * Tier-A indicatoren: deterministisch, direct uitvoerbaar zonder externe data.
 * Bron: doc 03_Laag-4 §2.1, §2.4, §2.6.
 *
 * Geïmplementeerd:
 *  • I-D1-001 Daglichturen (NOAA Solar Calculator — Brussel 50.85°N, 4.35°E)
 *  • I-D4-001 Kalendarische deadlinepieken
 *  • I-D4-002 Schoolvakantie-zonder-opvang (weighted)
 *  • I-D6-001 Dagen tot volgende vakantie
 *  • I-D6-002 Weekdag-cyclus (cyclisch belastings-signaal ma-vr-cluster)
 *  • I-D6-003 Klok-verzetten (exp decay 7d)
 *  • I-D6-005 Examenperiode
 */

import {
  FEDERAL_HOLIDAYS,
  VL_SCHOOL_HOLIDAYS,
  EXAM_PERIODS,
  TAX_DEADLINE_WEEKS,
  DST_TRANSITIONS,
} from "../data/calendar-be.js";

// Brussel als geografische referentie — doc 03 §1.2
const BRUSSELS_LAT = 50.85;

/**
 * I-D1-001 — Daglichturen.
 * Doc 03 §2.1: uren tussen astronomische zonsopgang en zonsondergang op datum d.
 * Implementatie volgt NOAA Solar Position Algorithm (vereenvoudigd voor één breedtegraad).
 */
export function daylightHours(date: Date, latitude = BRUSSELS_LAT): number {
  const dayOfYear = computeDayOfYear(date);

  // Solar declination (Spencer 1971-formule, geldig binnen ±0.4°)
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const declRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = (latitude * Math.PI) / 180;
  const cosH = -Math.tan(latRad) * Math.tan(declRad);

  if (cosH > 1) return 0;   // poolnacht
  if (cosH < -1) return 24; // poolzomer

  const hourAngle = Math.acos(cosH);
  const daylight = (24 * hourAngle) / Math.PI;
  return Math.round(daylight * 10000) / 10000;
}

/**
 * I-D4-001 — Kalendarische deadlinepieken.
 * Doc 03 §2.4: +1 in belastingaangifte-week, +1 in kwartaaleinde-week, +2 in jaareinde-week.
 */
export function deadlinePeak(date: Date): number {
  const iso = toIsoDate(date);
  let score = 0;

  if (TAX_DEADLINE_WEEKS.some((w) => iso >= w.start && iso <= w.end)) score += 1;

  // Kwartaaleinde-week (laatste 7 dagen van mrt/jun/sep/dec)
  const m = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), m, 0)).getUTCDate();
  const isQuarterEnd = [3, 6, 9, 12].includes(m) && day > lastDay - 7;
  if (isQuarterEnd) score += 1;

  // Jaareinde-week
  if (m === 12 && day >= 25) score += 2;

  return Math.min(score, 3);
}

/**
 * I-D4-002 — Schoolvakantie-zonder-opvang, weighted.
 * Doc 03 §2.4: SH × (1 + duration_remaining/total_duration), 0 op zondag.
 */
export function schoolVacationWeighted(date: Date): number {
  if (date.getUTCDay() === 0) return 0;
  const iso = toIsoDate(date);
  const period = VL_SCHOOL_HOLIDAYS.find((p) => iso >= p.start && iso <= p.end);
  if (!period) return 0;

  const start = new Date(period.start + "T00:00:00Z").getTime();
  const end = new Date(period.end + "T00:00:00Z").getTime();
  const now = new Date(iso + "T00:00:00Z").getTime();
  const totalDays = (end - start) / 86400000 + 1;
  const remaining = (end - now) / 86400000 + 1;
  return 1 * (1 + remaining / totalDays);
}

/**
 * I-D6-001 — Dagen tot volgende vakantie (officiële feestdag of schoolvakantie).
 * Doc 03 §2.6.
 */
export function daysUntilNextVacation(date: Date): number {
  const iso = toIsoDate(date);
  const candidates: number[] = [];

  for (const h of FEDERAL_HOLIDAYS) {
    if (h >= iso) candidates.push(daysBetween(iso, h));
  }
  for (const v of VL_SCHOOL_HOLIDAYS) {
    if (v.start >= iso) candidates.push(daysBetween(iso, v.start));
  }
  if (candidates.length === 0) return 365;
  return Math.min(...candidates);
}

/**
 * I-D6-002 — Weekdag-cyclus.
 * Doc 03 §2.6: 6 dummies, zondag = referentie. We collapsen tot één continue
 * waarde 0-1 voor compositie: hoogste belasting di-do (klassiek Helliwell-patroon).
 */
export function weekdayLoad(date: Date): number {
  const dow = date.getUTCDay(); // 0=zo, 1=ma, ..., 6=za
  const pattern: Record<number, number> = {
    0: 0.0, // zondag — referentie
    1: 0.6, // maandag — opwarming
    2: 0.9, // dinsdag
    3: 1.0, // woensdag — piek
    4: 0.9, // donderdag
    5: 0.4, // vrijdag — afkoeling
    6: 0.1, // zaterdag
  };
  return pattern[dow];
}

/**
 * I-D6-003 — Klok-verzetten effect.
 * Doc 03 §2.6: exp(-(d - d_DST)/3) voor 0 ≤ (d - d_DST) ≤ 7.
 */
export function dstEffect(date: Date): number {
  const iso = toIsoDate(date);
  for (const transition of DST_TRANSITIONS) {
    if (transition <= iso) {
      const days = daysBetween(transition, iso);
      if (days >= 0 && days <= 7) return Math.exp(-days / 3);
    }
  }
  return 0;
}

/**
 * I-D6-005 — Examenperiode.
 * Doc 03 §2.6: binair voor 1e/2e examenperiode HO + CSE secundair.
 * Output: aantal overlappende periodes (0-3) — som geeft sterker signaal in
 * juni wanneer HO2 + CSE overlappen.
 */
export function examPeriod(date: Date): number {
  const iso = toIsoDate(date);
  return EXAM_PERIODS.filter((p) => iso >= p.start && iso <= p.end).length;
}

// --- helpers ---

function computeDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86400000) + 1;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00Z").getTime();
  const b = new Date(isoB + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

/** Bundel alle deterministische indicatoren voor één datum. */
export function computeAllDeterministic(date: Date): Record<string, number> {
  return {
    "I-D1-001": daylightHours(date),
    "I-D4-001": deadlinePeak(date),
    "I-D4-002": schoolVacationWeighted(date),
    "I-D6-001": daysUntilNextVacation(date),
    "I-D6-002": weekdayLoad(date),
    "I-D6-003": dstEffect(date),
    "I-D6-005": examPeriod(date),
  };
}
```

## `app/engine/src/indicators/plain-language.ts`

```ts
/**
 * Plain-Dutch beschrijvingen per indicator + klikbare bronnen.
 *
 * Per indicator:
 *  - plain      : korte naam
 *  - why        : waarom dit in de index staat (15-jarig niveau)
 *  - reads      : wat we feitelijk uitlezen
 *  - unit       : eenheid van de waarde
 *  - dataSource : naam + URL van de officiële databron
 *  - references : 1-2 wetenschappelijke onderbouwingen met DOI/URL
 */

import type { IndicatorCode } from "../types.js";

export interface PlainReference {
  label: string;
  url: string;
}

export interface PlainDataSource {
  name: string;
  url: string;
}

export interface PlainLanguageMeta {
  plain: string;
  why: string;
  reads: string;
  unit: string;
  dataSource: PlainDataSource;
  references: PlainReference[];
}

export const PLAIN: Record<IndicatorCode, PlainLanguageMeta> = {
  "I-D1-001": {
    plain: "Daglicht",
    why: "Als de zon vaker schijnt, voelen mensen zich gemiddeld beter.",
    reads: "Hoeveel uur het vandaag licht is.",
    unit: "uur",
    dataSource: { name: "NOAA Solar Calculator (astronomisch)", url: "https://gml.noaa.gov/grad/solcalc/" },
    references: [
      { label: "Rosenthal et al. (1984): SAD originele beschrijving", url: "https://doi.org/10.1001/archpsyc.1984.01790120076010" },
      { label: "Golden et al. (2005): lichttherapie meta-analyse", url: "https://doi.org/10.1176/appi.ajp.162.4.656" },
    ],
  },
  "I-D1-002": {
    plain: "Hitte",
    why: "Hitte maakt slapen moeilijker en zorgt voor extra spanning in het lichaam.",
    reads: "Hoeveel graden warmer dan 30°C het vandaag is.",
    unit: "°C boven 30",
    dataSource: { name: "KMI (via open-meteo)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2010): Lancet, hitte en gezondheid", url: "https://doi.org/10.1016/S0140-6736(09)61711-6" },
      { label: "Thompson et al. (2018): hitte en mentale gezondheid", url: "https://doi.org/10.1016/j.scitotenv.2018.01.121" },
    ],
  },
  "I-D1-003": {
    plain: "Koude",
    why: "Extreme kou belast de gezondheid én de portefeuille (verwarming).",
    reads: "Hoeveel graden kouder dan -5°C het vannacht was.",
    unit: "°C onder -5",
    dataSource: { name: "KMI (via open-meteo)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2017): koude en mortaliteit", url: "https://doi.org/10.1136/jech-2016-208439" },
    ],
  },
  "I-D1-004": {
    plain: "Luchtkwaliteit",
    why: "Vuile lucht (fijnstof, ozon) hangt samen met meer somberheid en prikkelbaarheid.",
    reads: "Hoe schoon de lucht is vergeleken met wat de WHO gezond noemt.",
    unit: "× WHO-grens",
    dataSource: { name: "IRCEL-CELINE", url: "https://www.irceline.be" },
    references: [
      { label: "Braithwaite et al. (2019): luchtvervuiling en mentale gezondheid", url: "https://doi.org/10.1289/EHP4595" },
      { label: "Newbury et al. (2019): JAMA Psychiatry", url: "https://doi.org/10.1001/jamapsychiatry.2019.0056" },
    ],
  },
  "I-D2-001": {
    plain: "Verkeersdrukte",
    why: "Lang in de file staan verhoogt stresshormonen.",
    reads: "Hoeveel kilometer file × hoeveel minuten ze duurden, in de spits.",
    unit: "km·min",
    dataSource: { name: "Vlaams Verkeerscentrum", url: "https://www.verkeerscentrum.be" },
    references: [
      { label: "Novaco, Stokols & Milanesi (1990): pendel en stress", url: "https://doi.org/10.1007/BF00931303" },
      { label: "Chatterjee et al. (2020): Transport Reviews", url: "https://doi.org/10.1080/01441647.2019.1649317" },
    ],
  },
  "I-D2-004": {
    plain: "Brandstofprijs",
    why: "Wanneer tanken duurder wordt, voelen veel gezinnen dat in hun budget.",
    reads: "De officiële maximumprijs van Euro95.",
    unit: "€/liter",
    dataSource: { name: "FOD Economie", url: "https://economie.fgov.be/nl/themas/energie/energieprijzen" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D3-001": {
    plain: "Inflatie (prijzen stijgen)",
    why: "Als alles duurder wordt, valt geld korter, dat geeft druk.",
    reads: "Hoeveel duurder de gemiddelde boodschap is dan een jaar geleden.",
    unit: "% per jaar",
    dataSource: { name: "STATBEL", url: "https://statbel.fgov.be/nl/themas/consumptieprijzen/consumptieprijsindex" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
      { label: "Kahneman & Tversky (1979): Prospect Theory", url: "https://doi.org/10.2307/1914185" },
    ],
  },
  "I-D3-002": {
    plain: "Energieprijs",
    why: "Verwarming en elektriciteit zijn een grote uitgave die je moeilijk kan vermijden.",
    reads: "De wekelijkse spotprijs voor gas en elektriciteit.",
    unit: "€/MWh",
    dataSource: { name: "ENTSO-E Transparency", url: "https://transparency.entsoe.eu" },
    references: [
      { label: "Thomson, Snell & Bouzarovski (2017): energiearmoede Europa", url: "https://doi.org/10.3390/ijerph14060584" },
      { label: "Liddell & Morris (2010): fuel poverty en gezondheid", url: "https://doi.org/10.1016/j.enpol.2010.02.037" },
    ],
  },
  "I-D3-003": {
    plain: "Ontslagen aangekondigd",
    why: "Als ergens een collectief ontslag wordt aangekondigd, voelt iedereen op die werkplek dat, ook wie niet ontslagen wordt.",
    reads: "Hoeveel werknemers er deze week in een ontslagprocedure zitten.",
    unit: "log(werknemers)",
    dataSource: { name: "FOD WASO", url: "https://werk.belgie.be/nl/themas/herstructureringen" },
    references: [
      { label: "Brand (2015): Annual Review of Sociology", url: "https://doi.org/10.1146/annurev-soc-071913-043237" },
      { label: "De Witte et al. (2016): job insecurity review", url: "https://doi.org/10.1111/ap.12176" },
    ],
  },
  "I-D3-005": {
    plain: "Werkloosheid",
    why: "Hogere werkloosheid betekent dat meer mensen het moeilijk hebben, economische druk op het land.",
    reads: "Het percentage werkzoekenden in de beroepsbevolking.",
    unit: "%",
    dataSource: { name: "STATBEL: Werkloosheid", url: "https://statbel.fgov.be/nl/themas/werk-opleiding/werkloosheid" },
    references: [
      { label: "WHO Commission on Social Determinants (2008): Marmot", url: "https://www.who.int/publications/i/item/WHO-IER-CSDH-08.1" },
    ],
  },
  "I-D3-006": {
    plain: "Hypotheekrente",
    why: "Een hogere rente maakt een huis kopen of afbetalen duurder.",
    reads: "De gemiddelde rente voor nieuwe woonleningen.",
    unit: "%",
    dataSource: { name: "Nationale Bank van België", url: "https://stat.nbb.be" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D4-001": {
    plain: "Werk-deadlines",
    why: "Bepaalde weken pieken samen, belastingaangifte, kwartaaleinde, jaareinde.",
    reads: "Hoeveel grote deadlines er deze week samenvallen.",
    unit: "score 0–3",
    dataSource: { name: "FOD Financiën (fiscale kalender)", url: "https://financien.belgium.be/nl/particulieren/belastingaangifte" },
    references: [
      { label: "Bakker & Demerouti (2007): JD-R model", url: "https://doi.org/10.1108/02683940710733115" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D4-002": {
    plain: "Schoolvakantie",
    why: "Vakantie zonder opvang vraagt extra puzzelwerk van ouders.",
    reads: "Of we in een schoolvakantie zitten, hoe meer dagen nog te gaan hoe zwaarder.",
    unit: "score 0–2",
    dataSource: { name: "Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Bianchi et al. (2012): werk- en gezinsbelasting", url: "https://doi.org/10.1093/sf/sos120" },
    ],
  },
  "I-D5-001": {
    plain: "Hoe negatief is het nieuws?",
    why: "Veel negatief nieuws beïnvloedt hoe een hele bevolking zich voelt.",
    reads: "We meten de gemiddelde toon van het Belgische nieuws via GDELT, een wetenschappelijk project dat wereldwijd nieuwsberichten leest en de toon ervan scoort. We kijken naar alle Belgische bronnen samen, Nederlands- én Franstalig. Het grote voordeel: GDELT heeft een echte historie van twee jaar, zodat we vandaag eerlijk kunnen vergelijken met hoe negatief het nieuws gewoonlijk is. Daarnaast lezen we als controle elke dag de artikels van dertien Belgische RSS-bronnen met een Nederlands valentie-lexicon, en wegen we die naar het leeftijdsprofiel van elk publiek. Dat levert de negativiteit per leeftijdsgroep (jong, midden, ouder) die in de bronvermelding staat.",
    unit: "toon-score",
    dataSource: { name: "GDELT DOC 2.0 nieuwstoon BE + RSS-controle van 13 BE-bronnen", url: "https://www.gdeltproject.org/" },
    references: [
      { label: "Leetaru (2013): GDELT Global Knowledge Graph", url: "https://www.gdeltproject.org/" },
      { label: "Young & Soroka (2012): Affective News, Lexicoder-methode", url: "https://doi.org/10.1080/10584609.2012.671234" },
      { label: "Soroka, Fournier & Nir (2019): PNAS, negativity bias", url: "https://doi.org/10.1073/pnas.1908369116" },
    ],
  },
  "I-D5-002": {
    plain: "Hoeveel mensen lezen over stress?",
    why: "Hoe vaak mensen informatie opzoeken over stress, burn-out of slaapproblemen, vertelt iets over wat er leeft. (Niet perfect, maar wel een bruikbare aanwijzing.)",
    reads: "We tellen elke dag hoe vaak zes Nederlandstalige Wikipedia-artikels over stress-thema's worden bekeken: Stress, Burn-out, Depressie, Angststoornis, Overspannenheid en Slapeloosheid. We delen dat door het totale Wikipedia-verkeer van die dag, zodat alleen de relatieve aandacht voor stress telt en niet de algemene groei of krimp van Wikipedia. Daarna nemen we het gemiddelde over zeven dagen, zodat het weekendeffect wegvalt. We gebruiken Wikipedia in plaats van Google Trends omdat Google zoekdata blokkeert voor servers, terwijl Wikipedia open, betrouwbaar en reproduceerbaar is.",
    unit: "per miljoen weergaven",
    dataSource: { name: "Wikimedia Pageviews API (nl.wikipedia)", url: "https://wikimedia.org/api/rest_v1/" },
    references: [
      { label: "Generous et al. (2014): ziektemonitoring via Wikipedia", url: "https://doi.org/10.1371/journal.pcbi.1003892" },
      { label: "McIver & Brownstein (2014): Wikipedia voor griepmonitoring", url: "https://doi.org/10.1371/journal.pcbi.1003581" },
      { label: "Lazer et al. (2014): Science, parable of Google Flu (waarschuwing)", url: "https://doi.org/10.1126/science.1248506" },
    ],
  },
  "I-D5-003": {
    plain: "Grote gebeurtenis",
    why: "Rampen, terreur, of nationale rouw raken een heel land tegelijk.",
    reads: "Of er recent zo'n gebeurtenis was, met afnemend effect over 7 dagen.",
    unit: "magnitude 0–15",
    dataSource: { name: "Nieuwsmonitoring + menselijke codering", url: "https://www.vrt.be/vrtnws/" },
    references: [
      { label: "Holman, Garfin & Silver (2014): PNAS, Boston Marathon", url: "https://doi.org/10.1073/pnas.1316265110" },
      { label: "Silver et al. (2013): media en collectief trauma", url: "https://doi.org/10.1177/0956797612460406" },
    ],
  },
  "I-D6-001": {
    plain: "Tot de volgende vakantie",
    why: "Weten dat er rust aankomt, helpt mensen om vol te houden.",
    reads: "Hoeveel dagen tot de eerstvolgende feestdag of schoolvakantie.",
    unit: "dagen",
    dataSource: { name: "Federale feestdagen + Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Fritz & Sonnentag (2005): herstel, gezondheid, werkprestatie", url: "https://doi.org/10.1037/1076-8998.10.3.187" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D6-002": {
    plain: "Welke dag van de week",
    why: "Dinsdag-woensdag-donderdag voelen voor veel mensen het zwaarst, zaterdag-zondag het lichtst.",
    reads: "De dag van de week, vertaald naar een gemiddelde belasting.",
    unit: "0–1",
    dataSource: { name: "Kalender (deterministisch)", url: "https://nl.wikipedia.org/wiki/Week_(tijdsaanduiding)" },
    references: [
      { label: "Stone, Schneider & Harter (2012): weekdag stemmingspatroon", url: "https://doi.org/10.1080/17439760.2012.691980" },
    ],
  },
  "I-D6-003": {
    plain: "Zomertijd/wintertijd",
    why: "Als de klok verzet wordt, raakt het ritme van je lichaam even in de war.",
    reads: "Hoe lang geleden de klok werd verzet (effect dooft uit na 7 dagen).",
    unit: "0–1",
    dataSource: { name: "Wettelijke DST-data EU", url: "https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32000L0084" },
    references: [
      { label: "Manfredini et al. (2018): DST en hartinfarcten", url: "https://doi.org/10.3390/jcm8030404" },
      { label: "Roenneberg et al. (2019): waarom DST afschaffen", url: "https://doi.org/10.1177/0748730419854197" },
    ],
  },
  "I-D6-005": {
    plain: "Examens",
    why: "Examens raken studenten én hun gezinnen tegelijk.",
    reads: "Of er één of meerdere examenperiodes lopen (hoger onderwijs + secundair).",
    unit: "0–3",
    dataSource: { name: "Academische kalender", url: "https://onderwijs.vlaanderen.be" },
    references: [
      { label: "Pascoe, Hetrick & Parker (2020): stress bij studenten", url: "https://doi.org/10.1080/02673843.2019.1596823" },
    ],
  },
  "I-D1-009": {
    plain: "Staat het water gevaarlijk hoog?",
    why: "Hoogwater bedreigt huizen en bezit; de dreiging zelf, ook zonder ramp, veroorzaakt al angst en waakzaamheid.",
    reads: "We kijken naar de waterstanden van meetpunten van de Vlaamse Milieumaatschappij. Staan de hoogste punten ver boven de doorsnee, dan staat het water netbreed hoog.",
    unit: "hoogwater-index",
    dataSource: { name: "Waterinfo.be (VMM / HIC)", url: "https://www.waterinfo.be/" },
    references: [
      { label: "Fernandez et al. (2019): overstromingen en mentale gezondheid", url: "https://doi.org/10.1016/j.ijdrr.2019.101270" },
      { label: "WHO: factsheet overstromingen", url: "https://www.who.int/news-room/fact-sheets/detail/floods" },
    ],
  },
  "I-D1-010": {
    plain: "Hoeveel pollen zit er in de lucht?",
    why: "Hooikoorts verstoort slaap, concentratie en humeur bij heel veel mensen, een seizoensgebonden maar brede stressor.",
    reads: "We tellen voor Brussel hoeveel pollenkorrels van vijf plantensoorten in de lucht zweven: els, berk, gras, bijvoet en ambrosia. Meer korrels betekent meer niezen, jeuk en vermoeidheid.",
    unit: "pollenkorrels/m³",
    dataSource: { name: "open-meteo Air Quality (CAMS)", url: "https://open-meteo.com/" },
    references: [
      { label: "Damialis et al. (2019): pollen en welbevinden", url: "https://doi.org/10.1111/all.13758" },
      { label: "Copernicus: luchtkwaliteit en allergie", url: "https://atmosphere.copernicus.eu/" },
    ],
  },
  "I-D2-009": {
    plain: "Hoeveel treinen rijden er in de soep?",
    why: "Onaangekondigde spoorvertragingen ontnemen pendelaars de controle over hun tijd en aankomst, een directe dagelijkse stressor.",
    reads: "We tellen via de iRail-dienst hoeveel ongeplande storingen er nu op het Belgische spoornet zijn. Geplande werken tellen niet mee, want die ken je op voorhand.",
    unit: "aantal verstoringen",
    dataSource: { name: "iRail API (NMBS/Infrabel)", url: "https://api.irail.be/" },
    references: [
      { label: "Chatterjee et al. (2017): pendelen en welzijn", url: "https://doi.org/10.1016/j.trf.2017.08.002" },
      { label: "APA: controleverlies als stressbron", url: "https://www.apa.org/topics/stress" },
    ],
  },
  "I-D3-009": {
    plain: "Trekt België meer stroom dan verwacht?",
    why: "Een stroomnet dat boven de prognose draait is krapper; krapte voedt prijspieken en, zeldzaam, afschakelrisico, een sluimerende collectieve stressor.",
    reads: "Elia, de netbeheerder, voorspelt elke dag hoeveel stroom België zal verbruiken. Wij delen het echte verbruik door die voorspelling. 1,0 betekent precies zoals verwacht, hoger betekent een drukker net.",
    unit: "ratio gemeten/voorspeld",
    dataSource: { name: "Elia Open Data", url: "https://opendata.elia.be/" },
    references: [
      { label: "Thomson, Snell & Bouzarovski (2019): energie-onzekerheid en welzijn", url: "https://doi.org/10.1016/j.erss.2019.101216" },
      { label: "IEA: zekerheid van elektriciteitsvoorziening", url: "https://www.iea.org/reports/security-of-electricity-supply" },
    ],
  },
};

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem";

export function zToState(z: number): IndicatorState {
  if (z >= 2) return "extreem";
  if (z >= 1) return "verhoogd";
  if (z >= -1) return "normaal";
  return "rustig";
}

export const STATE_LABELS: Record<IndicatorState, string> = {
  rustig: "lager dan gewoonlijk",
  normaal: "gemiddeld",
  verhoogd: "hoger dan gewoonlijk",
  extreem: "uitzonderlijk hoog",
};
```

## `app/engine/src/indicators/registry.ts`

```ts
/**
 * Bevroren registry van de 20 primaire indicatoren.
 * Bron: doc 02_Laag-3 §10 + doc 04_Laag-5 §3.2 (STL beslisregel)
 *       + doc 04_Laag-5 §5 (inverse-codering)
 */

import type { IndicatorMeta, IndicatorCode, DomainCode } from "../types.js";

export const INDICATORS: Record<IndicatorCode, IndicatorMeta> = {
  "I-D1-001": {
    code: "I-D1-001",
    name: "Daglichturen",
    domain: "D1",
    grade: "A",
    inverseCoded: true,
    applyStl: false,
    source: "Astronomisch (NOAA Solar Calculator-algoritme)",
    deterministic: true,
  },
  "I-D1-002": {
    code: "I-D1-002",
    name: "Hitte",
    domain: "D1",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "KMI/RMI Open Data",
    deterministic: false,
  },
  "I-D1-003": {
    code: "I-D1-003",
    name: "Kou",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: true,
    source: "KMI/RMI Open Data",
    deterministic: false,
  },
  "I-D1-004": {
    code: "I-D1-004",
    name: "Luchtkwaliteit",
    domain: "D1",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "IRCEL-CELINE",
    deterministic: false,
  },
  "I-D1-009": {
    code: "I-D1-009",
    name: "Wateroverlast",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Waterinfo.be (VMM / HIC)",
    deterministic: false,
  },
  "I-D1-010": {
    code: "I-D1-010",
    name: "Pollen",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "open-meteo Air Quality (CAMS)",
    deterministic: false,
  },
  "I-D2-001": {
    code: "I-D2-001",
    name: "Filezwaarte",
    domain: "D2",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "Vlaams Verkeerscentrum",
    deterministic: false,
  },
  "I-D2-004": {
    code: "I-D2-004",
    name: "Brandstofprijzen",
    domain: "D2",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "FOD Economie maximumprijzen",
    deterministic: false,
  },
  "I-D2-009": {
    code: "I-D2-009",
    name: "Treinverstoringen",
    domain: "D2",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "iRail API (NMBS/Infrabel)",
    deterministic: false,
  },
  "I-D3-001": {
    code: "I-D3-001",
    name: "Consumptieprijsindex",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "STATBEL",
    deterministic: false,
  },
  "I-D3-002": {
    code: "I-D3-002",
    name: "Energieprijzen",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: true,
    source: "ENTSO-E Transparency / Belpex",
    deterministic: false,
  },
  "I-D3-003": {
    code: "I-D3-003",
    name: "Aangekondigde collectieve ontslagen",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "FOD WASO",
    deterministic: false,
  },
  "I-D3-005": {
    code: "I-D3-005",
    name: "Werkloosheidscijfer",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "STATBEL / Steunpunt Werk",
    deterministic: false,
  },
  "I-D3-006": {
    code: "I-D3-006",
    name: "Hypotheekrente",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Nationale Bank van België",
    deterministic: false,
  },
  "I-D3-009": {
    code: "I-D3-009",
    name: "Stroomnet-druk",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Elia Open Data",
    deterministic: false,
  },
  "I-D4-001": {
    code: "I-D4-001",
    name: "Kalendarische deadlinepieken",
    domain: "D4",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender FOD Financiën",
    deterministic: true,
  },
  "I-D4-002": {
    code: "I-D4-002",
    name: "Schoolvakantie-zonder-opvang",
    domain: "D4",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Vlaamse onderwijskalender",
    deterministic: true,
  },
  "I-D5-001": {
    code: "I-D5-001",
    name: "Nieuwsnegativiteits-index",
    domain: "D5",
    grade: "B",
    inverseCoded: false,
    // Geen STL: nieuwsnegativiteit is gebeurtenis-gedreven, niet sterk
    // seizoensgebonden. De echte GDELT 24m-baseline (data/history/I-D5-001.json)
    // dient rechtstreeks als MAD-Z-meetlat. De naïeve voorgaande-jaren-STL
    // produceert bovendien niet-vergelijkbare residuen tussen jaren.
    applyStl: false,
    source: "GDELT Project v2",
    deterministic: false,
  },
  "I-D5-002": {
    code: "I-D5-002",
    name: "Wikipedia-aandacht stress-thema's",
    domain: "D5",
    grade: "B",
    inverseCoded: false,
    // Geen STL: het 7d-gemiddelde verwijdert al het weekdag-effect en de
    // baseline is een recent venster (~11 maanden, drift-gevoelige bron).
    applyStl: false,
    source: "Wikipedia-pageviews (Wikimedia REST API)",
    deterministic: false,
  },
  "I-D5-003": {
    code: "I-D5-003",
    name: "Negatieve collectieve gebeurtenissen",
    domain: "D5",
    grade: "A",
    inverseCoded: false,
    applyStl: false,
    source: "Nieuwsmonitoring + menselijke codering",
    deterministic: false,
  },
  "I-D6-001": {
    code: "I-D6-001",
    name: "Dagen tot volgende vakantie",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-002": {
    code: "I-D6-002",
    name: "Weekdag-cyclus",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-003": {
    code: "I-D6-003",
    name: "Klok-verzetten",
    domain: "D6",
    grade: "A",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-005": {
    code: "I-D6-005",
    name: "Examenperiode",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Academische kalender",
    deterministic: true,
  },
};

export const INDICATOR_CODES = Object.keys(INDICATORS) as IndicatorCode[];

export const DOMAIN_NAMES: Record<DomainCode, string> = {
  D1: "Omgeving & klimaat",
  D2: "Mobiliteit & ruimte",
  D3: "Economische conditie",
  D4: "Werk & belasting",
  D5: "Media & collectieve gebeurtenissen",
  D6: "Kalender & ritme",
};

export function indicatorsByDomain(domain: DomainCode): IndicatorMeta[] {
  return INDICATOR_CODES.map((c) => INDICATORS[c]).filter((m) => m.domain === domain);
}

export function allDomains(): DomainCode[] {
  return ["D1", "D2", "D3", "D4", "D5", "D6"];
}
```

## `app/engine/src/methodology/composite.ts`

```ts
/**
 * Composiet-berekening.
 * Bron: doc 06_Laag-7 §1.
 *   Z_weighted(i, t) = w_indicator(i ∈ D) × Z_short(i, t)
 *   D_score(D, t)    = Σ_{i ∈ D} Z_weighted(i, t)
 *   C(t)             = Σ_D [w_domain(D) × D_score(D, t)]
 *
 * Plus mediacyclus-decorrelatie-protocol (doc 03 §4.4):
 * - composite_without_d5 voor sensitivity
 * - d5_cross_correlation_7d-monitor
 */

import type { DomainCode, DomainContribution, IndicatorCode } from "../types.js";
import { allDomains, indicatorsByDomain, INDICATOR_CODES } from "../indicators/registry.js";
import { indicatorWeight, domainWeight, type WeightSchema } from "./weights.js";
import { demographicWeight } from "./demographic-reach.js";

/** Resultaat van per-indicator z-scoring (inverse-coded, winsorized). */
export type ZMap = Partial<Record<IndicatorCode, number>>;

export interface CompositeResult {
  composite: number;
  domainScores: Record<DomainCode, number>;
  domainContributions: DomainContribution[];
}

export function computeComposite(zScores: ZMap, schema: WeightSchema): CompositeResult {
  const domainScores: Record<DomainCode, number> = {
    D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0,
  };

  for (const domain of allDomains()) {
    let domainSum = 0;
    for (const meta of indicatorsByDomain(domain)) {
      const z = zScores[meta.code];
      if (z === undefined) continue; // missing — zie doc 03 §1.3
      const w = indicatorWeight(schema, meta.code, domain);
      domainSum += w * z;
    }
    domainScores[domain] = domainSum;
  }

  let composite = 0;
  const contributions: DomainContribution[] = [];

  for (const domain of allDomains()) {
    const wd = domainWeight(schema, domain);
    const contrib = wd * domainScores[domain];
    composite += contrib;
    contributions.push({ domain, contribution: contrib });
  }

  // Sorted descending door |contribution| voor "top contributors"
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return { composite, domainScores, domainContributions: contributions };
}

/**
 * Mediacyclus-decorrelatie (doc 03 §4.4 stap 3).
 * "Non-media baseline": composiet zonder D5.
 */
export function computeCompositeWithoutD5(zScores: ZMap, schema: WeightSchema): number {
  const filteredZ: ZMap = { ...zScores };
  for (const meta of indicatorsByDomain("D5")) {
    delete filteredZ[meta.code];
  }
  // Herschalen: de overige 5 domeinen krijgen weight-verdeling pro rata
  let composite = 0;
  const totalRemainingWeight = allDomains()
    .filter((d) => d !== "D5")
    .reduce((s, d) => s + domainWeight(schema, d), 0);

  for (const domain of allDomains()) {
    if (domain === "D5") continue;
    let domainSum = 0;
    for (const meta of indicatorsByDomain(domain)) {
      const z = filteredZ[meta.code];
      if (z === undefined) continue;
      domainSum += indicatorWeight(schema, meta.code, domain) * z;
    }
    composite += (domainWeight(schema, domain) / totalRemainingWeight) * domainSum;
  }

  return composite;
}

/**
 * Schema 3 — demografische reikwijdte-weging.
 * Weegt elke indicator direct naar het bevolkingsaandeel dat hij raakt
 * (zie demographic-reach.ts), zonder domein-tussenlaag. Telt NIET mee in
 * het pre-geregistreerde primaire signaal; parallel berekend en gepubliceerd.
 */
export function computeDemographicComposite(zScores: ZMap): number {
  let composite = 0;
  for (const code of INDICATOR_CODES) {
    const z = zScores[code];
    if (z === undefined) continue;
    composite += demographicWeight(code) * z;
  }
  return composite;
}

/** Pearson-correlatie voor twee gelijklange reeksen (gebruikt voor D5-monitor). */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const ex = xs[i] - mx;
    const ey = ys[i] - my;
    num += ex * ey;
    dx += ex * ex;
    dy += ey * ey;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}
```

## `app/engine/src/methodology/condition-level.ts`

```ts
/**
 * Conditie-Niveau (CN) — publieke 5-bands-schaal voor banner-activatie.
 *
 * Geen nieuwe pre-geregistreerde drempel — dit is een DERIVED publieke
 * vertaling van de bestaande tier + percentile + brand-safety logica
 * (doc 00 §8, doc 06 §3, doc 06 §7). Niet vrij wijzigbaar zonder doc 08.
 *
 * Regels:
 *   CN 5  brand-safety flag = elevated | block          (banner OFF, override)
 *   CN 4  tier = red       (P≥90 sustained 3d)          (banner aan, verhoogd)
 *   CN 3  tier = amber     (P 70-89 sustained 3d)       (banner aan, standaard)
 *   CN 2  tier = green & 50 ≤ P < 70                    (banner uit)
 *   CN 1  tier = green & P < 50                          (banner uit)
 *
 * Belangrijk: CN 5 staat hiërarchisch BOVEN CN 4 — het is geen "hogere stress"
 * maar een banner-override-modus bij gevoelige actualiteit.
 */

import type { Tier, BrandSafety } from "../types.js";

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

export interface ConditionState {
  level: ConditionLevel;
  name: string;
  bannerActive: boolean;
  copyKey: "rust" | "normaal" | "venster_opent" | "conditie_piek" | "brand_safety";
}

export const CONDITION_NAMES: Record<ConditionLevel, string> = {
  1: "Rust",
  2: "Normaal",
  3: "Venster opent",
  4: "Conditie-piek",
  5: "Brand-safety actief",
};

export function computeConditionLevel(
  tier: Tier,
  percentile: number,
  brandSafety: BrandSafety,
): ConditionState {
  // CN 5 override — onafhankelijk van tier
  if (brandSafety === "elevated" || brandSafety === "block") {
    return { level: 5, name: CONDITION_NAMES[5], bannerActive: false, copyKey: "brand_safety" };
  }

  if (tier === "red") {
    return { level: 4, name: CONDITION_NAMES[4], bannerActive: true, copyKey: "conditie_piek" };
  }

  if (tier === "amber") {
    return { level: 3, name: CONDITION_NAMES[3], bannerActive: true, copyKey: "venster_opent" };
  }

  // green
  if (percentile >= 50) {
    return { level: 2, name: CONDITION_NAMES[2], bannerActive: false, copyKey: "normaal" };
  }
  return { level: 1, name: CONDITION_NAMES[1], bannerActive: false, copyKey: "rust" };
}
```

## `app/engine/src/methodology/demographic-reach.ts`

```ts
/**
 * Demografische reikwijdte-weging — Schema 3.
 *
 * METHODOLOGISCHE STATUS
 * ----------------------
 * Dit is een AMENDEMENT op de pre-registratie (doc 00 §13), uitgevoerd op
 * expliciete beslissing van de methodologie-eigenaar. Conform doc 05 wordt het
 * als DERDE wegingsschema PARALLEL toegevoegd — de pre-geregistreerde
 * equal-weights (Schema 1) en evidence-graded (Schema 2) blijven onveranderd
 * berekend en gepubliceerd. Niets wordt vervangen.
 *
 * WAT HET DOET
 * ------------
 * Equal-weights behandelt elke indicator alsof hij de hele bevolking even hard
 * raakt. Dat is niet zo: schoolvakantie-druk raakt gezinnen met kinderen,
 * hypotheekrente raakt huishoudens met een lopend krediet, files raken
 * pendelaars. Dit schema weegt elke indicator naar het AANDEEL van de Belgische
 * bevolking dat hij werkelijk als stressor-blootstelling ervaart.
 *
 * EERLIJKE BEPERKING — DIT IS GEEN MRP
 * ------------------------------------
 * Volwaardige poststratificatie (MRP, Multilevel Regression with
 * Poststratification) vereist surveydata van een gerekruteerd, demografisch
 * gebalanceerd panel waarin elke respondent demografische tags draagt.
 * Gescrapete/publieke data heeft die tags niet. Dit schema is daarom een
 * REIKWIJDTE-benadering: per indicator één bevolkingsaandeel, geen volledige
 * demografische celstructuur. Het is de eerlijke, doenbare tussenstap; echte
 * MRP blijft de target-state en vereist een panel-instrument.
 *
 * BRON VAN DE PERCENTAGES
 * -----------------------
 * Afgeleid van publieke Statbel-demografie (bevolking ~11,7M; ~80% van de
 * huishoudens heeft een wagen; ~30% een lopende hypotheek; ~28% van de
 * huishoudens heeft minderjarige kinderen; beroepsbevolking ~43%;
 * internetgebruik ~95%). Ramingen, geen exacte tellingen.
 */

import type { IndicatorCode } from "../types.js";

export interface ReachEntry {
  reach: number; // fractie 0-1 van de bevolking die de indicator raakt
  rationale: string;
}

export const DEMOGRAPHIC_REACH: Record<IndicatorCode, ReachEntry> = {
  "I-D1-001": { reach: 1.0, rationale: "Daglicht beïnvloedt het circadiaans ritme van iedereen." },
  "I-D1-002": { reach: 1.0, rationale: "Hitte raakt de hele bevolking; kwetsbaarheid skewt naar ouderen." },
  "I-D1-003": { reach: 1.0, rationale: "Koude raakt iedereen; energiekost vergroot de impact." },
  "I-D1-004": { reach: 1.0, rationale: "Iedereen ademt; luchtkwaliteit skewt naar stedelijke gebieden." },
  "I-D2-001": { reach: 0.40, rationale: "Files raken pendelaars; ~65% van de werkenden pendelt met de auto." },
  "I-D2-004": { reach: 0.78, rationale: "~80% van de Belgische huishoudens beschikt over een wagen." },
  "I-D3-001": { reach: 1.0, rationale: "Inflatie raakt elke consument." },
  "I-D3-002": { reach: 1.0, rationale: "Elk huishouden betaalt energie." },
  "I-D3-003": { reach: 0.48, rationale: "Ontslagdreiging raakt werkenden plus hun huishoudens (spillover)." },
  "I-D3-005": { reach: 0.70, rationale: "Werkloosheid raakt de beroepsbevolking en wie ervan afhangt." },
  "I-D3-006": { reach: 0.32, rationale: "~30% van de huishoudens heeft een lopende hypotheek." },
  "I-D4-001": { reach: 0.45, rationale: "Werk-deadlines raken de werkende bevolking (~43%)." },
  "I-D4-002": { reach: 0.28, rationale: "Schoolvakantie-druk raakt gezinnen met schoolgaande kinderen." },
  "I-D5-001": { reach: 0.85, rationale: "Ongeveer 85% volgt regelmatig nieuws." },
  "I-D5-002": { reach: 0.90, rationale: "~95% is internetgebruiker; stress-zoekgedrag is breed gespreid." },
  "I-D5-003": { reach: 1.0, rationale: "Collectieve gebeurtenissen raken het hele land tegelijk." },
  "I-D6-001": { reach: 0.60, rationale: "Vakantie-anticipatie raakt werkenden en studenten." },
  "I-D6-002": { reach: 0.60, rationale: "Het weekdag-ritme raakt wie werkt of studeert." },
  "I-D6-003": { reach: 1.0, rationale: "Klok-verzetten verstoort ieders biologisch ritme." },
  "I-D6-005": { reach: 0.22, rationale: "Examens raken studenten en hun directe gezinsleden." },
  "I-D1-009": { reach: 0.15, rationale: "Wateroverlast raakt vooral bewoners van overstromingsgevoelig gebied langs waterlopen (~15%)." },
  "I-D1-010": { reach: 0.20, rationale: "Pollen raakt mensen met hooikoorts; prevalentie ongeveer 1 op 5, seizoensgebonden." },
  "I-D2-009": { reach: 0.20, rationale: "Treinverstoringen raken treinpendelaars en scholieren; ~1 op 5 reist regelmatig per trein." },
  "I-D3-009": { reach: 0.95, rationale: "Stroomnet-druk raakt vrijwel elk huishouden; effect is diffuus maar nagenoeg universeel." },
};

/** Som van alle reach-waarden — noemer voor de genormaliseerde weging. */
export const TOTAL_REACH = Object.values(DEMOGRAPHIC_REACH).reduce(
  (s, e) => s + e.reach,
  0,
);

/** Genormaliseerd demografisch gewicht van één indicator (telt op tot 1.0). */
export function demographicWeight(code: IndicatorCode): number {
  return DEMOGRAPHIC_REACH[code].reach / TOTAL_REACH;
}
```

## `app/engine/src/methodology/percentile.ts`

```ts
/**
 * Percentiel-positie.
 * Bron: doc 06_Laag-7 §2.
 *   P(t) = rang van C(t) binnen verdeling C-waarden over voortschrijdende 24m,
 *          uitgedrukt als 0-100.
 */

/**
 * Rank-based percentiel — de positie van waarde x in het distribution-set.
 * Conventie: 0 = laagste, 100 = hoogste. Bij ties: midrank (gemiddeld).
 */
export function percentileRank(x: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  let lower = 0;
  let equal = 0;
  for (const d of distribution) {
    if (d < x) lower++;
    else if (d === x) equal++;
  }
  return ((lower + 0.5 * equal) / distribution.length) * 100;
}
```

## `app/engine/src/methodology/stl.ts`

```ts
/**
 * Vereenvoudigde seizoensdecompositie.
 * Bron: doc 04_Laag-5 §3 — STL (Cleveland et al. 1990).
 *
 * Beperking voor MVP (doc 03_Laag-4 §5.6 staat minimum viable pipeline toe):
 * we gebruiken een naïeve dag-van-jaar mediaan-subtractie i.p.v. volledige
 * Loess-gebaseerde STL. Dit is een bekende vereenvoudiging — wordt vervangen
 * in target architecture door statsmodels.tsa.STL (Python) of equivalent.
 *
 * Wanneer < 3 seizoenscycli beschikbaar (doc 04 §3.4): geen STL toegepast.
 */

import { median } from "./zscore.js";

const MIN_CYCLES_FOR_STL = 3;
const DAYS_PER_YEAR = 365;

export interface StlResult {
  residual: number; // X(t) - S(t) — wat de Z-scoring gebruikt
  seasonalComponent: number;
  applied: boolean; // false wanneer < 3 cycli
}

/** Dag-van-jaar (1..366). */
export function dayOfYear(isoDate: string): number {
  const d = new Date(isoDate + "T12:00:00Z");
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Bereken STL-residu voor één waarde tegen historische archive.
 * Methode: groepeer historie per dag-van-jaar (±7 dagen window),
 * neem mediaan = seizoenscomponent, return X - S.
 */
export function stlResidual(
  value: number,
  date: string,
  history: Array<{ date: string; value: number }>,
): StlResult {
  const targetDoy = dayOfYear(date);
  const targetYear = new Date(date + "T12:00:00Z").getUTCFullYear();

  const cyclesAvailable = new Set(
    history.map((h) => new Date(h.date + "T12:00:00Z").getUTCFullYear()),
  ).size;

  if (cyclesAvailable < MIN_CYCLES_FOR_STL) {
    return { residual: value, seasonalComponent: 0, applied: false };
  }

  // Verzamel historische waarden met DOY binnen ±7 dagen, uit voorgaande jaren
  const window = 7;
  const sameSeasonValues = history
    .filter((h) => {
      const hYear = new Date(h.date + "T12:00:00Z").getUTCFullYear();
      if (hYear >= targetYear) return false;
      const hDoy = dayOfYear(h.date);
      const diff = Math.min(
        Math.abs(hDoy - targetDoy),
        DAYS_PER_YEAR - Math.abs(hDoy - targetDoy),
      );
      return diff <= window;
    })
    .map((h) => h.value);

  if (sameSeasonValues.length < 10) {
    return { residual: value, seasonalComponent: 0, applied: false };
  }

  const seasonal = median(sameSeasonValues);
  return { residual: value - seasonal, seasonalComponent: seasonal, applied: true };
}
```

## `app/engine/src/methodology/tier.ts`

```ts
/**
 * Drie-tier-signaal met 3-dagen sustained-duration regel.
 * Bron: doc 06_Laag-7 §3.
 *
 * Drempels (pre-geregistreerd):
 *   Groen  P(t) < 70
 *   Oranje 70 ≤ P(t) < 90, gehandhaafd ≥ 3 opeenvolgende dagen
 *   Rood   P(t) ≥ 90, gehandhaafd ≥ 3 opeenvolgende dagen
 *
 * Decay: tier-afschaling pas na 3 dagen onder drempel (doc 00 §8.2).
 *
 * Rechtvaardiging 3-dagen: doc 06 §3.5 (cortisol-cyclus, allostatic load
 * literatuur McEwen 2007).
 */

import type { Tier } from "../types.js";

export const AMBER_THRESHOLD = 70;
export const RED_THRESHOLD = 90;
export const SUSTAINED_DAYS = 3;

/** Band waar dit percentiel formeel in valt — geen tier-uitspraak, alleen band. */
function percentileBand(p: number): Tier {
  if (p >= RED_THRESHOLD) return "red";
  if (p >= AMBER_THRESHOLD) return "amber";
  return "green";
}

/**
 * Bereken huidige tier uit reeks recente percentielen.
 * Asymmetrische logica: trage overgangen omhoog én omlaag (doc 06 §3.4).
 *
 * @param percentileHistory percentielen in chronologische volgorde, laatste = vandaag
 * @returns tier-stand vandaag, plus aantal dagen in deze tier
 */
export function computeTier(
  percentileHistory: number[],
): { tier: Tier; daysInTier: number; tierHistory: Tier[] } {
  if (percentileHistory.length === 0) {
    return { tier: "green", daysInTier: 0, tierHistory: [] };
  }

  // Stap 1: bereken band per dag
  const bands = percentileHistory.map(percentileBand);

  // Stap 2: pas sustained-duration regel toe voor opwaartse én neerwaartse overgangen
  const tiers: Tier[] = [];
  let currentTier: Tier = "green";
  let candidateTier: Tier = "green";
  let candidateRun = 0;

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (band === candidateTier) {
      candidateRun++;
    } else {
      candidateTier = band;
      candidateRun = 1;
    }
    if (candidateRun >= SUSTAINED_DAYS && candidateTier !== currentTier) {
      currentTier = candidateTier;
    }
    tiers.push(currentTier);
  }

  // Stap 3: tel hoe lang in huidige tier
  let daysInTier = 1;
  for (let i = tiers.length - 2; i >= 0; i--) {
    if (tiers[i] === currentTier) daysInTier++;
    else break;
  }

  return { tier: currentTier, daysInTier, tierHistory: tiers };
}
```

## `app/engine/src/methodology/weights.ts`

```ts
/**
 * Wegings-schema's: Schema 1 (equal), Schema 2 (evidence-graded met balance-correctie).
 * Bron: doc 05_Laag-6 §2, §3, Annex A.
 *
 * Beide schema's worden PARALLEL berekend (doc 05 §6) en in elke output gerapporteerd.
 */

import type { DomainCode, IndicatorCode } from "../types.js";
import { INDICATORS, indicatorsByDomain, allDomains } from "../indicators/registry.js";

/** Schema 1 — equal weights (doc 05 §2). */
export function equalDomainWeight(): number {
  return 1 / 6;
}

export function equalIndicatorWeightInDomain(domain: DomainCode): number {
  return 1 / indicatorsByDomain(domain).length;
}

/**
 * Schema 2 — evidence-graded met balance-correctie.
 * Doc 05 §3.3 Annex A — definitieve waarden gepre-registreerd.
 */
export const SCHEMA_2_DOMAIN_WEIGHTS: Record<DomainCode, number> = {
  D1: 0.211,
  D2: 0.135,
  D3: 0.223,
  D4: 0.108,
  D5: 0.155,
  D6: 0.172,
};

const GRADE_WEIGHT = { A: 3, B: 2 } as const;

export function evidenceIndicatorWeightInDomain(
  indicator: IndicatorCode,
  domain: DomainCode,
): number {
  const all = indicatorsByDomain(domain);
  const totalGradeWeight = all.reduce((sum, m) => sum + GRADE_WEIGHT[m.grade], 0);
  const myGrade = INDICATORS[indicator].grade;
  return GRADE_WEIGHT[myGrade] / totalGradeWeight;
}

export type WeightSchema = "equal" | "evidence";

export function indicatorWeight(
  schema: WeightSchema,
  indicator: IndicatorCode,
  domain: DomainCode,
): number {
  if (schema === "equal") return equalIndicatorWeightInDomain(domain);
  return evidenceIndicatorWeightInDomain(indicator, domain);
}

export function domainWeight(schema: WeightSchema, domain: DomainCode): number {
  if (schema === "equal") return equalDomainWeight();
  return SCHEMA_2_DOMAIN_WEIGHTS[domain];
}

/** Doc 05 §3.3: schema-2-gewichten tellen op tot ~1.000 (rounding-tolerantie). */
export function verifyWeightsSumToOne(schema: WeightSchema): number {
  return allDomains().reduce((s, d) => s + domainWeight(schema, d), 0);
}
```

## `app/engine/src/methodology/winsorize.ts`

```ts
/**
 * Winsorization tegen extreme outliers.
 * Bron: doc 04_Laag-5 §4 — Z_winsorized = clip(Z, -3, +3).
 *
 * Doc 04 §4.1 disclaimer: ±3 is conventionele drempel zonder specifieke
 * empirische basis; multiverse-toets in laag 8 varieert ±2.5 en ±3.5.
 */

export const WINSOR_BOUND = 3;

export function winsorize(z: number, bound = WINSOR_BOUND): { value: number; clipped: boolean } {
  if (z > bound) return { value: bound, clipped: true };
  if (z < -bound) return { value: -bound, clipped: true };
  return { value: z, clipped: false };
}
```

## `app/engine/src/methodology/zscore.ts`

```ts
/**
 * Z-scoring met mediaan + MAD (Median Absolute Deviation).
 * Bron: doc 04_Laag-5 §2 — dubbele baseline (24m voortschrijdend + 2010-2019 vast).
 *
 * Belangrijk: we gebruiken robuste statistiek (mediaan + MAD ×1.4826)
 * in plaats van klassiek gemiddelde + SD. Reden: hittegolven of crises
 * in de baseline-periode zouden anders de baseline scheef trekken (doc 04 §2.1).
 */

export const MAD_SCALE_FACTOR = 1.4826; // MAD → SD-equivalent voor normale verdeling

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** MAD = mediaan(|x - mediaan(x)|), geschaald naar SD-equivalent. */
export function madScaled(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const med = median(xs);
  const deviations = xs.map((x) => Math.abs(x - med));
  return MAD_SCALE_FACTOR * median(deviations);
}

export interface BaselineStats {
  median: number;
  sigma: number; // MAD-equivalent
  n: number;
}

export function computeBaseline(xs: number[]): BaselineStats {
  return {
    median: median(xs),
    sigma: madScaled(xs),
    n: xs.length,
  };
}

/**
 * Z-score voor één waarde tegen baseline.
 * Doc 04 §2.5: dit is een MAD-Z, niet equivalent aan klassieke Z.
 *
 * Wanneer σ = 0 (constant baseline) of NaN: return 0 zodat de indicator
 * geen artificiële piek genereert (eerlijker dan ∞).
 */
export function zscore(x: number, baseline: BaselineStats): number {
  if (!Number.isFinite(baseline.sigma) || baseline.sigma === 0) return 0;
  return (x - baseline.median) / baseline.sigma;
}
```

## `app/engine/src/runtime.ts`

```ts
/**
 * Daily runtime: orkestreert één SBI-berekening voor één datum.
 *
 * Pipeline (volgt doc 03_Laag-4 §5.3):
 *   [1] EXTRACT       — input bestaat al (rawValues + history)
 *   [2] VALIDATE      — schema-check op input
 *   [3] TRANSFORM     — STL waar voorgeschreven
 *   [4] HARMONIZE     — Z-scoring, inverse-codering, winsorize
 *   [5] DECORRELATE   — D5-decorrelatie-protocol (doc 03 §4.4)
 *   [6] AGGREGATE     — composite per Schema 1 + 2
 *   [7] SIGNAL        — percentiel + tier-logica
 */

import type {
  IndicatorCode,
  DailyOutput,
  IndicatorBreakdown,
  SecondarySignal,
  Tier,
} from "./types.js";
import { INDICATOR_CODES, INDICATORS } from "./indicators/registry.js";
import { computeAllDeterministic } from "./indicators/deterministic.js";
import { PLAIN, zToState } from "./indicators/plain-language.js";
import { computeBaseline, zscore } from "./methodology/zscore.js";
import { stlResidual } from "./methodology/stl.js";
import { winsorize } from "./methodology/winsorize.js";
import {
  computeComposite,
  computeCompositeWithoutD5,
  computeDemographicComposite,
  pearsonCorrelation,
  type ZMap,
} from "./methodology/composite.js";
import { DEMOGRAPHIC_REACH } from "./methodology/demographic-reach.js";
import { indicatorWeight, domainWeight } from "./methodology/weights.js";
import { percentileRank } from "./methodology/percentile.js";
import { computeTier } from "./methodology/tier.js";
import { computeConditionLevel } from "./methodology/condition-level.js";

const METHODOLOGY_VERSION = "0.2.0";
const PIPELINE_VERSION = "0.2.0-mvp";

export interface DailyComputeInput {
  date: string; // ISO YYYY-MM-DD
  /** Ruwe waarden per indicator voor vandaag. Deterministische indicatoren
   *  worden anders door de engine zelf gevuld via computeAllDeterministic(). */
  rawValues?: Partial<Record<IndicatorCode, number>>;
  /** Historische archive voor Z-baseline + percentiel. */
  history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>>;
  /** Historische composiet-waarden (laatste 24m) voor percentile-rank. */
  compositeHistory: Array<{ date: string; value: number }>;
  /** Welke indicatoren komen uit demo/mock-data — eerlijk gerapporteerd. */
  simulatedIndicators?: IndicatorCode[];
  /** Indicatoren die imputed waren (LCF/interpolation). */
  imputedIndicators?: IndicatorCode[];
  /** Per indicator: datum/periode waar de data naar verwijst (uit pipeline). */
  observationDates?: Partial<Record<IndicatorCode, string>>;
  /** Secundaire signalen (Reddit e.d.) — passthrough, niet in composiet. */
  secondarySignals?: SecondarySignal[];
  /** Brand-safety override — typisch bij nationale rouw (doc 06 §7). */
  brandSafety?: { flag: "elevated" | "block"; reason: string; expires_estimated: string };
}

export function computeDaily(input: DailyComputeInput): DailyOutput {
  // [1] EXTRACT — vul deterministische indicatoren altijd zelf in
  const today = new Date(input.date + "T12:00:00Z");
  const detValues = computeAllDeterministic(today);
  const raw: Partial<Record<IndicatorCode, number>> = { ...input.rawValues };
  for (const [code, value] of Object.entries(detValues)) {
    raw[code as IndicatorCode] = value;
  }

  // [2-3-4] Per indicator: STL → Z (short + fixed) → inverse-coding → winsorize
  const zShort: ZMap = {};
  const missing: IndicatorCode[] = [];

  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    const x = raw[code];
    if (x === undefined || !Number.isFinite(x)) {
      missing.push(code);
      continue;
    }

    const hist = input.history[code] ?? [];
    let effectiveValue = x;
    let baselineValues = hist.map((h) => h.value);
    if (meta.applyStl && hist.length > 0) {
      const stl = stlResidual(x, input.date, hist);
      if (stl.applied) {
        // STL toegepast: de dagwaarde is gedetrend (residu ~rond 0). De
        // baseline moet dan OOK uit gedetrende historiepunten komen —
        // anders weeg je een residu tegen een ruwe niveau-verdeling en
        // slaat de Z kunstmatig naar de winsor-limiet (-3).
        effectiveValue = stl.residual;
        baselineValues = hist
          .map((h) => stlResidual(h.value, h.date, hist))
          .filter((r) => r.applied)
          .map((r) => r.residual);
      }
    }

    if (hist.length < 30) {
      // Onvoldoende historie — output 0 om geen artificiële piek te genereren
      zShort[code] = 0;
      continue;
    }

    const baseline = computeBaseline(baselineValues);
    let z = zscore(effectiveValue, baseline);
    if (meta.inverseCoded) z = -z;
    const { value } = winsorize(z);
    zShort[code] = value;
  }

  // [5] DECORRELATE — D5-monitor (doc 03 §4.4 stap 2)
  const d5Cross = compute7dCrossCorrelation(
    "I-D5-001",
    "I-D5-003",
    input.history,
  );

  // [6] AGGREGATE
  const equal = computeComposite(zShort, "equal");
  const evidence = computeComposite(zShort, "evidence");
  const withoutD5 = computeCompositeWithoutD5(zShort, "equal");

  // Weegafhankelijkheids-diagnostiek (doc 05 §4 — informational, geen pass/fail)
  const weightSensitivity = {
    correlation_inverse_vs_equal_12w: 0.84, // placeholder — vereist 12-weken historie van beide schema's
    composite_range_with_dropouts: estimateDropoutRange(zShort),
    bootstrap_95_ci_around_equal: estimateBootstrapCI(zShort, equal.composite),
  };

  // [7] SIGNAL — percentiel uit 24m historie
  const percShort = percentileRank(
    equal.composite,
    input.compositeHistory.map((h) => h.value),
  );

  // Tier-logica vereist een geschiedenis van percentielen
  const percentileHistory = buildPercentileHistory(input.compositeHistory, equal.composite);
  const tierResult = computeTier(percentileHistory);

  // Tier history 30d (asymmetrisch, geen kortere lookback)
  const tierHistory30d: Tier[] = tierResult.tierHistory.slice(-30);

  // Top 3 domains
  const topThree = equal.domainContributions.slice(0, 3);

  // Conditie-Niveau (CN) — publieke 5-bands-schaal afgeleid van tier + percentile + brand-safety
  const brandSafetyFlag = input.brandSafety?.flag ?? "normal";
  const cn = computeConditionLevel(tierResult.tier, percShort, brandSafetyFlag);

  // Per-indicator publieksvriendelijke breakdown — alle 20 indicatoren met plain Dutch
  const indicatorBreakdown: IndicatorBreakdown[] = INDICATOR_CODES.map((code) => {
    const meta = INDICATORS[code];
    const plain = PLAIN[code];
    const z = zShort[code];
    const rawValue = raw[code] ?? null;
    const isMissing = z === undefined;
    const contribution = isMissing
      ? 0
      : indicatorWeight("equal", code, meta.domain) * domainWeight("equal", meta.domain) * (z as number);
    return {
      code,
      domain: meta.domain,
      plain_name: plain.plain,
      why: plain.why,
      reads: plain.reads,
      unit: plain.unit,
      raw_value: rawValue,
      z_short: isMissing ? null : (z as number),
      contribution,
      state: isMissing ? "ontbreekt" : zToState(z as number),
      source: meta.source,
      simulated: (input.simulatedIndicators ?? []).includes(code),
      data_source: plain.dataSource,
      references: plain.references,
      observation_date:
        input.observationDates?.[code] ?? (meta.deterministic ? input.date : input.date),
      demographic_reach: DEMOGRAPHIC_REACH[code].reach,
      reach_rationale: DEMOGRAPHIC_REACH[code].rationale,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    week_iso: isoWeek(input.date),
    condition_level: {
      value: cn.level,
      name: cn.name,
      banner_active: cn.bannerActive,
      copy_key: cn.copyKey,
    },
    composite: {
      equal: round2(equal.composite),
      evidence_graded: round2(evidence.composite),
      demographic: round2(computeDemographicComposite(zShort)),
      weight_sensitivity: {
        correlation_inverse_vs_equal_12w: weightSensitivity.correlation_inverse_vs_equal_12w,
        composite_range_with_dropouts: [
          round2(weightSensitivity.composite_range_with_dropouts[0]),
          round2(weightSensitivity.composite_range_with_dropouts[1]),
        ],
        bootstrap_95_ci_around_equal: [
          round2(weightSensitivity.bootstrap_95_ci_around_equal[0]),
          round2(weightSensitivity.bootstrap_95_ci_around_equal[1]),
        ],
      },
    },
    percentile: {
      short_24m: Math.round(percShort),
      fixed_2010_2019: Math.round(percShort), // placeholder — vereist aparte fixed baseline
    },
    tier: {
      current: tierResult.tier,
      days_in_tier: tierResult.daysInTier,
      tier_history_30d: tierHistory30d,
    },
    top_contributing_domains: topThree.map((c) => ({
      domain: c.domain,
      contribution: round2(c.contribution),
    })),
    indicator_breakdown: indicatorBreakdown.map((b) => ({
      ...b,
      raw_value: b.raw_value === null ? null : Math.round(b.raw_value * 1000) / 1000,
      z_short: b.z_short === null ? null : Math.round(b.z_short * 100) / 100,
      contribution: round2(b.contribution),
    })),
    secondary_signals: (input.secondarySignals ?? []).map((s) => ({
      ...s,
      value: Math.round(s.value * 1000) / 1000,
    })),
    media_cluster_diagnostic: {
      d5_cross_correlation_7d: round2(d5Cross),
      composite_without_d5: round2(withoutD5),
      media_contribution_percentile_points: Math.abs(
        Math.round(percentileRank(withoutD5, input.compositeHistory.map((h) => h.value)) - percShort),
      ),
    },
    brand_safety: input.brandSafety
      ? {
          flag: input.brandSafety.flag,
          reason: input.brandSafety.reason,
          expires_estimated: input.brandSafety.expires_estimated,
        }
      : { flag: "normal", reason: null, expires_estimated: null },
    data_quality: {
      indicators_with_imputed_data: input.imputedIndicators ?? [],
      indicators_missing: missing,
      indicators_simulated: input.simulatedIndicators ?? [],
      pipeline_version: PIPELINE_VERSION,
      methodology_version: METHODOLOGY_VERSION,
      implementation_stage: "minimum_viable_pipeline",
    },
  };
}

// --- helpers ---

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function isoWeek(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00Z");
  const target = new Date(d.valueOf());
  const day = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function compute7dCrossCorrelation(
  codeA: IndicatorCode,
  codeB: IndicatorCode,
  history: DailyComputeInput["history"],
): number {
  const a = history[codeA]?.slice(-7).map((h) => h.value) ?? [];
  const b = history[codeB]?.slice(-7).map((h) => h.value) ?? [];
  if (a.length < 3 || b.length < 3 || a.length !== b.length) return 0;
  return pearsonCorrelation(a, b);
}

function estimateDropoutRange(z: ZMap): [number, number] {
  // Bereken composiet met telkens één domein weggelaten — neem min/max
  const composites: number[] = [];
  for (const domain of ["D1", "D2", "D3", "D4", "D5", "D6"] as const) {
    const withoutDomain: ZMap = { ...z };
    for (const code of INDICATOR_CODES) {
      if (INDICATORS[code].domain === domain) delete withoutDomain[code];
    }
    composites.push(computeComposite(withoutDomain, "equal").composite);
  }
  return [Math.min(...composites), Math.max(...composites)];
}

function estimateBootstrapCI(z: ZMap, anchor: number): [number, number] {
  // Vereenvoudigd: ±0.15 × |anchor| als heuristische 95% CI placeholder.
  // Volledige Dirichlet-bootstrap vereist >= 1000 trekkingen — uit te voeren in pipeline.
  const margin = Math.max(0.1, Math.abs(anchor) * 0.15);
  return [anchor - margin, anchor + margin];
}

function buildPercentileHistory(
  compositeHistory: Array<{ date: string; value: number }>,
  todaysComposite: number,
): number[] {
  // Voor elke datum in compositeHistory: bereken percentiel binnen het hele venster
  // (vereenvoudigde benadering — in target architecture wordt percentiel per datum
  // berekend tegen alleen voorafgaande 24m)
  const allValues = [...compositeHistory.map((h) => h.value), todaysComposite];
  return allValues.map((v) => percentileRank(v, allValues));
}
```

## `app/engine/src/types.ts`

```ts
/**
 * Core types for the SBI engine.
 * Reference: doc 02_Laag-3, doc 03_Laag-4, doc 04_Laag-5, doc 06_Laag-7.
 */

export type IndicatorCode =
  | "I-D1-001" // Daglichturen
  | "I-D1-002" // Hitte
  | "I-D1-003" // Kou
  | "I-D1-004" // Luchtkwaliteit
  | "I-D1-009" // Wateroverlast (amendement Laag 3)
  | "I-D1-010" // Pollen (amendement Laag 3)
  | "I-D2-001" // Filezwaarte
  | "I-D2-004" // Brandstofprijzen
  | "I-D2-009" // Treinverstoringen (amendement Laag 3)
  | "I-D3-001" // CPI inflatie
  | "I-D3-002" // Energieprijzen
  | "I-D3-003" // Aangekondigde collectieve ontslagen
  | "I-D3-005" // Werkloosheidscijfer
  | "I-D3-006" // Hypotheekrente
  | "I-D3-009" // Stroomnet-druk (amendement Laag 3)
  | "I-D4-001" // Kalendarische deadlinepieken
  | "I-D4-002" // Schoolvakantie-zonder-opvang
  | "I-D5-001" // Nieuwsnegativiteits-index
  | "I-D5-002" // Google Trends stress-termen
  | "I-D5-003" // Negatieve collectieve gebeurtenissen
  | "I-D6-001" // Dagen tot vakantie
  | "I-D6-002" // Weekdag-cyclus
  | "I-D6-003" // Klok-verzetten
  | "I-D6-005"; // Examenperiode

export type DomainCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export type EvidenceGrade = "A" | "B";

/** Per indicator: meta-info bevroren uit doc 02 §10. */
export interface IndicatorMeta {
  code: IndicatorCode;
  name: string;
  domain: DomainCode;
  grade: EvidenceGrade;
  /** Inverse-codering: indien true, Z wordt vermenigvuldigd met -1 voor optelbaarheid (doc 04 §5). */
  inverseCoded: boolean;
  /** STL toepassen op deze indicator? (doc 04 §3.2) */
  applyStl: boolean;
  /** Bron-disclaimer (doc 03 §2). */
  source: string;
  /** True wanneer indicator volledig uit kalender/astronomie afleidbaar is (Tier A). */
  deterministic: boolean;
}

/** Eén meetpunt voor één indicator op één datum. */
export interface RawSample {
  code: IndicatorCode;
  date: string; // ISO YYYY-MM-DD
  value: number;
  /** True wanneer waarde uit imputatie of mock komt (doc 03 §1.3 + transparency). */
  imputed?: boolean;
  /** True wanneer waarde uit fixture-/demo-data komt — eerlijke vlag voor MVP. */
  simulated?: boolean;
}

/** Volledige historische archief — gebruikt voor Z-baseline en percentiel. */
export type HistoricalArchive = Record<IndicatorCode, RawSample[]>;

/** Tier-stand per doc 06 §3. */
export type Tier = "green" | "amber" | "red";

/** Brand-safety-vlag per doc 06 §7. */
export type BrandSafety = "normal" | "elevated" | "block";

/** Domein-bijdrage in composite (doc 06 §5). */
export interface DomainContribution {
  domain: DomainCode;
  contribution: number;
}

/** Per-indicator detail voor de publieke UI. Niet de pre-geregistreerde wiskunde
 *  zelf — dat is `zScores` in de runtime — maar een leesbare projectie ervan. */
export interface IndicatorBreakdown {
  code: IndicatorCode;
  domain: DomainCode;
  plain_name: string;
  why: string;
  reads: string;
  unit: string;
  raw_value: number | null;        // ruwe waarde uit pipeline/deterministisch
  z_short: number | null;          // Z-score na inverse + winsorize (null = missing)
  contribution: number;            // w_indicator × w_domain × z (signed)
  state: "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";
  source: string;
  simulated: boolean;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
  /** Datum/periode waar de onderliggende data naar verwijst.
   *  Dagelijkse bron: YYYY-MM-DD. Maandelijkse bron (ECB): YYYY-MM. */
  observation_date: string;
  /** Geschat aandeel van de bevolking dat deze indicator raakt (0-1). */
  demographic_reach: number;
  /** Korte onderbouwing van het reach-percentage. */
  reach_rationale: string;
}

/** Conditie-Niveau (CN) — publieke 5-bands-schaal voor banner-activatie. */
export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

/** Secundaire / sensitiviteits-indicator. Telt NIET mee in het composiet
 *  of de banner-logica (doc 02 §10). Apart getoond, expliciet gelabeld. */
export interface SecondarySignal {
  code: string;
  name: string;
  value: number;
  source: string;
  simulated: boolean;
  observation_date: string;
}

/** Volledig daily-output-record — conform doc 06 §4.1. */
export interface DailyOutput {
  timestamp: string; // ISO
  week_iso: string;
  condition_level: {
    value: ConditionLevel;
    name: string;
    banner_active: boolean;
    copy_key: string;
  };
  composite: {
    equal: number;
    evidence_graded: number;
    /** Schema 3 — demografische reikwijdte-weging (parallel, amendement). */
    demographic: number;
    weight_sensitivity: {
      correlation_inverse_vs_equal_12w: number;
      composite_range_with_dropouts: [number, number];
      bootstrap_95_ci_around_equal: [number, number];
    };
  };
  percentile: {
    short_24m: number;
    fixed_2010_2019: number;
  };
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  /** Volledige per-indicator detail — voor publieke transparantie. */
  indicator_breakdown: IndicatorBreakdown[];
  /** Secundaire signalen (bv. Reddit) — NIET in composiet, apart getoond. */
  secondary_signals: SecondarySignal[];
  media_cluster_diagnostic: {
    d5_cross_correlation_7d: number;
    composite_without_d5: number;
    media_contribution_percentile_points: number;
  };
  brand_safety: {
    flag: BrandSafety;
    reason: string | null;
    expires_estimated: string | null;
  };
  data_quality: {
    indicators_with_imputed_data: IndicatorCode[];
    indicators_missing: IndicatorCode[];
    indicators_simulated: IndicatorCode[];
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: "minimum_viable_pipeline" | "target_architecture";
  };
}
```

## `app/engine/package.json`

```json
{
  "name": "@sbi/engine",
  "version": "0.2.0",
  "description": "Stressor-Blootstellings-Index methodology engine (TypeScript)",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -p .",
    "test": "vitest run",
    "test:watch": "vitest",
    "compute": "tsx src/cli/compute-daily.ts",
    "compute-daily": "tsx src/cli/compute-daily.ts",
    "generate-fixture": "tsx src/cli/generate-fixture.ts"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

# Engine — tests

## `app/engine/test/engine.test.ts`

```ts
/**
 * Engine unit tests — reproduceren voorbeelden uit de methodologie-documenten.
 *
 * Bronnen:
 *  • doc 04_Laag-5 §7 — voorbeeld-Z-scores (hitte, file, energie, nieuwsneg., dagen-tot-vakantie)
 *  • doc 05_Laag-6 Annex A — Schema 2 definitieve gewichten
 *  • doc 06_Laag-7 §3 — drempels (70, 90) en 3-dagen-sustained-regel
 */

import { describe, it, expect } from "vitest";
import {
  computeBaseline,
  zscore,
  winsorize,
  computeComposite,
  computeTier,
  domainWeight,
  verifyWeightsSumToOne,
  SCHEMA_2_DOMAIN_WEIGHTS,
  daylightHours,
  percentileRank,
  computeConditionLevel,
} from "../src/index.js";

describe("Z-scoring (doc 04 §7)", () => {
  // Helper: bouw een baseline direct uit median + sigma
  const baselineFromMedSigma = (median: number, sigma: number) => ({ median, sigma, n: 100 });

  it("Hitte: (34.2 - 22.1) / 5.4 ≈ +2.24", () => {
    const z = zscore(34.2, baselineFromMedSigma(22.1, 5.4));
    expect(z).toBeCloseTo(2.24, 1);
  });

  it("Filezwaarte: (8400 - 6200) / 1100 = +2.00", () => {
    const z = zscore(8400, baselineFromMedSigma(6200, 1100));
    expect(z).toBeCloseTo(2.0, 2);
  });

  it("Energie: (95 - 78) / 12 ≈ +1.42", () => {
    const z = zscore(95, baselineFromMedSigma(78, 12));
    expect(z).toBeCloseTo(1.42, 1);
  });

  it("Nieuwsneg STL-residu: 3.1 / 1.8 ≈ +1.72", () => {
    const z = zscore(3.1, baselineFromMedSigma(0, 1.8));
    expect(z).toBeCloseTo(1.72, 1);
  });

  it("Dagen tot vakantie: (41 - 28) / 19 ≈ +0.68", () => {
    const z = zscore(41, baselineFromMedSigma(28, 19));
    expect(z).toBeCloseTo(0.68, 1);
  });
});

describe("Winsorization (doc 04 §4)", () => {
  it("clipt op +3", () => {
    expect(winsorize(4.5).value).toBe(3);
    expect(winsorize(4.5).clipped).toBe(true);
  });
  it("clipt op -3", () => {
    expect(winsorize(-3.7).value).toBe(-3);
  });
  it("laat normale waarden ongemoeid", () => {
    expect(winsorize(1.5).value).toBe(1.5);
    expect(winsorize(1.5).clipped).toBe(false);
  });
});

describe("Wegingen (doc 05 Annex A)", () => {
  it("Schema 2 gewichten exact zoals pre-geregistreerd", () => {
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D1).toBe(0.211);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D2).toBe(0.135);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D3).toBe(0.223);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D4).toBe(0.108);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D5).toBe(0.155);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D6).toBe(0.172);
  });

  it("Schema 1 gewichten zijn 1/6 per domein", () => {
    expect(domainWeight("equal", "D1")).toBeCloseTo(1 / 6, 5);
    expect(domainWeight("equal", "D6")).toBeCloseTo(1 / 6, 5);
  });

  it("Schema 2 sommeert tot ~1.0 (rounding-tolerantie)", () => {
    expect(verifyWeightsSumToOne("evidence")).toBeCloseTo(1.0, 2);
  });

  it("Schema 1 sommeert exact tot 1.0", () => {
    expect(verifyWeightsSumToOne("equal")).toBeCloseTo(1.0, 5);
  });
});

describe("Tier-logica (doc 06 §3)", () => {
  it("Eén dag boven 90 ≠ rood (sustained-regel)", () => {
    const result = computeTier([50, 50, 50, 95, 50, 50]);
    expect(result.tier).toBe("green");
  });

  it("Drie opeenvolgende dagen ≥90 → rood", () => {
    const result = computeTier([50, 50, 92, 93, 95]);
    expect(result.tier).toBe("red");
  });

  it("Drie opeenvolgende dagen tussen 70-90 → oranje", () => {
    const result = computeTier([60, 75, 80, 78]);
    expect(result.tier).toBe("amber");
  });

  it("Decay: 3 dagen onder drempel verlaagt tier", () => {
    const result = computeTier([95, 95, 95, 95, 50, 50, 50]);
    expect(result.tier).toBe("green");
  });

  it("Decay vereist 3 opeenvolgende dagen onder — 2 niet genoeg", () => {
    const result = computeTier([95, 95, 95, 50, 50]);
    expect(result.tier).toBe("red"); // nog steeds rood na 2 dagen herstel
  });
});

describe("Percentile rank", () => {
  it("Mediaan = 50e percentiel", () => {
    expect(percentileRank(5, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeCloseTo(50, 0);
  });

  it("Hoogste waarde > 90e percentiel", () => {
    expect(percentileRank(10, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeGreaterThan(90);
  });
});

describe("Daglichturen — NOAA Solar (Brussel 50.85°N)", () => {
  it("Zomerzonnewende (21 juni) ≈ 16+ uur", () => {
    const h = daylightHours(new Date("2026-06-21T12:00:00Z"));
    expect(h).toBeGreaterThan(16);
    expect(h).toBeLessThan(17);
  });

  it("Winterzonnewende (21 dec) ≈ 7-8 uur", () => {
    const h = daylightHours(new Date("2026-12-21T12:00:00Z"));
    expect(h).toBeGreaterThan(7);
    expect(h).toBeLessThan(8.5);
  });

  it("Lente-equinox (20 mrt) ≈ 12 uur", () => {
    const h = daylightHours(new Date("2026-03-20T12:00:00Z"));
    expect(h).toBeGreaterThan(11.5);
    expect(h).toBeLessThan(12.5);
  });
});

describe("Conditie-Niveau (publieke 5-bands)", () => {
  it("CN 1 — green + P<50", () => {
    const cn = computeConditionLevel("green", 30, "normal");
    expect(cn.level).toBe(1);
    expect(cn.bannerActive).toBe(false);
  });

  it("CN 2 — green + 50≤P<70", () => {
    const cn = computeConditionLevel("green", 60, "normal");
    expect(cn.level).toBe(2);
    expect(cn.bannerActive).toBe(false);
  });

  it("CN 3 — amber (banner aan)", () => {
    const cn = computeConditionLevel("amber", 75, "normal");
    expect(cn.level).toBe(3);
    expect(cn.bannerActive).toBe(true);
    expect(cn.copyKey).toBe("venster_opent");
  });

  it("CN 4 — red (banner aan, verhoogd)", () => {
    const cn = computeConditionLevel("red", 95, "normal");
    expect(cn.level).toBe(4);
    expect(cn.bannerActive).toBe(true);
    expect(cn.copyKey).toBe("conditie_piek");
  });

  it("CN 5 — brand-safety override OVER-RIJDT andere tier (banner UIT)", () => {
    const cn = computeConditionLevel("red", 95, "elevated");
    expect(cn.level).toBe(5);
    expect(cn.bannerActive).toBe(false);
    expect(cn.copyKey).toBe("brand_safety");
  });

  it("CN 5 — block ook override", () => {
    expect(computeConditionLevel("amber", 75, "block").level).toBe(5);
    expect(computeConditionLevel("green", 30, "block").level).toBe(5);
  });
});

describe("Composite met Schema 1", () => {
  it("Berekent gewogen som over alle domeinen", () => {
    const z = {
      "I-D1-001": 0.5,
      "I-D1-002": 1.0,
      "I-D1-003": 0.0,
      "I-D1-004": 0.5,
      "I-D2-001": 1.5,
      "I-D2-004": 0.5,
      "I-D3-001": 1.0,
      "I-D3-002": 1.0,
      "I-D3-003": 1.0,
      "I-D3-005": 1.0,
      "I-D3-006": 1.0,
      "I-D4-001": 0.5,
      "I-D4-002": 0.5,
      "I-D5-001": 0.8,
      "I-D5-002": 0.8,
      "I-D5-003": 0.8,
      "I-D6-001": 0.3,
      "I-D6-002": 0.3,
      "I-D6-003": 0.3,
      "I-D6-005": 0.3,
    } as const;
    const result = computeComposite(z, "equal");
    expect(result.composite).toBeGreaterThan(0);
    expect(result.domainContributions).toHaveLength(6);
  });
});
```

# Data-pipeline (Python) — fetchers en orkestrator

## `app/pipeline/pipeline/__init__.py`

```python
"""SBI Pipeline — minimum viable implementation (doc 03_Laag-4 §5.6)."""
__version__ = "0.2.0-mvp"
```

## `app/pipeline/pipeline/cache.py`

```python
"""
File-based cache voor laatst-succesvolle fetch-waarden.
Wordt door GitHub Actions workflow gecommit terug naar de repo, zodat
volgende runs een fallback hebben bij API-uitval.

Schema:
{
  "<indicator_code>": {
    "value": float,
    "date": ISO date,
    "source": string,
    "fetched_at": ISO datetime
  }
}

Een cache-entry wordt als "geldig" beschouwd wanneer fetched_at < 14 dagen oud.
Daarna wordt mock-fallback verkozen om geen vertekening te veroorzaken.
"""
from __future__ import annotations
import json
from datetime import datetime, timedelta
from pathlib import Path
from .util import DATA_DIR

CACHE_PATH = DATA_DIR / "sbi-cache.json"
CACHE_TTL = timedelta(days=14)


def _load() -> dict:
    if not CACHE_PATH.exists():
        return {}
    try:
        with open(CACHE_PATH, encoding="utf-8") as f:
            return json.load(f) or {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False, sort_keys=True)


def get(code: str) -> tuple[float, str] | None:
    """Return (value, source) als cache hit, anders None."""
    cache = _load()
    entry = cache.get(code)
    if not entry:
        return None
    try:
        fetched_at = datetime.fromisoformat(entry["fetched_at"])
    except (KeyError, ValueError):
        return None
    if datetime.utcnow() - fetched_at > CACHE_TTL:
        return None
    return entry["value"], entry.get("source", "cache")


def put(code: str, value: float, source: str, target_date: str) -> None:
    """Sla succesvolle fetch op."""
    cache = _load()
    cache[code] = {
        "value": value,
        "date": target_date,
        "source": source,
        "fetched_at": datetime.utcnow().isoformat(),
    }
    _save(cache)
```

## `app/pipeline/pipeline/fetchers/__init__.py`

```python
"""Fetchers per data-bron. Eén module per externe bron uit doc 03_Laag-4 §5.2."""
```

## `app/pipeline/pipeline/fetchers/elia.py`

```python
"""
Elia — netstress op het Belgische hoogspanningsnet.
Doc 03_Laag-4: I-D3-009 — netbelasting tov forecast (domein D3 energie/economie).

Bron: Elia Open Data (https://opendata.elia.be/), OpenDataSoft Explore API v2.1.
Open, gratis, geen token. Elia is de Belgische transmissienetbeheerder.

Dataset ods001 = "Measured and forecasted total load on the Belgian grid".
Per kwartier publiceert Elia de gemeten totale belasting (MW) én een
day-ahead-forecast van diezelfde belasting.

Netstress-maat = ratio gemeten / voorspelde belasting voor het recentste
kwartier waarvoor BEIDE waarden bestaan:
  ratio ≈ 1.0  → het net draait zoals gepland
  ratio > 1.0  → meer vraag dan voorspeld → krapper net → meer stress
  ratio < 1.0  → minder vraag dan voorspeld → ruimer net

De OpenDataSoft-veldnamen variëren licht tussen Elia-datasetversies. We
detecteren ze daarom dynamisch: het gemeten veld bevat "measured" of "load"
zonder "forecast"/"most"; het forecast-veld bevat "forecast" of "dayahead".
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

# where=totalload IS NOT NULL filtert toekomstige forecast-rijen weg
# (ods001 bevat ook week-ahead-rijen zonder gemeten belasting).
URL = (
    "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods001/records"
    "?limit=100&order_by=datetime%20desc"
    "&where=totalload%20is%20not%20null"
)


def _is_number(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def aggregate_ratio(records: list) -> float | None:
    """Geaggregeerde ratio Σ gemeten / Σ day-ahead-forecast over alle records.
    Aggregeren i.p.v. één kwartier nemen dempt de kwartier-ruis (≈ dagcijfer).
    Wordt door zowel de dagfetcher als het backfill-script gebruikt."""
    if not isinstance(records, list) or not records:
        return None
    tl_sum = 0.0
    fc_sum = 0.0
    for rec in records:
        if not isinstance(rec, dict):
            continue
        measured = rec.get("totalload")
        # day-ahead is de echte "wat verwachtten we"-prognose; mostrecent als fallback
        forecast = rec.get("dayaheadforecast")
        if not _is_number(forecast) or forecast <= 0:
            forecast = rec.get("mostrecentforecast")
        if _is_number(measured) and _is_number(forecast) and forecast > 0 and measured > 0:
            tl_sum += float(measured)
            fc_sum += float(forecast)
    return tl_sum / fc_sum if fc_sum > 0 else None


def _extract_ratio(body: dict) -> float | None:
    return aggregate_ratio(body.get("results"))


def fetch_grid_stress(target_date: date) -> FetchResult:
    """Netstress = gemeten/voorspelde belasting Belgische net (I-D3-009)."""
    ok, body = safe_request(URL, timeout=25)

    if ok and isinstance(body, dict):
        ratio = _extract_ratio(body)
        if ratio is not None:
            source = "Elia Open Data ods001 (gemeten/forecast totale netbelasting)"
            cache_put("I-D3-009", ratio, source, target_date.isoformat())
            return FetchResult(
                "I-D3-009", ratio, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D3-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock rond 1.0 (forecast doorgaans accuraat, kleine afwijking).
    value = max(0.0, 1.0 + seasonal_noise(target_date, 0.0, 0.03, 0.05, 0.0))
    return FetchResult(
        "I-D3-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (Elia Open Data onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
        error=body if not ok else None,
    )
```

## `app/pipeline/pipeline/fetchers/energy_charts.py`

```python
"""
Energy-Charts.info — Belgische day-ahead elektriciteitsprijs.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Bron: api.energy-charts.info (Fraunhofer ISE, Belgische BZN-data).
Open, geen token, CC BY 4.0. Voedt zich met ENTSO-E + Bundesnetzagentur.

We nemen het gemiddelde van de uurprijzen van de recentste beschikbare dag.

Bron-ladder (Energy-Charts kan tijdelijk 503'en):
  1. Energy-Charts plain endpoint (laatste dagen, lichte respons)
  2. Energy-Charts dated endpoint (vandaag/gisteren)
  3. cache (laatst succesvolle waarde)
  4. laatst bekende echte prijs uit data/history/I-D3-002.json
  5. mock
Stap 4 zorgt dat de indicator een ECHTE prijs toont, ook bij API-uitval.
"""
from __future__ import annotations
import json
from datetime import date, datetime, timedelta, timezone
from ..util import FetchResult, safe_request, seasonal_noise, DATA_DIR
from ..cache import get as cache_get, put as cache_put

_PLAIN_URL = "https://api.energy-charts.info/price?bzn=BE"
_SOURCE = "Energy-Charts (Fraunhofer ISE, BE day-ahead)"


def _day_mean_from_plain() -> tuple[float, str] | None:
    """Gemiddelde uurprijs van de recentste volledige dag uit het plain endpoint."""
    ok, body = safe_request(_PLAIN_URL, timeout=25, retries=2, retry_delay=5)
    if not ok or not isinstance(body, dict):
        return None
    prices = body.get("price") or []
    stamps = body.get("unix_seconds") or []
    by_day: dict[str, list[float]] = {}
    for p, ts in zip(prices, stamps):
        if not isinstance(p, (int, float)) or not isinstance(ts, (int, float)):
            continue
        d = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        by_day.setdefault(d, []).append(float(p))
    if not by_day:
        return None
    latest = max(by_day)
    vals = by_day[latest]
    return sum(vals) / len(vals), latest


def _day_mean_dated(d: date) -> float | None:
    url = (
        f"https://api.energy-charts.info/price?bzn=BE"
        f"&start={d.isoformat()}&end={(d + timedelta(days=1)).isoformat()}"
    )
    ok, body = safe_request(url, timeout=20)
    if not ok or not isinstance(body, dict):
        return None
    valid = [p for p in (body.get("price") or []) if isinstance(p, (int, float))]
    return sum(valid) / len(valid) if valid else None


def _last_known_from_history() -> tuple[float, str] | None:
    """Laatst bekende echte prijs uit het baseline-historiebestand."""
    path = DATA_DIR / "history" / "I-D3-002.json"
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(rows, list) and rows:
            last = rows[-1]
            return float(last["value"]), str(last.get("date", ""))
    except (OSError, ValueError, KeyError, TypeError):
        pass
    return None


def fetch_energy_prices(target_date: date) -> FetchResult:
    # 1) Plain endpoint — recentste dag
    plain = _day_mean_from_plain()
    if plain is not None:
        value, obs = plain
        cache_put("I-D3-002", value, _SOURCE, obs)
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False, source=_SOURCE, observation_date=obs,
        )

    # 2) Dated endpoint — vandaag, dan gisteren
    for delta in (0, 1):
        d = target_date - timedelta(days=delta)
        val = _day_mean_dated(d)
        if val is not None:
            cache_put("I-D3-002", val, _SOURCE, d.isoformat())
            return FetchResult(
                "I-D3-002", val, target_date.isoformat(),
                simulated=False, source=_SOURCE, observation_date=d.isoformat(),
            )

    # 3) Cache
    cached = cache_get("I-D3-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 4) Laatst bekende echte prijs uit de historie — nog steeds echte data
    hist = _last_known_from_history()
    if hist is not None:
        value, obs = hist
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False,
            source=f"laatst bekende prijs uit historie ({_SOURCE})",
            observation_date=obs,
        )

    # 5) Mock — alleen als zelfs de historie ontbreekt
    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (Energy-Charts + cache + historie alle leeg)",
    )
```

## `app/pipeline/pipeline/fetchers/entsoe.py`

```python
"""
ENTSO-E Transparency Platform fetcher voor Belgische energieprijzen.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Real-fetch vereist gratis ENTSO-E API token (registratie via
transparency.entsoe.eu). Endpoint:
  https://web-api.tp.entsoe.eu/api?securityToken=...

STATUS: skeleton. Token-injectie via env var ENTSOE_TOKEN.
"""
from __future__ import annotations
import os
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_energy_prices(target_date: date) -> FetchResult:
    token = os.environ.get("ENTSOE_TOKEN")
    if token:
        # TODO_REAL_FETCH: implementeer Day-ahead-prices XML-parser
        # (ENTSO-E API geeft XML met Energiebespreking per uur).
        pass
    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (ENTSO-E — set ENTSOE_TOKEN voor real-fetch)",
    )
```

## `app/pipeline/pipeline/fetchers/events.py`

```python
"""
Collectieve gebeurtenissen — RSS-monitor + menselijke confirmation.
Doc 03_Laag-4 §2.5: I-D5-003.

Methodologisch verplicht (doc 03 §2.5): twee onafhankelijke menselijke
codeurs met κ ≥ 0.75. Volledige automatisering is NIET toegestaan.

Wat deze fetcher wel doet:
1. Leest RSS-feeds van VRT NWS, HLN, De Standaard
2. Scoort headlines tegen magnitude-keywords (niveau 1/3/5)
3. Schrijft candidates naar `pending_events.json` voor admin-review
4. Leest `events.json` (door admin bevestigd) voor de daadwerkelijke score

Admin review-workflow: bekijk `pending_events.json` → kopieer relevante
entries naar `events.json`. De fetcher leest alleen events.json voor de
actieve score.

NB: voor MVP draait de classifier op simpele keyword-matching. Echte deployment
vereist een tweede codeur — bv. via een aparte AI-codeur of menselijke review,
met κ-test op 50 historische cases (doc 03 §2.5).
"""
from __future__ import annotations
import json
import math
import re
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from pathlib import Path
from ..util import FetchResult, ROOT, safe_request


EVENTS_FILE = ROOT / "pipeline" / "events.json"
PENDING_FILE = ROOT / "pipeline" / "pending_events.json"

RSS_FEEDS = {
    "VRT NWS": "https://www.vrt.be/vrtnws/nl.rss.articles.xml",
    "De Standaard": "https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss",
    "De Morgen": "https://www.demorgen.be/rss.xml",
    "Het Laatste Nieuws": "https://www.hln.be/rss.xml",
    "De Tijd": "https://www.tijd.be/rss/ondernemen.xml",
    "Het Belang van Limburg": "https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A",
    "Bruzz": "https://www.bruzz.be/rss.xml",
    "Knack": "https://www.knack.be/nieuws/feed/",
}

# Magnitude-classificatie via keywords. Doc 03 §2.5 niveaus 1/3/5.
KEYWORDS_MAG_5 = re.compile(
    r"\b(aanslag|terreur|terroristisch|oorlogsverklaring|massa[-\s]?evacuatie)\b",
    re.IGNORECASE,
)
KEYWORDS_MAG_3 = re.compile(
    r"\b(nationale\s+rouw|nationale\s+ramp|tragedie|catastrofe|noodtoestand)\b",
    re.IGNORECASE,
)
KEYWORDS_MAG_1 = re.compile(
    r"\b(zware\s+ramp|noodweer|overstroming|hittegolf\s+rood|grootschalige\s+evacuatie|treintragedie)\b",
    re.IGNORECASE,
)


def _classify(title: str, description: str = "") -> int:
    """Geeft magnitude 0 (geen match), 1, 3, of 5."""
    haystack = f"{title} {description}"
    if KEYWORDS_MAG_5.search(haystack): return 5
    if KEYWORDS_MAG_3.search(haystack): return 3
    if KEYWORDS_MAG_1.search(haystack): return 1
    return 0


def _parse_rss(xml_text: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[dict] = []
    # Atom feeds use {namespace}entry, RSS 2.0 uses plain "item"
    for tag_suffix in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag_suffix):
                continue
            title = ""
            desc = ""
            link = ""
            pubdate = ""
            for child in el:
                tag = child.tag.split("}", 1)[-1].lower()
                if tag == "title":
                    title = (child.text or "").strip()
                elif tag in ("description", "summary", "content"):
                    if not desc:
                        desc = (child.text or "").strip()
                elif tag in ("pubdate", "published", "updated"):
                    if not pubdate:
                        pubdate = (child.text or "").strip()
                elif tag == "link":
                    href = child.attrib.get("href")
                    if href:
                        link = href
                    elif child.text:
                        link = child.text.strip()
            if title:
                items.append({"title": title, "description": desc, "pubDate": pubdate, "link": link})
        if items:
            break
    return items


def _scan_rss_for_candidates(target_date: date) -> tuple[list[dict], bool]:
    """Return (candidates, rss_reachable).
    rss_reachable = True wanneer minstens één feed succesvol opgehaald is.
    Dat onderscheidt 'geen gebeurtenissen gemeten' (echte 0) van
    'kon niet meten' (feeds onbereikbaar)."""
    candidates = []
    seen_titles = set()
    rss_reachable = False
    for source, url in RSS_FEEDS.items():
        ok, body = safe_request(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"})
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        items = _parse_rss(body)
        for it in items:
            mag = _classify(it["title"], it["description"])
            if mag == 0:
                continue
            if it["title"] in seen_titles:
                continue
            seen_titles.add(it["title"])
            candidates.append({
                "date": target_date.isoformat(),
                "magnitude": mag,
                "title": it["title"],
                "source": source,
                "link": it["link"],
                "auto_detected": True,
                "review_status": "pending",
            })
    return candidates, rss_reachable


def _read_confirmed_events() -> list[dict]:
    if not EVENTS_FILE.exists():
        return []
    try:
        with open(EVENTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _write_pending(candidates: list[dict]) -> None:
    """Append nieuwe pending events, dedupliceren op title+date."""
    existing = []
    if PENDING_FILE.exists():
        try:
            with open(PENDING_FILE, encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, OSError):
            existing = []
    seen = {(e.get("title"), e.get("date")) for e in existing}
    for c in candidates:
        if (c["title"], c["date"]) not in seen:
            existing.append(c)
    with open(PENDING_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)


def fetch_collective_events(target_date: date) -> FetchResult:
    # Stap 1: scan RSS feeds en schrijf candidates voor admin review
    candidates, rss_reachable = _scan_rss_for_candidates(target_date)
    if candidates:
        _write_pending(candidates)

    # Stap 2: bereken score op basis van door admin BEVESTIGDE events
    confirmed = _read_confirmed_events()
    total = 0.0
    for ev in confirmed:
        try:
            ev_date = datetime.fromisoformat(ev["date"]).date()
        except (KeyError, ValueError):
            continue
        delta = (target_date - ev_date).days
        if 0 <= delta <= 7:
            magnitude = ev.get("magnitude", 1)
            total += magnitude * math.exp(-delta / 3)

    # RSS bereikbaar = echte meting, ook wanneer er 0 gebeurtenissen zijn.
    # Alleen wanneer geen enkele feed bereikbaar was kunnen we niet meten.
    if rss_reachable:
        return FetchResult(
            "I-D5-003", min(total, 15.0), target_date.isoformat(),
            simulated=False,
            source=(f"RSS-monitor (VRT NWS + De Standaard) + events.json "
                    f"({len(confirmed)} bevestigd, {len(candidates)} candidates voor review)"),
        )

    # Geen enkele RSS-feed bereikbaar: we konden niet meten.
    return FetchResult(
        "I-D5-003", min(total, 15.0), target_date.isoformat(),
        simulated=True,
        source="mock (RSS-feeds onbereikbaar, score uit events.json)",
    )
```

## `app/pipeline/pipeline/fetchers/fod_economie.py`

```python
"""
Brandstof-fetcher voor BE (I-D2-004).
Doc 03_Laag-4 §2.2.

Primaire bron: **be.STAT (Statbel / FOD Economie) — officiele dagelijkse
maximumprijzen aardolieproducten**. Statbel publiceert elke werkdag de
officiele maximumprijs (cliquetsysteem / programmaovereenkomst
petroleumproducten) als machine-leesbare JSON. We lezen "Benzine 95 RON E10"
(€/l, incl. btw) als de stress-relevante pompprijs.

Dit is een upgrade t.o.v. de vorige aanpak (ECB-HICP yoy → €/l-schatting):
de be.STAT-waarde is de ECHTE prijs van de dag zelf, geen maandschatting.

Fallback cascade: be.STAT → ECB HICP CP0722 → carbu scrape → mock.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest_with_period


# be.STAT API — officiele maximumprijzen aardolieproducten (FOD Economie)
# View-UUID is een mogelijk breekpunt: bij een lege/gewijzigde respons
# degraderen we netjes naar de ECB-fallback.
BESTAT_FUEL_URL = (
    "https://bestat.statbel.fgov.be/bestat/api/views/"
    "c42c9c16-9330-437b-9608-13781b795ec1/result/JSON"
)
BESTAT_PRODUCT = "Benzine 95 RON E10 (€/L)"

# ECB HICP key voor "Fuels and lubricants for personal transport equipment"
# Coicop 07.2.2, BE, monthly, annual rate of change
ECB_FUEL_HICP_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.072200.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

CARBU_URL = "https://carbu.com/belgie/index.php/laagsteprijs/EUROPE_95/-/-"

EURO95_PATTERN = re.compile(
    r"(?:Euro\s*95|euro95|E95)\D{0,40}?(\d[,.]\d{2,3})",
    re.IGNORECASE,
)
EURO95_BASELINE_PER_L = 1.85  # 2024-baseline voor BE Euro95

# Nederlandse maand-afkortingen zoals Statbel ze in het "Dag"-veld zet
# (bv. "22mei26" → 2026-05-22).
_NL_MONTHS = {
    "jan": 1, "feb": 2, "mrt": 3, "maa": 3, "apr": 4, "mei": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12,
}
_DAG_RE = re.compile(r"^(\d{1,2})([a-z]{3})(\d{2})$", re.IGNORECASE)


def _parse_bestat_dag(dag: str) -> str | None:
    """'22mei26' → '2026-05-22'. Return None bij onbekend formaat."""
    if not isinstance(dag, str):
        return None
    m = _DAG_RE.match(dag.strip())
    if not m:
        return None
    day, mon, yy = m.group(1), m.group(2).lower(), m.group(3)
    month = _NL_MONTHS.get(mon)
    if month is None:
        return None
    try:
        return f"20{yy}-{month:02d}-{int(day):02d}"
    except ValueError:
        return None


def _try_bestat() -> tuple[float, str] | None:
    """Return (euro_per_l, observation_date_iso) of None."""
    ok, body = safe_request(
        BESTAT_FUEL_URL, timeout=25,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None
    facts = body.get("facts")
    if not isinstance(facts, list):
        return None
    for fact in facts:
        if not isinstance(fact, dict):
            continue
        if fact.get("Product") != BESTAT_PRODUCT:
            continue
        price = fact.get("Prijs incl. BTW")
        try:
            val = float(price)
        except (TypeError, ValueError):
            continue
        if not (0.5 < val < 5.0):
            continue
        obs = _parse_bestat_dag(fact.get("Dag", "")) or None
        return round(val, 3), obs
    return None


def _try_ecb_fuel_hicp() -> tuple[float, float, str] | None:
    """Return (yoy_pct, eur_per_l_estimate, period) of None."""
    ok, body = safe_request(
        ECB_FUEL_HICP_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None
    result = _parse_ecb_latest_with_period(body)
    if result is None:
        return None
    yoy, period = result
    estimate = EURO95_BASELINE_PER_L * (1 + yoy / 100)
    return yoy, round(estimate, 3), period


def _try_scrape(url: str) -> float | None:
    ok, body = safe_request(
        url, timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0 (SBI-pipeline)",
            "Accept-Language": "nl-BE,nl;q=0.9",
        },
    )
    if not ok or not isinstance(body, str):
        return None
    m = EURO95_PATTERN.search(body)
    if not m:
        return None
    try:
        val = float(m.group(1).replace(",", "."))
        if 0.5 < val < 5.0:
            return val
    except ValueError:
        pass
    return None


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # 1) be.STAT — officiele dagelijkse maximumprijs (FOD Economie)
    bestat = _try_bestat()
    if bestat is not None:
        value, obs = bestat
        return FetchResult(
            "I-D2-004", value, target_date.isoformat(),
            simulated=False,
            source="Statbel be.STAT — officiele maximumprijs Benzine 95 E10 (FOD Economie)",
            observation_date=obs or target_date.isoformat(),
        )

    # 2) ECB HICP CP0722 — methodologisch sterke maand-fallback
    hicp = _try_ecb_fuel_hicp()
    if hicp is not None:
        yoy, estimate, period = hicp
        return FetchResult(
            "I-D2-004", estimate, target_date.isoformat(),
            simulated=False,
            source=f"ECB HICP brandstof yoy {yoy:+.1f}% naar €{estimate}/l geschat (be.STAT onbereikbaar)",
            observation_date=period,
        )

    # 3) carbu.com fallback
    val = _try_scrape(CARBU_URL)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="carbu.com (BE pomp-prijzen)",
            observation_date=target_date.isoformat(),
        )

    # 4) Conservative mock
    value = 1.85 + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True,
        source="mock (be.STAT + ECB HICP + carbu alle drie faalden)",
    )
```

## `app/pipeline/pipeline/fetchers/fod_waso.py`

```python
"""
Ontslagen-intensiteit-fetcher voor BE (I-D3-003).
Doc 03_Laag-4 §2.3.

**Eerlijke discloure**: FOD WASO publiceert geen open URL of API voor de
actieve wet-Renault-procedures. Alle URL's die we tot nu toe probeerden
geven 404 — de pagina-structuur wijzigt regelmatig en er is geen stabiele
publieke endpoint.

**Methodologisch-defensieve oplossing**: we gebruiken de **maandelijkse
verandering in BE-werkloosheidsaantallen** als **proxy** voor ontslag-
intensiteit. Dit is geen perfect proxy (een werkloosheidsstijging kan ook
door minder nieuw aangenomen mensen komen), maar wel een echte officiële
bron (ECB LFSI). Volledig gedocumenteerd in `source`.

We schalen de delta naar log(1 + max(0, delta_workers)) zodat de waarde
op dezelfde schaal blijft als de oorspronkelijke indicator.

Toekomst: vervang door directe FOD WASO scrape zodra zij open data publiceren.
"""
from __future__ import annotations
import math
from datetime import date
from ..util import FetchResult, safe_request


# ECB LFSI: BE unemployment rate (%), seasonally adjusted, ages 15-74, total
# We nemen 2 laatste maand-observaties om de delta te berekenen
ECB_UNEMPLOYED_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&lastNObservations=2"
)
# Approximate BE workforce (15-74) — voor delta-omzetting naar werkzoekenden-count
BE_WORKFORCE = 5_000_000


def _parse_ecb_last_two(body) -> tuple[float | None, float | None, str]:
    """Return (prev_value, last_value, last_period)."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        sorted_keys = sorted(observations.keys(), key=lambda k: int(k))
        period = ""
        try:
            obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
            period = obs_dim[int(sorted_keys[-1])]["id"]
        except (KeyError, IndexError, ValueError, TypeError):
            period = ""
        if len(sorted_keys) < 2:
            v = float(observations[sorted_keys[-1]][0])
            return None, v, period
        prev = float(observations[sorted_keys[-2]][0])
        last = float(observations[sorted_keys[-1]][0])
        return prev, last, period
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None, None, ""


def fetch_collective_layoffs(target_date: date) -> FetchResult:
    ok, body = safe_request(
        ECB_UNEMPLOYED_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if ok and isinstance(body, dict):
        prev_rate, last_rate, period = _parse_ecb_last_two(body)
        if last_rate is not None:
            # Rate is %, delta_pp = procentpunt verandering
            if prev_rate is not None:
                delta_pp = last_rate - prev_rate
                # Convert rate delta to estimated extra unemployed persons
                # 0.1 pp × 5M workforce = ~5000 extra werkzoekenden
                effective_workers = max(0, delta_pp / 100 * BE_WORKFORCE)
                value = math.log1p(effective_workers)
                return FetchResult(
                    "I-D3-003", value, target_date.isoformat(),
                    simulated=False,
                    source=(f"ECB LFSI werkloosheidsrate-delta ({delta_pp:+.2f}pp, "
                            f"~{int(effective_workers)} werkzoekenden, proxy voor ontslagen)"),
                    observation_date=period,
                )
            # Only last available — baseline 0
            return FetchResult(
                "I-D3-003", math.log1p(0), target_date.isoformat(),
                simulated=False,
                source=f"ECB LFSI werkloosheidsrate {last_rate:.1f}% (baseline)",
                observation_date=period,
            )

    # Conservatief fallback
    return FetchResult(
        "I-D3-003", math.log1p(1), target_date.isoformat(),
        simulated=True,
        source="mock (ECB LFSI endpoint faalde)",
    )
```

## `app/pipeline/pipeline/fetchers/gdelt.py`

```python
"""
Nieuwsnegativiteits-fetcher (I-D5-001).
Doc 03_Laag-4 §2.5.

WETENSCHAPPELIJKE METHODE
-------------------------
Primaire meting: **GDELT DOC 2.0 timelinetone** — de gemiddelde nieuwstoon
van Belgische nieuwsbronnen (sourcecountry:BE, zowel Nederlands- als
Franstalig). negativity = -AvgTone.

Waarom GDELT primair (en niet meer het RSS-lexicon):
GDELT levert ook een ECHTE 24-maanden-historie van exact dezelfde meting
(zie scripts/backfill_gdelt_baseline.py → data/history/I-D5-001.json).
Daardoor wordt de dagwaarde tegen een ECHTE mediaan+MAD-meetlat gewogen,
op dezelfde schaal. Vroeger draaide de baseline op een synthetische
sinus-reeks; dat is nu opgelost.

Naast GDELT meten we de RSS-corpus-toon nog steeds met het NL-valentielexicon
+ bron-niveau poststratificatie naar mediapubliek-profielen. Dat levert de
demografisch gesegmenteerde lezing (negativiteit jong/midden/ouder) die in
de bronvermelding wordt getoond — een controle-meting naast GDELT.

Bron-ladder voor de dagwaarde:
  1. GDELT DOC v2 timelinetone (zelfde schaal als de 24m-baseline)
  2. cache (≤14d)
  3. mock
"""
from __future__ import annotations
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text
from ..media_profiles import poststratify

# (feed-URL, mediaprofiel-sleutel). Sleutel matcht media_profiles.MEDIA_PROFILES.
RSS_FEEDS = [
    ("https://www.vrt.be/vrtnws/nl.rss.articles.xml", "vrtnws"),
    ("https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss", "standaard"),
    ("https://www.demorgen.be/rss.xml", "demorgen"),
    ("https://www.hln.be/rss.xml", "hln"),
    ("https://www.tijd.be/rss/ondernemen.xml", "tijd"),
    ("https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A", "hbvl"),
    ("https://www.bruzz.be/rss.xml", "bruzz"),
    ("https://www.knack.be/nieuws/feed/", "knack"),
    ("https://sporza.be/nl.rss.articles.xml", "sporza"),
    ("https://trends.knack.be/feed/", "trends"),
    ("https://businessam.be/feed/", "businessam"),
    ("https://www.eoswetenschap.eu/rss.xml", "eos"),
    ("https://newsmonkey.be/feed", "newsmonkey"),
]

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


def _parse_rss_texts(xml_text: str) -> list[str]:
    """Return list van 'titel + samenvatting' strings uit RSS/Atom XML."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[str] = []
    for tag in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag):
                continue
            title, desc = "", ""
            for child in el:
                t = child.tag.split("}", 1)[-1].lower()
                if t == "title" and child.text:
                    title = child.text.strip()
                elif t in ("description", "summary", "content") and child.text and not desc:
                    desc = child.text.strip()
            if title:
                items.append(f"{title} {desc}")
        if items:
            break
    return items


def _per_source_tones(target_date: date) -> tuple[bool, list[tuple[str, float]], int]:
    """Meet de toon per bron afzonderlijk (RSS-controle-meting).
    Return (rss_reachable, [(profiel-sleutel, gemiddelde toon), ...], totaal_artikels)."""
    source_tones: list[tuple[str, float]] = []
    total_articles = 0
    rss_reachable = False
    for url, key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        tones: list[float] = []
        for text in _parse_rss_texts(body):
            result = tone_of_text(text)
            if result is not None:
                tones.append(result[0])
        if tones:
            source_tones.append((key, sum(tones) / len(tones)))
            total_articles += len(tones)
    return rss_reachable, source_tones, total_articles


def gdelt_tone_series(start: date, end: date) -> list[dict] | None:
    """Haal de dagelijkse GDELT-nieuwstoon voor BE op tussen start en end.

    Return list van {"date": "YYYY-MM-DD", "value": negativity} of None.
    negativity = -AvgTone. Eén GDELT-call; gebruikt door zowel de dagelijkse
    fetcher als het 24m-backfill-script (scripts/backfill_gdelt_baseline.py).
    """
    url = (
        f"{GDELT_DOC_URL}?query=sourcecountry:BE"
        f"&mode=timelinetone&format=json"
        f"&startdatetime={start.strftime('%Y%m%d000000')}"
        f"&enddatetime={end.strftime('%Y%m%d235959')}"
    )
    ok, body = safe_request(url, timeout=45, retries=2, retry_delay=8)
    if ok and isinstance(body, str) and "limit requests" in body.lower():
        return None
    if not ok or not isinstance(body, dict):
        return None
    timeline = body.get("timeline", [])
    if not timeline:
        return None
    series = None
    for s in timeline:
        if s.get("seriesAlias") in ("Average Tone", "AvgTone"):
            series = s
            break
    if series is None:
        series = timeline[0]
    out: list[dict] = []
    for pt in series.get("data", []):
        raw_date = str(pt.get("date", ""))
        try:
            iso = datetime.strptime(raw_date[:8], "%Y%m%d").strftime("%Y-%m-%d")
            out.append({"date": iso, "value": round(-float(pt["value"]), 4)})
        except (ValueError, KeyError, TypeError):
            continue
    return out or None


def fetch_news_negativity(target_date: date) -> FetchResult:
    # RSS-controle-meting: demografisch gesegmenteerde lezing (los van de schaal
    # die de composiet aanstuurt — puur descriptief in de bronvermelding).
    seg_text = ""
    rss_ok, source_tones, n_articles = _per_source_tones(target_date)
    if rss_ok and source_tones and n_articles >= 8:
        ps = poststratify(source_tones)
        if ps["national"] is not None:
            seg = ps["segments"]
            seg_text = (
                f"; RSS-lexicon-controle ({LEXICON_SIZE} woorden, {LEXICON_VERSION}, "
                f"{n_articles} artikels, {ps['n_sources']} bronnen, poststratificatie): "
                f"negativiteit jong {-seg['jong']:+.2f} / midden {-seg['midden']:+.2f} / "
                f"ouder {-seg['ouder']:+.2f}"
            )

    # 1) GDELT timelinetone — zelfde schaal als de 24m-baseline
    time.sleep(8)  # respecteer GDELT rate-limit (1 req / 5s)
    series = gdelt_tone_series(target_date - timedelta(days=21), target_date)
    if series:
        recent = series[-3:]  # lichte stabilisatie tegen ontbrekende laatste dag
        negativity = round(sum(p["value"] for p in recent) / len(recent), 4)
        source = (
            f"GDELT DOC v2 timelinetone (gemiddelde nieuwstoon BE, "
            f"sourcecountry:BE, {len(recent)}d-venster){seg_text}"
        )
        cache_put("I-D5-001", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", negativity, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 2) Cache (GDELT-schaal)
    cached = cache_get("I-D5-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-001", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 3) Mock
    value = seasonal_noise(target_date, 1.4, 0.6, 0.5, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT + cache leeg)",
    )
```

## `app/pipeline/pipeline/fetchers/google_trends.py`

```python
"""
Google Trends stress-termen fetcher — v2 met cache-fallback.
Doc 03_Laag-4 §2.5: I-D5-002 — weighted index NL-termen, regio BE.

WAARSCHUWING (Lazer 2014): Google Trends-validiteit is fragiel.
pytrends is de enige gratis weg en wordt door Google regelmatig
rate-limited (429). Daarom dezelfde cache-strategie als GDELT:

Ladder:
1. pytrends real-fetch (met retry)
2. cache (laatst succesvolle waarde, ≤14 dagen)
3. mock met eerlijke vlag

De cache wordt via sbi-cache.json door de GitHub Actions workflow
gecommit terug naar de repo.
"""
from __future__ import annotations
import time
from datetime import date, timedelta
from ..util import FetchResult, seasonal_noise
from ..cache import get as cache_get, put as cache_put


GT_TERMS = ["stress", "burn-out", "slaapproblemen", "moe", "hoofdpijn",
            "angst", "uitgeput", "slapeloosheid"]


def _try_pytrends(target_date: date) -> float | None:
    """Eén poging via pytrends. Return gemiddelde index of None."""
    try:
        from pytrends.request import TrendReq  # type: ignore
        pytrends = TrendReq(hl="nl-BE", tz=60, retries=2, backoff_factor=1.0)
        start = target_date - timedelta(days=14)
        timeframe = f"{start.isoformat()} {target_date.isoformat()}"
        scores = []
        for batch in (GT_TERMS[:5], GT_TERMS[5:]):
            pytrends.build_payload(batch, geo="BE", timeframe=timeframe)
            df = pytrends.interest_over_time()
            if not df.empty:
                scores.extend(df[batch].mean().tolist())
            time.sleep(1)  # kleine pauze tussen batches
        if scores:
            return sum(scores) / len(scores)
    except Exception:  # noqa: BLE001
        pass
    return None


def fetch_stress_searches(target_date: date) -> FetchResult:
    # 1) pytrends real-fetch (2 pogingen met pauze)
    for attempt in range(2):
        val = _try_pytrends(target_date)
        if val is not None:
            source = "Google Trends (pytrends)"
            cache_put("I-D5-002", val, source, target_date.isoformat())
            return FetchResult(
                "I-D5-002", val, target_date.isoformat(),
                simulated=False, source=source,
            )
        if attempt == 0:
            time.sleep(8)

    # 2) Cache-fallback (≤14d) — echte data, mogelijk een paar dagen oud
    cached = cache_get("I-D5-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-002", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
        )

    # 3) Mock
    value = max(0, seasonal_noise(target_date, 50, 10, 15, 0.0))
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (pytrends + cache beide leeg)",
    )
```

## `app/pipeline/pipeline/fetchers/irail.py`

```python
"""
iRail — live treinverstoringen op het Belgische spoornet.
Doc 03_Laag-4: I-D2-009 — ongeplande spoorverstoringen (domein D2 mobiliteit).

Bron: iRail API (https://api.irail.be/) — open, gratis, geen token. iRail is
een community-project dat de officiële NMBS/SNCB-data ontsluit.

Endpoint: https://api.irail.be/disturbances/?format=json&lang=nl
De respons bevat een lijst 'disturbance'. Elk item heeft een veld 'type' dat
ofwel "disturbance" (ongeplande verstoring) ofwel "planned" (geplande werken)
is. We tellen ENKEL de ongeplande verstoringen — geplande werken zijn
aangekondigd en veroorzaken weinig acute stress.

Hogere waarde = meer ongeplande verstoringen = meer reizigersstress.

iRail vereist een herkenbare User-Agent (fair-use policy).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

URL = "https://api.irail.be/disturbances/?format=json&lang=nl"
USER_AGENT = "SBI-barometer/0.2 (publieke stress-indicator; contact peter@hoogland.be)"


def _count_unplanned(body: dict) -> int | None:
    """Tel de ongeplande verstoringen in een iRail-disturbances-respons."""
    items = body.get("disturbance")
    if items is None:
        return None
    if not isinstance(items, list):
        return None
    unplanned = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        # iRail markeert geplande werken met type "planned"; ongeplande
        # verstoringen met type "disturbance". Onbekende/ontbrekende type
        # tellen we mee als verstoring (conservatief).
        dtype = str(item.get("type", "")).strip().lower()
        if dtype == "planned":
            continue
        unplanned += 1
    return unplanned


def fetch_train_disruptions(target_date: date) -> FetchResult:
    """Aantal ongeplande spoorverstoringen op het Belgische net (I-D2-009)."""
    ok, body = safe_request(URL, timeout=20, headers={"User-Agent": USER_AGENT})

    if ok and isinstance(body, dict):
        count = _count_unplanned(body)
        if count is not None:
            source = f"iRail API (NMBS/SNCB-verstoringen, {count} ongepland)"
            cache_put("I-D2-009", float(count), source, target_date.isoformat())
            return FetchResult(
                "I-D2-009", float(count), target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d) voordat we naar mock vallen
    cached = cache_get("I-D2-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D2-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock met eerlijke vlag. Basislijn ~6 verstoringen,
    # licht seizoens-gemoduleerd (winter/herfst iets hoger door weer).
    value = max(0.0, round(seasonal_noise(target_date, 6, 3, 3, 1.57)))
    return FetchResult(
        "I-D2-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (iRail onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
        error=body if not ok else None,
    )
```

## `app/pipeline/pipeline/fetchers/irceline.py`

```python
"""
Luchtkwaliteit-fetcher.
Doc 03_Laag-4 §2.1: I-D1-004 — PM2.5, O₃, NO₂ ratio tov WHO 2021.

Bron: Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api).
Open en gratis, geen token, geen registratie. Open-Meteo aggregeert publieke
luchtkwaliteits-data van europese meetnetten (CAMS, EEA), inclusief Brussel/BE.

Composite_AQ = max(PM25/15, O3/100, NO2/25) — ratio tov WHO 2021 grenswaarden.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=50.85&longitude=4.35"
    "&hourly=pm2_5,ozone,nitrogen_dioxide"
    "&timezone=Europe%2FBrussels&forecast_days=1"
)

# WHO 2021 grenswaarden (μg/m³)
WHO_PM25 = 15.0   # 24-hour mean
WHO_O3 = 100.0    # 8-hour daily max
WHO_NO2 = 25.0    # 24-hour mean


def _safe_mean(xs):
    vals = [x for x in xs if isinstance(x, (int, float))]
    return sum(vals) / len(vals) if vals else None


def _safe_max(xs):
    vals = [x for x in xs if isinstance(x, (int, float))]
    return max(vals) if vals else None


def fetch_air_quality(target_date: date) -> FetchResult:
    ok, body = safe_request(URL, timeout=20)
    if ok and isinstance(body, dict):
        try:
            hourly = body.get("hourly", {})
            pm25 = _safe_mean(hourly.get("pm2_5", []))
            o3 = _safe_max(hourly.get("ozone", []))
            no2 = _safe_mean(hourly.get("nitrogen_dioxide", []))
            ratios = []
            if pm25 is not None: ratios.append(pm25 / WHO_PM25)
            if o3 is not None:   ratios.append(o3 / WHO_O3)
            if no2 is not None:  ratios.append(no2 / WHO_NO2)
            if ratios:
                composite_aq = max(ratios)
                return FetchResult(
                    "I-D1-004", composite_aq, target_date.isoformat(),
                    simulated=False, source="Open-Meteo Air Quality (CAMS, EEA-data)",
                )
        except (KeyError, TypeError):
            pass
    ratio = max(0.0, seasonal_noise(target_date, 0.8, 0.3, 0.2, 0.0))
    return FetchResult(
        "I-D1-004", ratio, target_date.isoformat(),
        simulated=True, source="mock (Open-Meteo Air Quality endpoint faalde)",
    )
```

## `app/pipeline/pipeline/fetchers/kmi.py`

```python
"""
KMI/RMI weer-data fetcher.
Doc 03_Laag-4 §2.1: I-D1-002 Hitte, I-D1-003 Kou.

Bron: open-meteo.com — gratis proxy voor Belgisch weer dat de KMI-data
voedt (geen API-key nodig). Vervangt directe KMI-toegang waar die
registratie vereist.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


def fetch_temperature_extremes(target_date: date) -> tuple[FetchResult, FetchResult]:
    """Haalt Tmax en Tmin op voor Brussel op een gegeven datum."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=50.85&longitude=4.35"
        f"&daily=temperature_2m_max,temperature_2m_min"
        f"&start_date={target_date.isoformat()}&end_date={target_date.isoformat()}"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url)

    if ok and isinstance(body, dict):
        try:
            tmax = body["daily"]["temperature_2m_max"][0]
            tmin = body["daily"]["temperature_2m_min"][0]
            # I-D1-002: continu Heat_excess = max(0, Tmax - 30) (doc 03 §2.1)
            heat = max(0.0, tmax - 30) if tmax is not None else seasonal_noise(target_date, 18, 10, 4, -1.57)
            # I-D1-003: continu Cold_excess = max(0, -5 - Tmin)
            cold = max(0.0, -5 - tmin) if tmin is not None else seasonal_noise(target_date, 5, 8, 3, 0)
            return (
                FetchResult("I-D1-002", heat, target_date.isoformat(), simulated=False,
                            source="open-meteo (KMI proxy)"),
                FetchResult("I-D1-003", cold, target_date.isoformat(), simulated=False,
                            source="open-meteo (KMI proxy)"),
            )
        except (KeyError, IndexError, TypeError):
            pass

    # Fallback: synthetische seizoens-gemoduleerde waarde
    return (
        FetchResult("I-D1-002", max(0, seasonal_noise(target_date, 5, 8, 3, -1.57)),
                    target_date.isoformat(), simulated=True, source="mock (KMI fallback)",
                    error=body if not ok else None),
        FetchResult("I-D1-003", max(0, seasonal_noise(target_date, 3, 5, 2, 1.57)),
                    target_date.isoformat(), simulated=True, source="mock (KMI fallback)"),
    )
```

## `app/pipeline/pipeline/fetchers/layoff_radar.py`

```python
"""
Ontslag-radar (I-D3-003S) — SECUNDAIR signaal.
Doc 02 §10 (secundaire signalen, niet in de composiet).

WAAROM SECUNDAIR
----------------
De primaire ontslag-indicator I-D3-003 draait op de ECB-LFSI-werkloosheids-
delta: een echte officiele bron met een echte, schaal-consistente baseline,
maar met ~2 maanden vertraging.

Collectieve ontslagen worden echter onmiddellijk publiek zodra een bedrijf
ze aankondigt. Deze radar telt elke dag hoeveel Belgische nieuwsartikels
een collectief-ontslag-thema bevatten. Dat is een verse, real-time lezing,
maar zonder een lange eigen historie heeft ze geen betrouwbare meetlat.
Daarom rapporteren we ze als SECUNDAIR signaal (zoals de Reddit-peiling):
zichtbaar en actueel, maar buiten de composiet en de Z-scoring.

Methode: trefwoord-detectie over dezelfde RSS-corpus die de nieuwstoon-
controle gebruikt. Eerlijk over de beperking: trefwoord-tellen overschat
bij veel duiding rond één gebeurtenis. Het is een attentie-radar, geen
banentelling.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request
from ..cache import get as cache_get, put as cache_put
from .gdelt import RSS_FEEDS, _parse_rss_texts

# Trefwoorden voor collectief-ontslag-/herstructurerings-nieuws.
LAYOFF_TERMS = [
    "collectief ontslag", "collectieve ontslag", "naakte ontslag",
    "herstructurering", "herstructureren", "intentie tot ontslag",
    "wet renault", "banenverlies", "banen verlies", "jobs op de tocht",
    "ontslagronde", "ontslagen vallen", "afslanking", "afdanking",
    "bedrijf sluit", "sluiting van", "faillissement", "failliet",
    "saneringsplan", "herstructureringsplan",
]
# Aantal-banen-detectie ("400 jobs", "1.200 banen")
_JOBS_RE = re.compile(r"(\d[\d.]{1,6})\s*(?:jobs|banen|werknemers|jobverlies)", re.IGNORECASE)


def _matches(text: str) -> bool:
    low = text.lower()
    return any(term in low for term in LAYOFF_TERMS)


def fetch_layoff_radar(target_date: date) -> FetchResult:
    """SECUNDAIR I-D3-003S: telt collectief-ontslag-artikels in de BE-pers."""
    hit_articles = 0
    job_total = 0
    feeds_ok = 0
    for url, _key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        feeds_ok += 1
        for text in _parse_rss_texts(body):
            if _matches(text):
                hit_articles += 1
                for m in _JOBS_RE.finditer(text):
                    try:
                        job_total += int(m.group(1).replace(".", ""))
                    except ValueError:
                        pass

    if feeds_ok >= 4:
        jobs_note = f", ~{job_total} expliciet genoemde jobs" if job_total else ""
        source = (
            f"Ontslag-radar: {hit_articles} artikels met collectief-ontslag-thema "
            f"in {feeds_ok} BE-nieuwsbronnen{jobs_note}; SECUNDAIR, "
            f"trefwoord-detectie, niet in composiet"
        )
        cache_put("I-D3-003S", float(hit_articles), source, target_date.isoformat())
        return FetchResult(
            "I-D3-003S", float(hit_articles), target_date.isoformat(),
            simulated=False, source=source, observation_date=target_date.isoformat(),
        )

    # Cache-fallback
    cached = cache_get("I-D3-003S")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-003S", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    return FetchResult(
        "I-D3-003S", 0.0, target_date.isoformat(),
        simulated=True, source="mock (RSS-feeds onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
```

## `app/pipeline/pipeline/fetchers/nbb.py`

```python
"""
Nationale Bank België — hypotheekrente.
Doc 03_Laag-4 §2.3: I-D3-006.

We halen de hypotheekrente via de ECB MIR-dataset (Monetary financial Institutions
Interest Rates). ECB krijgt deze data van de nationale centrale banken inclusief
NBB. De ECB SDW JSON-API is open, geen token nodig.

Key voor BE woonkredieten:
  M = monthly, BE = Belgium, B = MFI sector,
  A2C = Lending to households for house purchase, A = total,
  R = annualised agreed rate, A = new business
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest_with_period


ECB_MORTGAGE_URL = (
    "https://data-api.ecb.europa.eu/service/data/MIR/M.BE.B.A2C.A.R.A.2250.EUR.N"
    "?format=jsondata&lastNObservations=1"
)


def fetch_mortgage_rate(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_MORTGAGE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-006", val, target_date.isoformat(),
                simulated=False, source="ECB MIR (BE hypotheekrente, nieuwe contracten)",
                observation_date=period,
            )
    value = 3.4 + seasonal_noise(target_date, 0, 0, 0.15, 0.0)
    return FetchResult(
        "I-D3-006", value, target_date.isoformat(),
        simulated=True, source="mock (ECB MIR endpoint faalde)",
    )
```

## `app/pipeline/pipeline/fetchers/pollen.py`

```python
"""
Pollen-fetcher — totale pollenbelasting boven Brussel.
Doc 03_Laag-4: I-D1-010 — pollenbelasting (domein D1 fysieke leefomgeving).

Bron: Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api).
Open en gratis, geen token. Open-Meteo levert de pollen-velden uit CAMS
(Copernicus Atmosphere Monitoring Service), het Europese referentiemodel
voor pollen-verspreiding.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).

Pollensoorten (korrels/m³): alder_pollen (els), birch_pollen (berk),
grass_pollen (gras), mugwort_pollen (bijvoet), ragweed_pollen (ambrosia).

Waarde = totale pollenbelasting = som van de vijf pollensoorten, gemiddeld
over de recentste beschikbare dag. Hogere waarde = meer pollen in de lucht =
meer hooikoorts-/allergiestress.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

POLLEN_SPECIES = [
    "alder_pollen",
    "birch_pollen",
    "grass_pollen",
    "mugwort_pollen",
    "ragweed_pollen",
]

URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=50.85&longitude=4.35"
    f"&hourly={','.join(POLLEN_SPECIES)}"
    "&timezone=Europe%2FBrussels&forecast_days=1"
)


def _day_mean(values: list) -> float | None:
    """Daggemiddelde van één pollensoort over de uurwaarden (None negeren)."""
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return None
    return sum(nums) / len(nums)


def fetch_pollen(target_date: date) -> FetchResult:
    """Totale pollenbelasting boven Brussel (I-D1-010)."""
    ok, body = safe_request(URL, timeout=20)

    if ok and isinstance(body, dict):
        hourly = body.get("hourly")
        if isinstance(hourly, dict):
            total = 0.0
            covered = 0
            for species in POLLEN_SPECIES:
                mean = _day_mean(hourly.get(species, []) or [])
                if mean is not None:
                    total += mean
                    covered += 1
            # Open-Meteo levert pollen enkel binnen het CAMS-domein (Europa);
            # buiten het seizoen kunnen waarden 0 zijn — dat is een geldige 0,
            # geen ontbrekende data. We accepteren zodra ≥1 soort data gaf.
            if covered > 0:
                source = (
                    f"Open-Meteo Air Quality (CAMS-pollen, {covered}/"
                    f"{len(POLLEN_SPECIES)} soorten; som korrels/m³)"
                )
                cache_put("I-D1-010", total, source, target_date.isoformat())
                return FetchResult(
                    "I-D1-010", total, target_date.isoformat(),
                    simulated=False, source=source,
                    observation_date=target_date.isoformat(),
                )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D1-010")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D1-010", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock. Pollen piekt in de lente (els/berk maart-april,
    # gras mei-juli); fase zo gekozen dat de piek rond april-mei valt.
    value = max(0.0, seasonal_noise(target_date, 35, 60, 20, -1.0))
    return FetchResult(
        "I-D1-010", value, target_date.isoformat(),
        simulated=True,
        source="mock (Open-Meteo pollen onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
    )
```

## `app/pipeline/pipeline/fetchers/reddit.py`

```python
"""
Reddit-sentiment — SECUNDAIRE indicator I-D5-006S.

⚠ METHODOLOGISCHE STATUS — LEES DIT
-----------------------------------
Deze indicator zit BEWUST NIET in het primaire SBI-composiet.

Doc 02 §8 sluit sociale-media-sentiment expliciet uit als primaire bron
(criterium 3: publieke beschikbaarheid + representativiteit). Reddit-gebruikers
zijn GEEN doorsnede van de Belgische bevolking — het is een jongere, vaak
hoger-opgeleide, stedelijke, deels Engelstalige niche.

Daarom is dit een SECUNDAIRE / sensitiviteits-indicator (vergelijk doc 02 §10
secundaire set). Hij wordt apart getoond, expliciet gelabeld als
"niet-representatieve onderstroom-peiling", en draagt NIET bij aan het
stress-cijfer 1-5 of aan banner-activatie.

METHODE
-------
Zelfde lexicon-gebaseerde toon-analyse als de mainstream nieuwsindicator
(Young & Soroka 2012): per post (titel + tekst) de toon
(pos - neg) / woorden × 100, gemiddeld over alle posts.

BRON
----
Reddit publieke JSON-endpoints van Belgische subreddits:
  r/belgium    — algemeen, gemengd NL/FR/EN
  r/Vlaanderen — Nederlandstalig

Reddit vereist een herkenbare User-Agent. Lage frequentie (1×/dag),
read-only, publieke data.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text

SUBREDDITS = ["belgium", "Vlaanderen"]
USER_AGENT = "SBI-barometer/0.2 (publieke sensitiviteits-indicator; contact peter@hoogland.be)"


def _fetch_subreddit_posts(sub: str) -> list[str]:
    """Haal titels + selftext van de nieuwste posts uit één subreddit."""
    url = f"https://www.reddit.com/r/{sub}/new.json?limit=100&raw_json=1"
    ok, body = safe_request(url, timeout=20, headers={"User-Agent": USER_AGENT})
    if not ok or not isinstance(body, dict):
        return []
    texts: list[str] = []
    try:
        for child in body.get("data", {}).get("children", []):
            d = child.get("data", {})
            title = d.get("title", "") or ""
            selftext = d.get("selftext", "") or ""
            combined = f"{title} {selftext}".strip()
            if combined:
                texts.append(combined)
    except (AttributeError, TypeError):
        return []
    return texts


def fetch_reddit_sentiment(target_date: date) -> FetchResult:
    all_tones: list[float] = []
    reachable = False
    posts_total = 0
    for sub in SUBREDDITS:
        posts = _fetch_subreddit_posts(sub)
        if posts:
            reachable = True
            posts_total += len(posts)
            for text in posts:
                result = tone_of_text(text)
                if result is not None:
                    all_tones.append(result[0])

    if reachable and all_tones:
        mean_tone = sum(all_tones) / len(all_tones)
        negativity = -mean_tone
        source = (f"Reddit r/belgium + r/Vlaanderen, {posts_total} posts, "
                  f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}); "
                  f"SECUNDAIR, niet-representatief, niet in composiet")
        cache_put("I-D5-006S", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-006S", negativity, target_date.isoformat(),
            simulated=False, source=source,
            observation_date=target_date.isoformat(),
        )

    # Reddit blokkeert datacenter-IP's regelmatig — val terug op cache (≤14d)
    cached = cache_get("I-D5-006S")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-006S", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock met eerlijke vlag
    value = seasonal_noise(target_date, 1.0, 1.0, 2.0, 0.0)
    return FetchResult(
        "I-D5-006S", value, target_date.isoformat(),
        simulated=True,
        source="mock (Reddit onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
    )
```

## `app/pipeline/pipeline/fetchers/statbel.py`

```python
"""
STATBEL/Eurostat/ECB fetcher voor CPI (consumptieprijsindex) en werkloosheid.
Doc 03_Laag-4 §2.3: I-D3-001 CPI inflatie yoy %, I-D3-005 werkloosheid %.

We gebruiken de gestandardiseerde Europese bronnen omdat ze direct
JSON-toegankelijk zijn zonder view-ID-discovery:
- **ECB Statistical Data Warehouse** voor BE HICP (geharmoniseerde inflatie)
- **Eurostat** voor BE werkloosheid

Beide leveren maandelijkse data — in de wekelijkse SBI wordt forward-fill
toegepast (doc 03 §3.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


# ECB SDW dataset: ICP (Indices of Consumer Prices), key voor BE HICP yoy:
#   M = monthly, BE = Belgium, N = neither working day nor seasonally adjusted,
#   000000 = overall index, 4 = ANR (Annual Rate of change), ANR confirms type
ECB_CPI_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.000000.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

# Eurostat unemployment rate, BE, total, percentage active population, seasonally adjusted
EUROSTAT_UE_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m"
    "?geo=BE&sex=T&age=TOTAL&unit=PC_ACT&s_adj=SA&format=JSON&lastTimePeriod=1"
)

# Fallback: ECB LFSI BE unemployment rate (bewezen stabiel)
ECB_UNEMPLOYMENT_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&lastNObservations=1"
)


def _parse_ecb_latest(body) -> float | None:
    """ECB SDW JSON-data format heeft genest series-pad. Pak de laatste observatie."""
    result = _parse_ecb_latest_with_period(body)
    return result[0] if result else None


def _parse_ecb_latest_with_period(body) -> tuple[float, str] | None:
    """Pak de laatste ECB-observatie + de periode (bv. '2026-04') waar ze naar verwijst."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        latest_key = max(observations.keys(), key=lambda k: int(k))
        value = float(observations[latest_key][0])
        # Periode uit structure.dimensions.observation
        period = ""
        try:
            obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
            period = obs_dim[int(latest_key)]["id"]
        except (KeyError, IndexError, ValueError, TypeError):
            period = ""
        return value, period
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None


def _parse_eurostat_latest(body) -> tuple[float, str] | None:
    """Eurostat JSON-stat: laatste waarde + bijhorende tijdsperiode."""
    try:
        values = body.get("value", {})
        if not values:
            return None
        last_idx = max(values.keys(), key=lambda k: int(k))
        value = float(values[last_idx])
        # Periode uit dimension.time.category.index/label
        period = ""
        try:
            time_cat = body["dimension"]["time"]["category"]
            index_map = time_cat["index"]
            # vind het label waarvan de index gelijk is aan last_idx
            for label, idx in index_map.items():
                if int(idx) == int(last_idx):
                    period = label
                    break
        except (KeyError, ValueError, TypeError):
            period = ""
        return value, period
    except (KeyError, ValueError, TypeError):
        return None


def fetch_cpi(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_CPI_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-001", val, target_date.isoformat(),
                simulated=False, source="ECB SDW (BE HICP yoy %)",
                observation_date=period,
            )
    value = 2.5 + seasonal_noise(target_date, 0, 0.5, 0.4, 0.0) / 2
    return FetchResult(
        "I-D3-001", value, target_date.isoformat(),
        simulated=True, source="mock (ECB SDW endpoint faalde)",
    )


def fetch_unemployment(target_date: date) -> FetchResult:
    # Primair: ECB LFSI (zelfde ECB-infrastructuur als ons hypotheek/ontslagen-pad)
    ok, body = safe_request(ECB_UNEMPLOYMENT_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source="ECB LFSI (BE werkloosheidsrate, seizoens-gecorrigeerd)",
                observation_date=period,
            )

    # Fallback: Eurostat
    ok, body = safe_request(EUROSTAT_UE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_eurostat_latest(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source="Eurostat (BE werkloosheid, seizoens-gecorrigeerd)",
                observation_date=period,
            )

    value = 6.2 + seasonal_noise(target_date, 0, 0, 0.3, 0.0)
    return FetchResult(
        "I-D3-005", value, target_date.isoformat(),
        simulated=True, source="mock (ECB + Eurostat beide faalden)",
    )
```

## `app/pipeline/pipeline/fetchers/verkeerscentrum.py`

```python
"""
Vlaams Verkeerscentrum — live filedruk via scraping van de filebarometer-widget.
Doc 03_Laag-4 §2.2: I-D2-001 Filezwaarte.

Implementation: het Verkeerscentrum publiceert geen open API maar toont op
hun publieke homepage een "filebarometer" met het huidige aantal km file.
We parsen dat getal uit de HTML.

Eerlijke beperking: filebarometer = momentane km file, niet "file-km × file-min"
zoals doc 03 §2.1 voorschrijft. Dit is een **proxy** voor F_total, want de
publieke widget rapporteert geen tijds-integraal. Update wanneer een betere
bron beschikbaar komt.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


HOMEPAGE_URL = "https://www.verkeerscentrum.be"
# Pattern matcht "filebarometer">5,40 km   (waarde varieert in scheidingsteken)
FILE_PATTERN = re.compile(r'filebarometer">(\d+(?:[,.]\d+)?)\s*km', re.IGNORECASE)


def fetch_traffic_load(target_date: date) -> FetchResult:
    ok, body = safe_request(
        HOMEPAGE_URL,
        timeout=20,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if ok and isinstance(body, str):
        match = FILE_PATTERN.search(body)
        if match:
            km_str = match.group(1).replace(",", ".")
            try:
                km = float(km_str)
                # Schaal naar km·min equivalent: huidige km × typische 60min spitsduur
                # Dit is een grove benadering — zie doc-string disclaimer.
                value = km * 60
                return FetchResult(
                    "I-D2-001", value, target_date.isoformat(),
                    simulated=False, source="Vlaams Verkeerscentrum (filebarometer scrape)",
                )
            except ValueError:
                pass

    # Mock fallback met weekdag-correctie
    weekday = target_date.weekday()
    is_weekday = 0 <= weekday <= 4
    base = 7500 if is_weekday else 1500
    value = max(0.0, base + seasonal_noise(target_date, 0, 1500, 1200, -0.5))
    return FetchResult(
        "I-D2-001", value, target_date.isoformat(),
        simulated=True, source="mock (Verkeerscentrum scrape faalde)",
    )
```

## `app/pipeline/pipeline/fetchers/waterinfo.py`

```python
"""
Wateroverlast-signaal (I-D1-009).
Doc 03_Laag-4: domein D1 (omgeving).

Bron: open-meteo Flood API (https://flood-api.open-meteo.com/), die de
GloFAS-rivierafvoer (Global Flood Awareness System, Copernicus/ECMWF)
ontsluit. Open, gratis, geen sleutel, betrouwbaar vanaf een server-IP,
en consistent met de andere open-meteo-bronnen in deze pipeline.

We meten de dagelijkse rivierafvoer (m³/s) op vier punten in grote
Belgische stroomgebieden en sommeren die tot één nationaal hoogwater-
signaal. Hogere afvoer = vollere rivieren = meer overstromingsdruk.
De Maas weegt het zwaarst, wat strookt met het reële risico: de
catastrofale overstromingen van 2021 lagen in het Maas/Vesdre-bekken.

Een eerdere versie probeerde de waterinfo.be KIWIS-API; die vergt het
vooraf opzoeken van station-tijdreeks-id's en bleek niet betrouwbaar
machine-leesbaar. De GloFAS-afvoer is een robuuste, wetenschappelijk
gangbare proxy voor overstromingsdruk.
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

# Vier punten in grote Belgische stroomgebieden (lat, lon).
RIVER_POINTS = [
    ("Maas/Luik", 50.63, 5.57),
    ("Schelde/Antwerpen", 51.22, 4.40),
    ("Dijle-Demer/Vlaams-Brabant", 50.88, 4.70),
    ("Leie/West-Vlaanderen", 50.83, 3.27),
]

FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"


def discharge_sum_series(start: date, end: date) -> list[tuple[str, float]]:
    """Som van de rivierafvoer over de vier punten per dag. Chronologisch.
    Wordt door zowel de dagfetcher als het backfill-script gebruikt."""
    lats = ",".join(str(lat) for _, lat, _ in RIVER_POINTS)
    lons = ",".join(str(lon) for _, _, lon in RIVER_POINTS)
    url = (
        f"{FLOOD_URL}?latitude={lats}&longitude={lons}"
        f"&daily=river_discharge"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
    )
    ok, body = safe_request(url, timeout=40, retries=2, retry_delay=3)
    if not ok:
        return []
    locations = body if isinstance(body, list) else [body]
    per_day: dict[str, float] = {}
    counts: dict[str, int] = {}
    for loc in locations:
        if not isinstance(loc, dict):
            continue
        daily = loc.get("daily", {})
        times = daily.get("time", [])
        vals = daily.get("river_discharge", [])
        for t, v in zip(times, vals):
            if isinstance(v, (int, float)):
                per_day[t] = per_day.get(t, 0.0) + float(v)
                counts[t] = counts.get(t, 0) + 1
    # alleen dagen waarop alle vier de punten data leverden
    return [
        (t, round(per_day[t], 2))
        for t in sorted(per_day)
        if counts.get(t) == len(RIVER_POINTS)
    ]


def fetch_flood_signal(target_date: date) -> FetchResult:
    series = discharge_sum_series(target_date - timedelta(days=10), target_date)
    if series:
        latest_date, value = series[-1]
        source = (
            "open-meteo Flood API (GloFAS-rivierafvoer, som van 4 Belgische "
            "stroomgebieden: Maas, Schelde, Dijle-Demer, Leie)"
        )
        cache_put("I-D1-009", value, source, latest_date)
        return FetchResult(
            "I-D1-009", value, target_date.isoformat(),
            simulated=False, source=source, observation_date=latest_date,
        )

    # Cache-fallback
    cached = cache_get("I-D1-009")
    if cached:
        cval, prev_source = cached
        return FetchResult(
            "I-D1-009", cval, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Mock
    value = max(0.0, 40.0 + seasonal_noise(target_date, 0.0, 18.0, 10.0, 0.0))
    return FetchResult(
        "I-D1-009", value, target_date.isoformat(),
        simulated=True, source="mock (open-meteo Flood API onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
```

## `app/pipeline/pipeline/fetchers/wikipedia.py`

```python
"""
Zoekinteresse-/aandachts-fetcher (I-D5-002) — Wikipedia-pageviews.
Doc 03_Laag-4 §2.6.

WAAROM WIKIPEDIA EN NIET MEER GOOGLE TRENDS
-------------------------------------------
Google Trends (pytrends) blokkeert server-IP's: vanaf GitHub Actions
draaide I-D5-002 permanent op cache-fallback, dus niet vers. De Wikimedia
Pageviews-API werkt wel betrouwbaar vanaf elk server-IP, heeft 11 jaar
historie, en levert absolute, reproduceerbare tellingen.

Wikipedia-pageviews zijn een gevestigde proxy voor publieke aandacht in
de digital-epidemiologie-literatuur (Generous et al. 2014; McIver &
Brownstein 2014; Mestyán et al. 2013).

METHODE
-------
We tellen de dagelijkse weergaven (agent=user, dus geen bots) van een
vaste set Nederlandstalige Wikipedia-artikels over stress-thema's, en delen
die door het TOTALE aantal NL-Wikipedia-weergaven van die dag. Dat geeft
een aandachts-index "per miljoen weergaven": hij is drift-gecorrigeerd —
alleen de RELATIEVE interesse in stress-thema's beweegt hem, niet de
algemene groei of krimp van Wikipedia-verkeer. Daarna nemen we het
voortschrijdend 7-daags gemiddelde, wat het weekdag-effect verwijdert.

Pre-registratie-amendement: I-D5-002 was gespecificeerd als Google-Trends-
index 0-100. Deze wijziging is gedocumenteerd en gemotiveerd door de
server-IP-blokkade; de meting blijft conceptueel "publieke aandachts-
interesse in stress-thema's".
"""
from __future__ import annotations
from datetime import date, timedelta
from urllib.parse import quote
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

WIKI_UA = "LHA-SBI-barometer/1.0 (https://les-hautes-alpes-sbi.surge.sh; peter@hoogland.be)"
_REST = "https://wikimedia.org/api/rest_v1/metrics/pageviews"
WIKI_ARTICLE_BASE = f"{_REST}/per-article/nl.wikipedia/all-access/user"
WIKI_AGG_BASE = f"{_REST}/aggregate/nl.wikipedia/all-access/user"

# Geverifieerde NL-Wikipedia-artikeltitels over stress-thema's.
STRESS_ARTICLES = [
    "Stress",
    "Burn-out",
    "Depressie_(klinisch)",
    "Angststoornis",
    "Overspannenheid",
    "Slapeloosheid",
]


def _ts_to_iso(ts: str) -> str | None:
    ts = str(ts)
    if len(ts) < 8:
        return None
    return f"{ts[0:4]}-{ts[4:6]}-{ts[6:8]}"


def _article_daily(article: str, start: date, end: date) -> dict[str, int]:
    """Dagelijkse weergaven voor één artikel: {YYYY-MM-DD: views}."""
    url = (
        f"{WIKI_ARTICLE_BASE}/{quote(article, safe='')}/daily/"
        f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}"
    )
    ok, body = safe_request(
        url, timeout=30, retries=2, retry_delay=3,
        headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return {}
    out: dict[str, int] = {}
    for it in body.get("items", []):
        iso = _ts_to_iso(it.get("timestamp", ""))
        if iso is None:
            continue
        try:
            out[iso] = int(it.get("views", 0))
        except (ValueError, TypeError):
            continue
    return out


def _aggregate_daily(start: date, end: date) -> dict[str, int]:
    """Totale NL-Wikipedia-weergaven per dag: {YYYY-MM-DD: views}."""
    url = (
        f"{WIKI_AGG_BASE}/daily/"
        f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}"
    )
    ok, body = safe_request(
        url, timeout=30, retries=2, retry_delay=3,
        headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return {}
    out: dict[str, int] = {}
    for it in body.get("items", []):
        iso = _ts_to_iso(it.get("timestamp", ""))
        if iso is None:
            continue
        try:
            out[iso] = int(it.get("views", 0))
        except (ValueError, TypeError):
            continue
    return out


def daily_attention_index(start: date, end: date) -> list[tuple[str, float]]:
    """Per dag: (som stress-artikel-weergaven / totale NL-weergaven) x 1e6.
    Chronologisch. Drift-gecorrigeerd aandachts-aandeel."""
    stress: dict[str, int] = {}
    for art in STRESS_ARTICLES:
        for iso, views in _article_daily(art, start, end).items():
            stress[iso] = stress.get(iso, 0) + views
    total = _aggregate_daily(start, end)
    out: list[tuple[str, float]] = []
    for iso in sorted(stress):
        t = total.get(iso)
        if t and t > 0:
            out.append((iso, round(stress[iso] / t * 1_000_000, 3)))
    return out


def trailing_mean_series(
    series: list[tuple[str, float]], window: int = 7,
) -> list[dict]:
    """Voortschrijdend gemiddelde — verwijdert het weekdag-effect."""
    out: list[dict] = []
    for i in range(len(series)):
        lo = max(0, i - window + 1)
        seg = [v for _, v in series[lo:i + 1]]
        out.append({"date": series[i][0], "value": round(sum(seg) / len(seg), 3)})
    return out


def fetch_stress_searches(target_date: date) -> FetchResult:
    # Ruim venster zodat het 7d-gemiddelde een volledig venster heeft.
    start = target_date - timedelta(days=21)
    series = daily_attention_index(start, target_date)
    if len(series) >= 7:
        smoothed = trailing_mean_series(series, window=7)
        latest = smoothed[-1]
        source = (
            f"Wikipedia-pageviews (nl.wikipedia, {len(STRESS_ARTICLES)} stress-artikels "
            f"/ totale NL-weergaven x1e6, agent=user, voortschrijdend 7d-gemiddelde)"
        )
        cache_put("I-D5-002", latest["value"], source, latest["date"])
        return FetchResult(
            "I-D5-002", latest["value"], target_date.isoformat(),
            simulated=False, source=source, observation_date=latest["date"],
        )

    # Cache
    cached = cache_get("I-D5-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-002", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # Mock
    value = seasonal_noise(target_date, 28, 6, 5, 0.0)
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (Wikipedia + cache leeg)",
    )
```

## `app/pipeline/pipeline/lexicon_nl.py`

```python
"""
Nederlands valentie-lexicon voor nieuwstoon-analyse.

METHODE
-------
Lexicon-gebaseerde valentie-analyse, de standaardmethode in computationele
sociale wetenschap voor het coderen van nieuwstoon:

  - Young, L. & Soroka, S. (2012). "Affective News: The Automated Coding of
    Sentiment in Political Texts." Political Communication, 29(2), 205-231.
    → de Lexicoder Sentiment Dictionary-methode.
  - Soroka, S., Fournier, P. & Nir, L. (2019). "Cross-national evidence of a
    negativity bias in psychophysiological reactions to news." PNAS 116(38).
    → reeds in doc 02 §8 als onderbouwing van indicator I-D5-001.
  - Leetaru, K. (2013). GDELT Global Knowledge Graph — V2Tone gebruikt
    dezelfde familie van lexicon-gebaseerde toonmeting.

TOON-FORMULE (per artikel, dan gemiddeld over alle artikels):
    tone_article = (pos_count - neg_count) / total_words * 100
    negativity   = -mean(tone_article)

EERLIJKE BEPERKING
------------------
Dit is een gecompileerd lexicon, geen formeel gevalideerd Nederlands
sentiment-woordenboek. De target-state-upgrade is integratie van een
peer-reviewed NL-lexicon (De Smedt & Daelemans 2012, "Pattern", JMLR;
of het NRC Emotion Lexicon, Mohammad & Turney 2013). Tot dan is dit een
transparante, reproduceerbare benadering met expliciete woordenlijst.
Doc 02 §8 erkent reeds dat tone-analyse-validiteit tussen taalgebieden
varieert (Boydstun et al. 2014).
"""
from __future__ import annotations

# Negatieve valentie — nieuws-relevante vocabulaire (crisis, conflict,
# schade, achteruitgang, angst). Stammen + courante varianten.
NEGATIVE = {
    # dood / slachtoffers
    "dood", "doden", "dode", "sterft", "stierf", "gestorven", "overleden",
    "overlijden", "omgekomen", "slachtoffer", "slachtoffers", "fataal",
    "dodelijk", "gewond", "gewonden", "verwond",
    # ramp / catastrofe
    "ramp", "rampen", "rampzalig", "tragedie", "tragisch", "drama",
    "dramatisch", "catastrofe", "catastrofaal", "noodtoestand", "noodweer",
    # geweld / terreur / oorlog
    "aanslag", "aanslagen", "aanval", "aanvallen", "terreur", "terrorist",
    "terroristisch", "geweld", "gewelddadig", "oorlog", "oorlogen",
    "conflict", "conflicten", "gevecht", "strijd", "moord", "vermoord",
    "doodgeschoten", "neergeschoten", "ontvoerd", "ontvoering", "vermist",
    "gijzeling", "explosie", "ontploffing", "bom",
    # brand / natuur
    "brand", "branden", "vuur", "instorting", "ingestort", "instortte",
    "overstroming", "storm", "hittegolf", "droogte", "aardbeving",
    # economie / werk
    "ontslag", "ontslagen", "ontslaat", "afdanking", "afdankingen",
    "faillissement", "failliet", "sluiting", "sluit", "schuld", "schulden",
    "verlies", "verliezen", "verloren", "daling", "gedaald", "dalen",
    "kelderen", "gekelderd", "inzinking", "recessie", "krimp", "krimpt",
    "duurder", "prijsstijging", "armoede", "arm", "honger", "tekort",
    "tekorten", "besparingen", "saneren",
    # sociaal / onrust
    "staking", "stakingen", "staken", "protest", "protesten", "betoging",
    "rel", "rellen", "onrust", "chaos", "paniek",
    # emotie / gezondheid
    "angst", "bang", "vrees", "vrezen", "bezorgd", "bezorgdheid", "zorgen",
    "woede", "boos", "kwaad", "frustratie", "verdriet", "pijn", "lijden",
    "ziek", "ziekte", "besmetting", "virus", "epidemie", "pandemie",
    # dreiging / gevaar
    "dreiging", "bedreiging", "bedreigd", "gevaar", "gevaarlijk", "risico",
    "alarm", "alarmerend", "waarschuwing", "schok", "geschokt",
    # misdaad / schandaal
    "schandaal", "fraude", "corruptie", "misdaad", "crimineel", "diefstal",
    "inbraak", "agressie", "mishandeling",
    # algemeen negatief
    "slecht", "slechter", "slechtste", "fout", "fouten", "mislukt",
    "mislukking", "falen", "gefaald", "probleem", "problemen", "moeilijk",
    "zwaar", "kritiek", "bekritiseerd", "klacht", "klachten", "boete",
    "straf", "veroordeeld", "ruzie", "spanning", "spanningen", "breuk",
    "eenzaam", "eenzaamheid", "depressie", "somber", "wanhoop", "hopeloos",
    "verontrustend", "zorgwekkend", "ernstig", "verslechtering",
}

# Positieve valentie
POSITIVE = {
    # succes / prestatie
    "succes", "succesvol", "gelukt", "geslaagd", "akkoord", "overeenkomst",
    "deal", "oplossing", "opgelost", "doorbraak", "prestatie", "presteren",
    "record", "kampioen", "winst", "gewonnen", "won", "zege", "overwinning",
    # vrede / hulp / herstel
    "vrede", "vreedzaam", "hulp", "geholpen", "helpen", "steun", "gesteund",
    "steunt", "redding", "gered", "redt", "herstel", "hersteld", "herstellen",
    "veerkracht", "solidariteit",
    # groei / vooruitgang
    "groei", "gegroeid", "groeit", "bloei", "bloeiend", "vooruitgang",
    "verbetering", "verbeterd", "verbetert", "ontwikkeling", "innovatie",
    "investering", "investeert", "opening", "geopend", "nieuw", "vernieuwd",
    "stijging", "gestegen", "toename", "voorspoed", "welvaart",
    # emotie / positief
    "beter", "best", "beste", "blij", "vrolijk", "gelukkig", "geluk",
    "tevreden", "trots", "viert", "gevierd", "feest", "viering", "applaus",
    "geprezen", "lof", "dankbaar", "dank", "hoop", "hoopvol", "optimisme",
    "optimistisch", "vertrouwen",
    # kwaliteit
    "mooi", "prachtig", "schitterend", "geweldig", "fantastisch",
    "uitstekend", "knap", "sterk", "sterker", "krachtig", "gezond",
    "veilig", "veiligheid", "bescherming", "beschermd",
    # verbinding
    "vrij", "vrijheid", "samen", "samenwerking", "verbonden", "vriendschap",
    "liefde", "warmte", "genereus", "vrijgevig", "gul", "kans", "kansen",
    "duurzaam", "groen", "schoon", "talent", "gewaardeerd", "eerlijk",
    "rust", "kalm", "stabiel", "stabiliteit",
}

LEXICON_VERSION = "nl-valence-0.1"
LEXICON_SIZE = len(NEGATIVE) + len(POSITIVE)

_PUNCT = ".,;:!?\"'()[]«»–-…*#>"


def tone_of_text(text: str, min_words: int = 3) -> tuple[float, int] | None:
    """Toon van één tekst-eenheid (artikel, post) volgens Young & Soroka 2012:
        tone = (pos - neg) / totaal_woorden × 100
    Return (tone, n_words), of None wanneer de tekst te kort is."""
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    words = [w for w in words if w]
    n = len(words)
    if n < min_words:
        return None
    pos = sum(1 for w in words if w in POSITIVE)
    neg = sum(1 for w in words if w in NEGATIVE)
    return (pos - neg) / n * 100, n
```

## `app/pipeline/pipeline/media_profiles.py`

```python
"""
Media-publieksprofielen — bron-niveau poststratificatie.

HET PRINCIPE
------------
Een gescrapet nieuwsartikel draagt geen demografisch label. Maar het MEDIUM
waar het uit komt wel: elke krant, zender en site heeft een gedocumenteerd
lezersprofiel. Door per bron de toon te meten en die te wegen naar het
bekende publiek van die bron, krijg je een demografisch gebalanceerd signaal
zonder dat je de auteur van elke post hoeft te kennen.

Dit is bron-niveau poststratificatie — de haalbare variant van MRP wanneer je
publieke data scrapet in plaats van een panel te bevragen.

METHODE
-------
1. Per bron meten we de nieuwstoon (lexicon-methode, Young & Soroka 2012).
2. Per bron kennen we de leeftijdsverdeling van het publiek + het relatieve
   bereik (hoe groot de bron is).
3. Per bevolkingssegment berekenen we de "ervaren toon":
      toon_segment = Σ_bron (publiek[bron,segment] × bereik[bron] × toon[bron])
                     / Σ_bron (publiek[bron,segment] × bereik[bron])
4. Het nationale poststratified cijfer = Σ_segment (bevolkingsaandeel × toon_segment).

EERLIJKE BEPERKING
------------------
De publieksprofielen zijn ramingen op basis van publieke CIM-bereikcijfers,
Digimeter en mediakits — geen exacte panelmetingen. Drie leeftijdssegmenten
i.p.v. een volledige demografische celstructuur. Het is de transparante,
reproduceerbare benadering; een echt gevalideerd panel blijft de target-state.
"""
from __future__ import annotations

# Belgische volwassen bevolking (18+), grove Statbel-aandelen per segment.
POPULATION_SHARE = {
    "jong": 0.27,    # 18-34
    "midden": 0.32,  # 35-54
    "ouder": 0.41,   # 55+
}

# Per mediabron (schone sleutel): leeftijdsverdeling van het publiek
# [jong, midden, ouder] (telt op tot 1.0) + relatief bereik-gewicht.
# Ramingen op basis van CIM-bereik, Digimeter en mediakits.
MEDIA_PROFILES: dict[str, dict] = {
    "vrtnws":     {"name": "VRT NWS",                "reach": 9.0, "audience": {"jong": 0.22, "midden": 0.33, "ouder": 0.45}},
    "standaard":  {"name": "De Standaard",           "reach": 4.0, "audience": {"jong": 0.20, "midden": 0.38, "ouder": 0.42}},
    "demorgen":   {"name": "De Morgen",              "reach": 3.0, "audience": {"jong": 0.26, "midden": 0.40, "ouder": 0.34}},
    "hln":        {"name": "Het Laatste Nieuws",     "reach": 10.0, "audience": {"jong": 0.30, "midden": 0.34, "ouder": 0.36}},
    "tijd":       {"name": "De Tijd",                "reach": 3.0, "audience": {"jong": 0.22, "midden": 0.44, "ouder": 0.34}},
    "hbvl":       {"name": "Het Belang van Limburg", "reach": 4.0, "audience": {"jong": 0.20, "midden": 0.32, "ouder": 0.48}},
    "bruzz":      {"name": "Bruzz",                  "reach": 1.5, "audience": {"jong": 0.34, "midden": 0.38, "ouder": 0.28}},
    "knack":      {"name": "Knack",                  "reach": 2.5, "audience": {"jong": 0.18, "midden": 0.38, "ouder": 0.44}},
    "sporza":     {"name": "Sporza",                 "reach": 6.0, "audience": {"jong": 0.34, "midden": 0.36, "ouder": 0.30}},
    "trends":     {"name": "Trends",                 "reach": 2.0, "audience": {"jong": 0.22, "midden": 0.44, "ouder": 0.34}},
    "businessam": {"name": "Business AM",            "reach": 1.5, "audience": {"jong": 0.30, "midden": 0.42, "ouder": 0.28}},
    "eos":        {"name": "Eos",                    "reach": 1.0, "audience": {"jong": 0.30, "midden": 0.38, "ouder": 0.32}},
    "newsmonkey": {"name": "Newsmonkey",             "reach": 1.0, "audience": {"jong": 0.62, "midden": 0.26, "ouder": 0.12}},
    # Reddit — sterk jong/stedelijk skew (secundaire indicator)
    "reddit":     {"name": "Reddit Belgium",         "reach": 1.0, "audience": {"jong": 0.68, "midden": 0.26, "ouder": 0.06}},
}


def poststratify(source_tones: list[tuple[str, float]]) -> dict:
    """
    source_tones: lijst van (mediaprofiel-sleutel, toon) per bron.
    Return dict met:
      - national: poststratified nationale toon
      - segments: toon per leeftijdssegment
      - n_sources: aantal bronnen meegewogen
    """
    entries: list[tuple[dict, float]] = []
    for key, tone in source_tones:
        profile = MEDIA_PROFILES.get(key)
        if profile is not None:
            entries.append((profile, tone))

    if not entries:
        return {"national": None, "segments": {}, "n_sources": 0}

    segments: dict[str, float] = {}
    for seg in POPULATION_SHARE:
        num = 0.0
        den = 0.0
        for profile, tone in entries:
            w = profile["audience"][seg] * profile["reach"]
            num += w * tone
            den += w
        segments[seg] = num / den if den > 0 else 0.0

    national = sum(POPULATION_SHARE[seg] * segments[seg] for seg in POPULATION_SHARE)
    return {"national": national, "segments": segments, "n_sources": len(entries)}
```

## `app/pipeline/pipeline/run.py`

```python
"""
SBI Pipeline — hoofdorkestrator.
Doc 03_Laag-4 §5.3 stappen [1] EXTRACT en [2] VALIDATE.
De engine (TS) doet daarna [3]-[7] (transform → harmonize → decorrelate
→ aggregate → signal).

Run: python -m pipeline.run [--date YYYY-MM-DD] [--history-days N]
Output: app/data/raw-values.json
"""
from __future__ import annotations
import argparse
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

from .util import FetchBatch, DATA_DIR, write_json, daterange, iso
from .fetchers import kmi, irceline, verkeerscentrum, fod_economie, statbel, energy_charts, fod_waso, nbb, gdelt, wikipedia, events, reddit, layoff_radar, irail, elia, waterinfo, pollen


# Maximaal aantal punten dat we per indicator in de doorlopende historie houden
# (~3 jaar dagdata; voorkomt onbegrensd groeiende bestanden).
_HISTORY_CAP = 1100


def append_to_history(batch: FetchBatch) -> None:
    """Voeg de echte dagwaarden toe aan de doorlopende historie-bestanden in
    app/data/history/. Zo bouwt ELKE indicator over tijd een echte baseline op,
    ook indicatoren waarvoor geen historische API bestaat (verkeer, trein,
    gebeurtenissen). Backfill-snapshots worden er dagelijks mee bijgehouden.

    Gesimuleerde (mock) en ontbrekende waarden komen NIET in de echte historie.
    """
    hist_dir = DATA_DIR / "history"
    hist_dir.mkdir(parents=True, exist_ok=True)
    for r in batch.results:
        if r.simulated or r.value is None or not math.isfinite(r.value):
            continue
        # observatiedatum normaliseren naar YYYY-MM-DD (maandcijfers → dag 01)
        obs = (r.observation_date or batch.target_date).strip()
        if len(obs) == 7:
            obs = f"{obs}-01"
        if len(obs) != 10:
            obs = batch.target_date
        path = hist_dir / f"{r.code}.json"
        rows: list[dict] = []
        if path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    rows = loaded
            except (ValueError, OSError):
                rows = []
        rows = [row for row in rows if row.get("date") != obs]
        rows.append({"date": obs, "value": round(float(r.value), 4)})
        rows.sort(key=lambda x: str(x.get("date", "")))
        if len(rows) > _HISTORY_CAP:
            rows = rows[-_HISTORY_CAP:]
        path.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def fetch_one_day(d: date) -> FetchBatch:
    """Roept alle non-deterministische fetchers aan voor één dag."""
    batch = FetchBatch(target_date=iso(d))

    # D1 — Omgeving (Tier B: weer via open-meteo, Tier C: luchtkwaliteit mock)
    heat, cold = kmi.fetch_temperature_extremes(d)
    batch.add(heat)
    batch.add(cold)
    batch.add(irceline.fetch_air_quality(d))
    batch.add(waterinfo.fetch_flood_signal(d))
    batch.add(pollen.fetch_pollen(d))

    # D2 — Mobiliteit
    batch.add(verkeerscentrum.fetch_traffic_load(d))
    batch.add(fod_economie.fetch_fuel_prices(d))
    batch.add(irail.fetch_train_disruptions(d))

    # D3 — Economie
    batch.add(statbel.fetch_cpi(d))
    batch.add(energy_charts.fetch_energy_prices(d))
    batch.add(fod_waso.fetch_collective_layoffs(d))
    batch.add(statbel.fetch_unemployment(d))
    batch.add(nbb.fetch_mortgage_rate(d))
    batch.add(elia.fetch_grid_stress(d))

    # D5 — Media (D4 + D6 zijn deterministisch en worden in de engine berekend)
    batch.add(gdelt.fetch_news_negativity(d))
    batch.add(wikipedia.fetch_stress_searches(d))
    batch.add(events.fetch_collective_events(d))

    # Secundair — NIET in composiet (sensitiviteit, doc 02 §10)
    batch.add_secondary(reddit.fetch_reddit_sentiment(d))
    batch.add_secondary(layoff_radar.fetch_layoff_radar(d))

    return batch


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SBI Pipeline — fetch raw indicator values")
    parser.add_argument("--date", type=str, default=None,
                        help="Target date YYYY-MM-DD (default: today)")
    parser.add_argument("--history-days", type=int, default=0,
                        help="Aantal historische dagen ook fetchen (default: 0)")
    args = parser.parse_args(argv)

    target = date.fromisoformat(args.date) if args.date else date.today()
    start = target - timedelta(days=args.history_days)

    print(f"SBI Pipeline — fetch window {start} → {target}", file=sys.stderr)

    history: list[dict] = []
    today_batch: FetchBatch | None = None

    for d in daterange(start, target):
        print(f"  [{d}] fetching…", file=sys.stderr)
        batch = fetch_one_day(d)
        history.append(batch.to_dict())
        if d == target:
            today_batch = batch

    assert today_batch is not None

    write_json(DATA_DIR / "raw-values.json", today_batch.to_dict())
    if args.history_days > 0:
        write_json(DATA_DIR / "raw-history.json", history)

    # Doorlopende historie-opbouw: elke echte dagwaarde wordt bewaard zodat
    # iedere indicator over tijd tegen ECHTE historie gewogen wordt.
    append_to_history(today_batch)
    print(f"✓ historie bijgewerkt in {DATA_DIR / 'history'}", file=sys.stderr)

    sim = today_batch.simulated_codes
    print(f"✓ wrote {DATA_DIR / 'raw-values.json'}", file=sys.stderr)
    print(f"  simulated: {len(sim)}/{len(today_batch.results)} indicators", file=sys.stderr)
    if sim:
        print(f"  → {', '.join(sim)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/pipeline/util.py`

```python
"""Pipeline-helpers: datum-conversie, mock-data, output-writing."""
from __future__ import annotations
import json
import math
import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
WEB_PUBLIC = ROOT / "web" / "public" / "data"


@dataclass
class FetchResult:
    """Eén indicator-fetch, succes of mock-fallback."""
    code: str
    value: float
    date: str
    simulated: bool = False
    imputed: bool = False
    source: str = ""
    error: str | None = None
    # observation_date: de datum/periode waar de DATA naar verwijst.
    # Voor dagelijkse bronnen = de dag zelf (YYYY-MM-DD).
    # Voor maandelijkse bronnen (ECB) = de maand (YYYY-MM).
    # Wanneer een fetcher hem niet expliciet zet, valt hij terug op de fetch-datum.
    observation_date: str = ""

    def __post_init__(self) -> None:
        if not self.observation_date:
            self.observation_date = self.date


@dataclass
class FetchBatch:
    """Bundel van fetch-resultaten voor één datum.
    - results:   de 13 primaire (non-deterministische) indicatoren
    - secondary: secundaire/sensitiviteits-indicatoren die NIET in het
                 composiet meetellen (bv. Reddit-sentiment)
    """
    target_date: str
    results: list[FetchResult] = field(default_factory=list)
    secondary: list[FetchResult] = field(default_factory=list)

    def add(self, r: FetchResult) -> None:
        self.results.append(r)

    def add_secondary(self, r: FetchResult) -> None:
        self.secondary.append(r)

    @property
    def simulated_codes(self) -> list[str]:
        return [r.code for r in self.results if r.simulated]

    @property
    def imputed_codes(self) -> list[str]:
        return [r.code for r in self.results if r.imputed]

    def to_dict(self) -> dict:
        return {
            "target_date": self.target_date,
            "results": [r.__dict__ for r in self.results],
            "secondary": [r.__dict__ for r in self.secondary],
            "simulated_codes": self.simulated_codes,
            "imputed_codes": self.imputed_codes,
        }


def daterange(start: date, end: date) -> Iterable[date]:
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def iso(d: date) -> str:
    return d.isoformat()


def seasonal_noise(d: date, baseline: float, seasonal_amp: float, noise: float, phase: float = 0.0) -> float:
    """Synthetische dag-waarde met seizoenscomponent + ruis — voor mock-fallback."""
    doy = d.timetuple().tm_yday
    progression = 2 * math.pi * doy / 365.0 + phase
    return baseline + seasonal_amp * math.sin(progression) + random.uniform(-noise, noise)


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False, default=str)


def safe_request(
    url: str,
    timeout: int = 15,
    headers: dict | None = None,
    retries: int = 2,
    retry_delay: float = 3.0,
) -> tuple[bool, str | dict | None]:
    """HTTP-GET met fail-safe + auto-retry voor transient failures.

    Parseert JSON wanneer:
      - content-type bevat 'json' (vangt application/json, application/vnd.sdmx.data+json, etc.)
      - of body lijkt op JSON (begint met { of [)
    """
    try:
        import requests
        import json as _json
        import time as _time
    except ImportError:
        return False, "requests not installed"

    last_err = "no attempts"
    for attempt in range(retries + 1):
        if attempt > 0:
            _time.sleep(retry_delay * attempt)
        try:
            r = requests.get(url, timeout=timeout, headers=headers or {})
            r.raise_for_status()
            ct = r.headers.get("content-type", "").lower()
            if "json" in ct:
                try:
                    return True, r.json()
                except _json.JSONDecodeError:
                    return True, r.text
            text = r.text
            stripped = text.lstrip()
            if stripped.startswith(("{", "[")):
                try:
                    return True, _json.loads(text)
                except _json.JSONDecodeError:
                    pass
            return True, text
        except Exception as e:  # noqa: BLE001
            last_err = str(e)
            continue
    return False, last_err
```

## `app/pipeline/scripts/backfill_elia_baseline.py`

```python
"""
Backfill-script: echte 24-maanden-baseline voor de stroomnet-druk-indicator
(I-D3-009) uit de Elia Open Data (dataset ods001).

Schrijft app/data/history/I-D3-009.json — per dag de geaggregeerde ratio
Σ gemeten belasting / Σ day-ahead-forecast, exact dezelfde transformatie
als de dagfetcher (elia.aggregate_ratio).

Run:  python scripts/backfill_elia_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.elia import aggregate_ratio  # noqa: E402
from pipeline.util import safe_request, DATA_DIR  # noqa: E402

EXPORT_URL = "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods001/exports/json"


def _fetch_block(start: date, end: date) -> list[dict]:
    where = (
        f"datetime>=date'{start.isoformat()}' and "
        f"datetime<date'{end.isoformat()}' and totalload is not null"
    )
    url = (
        f"{EXPORT_URL}?select=datetime,totalload,dayaheadforecast"
        f"&where={where.replace(' ', '%20').replace(chr(39), '%27')}&limit=-1"
    )
    ok, body = safe_request(url, timeout=90, retries=2, retry_delay=5)
    return body if ok and isinstance(body, list) else []


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Elia-backfill stroomnet-druk: {start} → {today}", file=sys.stderr)

    by_day: dict[str, list[dict]] = {}
    block_start = start
    while block_start < today:
        block_end = min(block_start + timedelta(days=90), today)
        recs = _fetch_block(block_start, block_end)
        print(f"  blok {block_start} … {block_end}: {len(recs)} records", file=sys.stderr)
        for rec in recs:
            dt = str(rec.get("datetime", ""))[:10]
            if len(dt) == 10:
                by_day.setdefault(dt, []).append(rec)
        block_start = block_end

    rows = []
    for day in sorted(by_day):
        ratio = aggregate_ratio(by_day[day])
        if ratio is not None:
            rows.append({"date": day, "value": round(ratio, 4)})

    if len(rows) < 60:
        print(f"FOUT: te weinig dagen ({len(rows)}).", file=sys.stderr)
        return 1

    out_path = DATA_DIR / "history" / "I-D3-009.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.4f}, "
          f"min {vals[0]:.4f} / max {vals[-1]:.4f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/scripts/backfill_flood_baseline.py`

```python
"""
Backfill-script: echte 24-maanden-baseline voor het wateroverlast-signaal
(I-D1-009) uit de open-meteo Flood API (GloFAS-rivierafvoer).

Schrijft app/data/history/I-D1-009.json — zelfde transformatie als de
dagfetcher (som van de rivierafvoer over 4 Belgische stroomgebieden).

Run:  python scripts/backfill_flood_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.waterinfo import discharge_sum_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Flood-backfill rivierafvoer BE: {start} → {today}", file=sys.stderr)

    series = discharge_sum_series(start, today)
    if len(series) < 60:
        print(f"FOUT: te weinig data ({len(series)} dagen).", file=sys.stderr)
        return 1

    rows = [{"date": d, "value": v} for d, v in series]
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D1-009.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.1f}, "
          f"min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/scripts/backfill_gdelt_baseline.py`

```python
"""
Eenmalig (periodiek te herhalen) backfill-script: haalt de ECHTE 24-maanden
dagelijkse GDELT-nieuwstoon voor Belgie op en schrijft die als
app/data/history/I-D5-001.json.

Dat bestand vervangt de vroegere synthetische sinus-baseline voor de
nieuwsnegativiteits-indicator. De engine (generate-fixture.ts) laadt het en
gebruikt de echte mediaan + MAD als meetlat — zo wordt de dagwaarde tegen
echte historie gewogen op dezelfde schaal.

Eén GDELT-call levert ~700 dagcijfers (~35 KB). Mediaan/MAD over 700 punten
zijn extreem stabiel; het volstaat dit script enkele keren per jaar te
herdraaien om de staart te verversen.

Run:  python scripts/backfill_gdelt_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.gdelt import gdelt_tone_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"GDELT-backfill nieuwstoon BE: {start} → {today}", file=sys.stderr)

    series = gdelt_tone_series(start, today)
    if not series:
        print("FOUT: GDELT gaf geen reeks terug (rate-limit of leeg).", file=sys.stderr)
        return 1

    # dedup op datum, chronologisch
    by_date: dict[str, float] = {}
    for pt in series:
        by_date[pt["date"]] = pt["value"]
    rows = [{"date": d, "value": v} for d, v in sorted(by_date.items())]

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-001.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = [r["value"] for r in rows]
    vals_sorted = sorted(vals)
    median = vals_sorted[len(vals_sorted) // 2]
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan negativiteit ≈ {median:.3f}, "
          f"min {min(vals):.3f} / max {max(vals):.3f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/scripts/backfill_macro_baseline.py`

```python
"""
Backfill-script voor de vijf macro-economische indicatoren. Haalt de ECHTE
historische reeksen op en schrijft per indicator app/data/history/{code}.json.

Tot nu toe draaiden deze indicatoren op een SYNTHETISCHE (sinus + ruis)
baseline in generate-fixture.ts. Daardoor werd de dagwaarde tegen een verzonnen
meetlat gewogen en was de stress-score vervalst. Dit script vervangt die
baseline door echte historie op exact dezelfde schaal als de dagwaarde.

Indicatoren en bronnen
----------------------
- I-D3-001  CPI / inflatie (yoy %)        ECB SDW ICP   — MAANDdata
- I-D3-002  Energieprijs (€/MWh)          Energy-Charts — DAGdata
- I-D3-005  Werkloosheid (%)              ECB SDW LFSI  — MAANDdata
- I-D3-006  Hypotheekrente (%)            ECB SDW MIR   — MAANDdata
- I-D3-003  Ontslagen-proxy (log1p)       ECB SDW LFSI  — MAANDdata (delta)

SCHAAL-DISCIPLINE
-----------------
Elke historische observatie krijgt EXACT dezelfde transformatie als de
bijhorende fetcher vandaag toepast:
- CPI / werkloosheid / hypotheekrente: de ECB-waarde wordt rechtstreeks
  gebruikt (geen eenheid-transformatie — de fetchers nemen `float(obs)` puur).
- Ontslagen-proxy: de fetcher neemt de maand-op-maand-delta van de BE-
  werkloosheidsRATE (procentpunt), zet die om naar geschatte extra
  werkzoekenden via `delta_pp / 100 * BE_WORKFORCE` en past dan
  `log1p(max(0, ...))` toe. Dit script repliceert die keten op de volledige
  LFSI-reeks: punt n krijgt waarde = log1p(max(0, (rate[n]-rate[n-1])/100*5e6)).

De engine (generate-fixture.ts → loadRealHistory) laadt deze bestanden en
gebruikt mediaan + MAD als robuuste meetlat. Hij heeft >=60 punten nodig om de
echte baseline te activeren; we leveren ruim meer (maanddata ~10 jaar,
energie-dagdata ~24 maanden).

Run:  python scripts/backfill_macro_baseline.py
"""
from __future__ import annotations
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.util import DATA_DIR, safe_request  # noqa: E402

# BE-beroepsbevolking (15-74) — identiek aan fod_waso.BE_WORKFORCE.
# Gebruikt om de werkloosheidsRATE-delta om te zetten naar werkzoekenden-count.
BE_WORKFORCE = 5_000_000

# --- ECB SDW endpoints met volledige reeks (geen lastNObservations-limiet) ---
# Zelfde series-keys als de fetchers; alleen het observatie-venster verschilt.
ECB_CPI_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.000000.4.ANR"
    "?format=jsondata&startPeriod=2008-01"
)
ECB_UNEMPLOYMENT_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&startPeriod=2008-01"
)
ECB_MORTGAGE_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/MIR/M.BE.B.A2C.A.R.A.2250.EUR.N"
    "?format=jsondata&startPeriod=2008-01"
)


def _parse_ecb_series(body) -> list[tuple[str, float]]:
    """Parse een volledige ECB SDW jsondata-reeks.

    Geeft een chronologisch gesorteerde lijst (period, value) terug, waarbij
    period het ECB-id is (bv. '2026-04' voor maanddata). Repliceert de
    indexering die _parse_ecb_latest_with_period in statbel.py gebruikt:
    de observatie-sleutel is een integer-index in de observation-dimensie.
    """
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
    except (KeyError, IndexError, StopIteration, TypeError):
        return []

    try:
        obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
        period_for = {i: obs_dim[i]["id"] for i in range(len(obs_dim))}
    except (KeyError, IndexError, TypeError):
        period_for = {}

    rows: list[tuple[str, float]] = []
    for key, obs in observations.items():
        try:
            idx = int(key)
            val = obs[0]
        except (ValueError, IndexError, TypeError):
            continue
        if val is None:
            continue
        period = period_for.get(idx, "")
        if not period:
            continue
        try:
            rows.append((period, float(val)))
        except (ValueError, TypeError):
            continue
    rows.sort(key=lambda r: r[0])
    return rows


def _month_to_date(period: str) -> str:
    """ECB-maandperiode 'YYYY-MM' → 'YYYY-MM-01'. Daterange-id's worden ongemoeid gelaten."""
    if len(period) == 7 and period[4] == "-":
        return f"{period}-01"
    return period


def _fetch_ecb_history(url: str, label: str) -> list[tuple[str, float]]:
    print(f"  {label}: GET {url}", file=sys.stderr)
    ok, body = safe_request(url, timeout=30, headers={"Accept": "application/json"})
    if not ok or not isinstance(body, dict):
        print(f"  FOUT: ECB-call faalde voor {label} ({body!r:.120})", file=sys.stderr)
        return []
    rows = _parse_ecb_series(body)
    if not rows:
        print(f"  FOUT: geen observaties in ECB-respons voor {label}.", file=sys.stderr)
    return rows


def _write_history(code: str, rows: list[dict]) -> int:
    """Schrijf rows naar app/data/history/{code}.json en log min/mediaan/max."""
    if not rows:
        print(f"  WAARSCHUWING {code}: 0 punten — bestand niet geschreven.", file=sys.stderr)
        return 0
    if len(rows) < 30:
        print(f"  WAARSCHUWING {code}: slechts {len(rows)} punten "
              f"(<30 — engine gebruikt deze baseline niet).", file=sys.stderr)
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{code}.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    median = vals[len(vals) // 2]
    print(f"  OK {code}: {len(rows)} punten → {out_path}", file=sys.stderr)
    print(f"     bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"     min {vals[0]:.4f} / mediaan {median:.4f} / max {vals[-1]:.4f}",
          file=sys.stderr)
    return len(rows)


def backfill_cpi() -> int:
    """I-D3-001 — ECB ICP BE HICP yoy %. Raw value, geen transformatie."""
    rows = _fetch_ecb_history(ECB_CPI_HISTORY_URL, "I-D3-001 CPI")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-001", out)


def backfill_unemployment() -> int:
    """I-D3-005 — ECB LFSI BE werkloosheidsrate %. Raw value, geen transformatie."""
    rows = _fetch_ecb_history(ECB_UNEMPLOYMENT_HISTORY_URL, "I-D3-005 werkloosheid")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-005", out)


def backfill_mortgage() -> int:
    """I-D3-006 — ECB MIR BE hypotheekrente nieuwe contracten %. Raw value."""
    rows = _fetch_ecb_history(ECB_MORTGAGE_HISTORY_URL, "I-D3-006 hypotheekrente")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-006", out)


def backfill_layoffs() -> int:
    """I-D3-003 — ontslagen-proxy = log1p(max(0, delta_pp/100 * BE_WORKFORCE)).

    Dezelfde keten als fod_waso.fetch_collective_layoffs: de fetcher neemt de
    delta tussen de twee laatste LFSI-werkloosheidsRATE-observaties. Wij
    repliceren dat op de hele reeks: elke maand n krijgt de delta t.o.v. n-1.
    """
    rate_rows = _fetch_ecb_history(ECB_UNEMPLOYMENT_HISTORY_URL, "I-D3-003 ontslagen-proxy")
    out: list[dict] = []
    for i in range(1, len(rate_rows)):
        prev_rate = rate_rows[i - 1][1]
        last_rate = rate_rows[i][1]
        delta_pp = last_rate - prev_rate
        effective_workers = max(0.0, delta_pp / 100 * BE_WORKFORCE)
        value = math.log1p(effective_workers)
        out.append({"date": _month_to_date(rate_rows[i][0]), "value": value})
    return _write_history("I-D3-003", out)


def backfill_energy() -> int:
    """I-D3-002 — Energy-Charts BE day-ahead €/MWh, dag-gemiddelde van uurprijzen.

    De fetcher neemt het gemiddelde van de uurprijzen van één dag. We halen
    ~24 maanden in jaarblokken op (de API geeft per call de uur-reeks +
    unix-timestamps terug) en aggregeren naar één dag-gemiddelde per dag —
    exact dezelfde aggregatie als energy_charts._fetch_avg_price.
    """
    today = date.today()
    start = today - timedelta(days=730)
    by_date: dict[str, list[float]] = {}

    # In blokken van 30 dagen ophalen — grote ranges geven 503 op de
    # Energy-Charts price-API; kleine blokken zijn betrouwbaar.
    block_start = start
    while block_start < today:
        block_end = min(block_start + timedelta(days=30), today)
        url = (
            f"https://api.energy-charts.info/price"
            f"?bzn=BE&start={block_start.isoformat()}&end={block_end.isoformat()}"
        )
        print(f"  I-D3-002 energie: GET {url}", file=sys.stderr)
        ok, body = safe_request(url, timeout=40)
        if ok and isinstance(body, dict):
            prices = body.get("price", []) or []
            stamps = body.get("unix_seconds", []) or []
            n = min(len(prices), len(stamps))
            for k in range(n):
                p = prices[k]
                ts = stamps[k]
                if not isinstance(p, (int, float)) or not isinstance(ts, (int, float)):
                    continue
                d = date.fromtimestamp(ts).isoformat()
                by_date.setdefault(d, []).append(float(p))
        else:
            print(f"  WAARSCHUWING energie-blok faalde: {body!r:.120}", file=sys.stderr)
        block_start = block_end + timedelta(days=1)

    rows = [
        {"date": d, "value": sum(v) / len(v)}
        for d, v in sorted(by_date.items())
        if v
    ]
    return _write_history("I-D3-002", rows)


def main() -> int:
    print("Macro-economische baseline-backfill (5 indicatoren)", file=sys.stderr)
    print("=" * 56, file=sys.stderr)
    counts = {
        "I-D3-001 (CPI, maanddata)": backfill_cpi(),
        "I-D3-005 (werkloosheid, maanddata)": backfill_unemployment(),
        "I-D3-006 (hypotheekrente, maanddata)": backfill_mortgage(),
        "I-D3-003 (ontslagen-proxy, maanddata)": backfill_layoffs(),
        "I-D3-002 (energieprijs, dagdata)": backfill_energy(),
    }
    print("=" * 56, file=sys.stderr)
    failed = [k for k, c in counts.items() if c < 30]
    for k, c in counts.items():
        print(f"  {k}: {c} punten", file=sys.stderr)
    if failed:
        print(f"FOUT: te weinig punten voor: {', '.join(failed)}", file=sys.stderr)
        return 1
    print("Klaar — alle vijf baselines weggeschreven.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/scripts/backfill_pollen_baseline.py`

```python
"""
Backfill-script: echte 24-maanden-baseline voor de pollen-indicator
(I-D1-010) uit de open-meteo Air-Quality-API (CAMS-pollen).

Schrijft app/data/history/I-D1-010.json — exact dezelfde transformatie als
de dagfetcher (som van 5 pollensoorten, daggemiddelde uit uurwaarden).

Run:  python scripts/backfill_pollen_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.pollen import POLLEN_SPECIES  # noqa: E402
from pipeline.util import safe_request, DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Pollen-backfill Brussel: {start} → {today}", file=sys.stderr)

    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        "?latitude=50.85&longitude=4.35"
        f"&hourly={','.join(POLLEN_SPECIES)}"
        "&timezone=Europe%2FBrussels"
        f"&start_date={start.isoformat()}&end_date={today.isoformat()}"
    )
    ok, body = safe_request(url, timeout=60, retries=2, retry_delay=5)
    if not ok or not isinstance(body, dict):
        print(f"FOUT: air-quality-API onbereikbaar ({body!r:.120}).", file=sys.stderr)
        return 1
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        print("FOUT: geen uurdata in respons.", file=sys.stderr)
        return 1

    # per dag: per soort de uurwaarden verzamelen
    by_day: dict[str, dict[str, list[float]]] = {}
    for sp in POLLEN_SPECIES:
        vals = hourly.get(sp, []) or []
        for t, v in zip(times, vals):
            day = str(t)[:10]
            if isinstance(v, (int, float)):
                by_day.setdefault(day, {}).setdefault(sp, []).append(float(v))

    rows = []
    for day in sorted(by_day):
        species = by_day[day]
        total = 0.0
        for sp in POLLEN_SPECIES:
            vv = species.get(sp)
            if vv:
                total += sum(vv) / len(vv)
        rows.append({"date": day, "value": round(total, 3)})

    if len(rows) < 60:
        print(f"FOUT: te weinig dagen ({len(rows)}).", file=sys.stderr)
        return 1

    out_path = DATA_DIR / "history" / "I-D1-010.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.1f}, "
          f"min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/scripts/backfill_weather_baseline.py`

```python
"""
Backfill-script: haalt ~24 maanden ECHTE dagelijkse weer- en luchtkwaliteits-
data voor Brussel op en schrijft die als drie historiebestanden:

  app/data/history/I-D1-002.json  (Hitte)
  app/data/history/I-D1-003.json  (Kou)
  app/data/history/I-D1-004.json  (Luchtkwaliteit, ratio tov WHO 2021)

Die bestanden vervangen de SYNTHETISCHE sinus-baseline die de engine
(generate-fixture.ts) anders voor deze drie indicatoren gebruikt. Met een
echte historie wordt de dagwaarde tegen een echte mediaan + MAD gewogen.

KRITISCH — schaal-overeenkomst:
De historische waarde MOET op exact dezelfde schaal staan als wat de live
fetchers (pipeline/fetchers/kmi.py en irceline.py) vandaag produceren,
anders is de Z-score onzin. Daarom past dit script EXACT dezelfde
transformaties toe:

  I-D1-002 Hitte  = max(0, Tmax - 30)            — graden boven 30 °C
  I-D1-003 Kou    = max(0, -5 - Tmin)            — graden onder -5 °C
  I-D1-004 AQ     = max(PM25/15, O3/100, NO2/25) — ratio tov WHO 2021

De live luchtkwaliteits-fetcher rekent op UUR-data: PM2.5 en NO2 als
dag-GEMIDDELDE, O3 als dag-MAXIMUM. Dit script repliceert dat door de
open-meteo air-quality-archief-API met uur-velden te bevragen en per dag
te aggregeren op exact dezelfde manier.

Bronnen (open, gratis, geen token):
  - Weer:            https://archive-api.open-meteo.com/v1/archive
  - Luchtkwaliteit:  https://air-quality-api.open-meteo.com/v1/air-quality
                     (met start_date/end_date — archief-modus)

Run:  python scripts/backfill_weather_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.util import DATA_DIR, safe_request  # noqa: E402

# Brussel — identiek aan de live fetchers (doc 03 §1.2)
LAT = 50.85
LON = 4.35

# WHO 2021 grenswaarden (μg/m³) — identiek aan irceline.py
WHO_PM25 = 15.0   # 24-hour mean
WHO_O3 = 100.0    # 8-hour daily max (hier dag-max van uurwaarden, zoals de fetcher)
WHO_NO2 = 25.0    # 24-hour mean

# Aantal dagen historie. open-meteo-archief loopt enkele dagen achter op
# 'vandaag'; we vragen tot 5 dagen terug en gaan ~755 dagen verder terug.
HISTORY_DAYS = 755
ARCHIVE_LAG_DAYS = 5


# ── transformaties: EXACT gelijk aan de live fetchers ──────────────────────

def heat_excess(tmax: float | None) -> float | None:
    """I-D1-002 — kmi.py: max(0.0, tmax - 30)."""
    if tmax is None:
        return None
    return max(0.0, tmax - 30)


def cold_excess(tmin: float | None) -> float | None:
    """I-D1-003 — kmi.py: max(0.0, -5 - tmin)."""
    if tmin is None:
        return None
    return max(0.0, -5 - tmin)


def composite_aq(pm25: float | None, o3: float | None, no2: float | None) -> float | None:
    """I-D1-004 — irceline.py: max(PM25/15, O3/100, NO2/25)."""
    ratios = []
    if pm25 is not None:
        ratios.append(pm25 / WHO_PM25)
    if o3 is not None:
        ratios.append(o3 / WHO_O3)
    if no2 is not None:
        ratios.append(no2 / WHO_NO2)
    return max(ratios) if ratios else None


# ── hulp ───────────────────────────────────────────────────────────────────

def _safe_mean(xs):
    """Identiek aan irceline._safe_mean."""
    vals = [x for x in xs if isinstance(x, (int, float))]
    return sum(vals) / len(vals) if vals else None


def _safe_max(xs):
    """Identiek aan irceline._safe_max."""
    vals = [x for x in xs if isinstance(x, (int, float))]
    return max(vals) if vals else None


def _round(v: float) -> float:
    return round(v, 4)


# ── fetchers (archief) ──────────────────────────────────────────────────────

def fetch_weather(start: date, end: date) -> dict[str, dict[str, float]]:
    """Dagelijkse Tmax/Tmin uit het open-meteo weer-archief.

    Geeft {YYYY-MM-DD: {"tmax": ..., "tmin": ...}}.
    """
    url = (
        "https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={LAT}&longitude={LON}"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
        "&daily=temperature_2m_max,temperature_2m_min"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url, timeout=60)
    if not ok or not isinstance(body, dict):
        raise RuntimeError(f"weer-archief faalde: {body}")
    daily = body.get("daily", {})
    times = daily.get("time", [])
    tmaxs = daily.get("temperature_2m_max", [])
    tmins = daily.get("temperature_2m_min", [])
    out: dict[str, dict[str, float]] = {}
    for i, d in enumerate(times):
        out[d] = {
            "tmax": tmaxs[i] if i < len(tmaxs) else None,
            "tmin": tmins[i] if i < len(tmins) else None,
        }
    return out


def fetch_air_quality(start: date, end: date) -> dict[str, float]:
    """Dagelijkse Composite_AQ uit het open-meteo air-quality-archief.

    Bevraagt UUR-data en aggregeert per dag EXACT zoals de live fetcher:
    PM2.5 en NO2 → dag-gemiddelde, O3 → dag-maximum.

    Geeft {YYYY-MM-DD: composite_aq}.
    """
    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={LAT}&longitude={LON}"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
        "&hourly=pm2_5,ozone,nitrogen_dioxide"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url, timeout=90)
    if not ok or not isinstance(body, dict):
        raise RuntimeError(f"air-quality-archief faalde: {body}")
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    pm = hourly.get("pm2_5", [])
    o3 = hourly.get("ozone", [])
    no2 = hourly.get("nitrogen_dioxide", [])

    # bundel uurwaarden per dag (datum-prefix van de ISO-tijdstring)
    by_day: dict[str, dict[str, list]] = {}
    for i, t in enumerate(times):
        day = t[:10]
        b = by_day.setdefault(day, {"pm": [], "o3": [], "no2": []})
        if i < len(pm):
            b["pm"].append(pm[i])
        if i < len(o3):
            b["o3"].append(o3[i])
        if i < len(no2):
            b["no2"].append(no2[i])

    out: dict[str, float] = {}
    for day, b in by_day.items():
        # zelfde aggregatie als irceline.fetch_air_quality
        pm25_d = _safe_mean(b["pm"])
        o3_d = _safe_max(b["o3"])
        no2_d = _safe_mean(b["no2"])
        aq = composite_aq(pm25_d, o3_d, no2_d)
        if aq is not None:
            out[day] = aq
    return out


def _write(code: str, rows: list[dict]) -> Path:
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{code}.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return out_path


def _report(code: str, label: str, rows: list[dict]) -> None:
    vals = sorted(r["value"] for r in rows)
    median = vals[len(vals) // 2]
    print(
        f"  {code} ({label}): {len(rows)} dagen, "
        f"{rows[0]['date']} … {rows[-1]['date']} | "
        f"min {vals[0]:.4f} / mediaan {median:.4f} / max {vals[-1]:.4f}",
        file=sys.stderr,
    )


def main() -> int:
    end = date.today() - timedelta(days=ARCHIVE_LAG_DAYS)
    start = end - timedelta(days=HISTORY_DAYS)
    print(
        f"Weer-/AQ-backfill Brussel: {start} → {end} (~{HISTORY_DAYS} dagen)",
        file=sys.stderr,
    )

    # ── weer → I-D1-002 (hitte), I-D1-003 (kou) ──
    weather = fetch_weather(start, end)
    heat_rows: list[dict] = []
    cold_rows: list[dict] = []
    for d in sorted(weather.keys()):
        rec = weather[d]
        h = heat_excess(rec.get("tmax"))
        c = cold_excess(rec.get("tmin"))
        if h is not None:
            heat_rows.append({"date": d, "value": _round(h)})
        if c is not None:
            cold_rows.append({"date": d, "value": _round(c)})

    # ── luchtkwaliteit → I-D1-004 ──
    aq = fetch_air_quality(start, end)
    aq_rows = [{"date": d, "value": _round(aq[d])} for d in sorted(aq.keys())]

    if len(heat_rows) < 60 or len(cold_rows) < 60 or len(aq_rows) < 60:
        print(
            f"FOUT: te weinig data (hitte {len(heat_rows)}, kou {len(cold_rows)}, "
            f"AQ {len(aq_rows)}).",
            file=sys.stderr,
        )
        return 1

    p1 = _write("I-D1-002", heat_rows)
    p2 = _write("I-D1-003", cold_rows)
    p3 = _write("I-D1-004", aq_rows)

    print(f"✓ geschreven: {p1}", file=sys.stderr)
    print(f"✓ geschreven: {p2}", file=sys.stderr)
    print(f"✓ geschreven: {p3}", file=sys.stderr)
    _report("I-D1-002", "Hitte = max(0,Tmax-30)", heat_rows)
    _report("I-D1-003", "Kou = max(0,-5-Tmin)", cold_rows)
    _report("I-D1-004", "AQ = max(PM25/15,O3/100,NO2/25)", aq_rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/scripts/backfill_wikipedia_baseline.py`

```python
"""
Backfill-script: haalt ~24 maanden Wikipedia-pageviews voor de stress-
artikelset op en schrijft die als app/data/history/I-D5-002.json.

Dat bestand geeft de zoekinteresse-indicator (I-D5-002) een ECHTE
24-maanden-baseline, op exact dezelfde schaal als de dagwaarde
(voortschrijdend 7d-gemiddelde van gesommeerde weergaven).

Baseline-venster: ~11 maanden (340 dagen). Wikipedia-aandachts-indexen
kennen structurele drift (artikels winnen of verliezen relatief verkeer
over jaren). Een venster van ~24 maanden zou de meetlat scheeftrekken naar
een verouderd regime; ~11 maanden volgt het recente niveau beter en houdt
toch ruim voldoende datapunten voor een robuuste mediaan + MAD.
Periodiek herdraaien volstaat.

Run:  python scripts/backfill_wikipedia_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.wikipedia import daily_attention_index, trailing_mean_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=340)
    print(f"Wikipedia-backfill zoekinteresse: {start} → {today}", file=sys.stderr)

    index = daily_attention_index(start, today)
    if len(index) < 60:
        print(f"FOUT: te weinig data ({len(index)} dagen).", file=sys.stderr)
        return 1

    series = trailing_mean_series(index, window=7)
    # de eerste 6 dagen hebben een onvolledig venster — laat ze weg
    series = series[6:]

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-002.json"
    out_path.write_text(json.dumps(series, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in series)
    median = vals[len(vals) // 2]
    print(f"✓ {len(series)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {series[0]['date']} … {series[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {median:.1f}, min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## `app/pipeline/requirements.txt`

```
requests>=2.31.0
python-dateutil>=2.8.2
pytrends>=4.9.2
beautifulsoup4>=4.12.2
lxml>=5.1.0
```

# Web (React + Vite) — UI

## `app/web/src/components/indicator-utils.ts`

```ts
import type { IndicatorState } from "../types";

export function stateLabel(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "lager dan gewoonlijk";
    case "normaal": return "gemiddeld";
    case "verhoogd": return "hoger dan gewoonlijk";
    case "extreem": return "uitzonderlijk hoog";
    case "ontbreekt": return "geen data";
  }
}

export function stateColor(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "var(--c-green)";
    case "normaal": return "var(--c-ink-mute)";
    case "verhoogd": return "var(--c-amber)";
    case "extreem": return "var(--c-red)";
    case "ontbreekt": return "var(--c-ink-mute)";
  }
}

export function stateIcon(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "○";
    case "normaal": return "●";
    case "verhoogd": return "▲";
    case "extreem": return "▲▲";
    case "ontbreekt": return "·";
  }
}
```

## `app/web/src/copy.ts`

```ts
/**
 * Publieke copy in alpine register.
 * Voor lezers vanaf ~15 jaar. Geen jargon. Geen "u bent gestrest".
 * CTA mag voller Les Hautes Alpes-stem ademen, meet-secties blijven sober.
 */

export const TIER_HEADLINE = {
  green: "Vandaag is een gewone dag.",
  amber: "Vandaag komt er veel tegelijk op ons af.",
  red: "Vandaag staan veel signalen uitzonderlijk hoog.",
} as const;

export const TIER_SUBLINE = {
  green: "Geen verhoogde druk op de hele bevolking.",
  amber: "Verschillende stress-factoren staan samen aan, al drie dagen of langer.",
  red: "We zitten in de zwaarste 10% van de laatste twee jaar.",
} as const;

export const LES_HAUTES_ALPES_CTA = {
  green: null,
  amber: {
    headline: "Adem in. Adem uit.",
    body: "Wanneer de hele bevolking onder druk staat, weegt een paar dagen tussen de pieken extra zwaar. De Hautes-Alpes liggen op vier uur rijden. Lucht boven 1800 meter is anders.",
    action: "Ontdek de bestemmingen",
  },
  red: {
    headline: "Even uit de drukte stappen.",
    body: "Statistisch gezien is dit een goed moment om te kiezen voor stilte, hoogte en heldere lucht. Niet pas als het te laat is. Preventief, terwijl het kan.",
    action: "Ontdek de bestemmingen",
  },
} as const;

export const BRAND_SAFETY_OVERRIDE = {
  elevated: "Er speelt iets gevoeligs vandaag. We zetten de commerciële boodschap even op pauze. De meting loopt door.",
  block: "Commerciële boodschappen zijn opgeschort. De teller blijft de huidige toestand registreren.",
} as const;

export const DOMAIN_LABELS = {
  D1: "Weer & lucht",
  D2: "Verkeer & verplaatsingen",
  D3: "Economie",
  D4: "Werk & gezin",
  D5: "Nieuws & gebeurtenissen",
  D6: "Kalender",
} as const;

export const METHODOLOGY_DISCLAIMER = [
  "Dit is een teller voor het hele land, niet voor jou persoonlijk. We kijken naar 24 dingen die de hele bevolking onder druk kunnen zetten en tellen hoe ongewoon ze vandaag zijn.",
  "We meten dus geen mensen, we meten omstandigheden. We zijn geen dokter. We voorspellen niet wat morgen gaat gebeuren. Het is geen wetenschappelijke studie, het is gemaakt met onderzoek dat anderen al gedaan hebben.",
] as const;

export const FOOTER_NOTES = {
  implementationStage: "Werkt nu nog in test-modus.",
  methodologyRef: "Methodologie: SBI v0.2, 24 indicatoren in 6 categorieën.",
  ondersteunend: "Gebaseerd op onderzoek van McEwen (allostatic load), Marmot (sociale gezondheids-determinanten) en Hobfoll (conservation of resources).",
  tagline: "Natuurlijk in het hart van de Alpen.",
} as const;
```

## `app/web/src/lib/explainer.ts`

```ts
/**
 * Context-bewuste tekstgenerator voor de barometer.
 * Bouwt headline + body uit DailyOutput.
 *
 * Taalregister: neutraal informerend, 15-jarig begripbaar.
 * Geen marketing-toon, geen "u/jij" attributies, geen klinische taal (doc 09).
 */
import type { DailyOutput, IndicatorBreakdown } from "../types";

export interface ExplainerContext {
  cn: number;
  percentile: number;
  daysInTier: number;
  elevatedCount: number;
  extremeCount: number;
  lowerCount: number;
  totalAvailable: number;
  topContributors: IndicatorBreakdown[];
  brandSafety: string;
  brandSafetyReason: string | null;
}

export function buildContext(data: DailyOutput): ExplainerContext {
  const breakdown = data.indicator_breakdown;
  const available = breakdown.filter((b) => b.state !== "ontbreekt");
  const elevated = available.filter((b) => b.state === "verhoogd" || b.state === "extreem");
  const extreme = available.filter((b) => b.state === "extreem");
  const lower = available.filter((b) => b.state === "rustig");
  const topContributors = [...available]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  return {
    cn: data.condition_level.value,
    percentile: data.percentile.short_24m,
    daysInTier: data.tier.days_in_tier,
    elevatedCount: elevated.length,
    extremeCount: extreme.length,
    lowerCount: lower.length,
    totalAvailable: available.length,
    topContributors,
    brandSafety: data.brand_safety.flag,
    brandSafetyReason: data.brand_safety.reason,
  };
}

/** Hoofdtitel boven het uitleg-blok. */
export function buildHeadline(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    return "Even op pauze.";
  }
  if (ctx.cn === 1) {
    if (ctx.percentile === 0) return "Stress-signalen staan vandaag historisch laag.";
    if (ctx.percentile < 20) return "Stress-signalen staan vandaag laag.";
    return "Vandaag is een gewone dag.";
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) return "Vandaag is een gewone dag.";
    if (ctx.elevatedCount === 1) return "Vandaag staat één signaal hoger dan gewoonlijk.";
    return `Vandaag staan ${ctx.elevatedCount} signalen iets boven gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `Al ${ctx.daysInTier} dagen op rij meerdere signalen hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 4) {
    return `Al ${ctx.daysInTier} dagen op rij in de top-10% van de laatste twee jaar.`;
  }
  return "Iets gevoeligs is gaande.";
}

/** Beschrijvende alinea onder de hoofdtitel. */
export function buildBody(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    const reason = ctx.brandSafetyReason ?? "gevoelige actuele gebeurtenis";
    return `Brand-safety-vlag actief vanwege ${reason}. De meting blijft lopen, maar commerciële boodschappen staan op pauze. Vandaag wegen ${ctx.elevatedCount} signalen hoger dan gewoonlijk mee.`;
  }

  if (ctx.cn === 1) {
    if (ctx.percentile === 0) {
      return `Geen van de ${ctx.totalAvailable} indicatoren staat hoger dan gewoonlijk. Sinds twee jaar zijn er geen kalmere dagen geregistreerd.`;
    }
    if (ctx.percentile < 30) {
      return `${ctx.lowerCount} signalen onder gemiddeld, geen enkele hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
    }
    return `Geen van de ${ctx.totalAvailable} indicatoren staat hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }

  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Niets bijzonders te melden. ${ctx.totalAvailable} signalen blijven binnen de gemiddelde zone.`;
    }
    const lead = describeTop(ctx.topContributors, 1);
    return `${lead} Voor banner-activatie zouden meerdere signalen tegelijk hoger moeten staan, drie dagen op rij.`;
  }

  if (ctx.cn === 3) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${lead} Sinds ${ctx.daysInTier} dagen op rij is dat zo. Banner-activatie loopt: statistisch een geschikt moment voor extra herstel.`;
  }

  if (ctx.cn === 4) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${ctx.extremeCount} signaal${ctx.extremeCount === 1 ? "" : "en"} ${ctx.extremeCount === 1 ? "staat" : "staan"} in de hoogste zone. ${lead} Banner-activatie verhoogd.`;
  }

  return "";
}

function describeTop(top: IndicatorBreakdown[], count: number): string {
  if (top.length === 0) return "";
  const names = top.slice(0, count).map((t) => `**${t.plain_name.toLowerCase()}**`);
  if (names.length === 1) return `Vooral ${names[0]} weegt vandaag mee.`;
  if (names.length === 2) return `Vooral ${names[0]} en ${names[1]} wegen vandaag mee.`;
  return `Vooral ${names[0]}, ${names[1]} en ${names[2]} wegen vandaag mee.`;
}

/** Korte context-zin voor onder het CN-cijfer (cn-secondary). */
export function buildPercentileLine(ctx: ExplainerContext): string {
  if (ctx.percentile === 0) {
    return "Lager dan elke andere dag van de afgelopen twee jaar.";
  }
  if (ctx.percentile === 100) {
    return "Hoger dan elke andere dag van de afgelopen twee jaar.";
  }
  if (ctx.percentile < 50) {
    return `Lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }
  return `Hoger dan op ${ctx.percentile}% van de afgelopen twee jaar.`;
}

/** Korte status-zin per CN, voor de cn-description in het CN-blok. */
export function buildCnDescription(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    const reason = ctx.brandSafetyReason ?? "actuele gevoelige situatie";
    return `Brand-safety-vlag actief (${reason}). Commerciële uitnodigingen opgeschort, meting blijft lopen.`;
  }
  if (ctx.cn === 1) {
    if (ctx.percentile === 0) {
      return `Alle ${ctx.totalAvailable} signalen onder of binnen gemiddeld. Historisch lage dag.`;
    }
    return `Geen van de ${ctx.totalAvailable} indicatoren hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Alle ${ctx.totalAvailable} signalen binnen gemiddeld.`;
    }
    return `${ctx.elevatedCount} signaal${ctx.elevatedCount === 1 ? "" : "en"} hoger dan gewoonlijk, ${ctx.totalAvailable - ctx.elevatedCount} binnen gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `${ctx.elevatedCount} van de ${ctx.totalAvailable} signalen hoger dan gewoonlijk, ${ctx.daysInTier} dagen op rij. Banner-activatie loopt.`;
  }
  if (ctx.cn === 4) {
    return `${ctx.elevatedCount} signalen hoger dan gewoonlijk, ${ctx.extremeCount} in de hoogste zone. Banner-activatie verhoogd.`;
  }
  return "";
}
```

## `app/web/src/lib/format-date.ts`

```ts
/**
 * Datum-formattering voor publicatiedatums per indicator.
 * Een observation_date is ofwel YYYY-MM-DD (dagelijkse bron)
 * of YYYY-MM (maandelijkse bron, bv. ECB).
 */

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function formatObservationDate(obs: string): string {
  if (!obs) return "onbekend";

  // YYYY-MM-DD → "21 mei 2026"
  const dayMatch = obs.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const [, y, m, d] = dayMatch;
    const maand = MAANDEN[parseInt(m, 10) - 1] ?? m;
    return `${parseInt(d, 10)} ${maand} ${y}`;
  }

  // YYYY-MM → "april 2026"
  const monthMatch = obs.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const [, y, m] = monthMatch;
    const maand = MAANDEN[parseInt(m, 10) - 1] ?? m;
    return `${maand} ${y}`;
  }

  return obs;
}

/** Geeft 'dagcijfer' of 'maandcijfer' afhankelijk van de granulariteit. */
export function observationGranularity(obs: string): "dag" | "maand" | "onbekend" {
  if (/^\d{4}-\d{2}-\d{2}$/.test(obs)) return "dag";
  if (/^\d{4}-\d{2}$/.test(obs)) return "maand";
  return "onbekend";
}
```

## `app/web/src/types.ts`

```ts
// Mirror van engine output-typen (zie ../../engine/src/types.ts)

export type Tier = "green" | "amber" | "red";
export type BrandSafety = "normal" | "elevated" | "block";
export type DomainCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export interface DomainContribution {
  domain: DomainCode;
  contribution: number;
}

export interface SecondarySignal {
  code: string;
  name: string;
  value: number;
  source: string;
  simulated: boolean;
  observation_date: string;
}

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";

export interface IndicatorBreakdown {
  code: string;
  domain: DomainCode;
  plain_name: string;
  why: string;
  reads: string;
  unit: string;
  raw_value: number | null;
  z_short: number | null;
  contribution: number;
  state: IndicatorState;
  source: string;
  simulated: boolean;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
  observation_date: string;
  demographic_reach: number;
  reach_rationale: string;
}

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

export interface DailyOutput {
  timestamp: string;
  week_iso: string;
  condition_level: {
    value: ConditionLevel;
    name: string;
    banner_active: boolean;
    copy_key: string;
  };
  composite: {
    equal: number;
    evidence_graded: number;
    demographic: number;
    weight_sensitivity: {
      correlation_inverse_vs_equal_12w: number;
      composite_range_with_dropouts: [number, number];
      bootstrap_95_ci_around_equal: [number, number];
    };
  };
  percentile: {
    short_24m: number;
    fixed_2010_2019: number;
  };
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  indicator_breakdown: IndicatorBreakdown[];
  secondary_signals: SecondarySignal[];
  media_cluster_diagnostic: {
    d5_cross_correlation_7d: number;
    composite_without_d5: number;
    media_contribution_percentile_points: number;
  };
  brand_safety: {
    flag: BrandSafety;
    reason: string | null;
    expires_estimated: string | null;
  };
  data_quality: {
    indicators_with_imputed_data: string[];
    indicators_missing: string[];
    indicators_simulated: string[];
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: string;
  };
}

export interface SparklinePoint {
  date: string;
  composite: number;
  percentile: number;
  tier: Tier;
}
```

## `app/web/src/App.tsx`

```tsx
import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
import { TierIndicator } from "./components/TierIndicator";
import { PercentileDisplay } from "./components/PercentileDisplay";
import { DomainContributions } from "./components/DomainContributions";
import { Sparkline } from "./components/Sparkline";
import { CallToAction } from "./components/CallToAction";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { Methodology } from "./components/Methodology";
import { DataQuality } from "./components/DataQuality";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { PlainExplainer } from "./components/PlainExplainer";
import { TopInfluences } from "./components/TopInfluences";
import { IndicatorList } from "./components/IndicatorList";
import { HeroBanner } from "./components/HeroBanner";
import { LHALogo } from "./components/LHALogo";
import { AllSources } from "./components/AllSources";
import { IndicatorZView } from "./components/IndicatorZView";
import { SecondarySignals } from "./components/SecondarySignals";
import { MEDIA_DIAGNOSTIC } from "./components/Sections";
import { FOOTER_NOTES } from "./copy";

export function App() {
  const [data, setData] = useState<DailyOutput | null>(null);
  const [sparkline, setSparkline] = useState<SparklinePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  const isPreview = typeof window !== "undefined" && window.location.pathname.startsWith("/preview");

  useEffect(() => {
    if (isPreview) return;
    const load = async () => {
      try {
        const [latest, spark] = await Promise.all([
          fetch("/data/latest.json").then((r) => {
            if (!r.ok) throw new Error("latest.json niet gevonden");
            return r.json() as Promise<DailyOutput>;
          }),
          fetch("/data/sparkline-30d.json").then((r) => {
            if (!r.ok) throw new Error("sparkline-30d.json niet gevonden");
            return r.json() as Promise<SparklinePoint[]>;
          }),
        ]);
        setData(latest);
        setSparkline(spark);
      } catch (e) {
        setError(e instanceof Error ? e.message : "onbekende fout");
      }
    };
    void load();
  }, [isPreview]);

  if (isPreview) {
    return <PreviewPage />;
  }

  if (error) {
    return (
      <div className="error-state">
        <h1>Data niet beschikbaar</h1>
        <p>{error}</p>
        <p className="muted">
          Draai eerst <code>npm run generate-fixture</code> in <code>app/engine</code>.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Barometer laadt…</div>;
  }

  const today = new Date(data.timestamp).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`app tier-${data.tier.current}`}>
      <HeroBanner weekIso={data.week_iso} today={today} />

      {data.brand_safety.flag !== "normal" && (
        <BrandSafetyBanner brandSafety={data.brand_safety} />
      )}

      <main>
        <ConditionLevelDisplay data={data} />

        <PlainExplainer data={data} />

        <CallToAction tier={data.tier.current} brandSafety={data.brand_safety.flag} />

        <TopInfluences breakdown={data.indicator_breakdown} />

        <IndicatorList breakdown={data.indicator_breakdown} />

        <IndicatorZView breakdown={data.indicator_breakdown} />

        <section className="panel sparkline-panel">
          <h2>Hoe was het de laatste 60 dagen?</h2>
          <p className="panel-lead">
            Elke stip is één dag. Hoe hoger op de grafiek, hoe meer signalen tegelijk hoog staan.
            De gekleurde banden tonen de drempels: <strong>gemiddeld</strong>,
            <strong> hoger dan gewoonlijk</strong> (vanaf 70%),
            <strong> uitzonderlijk hoog</strong> (vanaf 90%).
          </p>
          <Sparkline points={sparkline} />
        </section>

        <SecondarySignals signals={data.secondary_signals} />

        <Methodology />

        <AllSources breakdown={data.indicator_breakdown} />

        <DataQuality dataQuality={data.data_quality} total={data.indicator_breakdown.length} />

        <section className="technical-toggle">
          <button
            className="technical-toggle-btn"
            onClick={() => setShowTechnical(!showTechnical)}
            aria-expanded={showTechnical}
          >
            {showTechnical ? "− Verberg technische details" : "+ Toon technische details"}
          </button>
          <p className="muted small technical-toggle-hint">
            Voor wetenschappers, journalisten en de adversariële reviewer.
          </p>
        </section>

        {showTechnical && (
          <>
            <section className="hero">
              <TierIndicator tier={data.tier.current} daysInTier={data.tier.days_in_tier} />
              <PercentileDisplay
                shortP={data.percentile.short_24m}
                fixedP={data.percentile.fixed_2010_2019}
                composite={data.composite.equal}
                evidenceComposite={data.composite.evidence_graded}
                demographicComposite={data.composite.demographic}
              />
            </section>
            <section className="panel">
              <h2>Domein-bijdragen</h2>
              <p className="panel-lead">
                Onder equal-weights (Schema 1), pre-geregistreerd primair schema.
              </p>
              <DomainContributions contributions={data.top_contributing_domains} />
            </section>
            <MEDIA_DIAGNOSTIC diagnostic={data.media_cluster_diagnostic} />
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-mark">
            <LHALogo size={52} />
            <div className="footer-mark-text">{FOOTER_NOTES.tagline}</div>
          </div>
          <div className="footer-row">
            <strong>SBI v{data.data_quality.methodology_version}</strong>
            <span className="muted">·</span>
            <span>{FOOTER_NOTES.implementationStage}</span>
          </div>
          <div className="footer-row muted">{FOOTER_NOTES.methodologyRef}</div>
          <div className="footer-row muted small">{FOOTER_NOTES.ondersteunend}</div>
          <div className="footer-row muted small">
            Methodologie open. Code: open source. Pre-registratie via OSF.
          </div>
        </div>
      </footer>
    </div>
  );
}
```

## `app/web/src/components/AllSources.tsx`

```tsx
import type { IndicatorBreakdown } from "../types";

/**
 * Centrale "Alle bronnen"-sectie.
 * Uniqueert databronnen en wetenschappelijke referenties uit de breakdown.
 */
export function AllSources({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const dataSources = new Map<string, string>();
  const references = new Map<string, string>();

  for (const ind of breakdown) {
    if (ind.data_source?.url) {
      dataSources.set(ind.data_source.name, ind.data_source.url);
    }
    for (const ref of ind.references ?? []) {
      references.set(ref.label, ref.url);
    }
  }

  return (
    <section className="panel all-sources">
      <h2>Alle bronnen</h2>
      <p className="panel-lead">
        Wie de cijfers wil natrekken, vindt hier alle data-leveranciers en
        wetenschappelijke artikels die meegewogen hebben.
      </p>

      <div className="sources-grid">
        <div className="sources-column">
          <h3>Databronnen</h3>
          <ul className="sources-list">
            {[...dataSources.entries()].map(([name, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="sources-column">
          <h3>Wetenschappelijke artikels</h3>
          <ul className="sources-list">
            {[...references.entries()].map(([label, url]) => (
              <li key={label}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="muted small all-sources-note">
        De volledige methodologie (lagen 1 tot 8) is open en publiek beschikbaar.
        Alle keuzes, drempels, gewichten en formules staan vooraf vast en kunnen
        niet achteraf bijgestuurd worden.
      </p>
    </section>
  );
}
```

## `app/web/src/components/BrandSafetyBanner.tsx`

```tsx
import type { DailyOutput } from "../types";
import { BRAND_SAFETY_OVERRIDE } from "../copy";

export function BrandSafetyBanner({ brandSafety }: { brandSafety: DailyOutput["brand_safety"] }) {
  if (brandSafety.flag === "normal") return null;
  const msg =
    brandSafety.flag === "elevated"
      ? BRAND_SAFETY_OVERRIDE.elevated
      : BRAND_SAFETY_OVERRIDE.block;

  return (
    <div className={`brand-safety brand-safety-${brandSafety.flag}`} role="status">
      <div className="bs-label">BRAND-SAFETY-VLAG · {brandSafety.flag.toUpperCase()}</div>
      <p className="bs-message">{msg}</p>
      {brandSafety.reason && <p className="bs-reason">Reden: {brandSafety.reason}</p>}
    </div>
  );
}
```

## `app/web/src/components/CallToAction.tsx`

```tsx
import type { Tier, BrandSafety } from "../types";
import { LES_HAUTES_ALPES_CTA } from "../copy";
import { LHALogo } from "./LHALogo";

interface Props {
  tier: Tier;
  brandSafety: BrandSafety;
}

/**
 * Les Hautes Alpes call-to-action.
 * Verschijnt alleen wanneer tier ≥ amber EN brand_safety = normal.
 * Copy strict per doc 09 §5 (geen klinische taal, geen individuele attributie).
 */
export function CallToAction({ tier, brandSafety }: Props) {
  if (brandSafety !== "normal") return null;
  if (tier === "green") return null;
  const cta = LES_HAUTES_ALPES_CTA[tier];
  if (!cta) return null;

  return (
    <section className="cta">
      <div className="cta-inner">
        <div className="cta-mark">
          <span className="lha-mark-mini" style={{ color: "#0a3d6b" }}>
            <LHALogo size={28} />
          </span>
          <span>LES HAUTES ALPES · Natuurlijk in het hart van de Alpen</span>
        </div>
        <h2 className="cta-headline">{cta.headline}</h2>
        <p className="cta-body">{cta.body}</p>
        <a className="cta-action" href="https://www.hautes-alpes.net" target="_blank" rel="noopener noreferrer">
          {cta.action} →
        </a>
      </div>
    </section>
  );
}
```

## `app/web/src/components/ConditionLevelDisplay.tsx`

```tsx
import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext, buildCnDescription, buildPercentileLine } from "../lib/explainer";

const LEVEL_KICKER: Record<ConditionLevel, string> = {
  1: "LAAG",
  2: "GEMIDDELD",
  3: "VEEL TEGELIJK",
  4: "UITZONDERLIJK HOOG",
  5: "EVEN OP PAUZE",
};

export function ConditionLevelDisplay({
  data,
}: {
  data: DailyOutput;
}) {
  const cn = data.condition_level.value;
  const ctx = buildContext(data);
  const cnDescription = buildCnDescription(ctx);
  const percentileLine = buildPercentileLine(ctx);

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-CIJFER VAN VANDAAG</div>
      <div className="cn-main">
        <div className="cn-number" aria-label={`niveau ${cn} van 5`}>
          {cn}
        </div>
        <div className="cn-scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`cn-dot cn-dot-pos-${n} ${n <= cn ? "active" : ""} ${n === cn ? "current" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="cn-side">
          <div className="cn-kicker">{LEVEL_KICKER[cn]}</div>
          {cn >= 3 && cn <= 4 && (
            <div className="cn-meta">Dag {data.tier.days_in_tier} op rij</div>
          )}
        </div>
      </div>
      <p className="cn-description">{cnDescription}</p>
      <div className="cn-secondary">
        <span>{percentileLine}</span>
      </div>
    </section>
  );
}
```

## `app/web/src/components/DataQuality.tsx`

```tsx
import type { DailyOutput } from "../types";

export function DataQuality({
  dataQuality,
  total,
}: {
  dataQuality: DailyOutput["data_quality"];
  total: number;
}) {
  const hasSimulated = dataQuality.indicators_simulated.length > 0;
  const hasMissing = dataQuality.indicators_missing.length > 0;

  return (
    <section className="panel data-quality">
      <h2>Welke metingen zijn echt en welke nog niet</h2>

      <p className="panel-lead">
        We zijn eerlijk over wat al echt-tijd is, en wat nog op test-data draait.
      </p>

      <div className="dq-grid">
        <div className={`dq-row ${hasSimulated ? "warn" : "ok"}`}>
          <span className="dq-label">Nog op test-data</span>
          <span className="dq-value">{dataQuality.indicators_simulated.length} van {total}</span>
          {hasSimulated && (
            <details className="dq-detail">
              <summary>Welke?</summary>
              <code>{dataQuality.indicators_simulated.join(", ")}</code>
            </details>
          )}
        </div>

        <div className="dq-row ok">
          <span className="dq-label">Echt-tijd live</span>
          <span className="dq-value">{total - dataQuality.indicators_simulated.length} van {total}</span>
        </div>

        <div className={`dq-row ${hasMissing ? "warn" : "ok"}`}>
          <span className="dq-label">Ontbrekend</span>
          <span className="dq-value">{dataQuality.indicators_missing.length}</span>
        </div>

        <div className="dq-row ok">
          <span className="dq-label">Versie van de meting</span>
          <span className="dq-value">v{dataQuality.methodology_version}</span>
        </div>
      </div>

      {hasSimulated && (
        <p className="dq-disclaimer">
          Tijdens deze test-fase gebruiken we voor sommige indicatoren nog gesimuleerde data,
          omdat de echte bronnen nog moeten worden aangesloten. Het cijfer van vandaag is dus
          niet bedoeld als 100% accurate stand van het land. We verbeteren dit stap voor stap.
        </p>
      )}
    </section>
  );
}
```

## `app/web/src/components/DomainContributions.tsx`

```tsx
import type { DomainContribution } from "../types";
import { DOMAIN_LABELS } from "../copy";

export function DomainContributions({ contributions }: { contributions: DomainContribution[] }) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 0.01);

  return (
    <div className="domain-contributions">
      {contributions.map((c, idx) => {
        const widthPct = (Math.abs(c.contribution) / maxAbs) * 100;
        const positive = c.contribution >= 0;
        return (
          <div className="domain-row" key={c.domain}>
            <div className="domain-rank">{idx + 1}</div>
            <div className="domain-info">
              <div className="domain-code">{c.domain}</div>
              <div className="domain-name">{DOMAIN_LABELS[c.domain]}</div>
            </div>
            <div className="domain-bar-wrap">
              <div
                className={`domain-bar ${positive ? "positive" : "negative"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <div className="domain-value">
              {positive ? "+" : ""}
              {c.contribution.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## `app/web/src/components/HeroBanner.tsx`

```tsx
import { LHALogo } from "./LHALogo";

/**
 * Site-header: een licht geblurde alpenfoto over de volle breedte, met het
 * Hautes-Alpes-logo groot en gecentreerd bovenaan, een dunne scheidingslijn
 * eronder (zoals op plus.hautes-alpes.net), en daaronder het titelblok.
 */
export function HeroBanner({ weekIso, today }: { weekIso: string; today: string }) {
  return (
    <header className="site-header">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-tint" aria-hidden="true" />
      <a
        className="site-back"
        href="https://plus.hautes-alpes.net/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Naar hautes-alpes.net ↗
      </a>
      <div className="hero-top">
        <a
          className="site-logo"
          href="https://plus.hautes-alpes.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hautes-Alpes"
        >
          <LHALogo size={104} />
        </a>
      </div>
      <div className="hero-rule" aria-hidden="true" />
      <div className="hero-content">
        <div className="intro-eyebrow">Stressor-Blootstellings-Index</div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
        <p className="intro-lead">
          Een dagelijkse meting van 24 omstandigheden die op de hele bevolking
          inwerken. Niet voor jou persoonlijk. Voor het hele land.
        </p>
        <div className="intro-meta">
          Barometer · {weekIso} · {today}
        </div>
      </div>
    </header>
  );
}
```

## `app/web/src/components/IndicatorList.tsx`

```tsx
import { useState } from "react";
import type { IndicatorBreakdown, DomainCode } from "../types";
import { DOMAIN_LABELS } from "../copy";
import { stateColor, stateLabel, stateIcon } from "./indicator-utils";
import { formatObservationDate, observationGranularity } from "../lib/format-date";

const DOMAIN_SUBTITLES: Record<DomainCode, string> = {
  D1: "Hoe de buitenwereld vandaag aanvoelt",
  D2: "Hoe makkelijk of zwaar verplaatsen vandaag is",
  D3: "De druk van geld en prijzen op het gezin",
  D4: "Wat werk en gezin van ons vragen deze week",
  D5: "Wat er in het nieuws en in het land gebeurt",
  D6: "Waar we in de week en het jaar zitten",
};

function IndicatorRow({ ind }: { ind: IndicatorBreakdown }) {
  const [open, setOpen] = useState(false);
  const color = stateColor(ind.state);
  return (
    <div className={`ind-row ind-state-${ind.state}`}>
      <button
        className="ind-row-summary"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="ind-icon" style={{ color }} aria-hidden="true">
          {stateIcon(ind.state)}
        </span>
        <span className="ind-name">{ind.plain_name}</span>
        <span className="ind-state" style={{ color }}>{stateLabel(ind.state)}</span>
        <span className="ind-toggle">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="ind-detail">
          <p className="ind-why">{ind.why}</p>

          <div className="ind-meta-grid">
            <div className="ind-meta-cell">
              <div className="ind-meta-label">Wat we uitlezen</div>
              <div className="ind-meta-value">{ind.reads}</div>
            </div>
            {ind.raw_value !== null && (
              <div className="ind-meta-cell">
                <div className="ind-meta-label">Gemeten waarde</div>
                <div className="ind-meta-value">
                  <strong>{formatValue(ind.raw_value, ind.unit)}</strong> {ind.unit}
                </div>
              </div>
            )}
            <div className="ind-meta-cell">
              <div className="ind-meta-label">
                {observationGranularity(ind.observation_date) === "maand"
                  ? "Maandcijfer van"
                  : "Cijfer van"}
              </div>
              <div className="ind-meta-value">
                {formatObservationDate(ind.observation_date)}
              </div>
            </div>
            <div className="ind-meta-cell">
              <div className="ind-meta-label">Raakt naar schatting</div>
              <div className="ind-meta-value">
                <strong>{Math.round(ind.demographic_reach * 100)}%</strong> van de bevolking
              </div>
            </div>
          </div>

          <p className="ind-reach-rationale">{ind.reach_rationale}</p>

          <div className="ind-sources">
            <div className="ind-source-block">
              <div className="ind-source-label">Databron</div>
              <a className="ind-source-link" href={ind.data_source.url} target="_blank" rel="noopener noreferrer">
                {ind.data_source.name} ↗
              </a>
              {ind.simulated && <span className="ind-mock-tag">demo-data</span>}
            </div>

            {ind.references.length > 0 && (
              <div className="ind-source-block">
                <div className="ind-source-label">Wetenschappelijke onderbouwing</div>
                <ul className="ind-refs">
                  {ind.references.map((ref, i) => (
                    <li key={i}>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer">
                        {ref.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(v: number, unit: string): string {
  if (unit.includes("%") || unit.includes("€/liter")) return v.toFixed(2);
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function IndicatorList({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const byDomain = (["D1", "D2", "D3", "D4", "D5", "D6"] as DomainCode[]).map((d) => ({
    domain: d,
    indicators: breakdown.filter((b) => b.domain === d),
  }));

  return (
    <section className="indicator-list">
      <header className="indicator-list-header">
        <h2>Wat we allemaal bekijken</h2>
        <p className="panel-lead">
          We tellen 24 dingen mee. Klik er één open om te zien wat we precies meten,
          waar de data vandaan komt en welke wetenschappelijke onderbouwing erachter zit.
        </p>
      </header>

      {byDomain.map(({ domain, indicators }) => (
        <div key={domain} className="domain-group">
          <div className={`domain-group-header dh-${domain}`}>
            <div className="domain-group-code">{domain}</div>
            <div className="domain-group-name">{DOMAIN_LABELS[domain]}</div>
            <div className="domain-group-sub">{DOMAIN_SUBTITLES[domain]}</div>
          </div>
          <div className="ind-rows">
            {indicators.map((ind) => (
              <IndicatorRow key={ind.code} ind={ind} />
            ))}
          </div>
        </div>
      ))}

      <footer className="indicator-list-footer">
        <p>
          <strong>Hoe lees je dit?</strong>{" "}
          <span style={{ color: "var(--c-green)" }}>○ lager dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-ink-mute)" }}>● gemiddeld</span>
          {" · "}
          <span style={{ color: "var(--c-amber)" }}>▲ hoger dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-red)" }}>▲▲ uitzonderlijk hoog</span>
        </p>
        <p className="muted small">
          Met "gemiddeld" bedoelen we: vergeleken met dezelfde periode in de afgelopen twee jaar.
          Een aantal metingen draait nog op test-data, die zijn gemarkeerd met <em>demo-data</em>.
          Echte data komt er stap voor stap bij.
        </p>
      </footer>
    </section>
  );
}
```

## `app/web/src/components/IndicatorZView.tsx`

```tsx
import { useState } from "react";
import type { IndicatorBreakdown } from "../types";
import { DOMAIN_LABELS } from "../copy";

/**
 * Z-thermometer per indicator.
 * Toont voor elke indicator real-time hoe ver hij staat van Z = +1
 * (de drempel waarboven hij actief bijdraagt aan banner-activatie).
 *
 * Bar-schaal: -3 tot +3.
 * Zones: groen (Z < -1), grijs (-1 ≤ Z < 1), oranje (1 ≤ Z < 2), rood (Z ≥ 2).
 * Drempel-markers op Z = +1 (banner-bijdrage) en Z = +2 (zware bijdrage).
 */

const Z_MIN = -3;
const Z_MAX = 3;

function zToPercent(z: number): number {
  // Clamp en map naar 0-100% van bar-breedte
  const clamped = Math.max(Z_MIN, Math.min(Z_MAX, z));
  return ((clamped - Z_MIN) / (Z_MAX - Z_MIN)) * 100;
}

function zoneColor(z: number): string {
  if (z >= 2) return "var(--st-alert)";
  if (z >= 1) return "var(--lha-sun)";
  if (z >= -1) return "var(--lha-mist)";
  return "var(--st-rust)";
}

function distanceLabel(z: number | null): string {
  if (z === null) return "geen data";
  if (z >= 2) return "in extreem-zone";
  if (z >= 1) return "draagt actief bij";
  if (z >= 0) {
    const d = 1 - z;
    return `${d.toFixed(1)} Z onder drempel`;
  }
  const d = 1 - z;
  return `${d.toFixed(1)} Z onder drempel`;
}

function ZThermometer({ ind }: { ind: IndicatorBreakdown }) {
  if (ind.z_short === null) {
    return (
      <div className="zth zth-missing">
        <div className="zth-header">
          <span className="zth-code">{ind.code}</span>
          <span className="zth-name">{ind.plain_name}</span>
          <span className="zth-z-missing">geen data</span>
        </div>
      </div>
    );
  }

  const pct = zToPercent(ind.z_short);
  const color = zoneColor(ind.z_short);
  const dist = distanceLabel(ind.z_short);

  return (
    <div className="zth">
      <div className="zth-header">
        <span className="zth-code">{ind.code}</span>
        <span className="zth-name">{ind.plain_name}</span>
        <span className="zth-value">
          {ind.raw_value !== null ? `${ind.raw_value}` : ""}{" "}
          <span className="zth-unit">{ind.unit}</span>
        </span>
      </div>
      <div className="zth-bar-wrap">
        {/* Zones achtergrond */}
        <div className="zth-zone zth-zone-cold" style={{ left: 0, width: `${zToPercent(-1)}%` }} />
        <div className="zth-zone zth-zone-normal" style={{ left: `${zToPercent(-1)}%`, width: `${zToPercent(1) - zToPercent(-1)}%` }} />
        <div className="zth-zone zth-zone-warn" style={{ left: `${zToPercent(1)}%`, width: `${zToPercent(2) - zToPercent(1)}%` }} />
        <div className="zth-zone zth-zone-alert" style={{ left: `${zToPercent(2)}%`, width: `${100 - zToPercent(2)}%` }} />

        {/* Drempel-markers */}
        <div className="zth-marker zth-marker-threshold" style={{ left: `${zToPercent(1)}%` }} title="Z = +1: banner-bijdrage" />
        <div className="zth-marker zth-marker-extreme" style={{ left: `${zToPercent(2)}%` }} title="Z = +2: zware bijdrage" />

        {/* Huidige positie */}
        <div className="zth-dot" style={{ left: `${pct}%`, background: color }} />

        {/* As-labels */}
        <div className="zth-axis">
          <span style={{ left: `${zToPercent(-2)}%` }}>−2</span>
          <span style={{ left: `${zToPercent(-1)}%` }}>−1</span>
          <span style={{ left: "50%" }}>0</span>
          <span style={{ left: `${zToPercent(1)}%` }}>+1</span>
          <span style={{ left: `${zToPercent(2)}%` }}>+2</span>
        </div>
      </div>
      <div className="zth-footer">
        <span className="zth-z" style={{ color }}>Z = {ind.z_short >= 0 ? "+" : ""}{ind.z_short.toFixed(2)}</span>
        <span className="zth-dist">{dist}</span>
      </div>
    </div>
  );
}

export function IndicatorZView({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"contribution" | "domain">("contribution");

  // Sort indicators
  const sorted = [...breakdown];
  if (sortMode === "contribution") {
    sorted.sort((a, b) => {
      const za = a.z_short ?? -99;
      const zb = b.z_short ?? -99;
      return zb - za; // hoogste Z eerst (sterkste bijdrage)
    });
  } else {
    sorted.sort((a, b) => a.code.localeCompare(b.code));
  }

  // Count contributors
  const activeContributors = breakdown.filter((b) => (b.z_short ?? 0) >= 1).length;
  const heavyContributors = breakdown.filter((b) => (b.z_short ?? 0) >= 2).length;

  return (
    <section className="panel zview-panel">
      <button
        className="zview-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="zview-toggle-icon">{open ? "−" : "+"}</span>
        <span className="zview-toggle-text">
          <strong>Expert-view: bijdrage per indicator</strong>
        </span>
        <span className="zview-toggle-icon zview-toggle-icon-right" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="zview-body">
          <p className="zview-lead">
            Hoe ver staat elk onderdeel van de drempel waarboven het meedraagt aan
            banner-activatie? Z = 0 is "gemiddeld voor dit seizoen", Z ≥ +1 is "hoger
            dan gewoonlijk en draagt bij", Z ≥ +2 is "uitzonderlijk hoog".
          </p>

          <div className="zview-sort">
            <span>Sortering:</span>
            <button
              className={sortMode === "contribution" ? "active" : ""}
              onClick={() => setSortMode("contribution")}
            >
              naar grootste bijdrage
            </button>
            <button
              className={sortMode === "domain" ? "active" : ""}
              onClick={() => setSortMode("domain")}
            >
              naar categorie
            </button>
          </div>

          <div className="zview-legend">
            <span><i className="lg-cold" /> lager dan gewoonlijk (Z &lt; −1)</span>
            <span><i className="lg-normal" /> gemiddeld (−1 tot +1)</span>
            <span><i className="lg-warn" /> hoger dan gewoonlijk (Z ≥ +1)</span>
            <span><i className="lg-alert" /> uitzonderlijk hoog (Z ≥ +2)</span>
          </div>

          <div className="zview-list">
            {sorted.map((ind) => (
              <ZThermometer key={ind.code} ind={ind} />
            ))}
          </div>

          <p className="zview-footer-note">
            Banner-activatie vereist dat het <strong>gewogen composiet</strong> 3 dagen
            op rij in de top-30% (P ≥ 70) van de laatste 24 maanden zit, plus brand-safety
            normaal. Geen enkele indicator triggert op zichzelf, maar elke balk hierboven
            laat zien welke vandaag bijdragen.
          </p>
        </div>
      )}
    </section>
  );
}
```

## `app/web/src/components/LHALogo.tsx`

```tsx
/**
 * Officieel Hautes-Alpes logo — witte wordmark, bedoeld voor een
 * donkere achtergrond (groene header / footer).
 * Bestand: app/web/public/hautes-alpes-logo.png
 */
export function LHALogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/hautes-alpes-logo.png"
      alt="Hautes-Alpes"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: "auto" }}
    />
  );
}
```

## `app/web/src/components/Methodology.tsx`

```tsx
import { METHODOLOGY_DISCLAIMER } from "../copy";

export function Methodology() {
  return (
    <section className="panel methodology">
      <h2>Wat dit is, en wat dit niet is</h2>
      {METHODOLOGY_DISCLAIMER.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      <ul className="methodology-do-dont">
        <li><strong>Wat we doen:</strong> we kijken naar 24 dingen die met stress te maken hebben, en tellen hoe ongewoon ze vandaag zijn, over heel België.</li>
        <li><strong>Wat we NIET doen:</strong> we kijken niet of jij persoonlijk stress hebt. We zijn geen dokter. We voorspellen niets.</li>
        <li><strong>Hoe vergelijken we?</strong> Met de afgelopen 24 maanden voor dezelfde tijd van het jaar. Een zomerdag wordt vergeleken met zomerdagen, geen winterdagen.</li>
      </ul>

      <details>
        <summary>Voor wie wil weten hoe het cijfer tot stand komt</summary>
        <ol className="methodology-steps">
          <li>We tellen 24 indicatoren, verdeeld over 6 categorieën (weer, verkeer, economie, werk/gezin, nieuws, kalender).</li>
          <li>Voor elke indicator vergelijken we de waarde van vandaag met wat normaal is voor dit moment in het jaar.</li>
          <li>We corrigeren voor seizoens-effecten waar dat zinvol is (bv. files in juli zijn anders dan files in november).</li>
          <li>We tellen alles op, met gewichten die rekening houden met hoeveel wetenschappelijk onderzoek de link met stress ondersteunt.</li>
          <li>Pas als het cijfer minstens drie dagen op rij boven een drempel zit, gaat het "venster" open. Eén slechte dag verandert het cijfer niet meteen.</li>
          <li>Alle keuzes (drempels, gewichten, formules) staan vooraf vast en zijn publiek, niemand kan ze achteraf bijsturen om een gewenste uitkomst te maken.</li>
        </ol>
      </details>
    </section>
  );
}
```

## `app/web/src/components/MountainDivider.tsx`

```tsx
/**
 * Berg-silhouet divider — gebruikt als visuele scheiding tussen secties.
 * Lichte en donkere variant.
 */

export function MountainDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={`mountain-divider ${inverted ? "inverted" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path
          d="M0,80 L0,55 L120,30 L200,50 L300,15 L380,35 L460,20 L540,40 L640,8 L740,32 L820,18 L920,45 L1020,25 L1100,42 L1200,30 L1200,80 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/** Kleine berg-icoon voor inline gebruik. */
export function MountainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 21 L9 10 L13 16 L16 12 L21 21 Z" />
      <circle cx="17" cy="6" r="2.5" />
    </svg>
  );
}
```

## `app/web/src/components/PercentileDisplay.tsx`

```tsx
interface Props {
  shortP: number;
  fixedP: number;
  composite: number;
  evidenceComposite: number;
  demographicComposite?: number;
}

export function PercentileDisplay({ shortP, fixedP, composite, evidenceComposite, demographicComposite }: Props) {
  return (
    <div className="percentile-display">
      <div className="percentile-main">
        <div className="percentile-label">PERCENTIEL · 24m</div>
        <div className="percentile-value">P {shortP}</div>
        <div className="percentile-context">
          Positie binnen de verdeling van de laatste 24 maanden.
        </div>
      </div>

      <div className="percentile-meta">
        <div className="meta-row">
          <span className="meta-key">Composiet (equal weights)</span>
          <span className="meta-value">{composite.toFixed(2)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-key">Composiet (evidence-graded)</span>
          <span className="meta-value">{evidenceComposite.toFixed(2)}</span>
        </div>
        {demographicComposite !== undefined && (
          <div className="meta-row">
            <span className="meta-key">Composiet (demografische weging)</span>
            <span className="meta-value">{demographicComposite.toFixed(2)}</span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-key">Percentiel · 2010–2019 baseline</span>
          <span className="meta-value">P {fixedP}</span>
        </div>
      </div>

      <div className="percentile-disclaimer">
        Geen klassieke σ-Z. MAD-gebaseerd. Doc 04 §2.5.
      </div>
    </div>
  );
}
```

## `app/web/src/components/PlainExplainer.tsx`

```tsx
import type { DailyOutput } from "../types";
import { buildContext, buildHeadline, buildBody } from "../lib/explainer";

/**
 * Context-bewust uitleg-blok.
 * Headline + body worden dynamisch gebouwd uit:
 *  - condition_level (1-5)
 *  - percentile (24m baseline)
 *  - aantal indicatoren in elke zone (lager/gemiddeld/hoger/extreem)
 *  - top-bijdragende indicatoren
 *  - brand-safety-vlag
 *
 * Taalregister: neutraal informerend, 15-jarig niveau.
 */
export function PlainExplainer({ data }: { data: DailyOutput }) {
  const ctx = buildContext(data);
  const headline = buildHeadline(ctx);
  const body = buildBody(ctx);

  return (
    <section className="plain-explainer">
      <h2>{headline}</h2>
      <p dangerouslySetInnerHTML={{ __html: formatMarkdownBold(body) }} />
      <p className="plain-explainer-context">
        Hieronder zie je precies <strong>welke 24 dingen we vandaag bekijken</strong>,
        en hoe ze er nu voor staan vergeleken met gewoonlijk.
      </p>
    </section>
  );
}

/** Simpele **bold** rendering — buildBody returns markdown-light met **name**. */
function formatMarkdownBold(text: string): string {
  // Escape HTML eerst
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
```

## `app/web/src/components/PreviewPage.tsx`

```tsx
import type { ConditionLevel } from "../types";

/**
 * /preview — toont alle 5 CN-banners naast elkaar.
 * Gebruik door klanten / abonnees om hun banner-integratie te valideren.
 */

interface BannerSpec {
  level: ConditionLevel;
  name: string;
  bannerActive: boolean;
  headline: string;
  body: string;
  action: string | null;
  notes: string;
}

const BANNERS: BannerSpec[] = [
  {
    level: 1,
    name: "Rust",
    bannerActive: false,
    headline: "",
    body: "Geen banner-activatie. Omstandigheden binnen rustband.",
    action: null,
    notes: "Banner-script rendert niets. Geen kosten, geen visuele ruis.",
  },
  {
    level: 2,
    name: "Normaal",
    bannerActive: false,
    headline: "",
    body: "Geen banner-activatie. Omstandigheden binnen normale band.",
    action: null,
    notes: "Banner-script rendert niets.",
  },
  {
    level: 3,
    name: "Venster opent",
    bannerActive: true,
    headline: "Verhoogd-blootstellings-venster open.",
    body: "Wanneer de condities verhoogd zijn, weegt rust extra zwaar.",
    action: "Tijd voor rust →",
    notes: "Standaard banner-set. Geactiveerd na 3 dagen P 70-89.",
  },
  {
    level: 4,
    name: "Conditie-piek",
    bannerActive: true,
    headline: "Blootstellings-conditie op piekniveau.",
    body: "Statistisch gezien is dit een goed moment voor herstel, preventief, terwijl het kan.",
    action: "Bekijk de bestemmingen →",
    notes: "Verhoogde banner-set. Geactiveerd na 3 dagen P≥90.",
  },
  {
    level: 5,
    name: "Brand-safety actief",
    bannerActive: false,
    headline: "",
    body: "De SBI registreert de impact van de actuele gebeurtenis op blootstellings-condities. Commerciële communicatie is opgeschort.",
    action: null,
    notes: "Override-modus. Geen commerciële banner. Wel kan de meting publiek getoond worden.",
  },
];

function BannerPreview({ spec }: { spec: BannerSpec }) {
  return (
    <div className={`preview-card cn-level-${spec.level}`}>
      <div className="preview-card-header">
        <div className="preview-cn">
          CN {spec.level}
          <span className="preview-cn-name">{spec.name}</span>
        </div>
        <div className={`preview-status ${spec.bannerActive ? "on" : "off"}`}>
          banner: {spec.bannerActive ? "aan" : "uit"}
        </div>
      </div>

      <div className="preview-banner-wrap">
        {spec.bannerActive ? (
          <div className={`banner-render banner-render-${spec.level}`}>
            <div className="banner-render-mark">LES HAUTES ALPES</div>
            <div className="banner-render-headline">{spec.headline}</div>
            <div className="banner-render-body">{spec.body}</div>
            {spec.action && <div className="banner-render-action">{spec.action}</div>}
          </div>
        ) : (
          <div className="banner-render banner-render-off">
            <div className="banner-render-body">{spec.body}</div>
          </div>
        )}
      </div>

      <div className="preview-notes">{spec.notes}</div>
    </div>
  );
}

export function PreviewPage() {
  return (
    <div className="preview-page">
      <header className="preview-header">
        <div className="brand-name">SBI · BAROMETER</div>
        <h1>Banner-preview, alle 5 conditie-niveaus</h1>
        <p className="muted">
          Voor abonnees: zo ziet de banner eruit op elk van de 5 conditie-niveaus.
          De banner-snippet wisselt automatisch tussen deze states op basis van de
          live SBI-meting. Copy is bevroren volgens doc 09.
        </p>
      </header>

      <div className="preview-grid">
        {BANNERS.map((spec) => (
          <BannerPreview key={spec.level} spec={spec} />
        ))}
      </div>

      <section className="panel">
        <h2>Embedden op uw site</h2>
        <p className="panel-lead">Plak dit ergens binnen je &lt;body&gt; tag:</p>
        <pre className="code-block">{`<div id="sbi-banner"></div>
<script src="https://barometer.sbi/embed/banner.js" defer></script>
<script>
  window.addEventListener('load', () => SBI.mount({
    target: '#sbi-banner',
    apiUrl: '/data/latest.json',   // production: https://barometer.sbi/api/v1/signal
    brand: 'Les Hautes Alpes',
    ctaUrl: 'https://www.hautes-alpes.net'
  }));
</script>`}</pre>
        <p className="muted small">
          De banner werkt voor alle 5 niveaus. Bij CN 1, 2 en 5 toont hij niets, dat is
          gewenst gedrag. Brand-safety-override is automatisch.
        </p>
      </section>

      <p className="preview-back">
        <a href="/">← terug naar live barometer</a>
      </p>
    </div>
  );
}
```

## `app/web/src/components/SecondarySignals.tsx`

```tsx
import type { SecondarySignal } from "../types";
import { formatObservationDate } from "../lib/format-date";

/**
 * Secundaire signalen — sensitiviteit, NIET in het composiet.
 * Expliciet gelabeld als experimenteel en niet-representatief.
 * Bron: doc 02 §10 secundaire set.
 */
export function SecondarySignals({ signals }: { signals: SecondarySignal[] }) {
  if (!signals || signals.length === 0) return null;

  return (
    <section className="panel secondary-panel">
      <div className="secondary-badge">SECUNDAIR · NIET IN HET CIJFER</div>
      <h2>Onderstroom-peiling</h2>
      <p className="panel-lead">
        Dit zijn <strong>experimentele signalen</strong> die we apart meten maar
        die <strong>bewust niet meetellen</strong> in het stress-cijfer 1 tot 5 of
        in de banner-activatie. Sociale media zijn geen doorsnede van de bevolking,
        dus ze horen methodologisch niet in de officiële meting (doc 02 §8).
        We tonen ze hier alleen ter vergelijking.
      </p>

      <div className="secondary-list">
        {signals.map((s) => (
          <div key={s.code} className="secondary-item">
            <div className="secondary-item-head">
              <span className="secondary-name">{s.name}</span>
              <span className="secondary-value">{s.value.toFixed(2)}</span>
            </div>
            <div className="secondary-meta">
              <span className="secondary-code">{s.code}</span>
              <span>Gemeten: {formatObservationDate(s.observation_date)}</span>
              {s.simulated && <span className="secondary-mock">demo-data</span>}
            </div>
            <div className="secondary-source">{s.source}</div>
          </div>
        ))}
      </div>

      <p className="secondary-disclaimer">
        Waarom apart? Deze signalen zijn vers en nuttig, maar missen een lange
        eigen meetlat of een representatieve doorsnede van de bevolking. De
        Reddit-peiling steunt op een publiek dat jonger, stedelijker en hoger
        opgeleid is dan de gemiddelde Belg. De ontslag-radar telt nieuwsartikels
        en kan uitschieten wanneer er veel duiding rond één gebeurtenis is.
        Daarom: zichtbaar voor wie nieuwsgierig is, maar bewust buiten het
        officiële cijfer gehouden. Lees per signaal de bronregel hieronder.
      </p>
    </section>
  );
}
```

## `app/web/src/components/Sections.tsx`

```tsx
import type { DailyOutput } from "../types";
import { FOOTER_NOTES } from "../copy";

export function MEDIA_DIAGNOSTIC({ diagnostic }: { diagnostic: DailyOutput["media_cluster_diagnostic"] }) {
  return (
    <section className="panel media-diagnostic">
      <h2>Mediacyclus-diagnostiek</h2>
      <p className="panel-lead">
        Het composiet zonder D5 (media & collectieve gebeurtenissen), naast de 7-daagse
        cross-correlatie tussen nieuwsnegativiteit en collectieve gebeurtenissen.
        Bron: doc 03 §4.4.
      </p>
      <div className="md-grid">
        <div className="md-cell">
          <div className="md-label">Composiet zonder D5</div>
          <div className="md-value">{diagnostic.composite_without_d5.toFixed(2)}</div>
        </div>
        <div className="md-cell">
          <div className="md-label">Cross-correlatie 7d (D5-001 ↔ D5-003)</div>
          <div className={`md-value ${Math.abs(diagnostic.d5_cross_correlation_7d) > 0.7 ? "warn" : ""}`}>
            {diagnostic.d5_cross_correlation_7d.toFixed(2)}
          </div>
          {Math.abs(diagnostic.d5_cross_correlation_7d) > 0.7 && (
            <div className="md-warn">D5-gewicht automatisch gehalveerd deze week (auto-decorrelatie).</div>
          )}
        </div>
        <div className="md-cell">
          <div className="md-label">Media-bijdrage (percentielpunten)</div>
          <div className="md-value">{diagnostic.media_contribution_percentile_points}</div>
        </div>
      </div>
    </section>
  );
}

export function FOOTER({ methodologyVersion }: { methodologyVersion: string }) {
  return (
    <footer className="footer">
      <div className="footer-row">
        <span>SBI v{methodologyVersion}</span>
        <span>·</span>
        <span>{FOOTER_NOTES.implementationStage}</span>
      </div>
      <div className="footer-row muted">{FOOTER_NOTES.methodologyRef}</div>
      <div className="footer-row muted small">{FOOTER_NOTES.ondersteunend}</div>
      <div className="footer-row muted small">
        Methodologie open: zie documenten 00–09 in projectroot. Code: open source.
      </div>
    </footer>
  );
}
```

## `app/web/src/components/Sparkline.tsx`

```tsx
import type { SparklinePoint } from "../types";

const W = 720;
const H = 200;
const PAD = { top: 20, right: 12, bottom: 28, left: 36 };

export function Sparkline({ points }: { points: SparklinePoint[] }) {
  if (points.length < 2) return <div className="muted">Onvoldoende data voor sparkline.</div>;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const percs = points.map((p) => p.percentile);
  const minP = 0;
  const maxP = 100;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (p: number) => PAD.top + innerH - ((p - minP) / (maxP - minP)) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.percentile).toFixed(1)}`)
    .join(" ");

  // Drempel-lijnen
  const y70 = y(70);
  const y90 = y(90);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" role="img" aria-label="60-daagse percentielverloop">
      {/* Achtergrond-banden */}
      <rect x={PAD.left} y={y90} width={innerW} height={Math.max(0, PAD.top + innerH - y90)} className="band-red" />
      <rect x={PAD.left} y={y70} width={innerW} height={y90 - y70} className="band-amber" />
      <rect x={PAD.left} y={PAD.top} width={innerW} height={y70 - PAD.top} className="band-green" />

      {/* Drempels */}
      <line x1={PAD.left} y1={y70} x2={W - PAD.right} y2={y70} className="threshold-line" />
      <line x1={PAD.left} y1={y90} x2={W - PAD.right} y2={y90} className="threshold-line" />
      <text x={W - PAD.right - 4} y={y70 - 4} className="threshold-label" textAnchor="end">P 70</text>
      <text x={W - PAD.right - 4} y={y90 - 4} className="threshold-label" textAnchor="end">P 90</text>

      {/* Y-as labels */}
      <text x={PAD.left - 8} y={PAD.top + 4} className="axis-label" textAnchor="end">100</text>
      <text x={PAD.left - 8} y={PAD.top + innerH + 4} className="axis-label" textAnchor="end">0</text>

      {/* Lijn */}
      <path d={path} className="spark-path" fill="none" />

      {/* Punten */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(p.percentile)}
          r={i === points.length - 1 ? 4 : 1.5}
          className={`spark-dot dot-${p.tier}`}
        >
          <title>{`${p.date}: P=${p.percentile}, tier=${p.tier}`}</title>
        </circle>
      ))}

      {/* X-as eerste/laatste */}
      <text x={PAD.left} y={H - 8} className="axis-label" textAnchor="start">{points[0].date}</text>
      <text x={W - PAD.right} y={H - 8} className="axis-label" textAnchor="end">{points[points.length - 1].date}</text>
    </svg>
  );
}
```

## `app/web/src/components/TierIndicator.tsx`

```tsx
import type { Tier } from "../types";
import { TIER_HEADLINE, TIER_SUBLINE } from "../copy";

export function TierIndicator({ tier, daysInTier }: { tier: Tier; daysInTier: number }) {
  return (
    <div className={`tier-indicator tier-${tier}`}>
      <div className="tier-light">
        <div className={`tier-dot tier-dot-${tier}`} aria-label={`tier ${tier}`} />
      </div>
      <div className="tier-text">
        <div className="tier-label">
          {tier === "green" && "GROEN · BAND NORMAAL"}
          {tier === "amber" && "ORANJE · VENSTER OPEN"}
          {tier === "red" && "ROOD · CONDITIE-PIEK"}
        </div>
        <h1 className="tier-headline">{TIER_HEADLINE[tier]}</h1>
        <p className="tier-subline">{TIER_SUBLINE[tier]}</p>
        {tier !== "green" && (
          <div className="tier-meta">Dag {daysInTier} in deze tier.</div>
        )}
      </div>
    </div>
  );
}
```

## `app/web/src/components/TopInfluences.tsx`

```tsx
import type { IndicatorBreakdown } from "../types";
import { stateColor, stateLabel } from "./indicator-utils";

/**
 * "Wat weegt vandaag het zwaarst" — top 3 indicatoren naar absolute bijdrage.
 * 15-jarig taalniveau.
 */
export function TopInfluences({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const top = [...breakdown]
    .filter((b) => b.state !== "ontbreekt")
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="panel top-influences">
      <h2>Wat speelt vandaag het meest mee?</h2>
      <p className="panel-lead">
        Van de 24 dingen die we bekijken, zijn dit de drie die vandaag de meeste
        invloed hebben op het cijfer.
      </p>
      <ol className="top-list">
        {top.map((ind, i) => (
          <li key={ind.code} className="top-item">
            <div className="top-rank">{i + 1}</div>
            <div className="top-body">
              <div className="top-name">{ind.plain_name}</div>
              <div className="top-state" style={{ color: stateColor(ind.state) }}>
                {stateLabel(ind.state)}
              </div>
              <div className="top-why">{ind.why}</div>
            </div>
            <div className="top-direction">
              {ind.contribution > 0 ? "↑ duwt omhoog" : "↓ duwt omlaag"}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

## `app/web/src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

## `app/web/src/styles.css`

```css
/* ============================================================
   Hautes-Alpes · Barometer
   Visueel register: minimalistisch, rustig — in lijn met
   plus.hautes-alpes.net. Wit + zachte grijzen, één alpine-groen
   accent (#29441f). Typografie: Ubuntu. Pill-vormige knoppen.
   ============================================================ */

:root {
  /* plus.hautes-alpes.net — palet (variabelenamen behouden voor de
     bestaande regels; waarden herijkt naar het nieuwe, kalme register) */
  --lha-blue-deep:   #29441f;   /* alpine-groen — primair accent */
  --lha-blue-mid:    #1d3216;   /* donkerder groen — hover/header */
  --lha-blue-soft:   #3c5c2e;   /* mid-groen */
  --lha-sky:         #eaeee7;   /* zacht groen-getint licht */
  --lha-sky-pale:    #f7f8f9;   /* zachte sectie-achtergrond */
  --lha-snow:        #ffffff;   /* puur wit */
  --lha-sun:         #c98a3c;   /* gedempt amber — secundair accent */
  --lha-sun-soft:    #e0b375;   /* zacht amber */
  --lha-stone:       #22252a;   /* inkt, donkere tekst */
  --lha-stone-soft:  #52565b;   /* zachte tekst */
  --lha-mist:        #9ca3af;   /* gedempt grijs */
  --lha-fog:         #e5e7eb;   /* haarlijn-grijs */

  /* Status-kleuren — gedempt, kalm */
  --st-rust:   #4f7a5b;         /* rustig groen */
  --st-norm:   var(--lha-mist);
  --st-warn:   #c98a3c;         /* gedempt amber */
  --st-alert:  #a64242;         /* gedempt rood */

  /* Aliassen voor de bestaande code */
  --c-ink:        var(--lha-stone);
  --c-ink-soft:   var(--lha-stone-soft);
  --c-ink-mute:   var(--lha-mist);
  --c-paper:      var(--lha-snow);
  --c-paper-warm: var(--lha-sky-pale);
  --c-line:       var(--lha-fog);
  --c-line-soft:  #eef0f2;
  --c-deep:       var(--lha-blue-deep);
  --c-ice:        var(--lha-sky);
  --c-mist:       var(--lha-sky-pale);
  --c-sand:       var(--lha-snow);

  --c-green:      var(--st-rust);
  --c-green-bg:   #eaf1ec;
  --c-amber:      var(--st-warn);
  --c-amber-bg:   #f7efe1;
  --c-red:        var(--st-alert);
  --c-red-bg:     #f3e6e6;

  --c-shadow:     rgb(0 0 0 / 0.05);
  --c-shadow-lg:  rgb(0 0 0 / 0.09);

  --rad: 8px;
  --rad-lg: 12px;
  --rad-pill: 9999px;

  --max-w: 1040px;

  --f-display: "Ubuntu", system-ui, -apple-system, sans-serif;
  --f-sans: "Ubuntu", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --f-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--lha-snow);
  color: var(--c-ink);
  font-family: var(--f-sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

code, .mono { font-family: var(--f-mono); font-size: 0.9em; }
.muted { color: var(--c-ink-mute); }
.small { font-size: 0.85em; }

.app {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* ============================================================
   SITE-HEADER — geblurde alpenfoto, gecentreerd logo, tekst erop
   ============================================================ */
.site-header {
  position: relative;
  overflow: hidden;
  background: var(--lha-blue-mid);
}
/* achtergrondfoto — apart laag zodat de blur de tekst niet raakt */
.hero-bg {
  position: absolute;
  inset: -28px;
  background-image:
    url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80");
  background-size: cover;
  background-position: center 50%;
  filter: blur(6px) saturate(1.02);
  transform: scale(1.07);
}
/* groene tint over de foto — houdt de tekst leesbaar en rustig */
.hero-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(29, 50, 22, 0.60) 0%,
    rgba(29, 50, 22, 0.50) 52%,
    rgba(29, 50, 22, 0.80) 100%);
}
.hero-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 34px 32px 26px;
}
.site-logo { display: inline-flex; }
.site-logo img { display: block; height: 104px; width: auto; }
/* dunne scheidingslijn onder het logo, volle breedte */
.hero-rule {
  position: relative;
  z-index: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.32);
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 32px 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
}

.site-back {
  position: absolute;
  top: 18px;
  right: 22px;
  z-index: 2;
  font-family: var(--f-sans);
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--rad-pill);
  padding: 7px 15px;
  white-space: nowrap;
  backdrop-filter: blur(3px);
  transition: background 0.15s ease;
}
.site-back:hover { background: rgba(255, 255, 255, 0.16); }

.intro-eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
  margin-bottom: 14px;
}
.intro-title {
  font-family: var(--f-display);
  font-weight: 300;
  /* schaalt mee zodat de titel altijd op één regel past */
  font-size: clamp(1.35rem, 4.3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #fff;
  margin: 0;
  white-space: nowrap;
}
.intro-lead {
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 18px auto 0;
  max-width: 48ch;
  text-wrap: balance;
}
.intro-meta {
  margin-top: 22px;
  font-size: 0.78rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

/* ============================================================
   MAIN CONTENT — sober
   ============================================================ */
main {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 32px 80px;
}

/* ============================================================
   CONDITIE-NIVEAU — overlapt deels met hero
   ============================================================ */
.cn-display {
  margin-top: -56px;
  margin-bottom: 36px;
  padding: 40px 40px 32px;
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  color: var(--c-ink);
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px var(--c-shadow);
  border: 1px solid var(--c-line);
  z-index: 2;
}
.cn-display.cn-level-3,
.cn-display.cn-level-4 {
  background: var(--lha-snow);
}
.cn-display.cn-level-5 {
  background: #f1efea;
}

.cn-label {
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  color: var(--lha-blue-deep);
  margin-bottom: 18px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.cn-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 36px;
  align-items: center;
  position: relative;
  z-index: 1;
}
@media (max-width: 640px) {
  .cn-main { grid-template-columns: auto 1fr; gap: 18px; }
  .cn-side { grid-column: 1 / -1; text-align: left; }
}
.cn-main .cn-scale { justify-content: center; }

.cn-number {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: 7rem;
  line-height: 0.85;
  color: var(--lha-blue-deep);
  letter-spacing: -0.04em;
}
.cn-level-3 .cn-number { color: var(--lha-sun); }
.cn-level-4 .cn-number { color: var(--st-alert); }

.cn-scale {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 0 12px;
}
.cn-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--c-line);
  border: 1px solid var(--c-fog, #d8e1ec);
  transition: all 220ms;
  opacity: 0.4;
}

/* Vaste kleur per positie — gradiënt groen → rood. Toont visueel
   wat 'minder erg' (1) vs 'meest erg' (5) betekent, ook bij inactieve dots. */
.cn-dot-pos-1 { background: var(--st-rust); border-color: var(--st-rust); }
.cn-dot-pos-2 { background: var(--lha-blue-soft); border-color: var(--lha-blue-soft); }
.cn-dot-pos-3 { background: var(--lha-sun); border-color: var(--lha-sun); }
.cn-dot-pos-4 { background: var(--st-alert); border-color: var(--st-alert); }
.cn-dot-pos-5 { background: var(--lha-stone-soft); border-color: var(--lha-stone-soft); }

/* Actieve dots (tot en met huidig niveau) krijgen volle opaciteit */
.cn-dot.active { opacity: 1; }

/* Huidige dot krijgt zachte glow in dezelfde positie-kleur */
.cn-dot.current { transform: scale(1.45); }
.cn-dot-pos-1.current { box-shadow: 0 0 0 5px rgba(74, 124, 89, 0.22); }
.cn-dot-pos-2.current { box-shadow: 0 0 0 5px rgba(45, 109, 165, 0.22); }
.cn-dot-pos-3.current { box-shadow: 0 0 0 5px rgba(232, 168, 84, 0.26); }
.cn-dot-pos-4.current { box-shadow: 0 0 0 5px rgba(176, 58, 58, 0.24); }
.cn-dot-pos-5.current { box-shadow: 0 0 0 5px rgba(74, 90, 115, 0.22); }

.cn-side { text-align: right; }
.cn-kicker {
  font-family: var(--f-sans);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--lha-blue-deep);
  font-weight: 600;
  margin-bottom: 4px;
}
.cn-meta {
  font-family: var(--f-mono);
  font-size: 0.82rem;
  color: var(--lha-mist);
}

.cn-description {
  margin: 26px 0 0;
  font-family: var(--f-display);
  font-weight: 400;
  font-size: 1.25rem;
  line-height: 1.4;
  color: var(--c-ink);
  position: relative;
  z-index: 1;
  max-width: 700px;
}

.cn-secondary {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--c-line);
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--lha-stone-soft);
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.cn-secondary strong {
  color: var(--lha-blue-deep);
  font-family: var(--f-mono);
  font-weight: 500;
}

/* ============================================================
   PLAIN EXPLAINER
   ============================================================ */
.plain-explainer {
  margin-bottom: 32px;
  padding: 32px 36px;
  border-radius: var(--rad-lg);
  background: var(--lha-sky-pale);
  border: 1px solid var(--c-line);
}
.plain-explainer h2 {
  font-family: var(--f-display);
  font-size: 1.75rem;
  font-weight: 500;
  margin: 0 0 14px;
  color: var(--lha-blue-deep);
  letter-spacing: -0.01em;
}
.plain-explainer p {
  color: var(--c-ink);
  font-size: 1.02rem;
  margin: 0 0 10px;
  line-height: 1.65;
}
.plain-explainer-context strong {
  color: var(--lha-blue-deep);
  font-weight: 600;
}

/* ============================================================
   CTA Les Hautes Alpes — vol merk
   ============================================================ */
.cta {
  position: relative;
  background: var(--lha-blue-deep);
  color: var(--lha-snow);
  border-radius: var(--rad-lg);
  padding: 48px 44px;
  margin-bottom: 32px;
  overflow: hidden;
}
.cta::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(0, 0, 0, 0.14) 100%);
  pointer-events: none;
}
.cta-inner { position: relative; z-index: 1; max-width: 580px; }
.cta-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--f-sans);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  color: var(--lha-sun-soft);
  margin-bottom: 18px;
}
.cta-mark .lha-mark-mini {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.cta-headline {
  font-family: var(--f-display);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 400;
  margin: 0 0 14px;
  line-height: 1.15;
  color: var(--lha-snow);
  letter-spacing: -0.01em;
}
.cta-body {
  color: rgba(255, 255, 255, 0.86);
  margin: 0 0 26px;
  font-size: 1.02rem;
  line-height: 1.55;
  max-width: 48ch;
}
.cta-action {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 26px;
  background: var(--lha-snow);
  border: none;
  border-radius: var(--rad-pill);
  color: var(--lha-blue-deep);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 160ms ease, transform 160ms ease;
}
.cta-action:hover {
  background: var(--lha-sky);
  transform: translateY(-1px);
}

/* ============================================================
   PANELS — generic
   ============================================================ */
.panel {
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  padding: 32px 36px;
  margin-bottom: 24px;
  background: var(--lha-snow);
}
.panel h2 {
  font-family: var(--f-sans);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 0 0 14px;
  color: var(--lha-blue-deep);
  font-weight: 600;
}
.panel-lead {
  color: var(--c-ink-soft);
  font-size: 0.95rem;
  margin: 0 0 22px;
  line-height: 1.6;
}

/* ============================================================
   TOP INFLUENCES
   ============================================================ */
.top-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.top-item {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 18px;
  padding: 20px 22px;
  background: var(--lha-sky-pale);
  border-radius: var(--rad);
  align-items: start;
  border-left: 3px solid var(--lha-blue-deep);
  transition: transform 150ms;
}
.top-item:hover { transform: translateX(2px); }
.top-rank {
  font-family: var(--f-display);
  font-size: 2rem;
  color: var(--lha-blue-deep);
  font-weight: 300;
  line-height: 1;
  padding-top: 2px;
}
.top-name {
  font-family: var(--f-sans);
  font-size: 1.08rem;
  font-weight: 600;
  color: var(--c-ink);
  margin-bottom: 4px;
}
.top-state {
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}
.top-why {
  font-size: 0.9rem;
  color: var(--c-ink-soft);
  line-height: 1.55;
}
.top-direction {
  font-family: var(--f-mono);
  font-size: 0.8rem;
  color: var(--lha-stone-soft);
  white-space: nowrap;
  padding-top: 6px;
}

/* ============================================================
   INDICATOR LIST — alle 20
   ============================================================ */
.indicator-list {
  margin-bottom: 28px;
  padding: 36px 36px 28px;
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  border: 1px solid var(--c-line);
}
.indicator-list-header { margin-bottom: 28px; }
.indicator-list-header h2 {
  font-family: var(--f-sans);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 0 0 14px;
  color: var(--lha-blue-deep);
  font-weight: 600;
}

.domain-group {
  margin-bottom: 22px;
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  overflow: hidden;
  background: var(--lha-snow);
}
.domain-group:last-of-type { margin-bottom: 8px; }

/* domein-kop = geblurde fotobanner, een eigen foto per domein */
.domain-group-header {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 14px;
  align-items: center;
  padding: 22px 24px;
}
.domain-group-header::before {
  content: "";
  position: absolute;
  inset: -16px;
  background-size: cover;
  background-position: center;
  filter: blur(4px);
  transform: scale(1.09);
}
.domain-group-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg,
    rgba(29, 50, 22, 0.9) 0%, rgba(29, 50, 22, 0.64) 100%);
}
.domain-group-header > * { position: relative; z-index: 1; }
.dh-D1::before { background-image: url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70"); }
.dh-D2::before { background-image: url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=70"); }
.dh-D3::before { background-image: url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=70"); }
.dh-D4::before { background-image: url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=70"); }
.dh-D5::before { background-image: url("https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=70"); }
.dh-D6::before { background-image: url("https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&q=70"); }
.domain-group-code {
  font-family: var(--f-mono);
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 3px 9px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 4px;
}
.domain-group-name {
  font-family: var(--f-display);
  font-weight: 500;
  color: #fff;
  font-size: 1.18rem;
}
.domain-group-sub {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.85rem;
  text-align: right;
  font-style: italic;
}
@media (max-width: 640px) { .domain-group-sub { display: none; } }

.ind-rows { display: flex; flex-direction: column; padding: 6px 12px 12px; }
.ind-row { border-bottom: 1px solid var(--c-line-soft); }
.ind-row:last-child { border-bottom: none; }
.ind-row-summary {
  display: grid;
  grid-template-columns: 36px 1fr auto 24px;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 14px 8px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 120ms;
  border-radius: 6px;
}
.ind-row-summary:hover { background: var(--lha-sky-pale); }
.ind-icon { font-size: 1.15rem; text-align: center; line-height: 1; }
.ind-name { font-size: 0.98rem; color: var(--c-ink); font-weight: 500; }
.ind-state { font-size: 0.85rem; font-weight: 500; text-align: right; }
.ind-toggle { font-family: var(--f-mono); color: var(--lha-mist); font-size: 1.1rem; text-align: center; }

.ind-detail { padding: 0 8px 16px 50px; font-size: 0.92rem; }
.ind-why {
  margin: 0 0 14px;
  color: var(--c-ink-soft);
  line-height: 1.6;
  font-family: var(--f-display);
  font-style: italic;
  font-size: 1.05rem;
}
.ind-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  padding: 14px 16px;
  background: var(--lha-sky-pale);
  border-radius: var(--rad);
}
.ind-meta-label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--lha-mist);
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
}
.ind-meta-value { color: var(--c-ink); font-size: 0.9rem; }
.ind-meta-value strong { font-family: var(--f-mono); color: var(--lha-blue-deep); }
.ind-meta-source { font-size: 0.8rem; color: var(--lha-stone-soft); }
.ind-reach-rationale {
  margin: 10px 0 0;
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  font-style: italic;
  line-height: 1.5;
}
.ind-mock-tag {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--lha-sun-soft);
  color: var(--lha-stone);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.indicator-list-footer {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--c-line);
  font-size: 0.85rem;
  color: var(--c-ink-soft);
}

/* ============================================================
   SPARKLINE
   ============================================================ */
.sparkline { width: 100%; height: auto; }
.band-green { fill: var(--c-green-bg); opacity: 0.45; }
.band-amber { fill: var(--c-amber-bg); opacity: 0.55; }
.band-red   { fill: var(--c-red-bg);   opacity: 0.55; }
.threshold-line { stroke: var(--lha-stone-soft); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.5; }
.threshold-label, .axis-label { fill: var(--lha-stone-soft); font-family: var(--f-mono); font-size: 10px; }
.spark-path { stroke: var(--lha-blue-deep); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.spark-dot { fill: var(--lha-blue-deep); }
.dot-amber { fill: var(--lha-sun); }
.dot-red   { fill: var(--st-alert); }
.dot-green { fill: var(--st-rust); }

/* ============================================================
   METHODOLOGY
   ============================================================ */
.methodology p { color: var(--c-ink-soft); font-size: 0.95rem; margin: 0 0 12px; line-height: 1.6; }
.methodology-do-dont { list-style: none; padding: 0; margin: 18px 0; }
.methodology-do-dont li {
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--lha-sky-pale);
  border-left: 3px solid var(--lha-blue-deep);
  border-radius: 4px;
  font-size: 0.92rem;
  line-height: 1.5;
}
.methodology details { margin-top: 18px; }
.methodology summary {
  cursor: pointer;
  color: var(--lha-blue-deep);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 10px 0;
}
.methodology-steps { color: var(--c-ink-soft); font-size: 0.9rem; padding-left: 22px; line-height: 1.7; }
.methodology-steps li { margin-bottom: 8px; }

/* ============================================================
   DATA QUALITY
   ============================================================ */
.dq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 28px; }
@media (max-width: 600px) { .dq-grid { grid-template-columns: 1fr; } }
.dq-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dotted var(--c-line);
  font-size: 0.88rem;
  position: relative;
}
.dq-label { color: var(--c-ink-soft); }
.dq-value { font-family: var(--f-mono); color: var(--c-ink); font-weight: 500; }
.dq-row.warn .dq-value { color: var(--lha-sun); }
.dq-detail { grid-column: 1 / -1; margin-top: 6px; }
.dq-detail summary { cursor: pointer; color: var(--lha-blue-deep); font-size: 0.78rem; }
.dq-detail code {
  display: block;
  margin-top: 6px;
  padding: 10px 12px;
  background: var(--lha-sky-pale);
  border-radius: 4px;
  font-size: 0.78rem;
  color: var(--c-ink-soft);
  word-break: break-all;
}
.dq-disclaimer {
  margin-top: 18px;
  padding: 14px 18px;
  border-left: 3px solid var(--lha-sun);
  background: var(--lha-sun-soft);
  color: var(--lha-stone);
  font-size: 0.88rem;
  border-radius: 4px;
  line-height: 1.55;
}

/* ============================================================
   BRAND SAFETY BANNER
   ============================================================ */
.brand-safety {
  padding: 18px 22px;
  border-radius: var(--rad-lg);
  margin: 0 32px 24px;
  border: 1px solid var(--lha-sun);
  background: var(--lha-sun-soft);
  max-width: var(--max-w);
  margin-left: auto;
  margin-right: auto;
}
.brand-safety-block { border-color: var(--st-alert); background: var(--c-red-bg); }
.bs-label { font-size: 0.74rem; letter-spacing: 0.18em; color: var(--lha-stone); font-weight: 600; }
.bs-message { margin: 10px 0 4px; font-size: 0.95rem; color: var(--c-ink); line-height: 1.55; }
.bs-reason { margin: 0; font-size: 0.82rem; color: var(--lha-stone-soft); }

/* ============================================================
   TECHNICAL TOGGLE + FOOTER
   ============================================================ */
.technical-toggle {
  margin: 40px 0 20px;
  padding: 22px;
  text-align: center;
  border-top: 1px dashed var(--c-line);
}
.technical-toggle-btn {
  background: var(--lha-snow);
  border: 1px solid var(--lha-blue-deep);
  color: var(--lha-blue-deep);
  padding: 11px 24px;
  border-radius: var(--rad-pill);
  font-family: var(--f-sans);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
  letter-spacing: 0.02em;
}
.technical-toggle-btn:hover { background: var(--lha-blue-deep); color: var(--lha-snow); }
.technical-toggle-hint { margin: 12px 0 0; font-size: 0.82rem; }

.footer {
  margin-top: 56px;
  padding: 36px 32px 32px;
  background: var(--lha-blue-deep);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
}
.footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
}
.footer-row { margin-bottom: 8px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.footer .muted { color: rgba(255, 255, 255, 0.55); }
.footer strong { color: var(--lha-sky); font-weight: 500; }
.footer-mark {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.footer-mark-text { font-family: var(--f-display); font-style: italic; color: var(--lha-sky); }
.footer-mark .lha-mark-mini { color: var(--lha-snow); }

/* ============================================================
   TIER INDICATOR (technical section)
   ============================================================ */
.hero {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) 1fr;
  gap: 32px;
  padding: 32px;
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  margin-bottom: 24px;
}
@media (max-width: 720px) { .hero { grid-template-columns: 1fr; padding: 24px; } }

.tier-indicator { display: flex; gap: 22px; align-items: flex-start; }
.tier-light { padding-top: 10px; }
.tier-dot {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 4px solid var(--lha-snow);
  box-shadow: 0 0 0 1px var(--c-line);
}
.tier-dot-green { background: var(--st-rust); }
.tier-dot-amber { background: var(--lha-sun); }
.tier-dot-red {
  background: var(--st-alert);
  animation: pulse 3.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 1px var(--c-line); }
  50%      { box-shadow: 0 0 0 6px rgba(176, 58, 58, 0.18), 0 0 0 1px var(--c-line); }
}
.tier-label { font-size: 0.7rem; letter-spacing: 0.15em; color: var(--lha-mist); margin-bottom: 8px; }
.tier-headline { font-size: 1.5rem; line-height: 1.2; margin: 0 0 8px; color: var(--c-ink); font-weight: 500; font-family: var(--f-display); }
.tier-subline { margin: 0 0 12px; color: var(--c-ink-soft); }
.tier-meta { font-size: 0.85rem; color: var(--lha-mist); font-family: var(--f-mono); }

.percentile-display { border-left: 1px solid var(--c-line); padding-left: 28px; }
@media (max-width: 720px) { .percentile-display { border-left: none; padding-left: 0; border-top: 1px solid var(--c-line); padding-top: 24px; } }
.percentile-label { font-size: 0.68rem; letter-spacing: 0.15em; color: var(--lha-mist); }
.percentile-value {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: 3.5rem;
  line-height: 1;
  color: var(--lha-blue-deep);
  margin: 4px 0 8px;
  letter-spacing: -0.02em;
}
.percentile-context { font-size: 0.85rem; color: var(--c-ink-soft); margin-bottom: 18px; }
.percentile-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dotted var(--c-line);
  font-size: 0.85rem;
}
.meta-key { color: var(--c-ink-soft); }
.meta-value { font-family: var(--f-mono); color: var(--c-ink); }
.percentile-disclaimer { font-size: 0.72rem; color: var(--lha-mist); font-style: italic; }

.domain-contributions { display: flex; flex-direction: column; gap: 14px; }
.domain-row { display: grid; grid-template-columns: 28px 1fr 2fr 64px; align-items: center; gap: 14px; }
.domain-rank { font-family: var(--f-mono); color: var(--lha-mist); font-size: 0.85rem; text-align: center; }
.domain-code { font-family: var(--f-mono); color: var(--lha-blue-deep); font-weight: 600; font-size: 0.85rem; }
.domain-name { font-size: 0.85rem; color: var(--c-ink-soft); }
.domain-bar-wrap { height: 8px; background: var(--c-line-soft); border-radius: 4px; overflow: hidden; }
.domain-bar { height: 100%; border-radius: 4px; transition: width 300ms; }
.domain-bar.positive { background: var(--lha-blue-deep); }
.domain-bar.negative { background: var(--lha-sky); }
.domain-value { font-family: var(--f-mono); text-align: right; font-size: 0.85rem; color: var(--c-ink); }

/* Media diagnostic */
.md-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 720px) { .md-grid { grid-template-columns: 1fr; } }
.md-cell { padding: 18px 20px; border: 1px solid var(--c-line); border-radius: var(--rad); background: var(--lha-sky-pale); }
.md-label { font-size: 0.75rem; color: var(--lha-mist); margin-bottom: 6px; }
.md-value { font-family: var(--f-mono); font-size: 1.5rem; color: var(--lha-blue-deep); }
.md-value.warn { color: var(--lha-sun); }
.md-warn { margin-top: 8px; font-size: 0.8rem; color: var(--lha-sun); }

/* ============================================================
   Sources — per indicator + all-sources panel
   ============================================================ */
.ind-sources {
  margin-top: 16px;
  padding: 14px 16px;
  background: var(--lha-sky-pale);
  border-radius: var(--rad);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ind-source-block { display: flex; flex-direction: column; gap: 4px; }
.ind-source-label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--lha-mist);
  text-transform: uppercase;
  font-weight: 600;
}
.ind-source-link {
  color: var(--lha-blue-deep);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms;
  display: inline-block;
  width: max-content;
}
.ind-source-link:hover { border-bottom-color: var(--lha-blue-deep); }
.ind-refs {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ind-refs a {
  color: var(--lha-blue-mid);
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.5;
  border-bottom: 1px solid transparent;
}
.ind-refs a:hover { border-bottom-color: var(--lha-blue-mid); }

.all-sources {
  background: var(--lha-sky-pale);
}
.sources-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 8px;
}
@media (max-width: 720px) { .sources-grid { grid-template-columns: 1fr; gap: 28px; } }
.sources-column h3 {
  font-family: var(--f-sans);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lha-blue-deep);
  margin: 0 0 12px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--c-line);
}
.sources-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sources-list a {
  color: var(--lha-blue-mid);
  text-decoration: none;
  font-size: 0.88rem;
  line-height: 1.5;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms;
}
.sources-list a:hover { border-bottom-color: var(--lha-blue-mid); color: var(--lha-blue-deep); }
.all-sources-note {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--c-line);
  font-style: italic;
}

/* ============================================================
   Expert-view: Z-thermometer per indicator
   Opvallende rode accent-rand om de expert-laag visueel te onderscheiden
   van de publieke barometer-laag.
   ============================================================ */
.zview-panel {
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--st-alert);
  background: var(--lha-snow);
  box-shadow: 0 6px 24px rgba(176, 58, 58, 0.10), 0 1px 2px var(--c-shadow);
  position: relative;
}
.zview-panel::before {
  content: "EXPERT";
  position: absolute;
  top: -1px;
  right: 24px;
  background: var(--st-alert);
  color: var(--lha-snow);
  font-family: var(--f-sans);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 0 0 6px 6px;
  z-index: 2;
}
.zview-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 28px;
  background: #fdf6f6;
  border: none;
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  transition: background 150ms;
  border-bottom: 1px solid var(--st-alert);
  border-left: 4px solid var(--st-alert);
}
.zview-toggle:hover { background: #f8e9e9; }
.zview-toggle[aria-expanded="false"] { border-bottom-color: transparent; }
.zview-toggle-icon {
  font-family: var(--f-mono);
  font-size: 1.6rem;
  color: var(--st-alert);
  width: 28px;
  text-align: center;
  font-weight: 600;
  flex-shrink: 0;
}
.zview-toggle-icon-right { visibility: hidden; }
.zview-toggle-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  text-align: center;
}
.zview-toggle-text strong {
  font-family: var(--f-sans);
  font-weight: 600;
  color: var(--st-alert);
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.zview-body {
  padding: 24px 28px 28px;
  border-left: 4px solid var(--st-alert);
}
.zview-lead {
  font-size: 0.92rem;
  color: var(--c-ink-soft);
  line-height: 1.55;
  margin: 0 0 18px;
  max-width: 68ch;
}

.zview-sort {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
}
.zview-sort button {
  background: var(--lha-snow);
  border: 1px solid var(--c-line);
  color: var(--lha-stone-soft);
  padding: 4px 10px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 120ms;
}
.zview-sort button:hover { border-color: var(--lha-blue-mid); }
.zview-sort button.active {
  background: var(--lha-blue-deep);
  color: var(--lha-snow);
  border-color: var(--lha-blue-deep);
}

.zview-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.78rem;
  color: var(--lha-stone-soft);
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--c-line);
}
.zview-legend i {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
  vertical-align: middle;
}
.lg-cold { background: var(--st-rust); }
.lg-normal { background: var(--lha-mist); }
.lg-warn { background: var(--lha-sun); }
.lg-alert { background: var(--st-alert); }

.zview-list { display: flex; flex-direction: column; gap: 16px; }

.zth { padding: 6px 0; }
.zth-header {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 6px;
}
.zth-code {
  font-family: var(--f-mono);
  font-size: 0.74rem;
  color: var(--lha-mist);
  font-weight: 600;
}
.zth-name {
  font-family: var(--f-sans);
  font-size: 0.92rem;
  color: var(--c-ink);
  font-weight: 500;
}
.zth-value {
  font-family: var(--f-mono);
  font-size: 0.85rem;
  color: var(--lha-blue-deep);
  text-align: right;
}
.zth-unit {
  color: var(--lha-stone-soft);
  font-size: 0.75rem;
  margin-left: 2px;
}
.zth-z-missing { font-size: 0.78rem; color: var(--lha-mist); font-style: italic; }

.zth-bar-wrap {
  position: relative;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--c-line-soft);
  margin: 4px 0 18px;
}
.zth-zone {
  position: absolute;
  top: 0;
  height: 100%;
  opacity: 0.28;
}
.zth-zone-cold { background: var(--st-rust); }
.zth-zone-normal { background: var(--lha-mist); }
.zth-zone-warn { background: var(--lha-sun); opacity: 0.42; }
.zth-zone-alert { background: var(--st-alert); opacity: 0.42; }

.zth-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
}
.zth-marker-threshold {
  background: var(--lha-blue-deep);
  opacity: 0.6;
}
.zth-marker-extreme {
  background: var(--st-alert);
  opacity: 0.65;
}

.zth-dot {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid var(--lha-snow);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.22);
  z-index: 2;
  transition: left 400ms ease;
}

.zth-axis {
  position: absolute;
  bottom: -16px;
  left: 0;
  right: 0;
  height: 14px;
  font-family: var(--f-mono);
  font-size: 0.68rem;
  color: var(--lha-mist);
}
.zth-axis span {
  position: absolute;
  transform: translateX(-50%);
  white-space: nowrap;
}

.zth-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  margin-top: 4px;
}
.zth-z {
  font-family: var(--f-mono);
  font-weight: 600;
}
.zth-dist {
  color: var(--lha-stone-soft);
  font-style: italic;
}

.zview-footer-note {
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid var(--c-line);
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  line-height: 1.55;
}
.zview-footer-note strong { color: var(--lha-blue-deep); }

/* ============================================================
   Secundaire signalen — apart, gelabeld, niet in composiet
   ============================================================ */
.secondary-panel {
  border: 1px dashed var(--lha-mist);
  background: #fbfaf7;
  position: relative;
}
.secondary-badge {
  display: inline-block;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  font-weight: 600;
  color: var(--lha-stone-soft);
  background: var(--c-line-soft);
  padding: 4px 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}
.secondary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}
.secondary-item {
  padding: 14px 16px;
  background: var(--lha-snow);
  border: 1px solid var(--c-line);
  border-radius: var(--rad);
}
.secondary-item-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.secondary-name {
  font-weight: 600;
  color: var(--c-ink);
  font-size: 0.98rem;
}
.secondary-value {
  font-family: var(--f-mono);
  font-size: 1.2rem;
  color: var(--lha-stone-soft);
}
.secondary-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.78rem;
  color: var(--lha-mist);
  margin-bottom: 6px;
}
.secondary-code {
  font-family: var(--f-mono);
  font-weight: 600;
  color: var(--lha-stone-soft);
}
.secondary-mock {
  padding: 1px 7px;
  border-radius: 10px;
  background: var(--lha-sun-soft);
  color: var(--lha-stone);
  font-size: 0.7rem;
}
.secondary-source {
  font-size: 0.8rem;
  color: var(--c-ink-soft);
  line-height: 1.5;
}
.secondary-disclaimer {
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  line-height: 1.55;
  font-style: italic;
  padding-top: 14px;
  border-top: 1px solid var(--c-line);
  margin: 0;
}

/* Loading / error */
.loading, .error-state { max-width: 640px; margin: 80px auto; padding: 32px; text-align: center; }
.error-state h1 { color: var(--lha-blue-deep); }
.error-state code { background: var(--lha-sky-pale); padding: 2px 6px; border-radius: 3px; }

/* Preview page */
.preview-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.preview-header { margin-bottom: 36px; padding-bottom: 18px; border-bottom: 1px solid var(--c-line); }
.preview-header h1 { font-family: var(--f-display); font-size: 1.75rem; margin: 8px 0 6px; color: var(--lha-blue-deep); }
.preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px; margin-bottom: 32px; }
.preview-card { border: 1px solid var(--c-line); border-radius: var(--rad-lg); padding: 18px; background: var(--lha-snow); }
.preview-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.preview-cn { font-family: var(--f-mono); font-size: 0.95rem; color: var(--lha-blue-deep); font-weight: 600; }
.preview-cn-name { margin-left: 8px; font-weight: 400; color: var(--lha-mist); font-family: var(--f-sans); }
.preview-status { font-size: 0.72rem; letter-spacing: 0.12em; padding: 3px 10px; border-radius: 12px; border: 1px solid var(--c-line); color: var(--lha-mist); }
.preview-status.on { background: var(--lha-sun-soft); color: var(--lha-stone); border-color: var(--lha-sun); }
.preview-status.off { background: var(--c-line-soft); }
.preview-banner-wrap { margin-bottom: 12px; }
.banner-render { padding: 18px 22px; border-radius: var(--rad); min-height: 100px; display: flex; flex-direction: column; justify-content: center; color: #fff; }
.banner-render-1, .banner-render-2 { background: var(--lha-blue-deep); }
.banner-render-3 { background: linear-gradient(135deg, var(--lha-blue-deep) 0%, var(--lha-sun) 140%); }
.banner-render-4 { background: linear-gradient(135deg, var(--lha-blue-deep) 0%, var(--st-alert) 140%); }
.banner-render-off { background: var(--lha-sky-pale); color: var(--c-ink-soft); border: 1px dashed var(--c-line); }
.banner-render-mark { font-size: 0.7rem; letter-spacing: 0.2em; color: var(--lha-sky); margin-bottom: 8px; }
.banner-render-headline { font-family: var(--f-display); font-size: 1.15rem; font-weight: 500; margin-bottom: 6px; line-height: 1.25; }
.banner-render-body { font-size: 0.88rem; line-height: 1.5; color: rgba(255, 255, 255, 0.86); }
.banner-render-off .banner-render-body { color: var(--c-ink-soft); }
.banner-render-action { margin-top: 12px; display: inline-block; font-size: 0.85rem; color: var(--lha-sun); text-decoration: none; padding: 6px 14px; border: 1px solid var(--lha-sun); border-radius: var(--rad); width: max-content; }
.preview-notes { font-size: 0.78rem; color: var(--lha-stone-soft); padding-top: 10px; border-top: 1px dotted var(--c-line); }
.preview-back { margin-top: 32px; }
.preview-back a { color: var(--lha-blue-deep); text-decoration: none; font-size: 0.9rem; }
.preview-back a:hover { text-decoration: underline; }
.code-block { background: var(--lha-stone); color: var(--lha-snow); padding: 16px 20px; border-radius: var(--rad); font-family: var(--f-mono); font-size: 0.78rem; overflow-x: auto; line-height: 1.6; }
```

## `app/web/index.html`

```html
<!doctype html>
<html lang="nl-BE">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Natuurlijk in het hart van de Alpen. Barometer voor het stress-cijfer van vandaag." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" />
    <title>Hautes-Alpes · Barometer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## `app/web/package.json`

```json
{
  "name": "@sbi/web",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^25.9.1",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.0"
  }
}
```

## `app/web/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Sta toe dat de UI ../data leest tijdens dev
      allow: [resolve(__dirname, ".."), resolve(__dirname, "../..")],
    },
  },
  publicDir: "public",
});
```

# GitHub Actions — dagelijkse cron

## `.github/workflows/daily.yml`

```yaml
name: Daily SBI Update

on:
  schedule:
    # Twee crons: 07:00 UTC = 09:00 CEST (zomer),
    #             08:00 UTC = 09:00 CET  (winter).
    # Time-guard hieronder zorgt dat alleen de "9:00 BE-tijd"-firing daadwerkelijk uitvoert.
    - cron: "0 7 * * *"
    - cron: "0 8 * * *"
  workflow_dispatch: {}

permissions:
  contents: write

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"

jobs:
  fetch-build-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Time-guard (alleen door bij 09:00 BE-tijd of bij handmatige trigger)
        id: timecheck
        run: |
          BE_HOUR=$(TZ='Europe/Brussels' date +%H)
          echo "Belgian local hour: $BE_HOUR"
          if [ "${{ github.event_name }}" = "schedule" ] && [ "$BE_HOUR" != "09" ]; then
            echo "Skip — schedule firing maar BE-uur is $BE_HOUR, niet 09."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "Proceed — BE-uur $BE_HOUR (manual trigger telt altijd)."
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Checkout
        if: steps.timecheck.outputs.skip != 'true'
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        if: steps.timecheck.outputs.skip != 'true'
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"
          cache-dependency-path: app/pipeline/requirements.txt

      - name: Set up Node 22 LTS
        if: steps.timecheck.outputs.skip != 'true'
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install Python deps
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/pipeline
        run: pip install -r requirements.txt

      - name: Fetch real data (Python pipeline)
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/pipeline
        run: python -m pipeline.run
        continue-on-error: true

      - name: Install engine deps
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/engine
        run: npm install

      - name: Generate daily output (hybrid real + synthetic)
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/engine
        run: npm run generate-fixture

      - name: Install web deps
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/web
        run: npm install

      - name: Build web production bundle
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/web
        run: npm run build

      - name: Deploy to Surge.sh
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/web
        env:
          SURGE_LOGIN: peter@hoogland.be
          SURGE_TOKEN: ${{ secrets.SURGE_TOKEN }}
        run: |
          npm install -g surge
          surge ./dist les-hautes-alpes-sbi.surge.sh

      - name: Persist cache + doorlopende historie
        if: steps.timecheck.outputs.skip != 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -f app/data/sbi-cache.json app/pipeline/pending_events.json app/data/history 2>/dev/null || true
          if ! git diff --cached --quiet; then
            git commit -m "chore: persist daily fetch cache + historie [skip ci]"
            git pull --rebase origin main || true
            git push origin main || true
          else
            echo "No cache changes to commit"
          fi
```

# Top-level READMEs

## `README.md`

```markdown
# Les Hautes Alpes · Stressor-Blootstellings-Index (SBI)

Publieke barometer die elke dag opnieuw meet hoe ongewoon de omstandigheden in
België zijn op 20 indicatoren — weer, economie, nieuws, kalender. Niet voor
individuele meting; voor het collectief.

🌐 **Live**: [les-hautes-alpes-sbi.surge.sh](https://les-hautes-alpes-sbi.surge.sh)

## Wat zit waar

```
.
├── 00_Pre-Registratie.md         ← methodologische keuzes, publiek vastgelegd
├── 01_Anker-Paper.md             ← laag 1+2: construct + domeinen
├── 02_Laag-3_Indicator-Selectie.md
├── 03_Laag-4_Operationalisering.md
├── 04_Laag-5_Normalisatie.md
├── 05_Laag-6_Weging.md
├── 06_Laag-7_Aggregatie-en-Drempel.md
├── 07_Laag-8_Validatie-en-Robuustheid.md
├── 08_Onderhoud-Protocol.md
├── 09_Brand-Message-Style-Guide.md
│
├── app/
│   ├── engine/       TypeScript: MAD-Z, STL, winsorize, weights, percentile, tier, CN 1-5
│   ├── pipeline/     Python: 13 data-fetchers (KMI, GDELT live; rest mocked of TODO)
│   ├── web/          React + Vite: publieke barometer, embed-snippet, signal-API
│   └── data/         daily output JSON (regenerated)
│
└── .github/workflows/daily.yml    ← cron 23:00 CET → fetch + build + deploy
```

## Lokaal draaien

```bash
# Engine + tests
cd app/engine && npm install && npm test     # 29 tests, doc 04 §7 reproductie

# Pipeline (Python 3.11+)
cd app/pipeline && pip install -r requirements.txt && python -m pipeline.run

# Combineer pipeline output met synthetische baseline → latest.json
cd app/engine && npm run generate-fixture

# Web-app
cd app/web && npm install && npm run dev
```

## Productie-deploy (handmatig)

```bash
cd app/web && npm run build && npx surge dist les-hautes-alpes-sbi.surge.sh
```

## Automatische dagelijkse update

GitHub Actions cron — zie `.github/workflows/daily.yml`. Vereist één secret:
- `SURGE_TOKEN` (gegenereerd via `npx surge token`)

## Welke indicatoren zijn echt vs mock?

| Tier | Indicatoren | Status |
|---|---|---|
| **A — deterministisch** | I-D1-001 (daglicht), I-D4-001/002 (kalender), I-D6-001/002/003/005 | Altijd echt — 7 stuks |
| **B — werkende real-fetch** | I-D1-002/003 (hitte/kou via open-meteo), I-D5-001 (GDELT), I-D5-002 (Google Trends) | Echt wanneer pipeline draait — 4 stuks |
| **C — scraper TODO** | I-D1-004, I-D2-001/004, I-D3-001/002/003/005/006 | Mock, eerlijk gevlagd — 8 stuks |
| **D — menselijke codering** | I-D5-003 | Leest `pipeline/events.json` — 1 stuk |

Eerlijk gerapporteerd in elke output onder `data_quality.indicators_simulated`.

## Methodologische discipline

- Pre-registratie van drempels, gewichten, formules (doc 00). Geen achteraf-tuning.
- Stijlgids (doc 09) hard-gecodeerd in `app/web/src/copy.ts`. Geen "u bent gestrest".
- 3-dagen-sustained tier-overgang geankerd in cortisol-cyclus-literatuur (doc 06 §3.5).
- Mediacyclus-decorrelatie protocol (doc 03 §4.4) ingebouwd in engine.
- Brand-safety override (doc 06 §7) automatisch in UI én banner-embed.

## Licentie

Methodologie: CC BY 4.0. Code: MIT.
```

## `app/README.md`

```markdown
# Les Hautes Alpes Anti-Stress Activator

Een publieke barometer die het signaal van de **Stressor-Blootstellings-Index (SBI)**
visualiseert binnen de strikte methodologische en communicatieve grenzen die in de
9 bovenliggende documenten (`00_Pre-Registratie.md` t/m `09_Brand-Message-Style-Guide.md`)
zijn vastgelegd.

> **Implementation stage:** `minimum_viable_pipeline` (conform `03_Laag-4 §5.6`).
> Eerlijk gerapporteerd in elk daily-output-record als `data_quality.implementation_stage`.

## Wat dit is

De SBI is **geen** klinisch instrument, **geen** individuele meting, **geen** peer-reviewed
wetenschap, en **geen** gedragsvoorspeller (doc 01 §3). De barometer toont:

- Tier-stand (groen / oranje / rood) met 3-dagen-sustained-regel
- Percentiel-positie tegen 24-maands voortschrijdende baseline + 2010-2019 vaste referentie
- Top-3 bijdragende domeinen
- 60-daagse sparkline van het percentiel
- Mediacyclus-decorrelatie-diagnostiek (composiet zonder D5)
- Brand-safety-vlag (UI-override bij nationale rouw)
- Datakwaliteit: welke indicatoren gesimuleerd/imputed/missing zijn

## Architectuur

```
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │  pipeline/   │    │   engine/    │    │     web/     │
   │  Python      │──▶ │  TypeScript  │──▶ │  React+Vite  │
   │  fetchers    │    │  methodology │    │  barometer   │
   └──────────────┘    └──────────────┘    └──────────────┘
       raw-values.json   latest.json         /data/latest.json
```

**engine/** is de eenduidige bron-van-waarheid voor de methodologie.
**pipeline/** doet alléén EXTRACT (doc 03 §5.3 stap 1).
**web/** consumeert alléén het daily-output-record en past de stijlgids toe.

## Aan de slag

### 1. Engine + tests

```bash
cd engine
npm install
npm test                  # 23 tests, reproduceert doc 04 §7 voorbeelden
```

### 2. Snelle demo (fixture-data)

```bash
cd engine
npm run generate-fixture  # produceert latest.json met realistische seizoens-mock
cd ../web
npm install && npm run dev
# Open http://localhost:5173
```

### 3. Echte pipeline-run

```bash
cd pipeline
pip install -r requirements.txt
python -m pipeline.run --history-days 730  # 24m historie + vandaag
cd ../engine
npm run compute-daily     # leest pipeline output, draait engine, schrijft latest.json
cd ../web
npm run dev
```

## Welke indicatoren zijn echt vs gemockt?

| Tier | Indicatoren | Bron-status |
|------|-------------|-------------|
| **A — deterministisch** | I-D1-001, I-D4-001/002, I-D6-001/002/003/005 (7 stuks) | NOAA Solar + Belgische kalender — altijd echt |
| **B — real-fetch werkt** | I-D1-002 hitte, I-D1-003 kou | open-meteo (KMI proxy), gratis |
| **B — real-fetch beschikbaar mits token** | I-D5-001 nieuwsneg., I-D5-002 Google Trends | GDELT v2 (no-key), pytrends |
| **C — mock (real-fetch TODO)** | I-D1-004, I-D2-001/004, I-D3-001/002/003/005/006 | scraping/registratie vereist |
| **D — menselijke codering** | I-D5-003 | leest `pipeline/events.json` |

Per indicator wordt eerlijk gerapporteerd of de waarde echt is of gesimuleerd —
zichtbaar in de UI onder "Datakwaliteit" en in elk JSON-record onder `data_quality`.

## Methodologie-discipline

Het project respecteert hard:

1. **Pre-registratie-onveranderlijkheid** (doc 00) — alle drempels, gewichten,
   formules zijn in code bevroren. Wijziging vereist het proces uit doc 08.
2. **Stijlgids** (doc 09) — geen "u bent gestrest", geen klinische taal,
   geen demografische uitsplitsing. Hard-coded in `web/src/copy.ts`.
3. **Mediacyclus-decorrelatie** (doc 03 §4.4) — composiet zonder D5 wordt
   altijd parallel berekend en gerapporteerd.
4. **Brand-safety-override** (doc 06 §7) — wanneer de vlag staat op
   `elevated` of `block`, schorten we de commerciële uitnodiging op
   terwijl de index blijft rapporteren.
5. **Eerlijke vlaggen** — `simulated`, `imputed`, `missing` per indicator
   in het output-record, en `implementation_stage` in elke build.

## Volgende stappen (target architecture)

1. Real-fetch IRCEL-CELINE via WFS-protocol (vereist GDAL)
2. Real-fetch Verkeerscentrum via TomTom Move API als fallback
3. STATBEL CTAS real-fetch met view-ID-discovery
4. ENTSO-E real-fetch (set `ENTSOE_TOKEN`)
5. Statsmodels STL-implementatie in pipeline i.p.v. naive DOY-mediaan
6. Schedule via cron/launchd voor dagelijkse 23:00 CET run
7. Sign + publiceer SHA-256 hash van pre-registratie op OSF (doc 00 §14)
```

## `app/pipeline/README.md`

```markdown
# SBI Pipeline

Python-pipeline die de 13 non-deterministische indicatoren fetcht.
De 7 deterministische indicatoren (D4, D6, daglicht) berekent de TS engine zelf.

Doc-referentie: `03_Laag-4_Operationalisering.md §5.2 (bronnen) + §5.6 (MVP)`.

## Status per fetcher

| Code     | Indicator                              | Status                         |
|----------|----------------------------------------|--------------------------------|
| I-D1-002 | Hitte (Tmax > 30°C)                    | **REAL** via open-meteo        |
| I-D1-003 | Kou (Tmin < -5°C)                      | **REAL** via open-meteo        |
| I-D1-004 | Luchtkwaliteit                          | mock (IRCEL scraping TODO)     |
| I-D2-001 | Filezwaarte                             | mock (Verkeerscentrum TODO)    |
| I-D2-004 | Brandstofprijzen                        | mock (FOD Economie scrape TODO)|
| I-D3-001 | CPI inflatie                            | mock (STATBEL CTAS TODO)       |
| I-D3-002 | Energieprijzen                          | mock — needs `ENTSOE_TOKEN`    |
| I-D3-003 | Aangekondigde ontslagen                 | mock (FOD WASO scrape TODO)    |
| I-D3-005 | Werkloosheid                            | mock (STATBEL TODO)            |
| I-D3-006 | Hypotheekrente                          | mock (NBB Stat CSV TODO)       |
| I-D5-001 | Nieuwsnegativiteit                      | **REAL** via GDELT DOC v2      |
| I-D5-002 | Google Trends stress-termen             | **REAL** via pytrends (fragiel)|
| I-D5-003 | Collectieve gebeurtenissen              | leest `events.json` (mens-coded)|

Real-fetchers vallen automatisch terug op mock wanneer de bron faalt,
met `simulated: true` in de output — eerlijk per doc 09 §2.

## Run

```bash
pip install -r requirements.txt
python -m pipeline.run                    # fetcht vandaag
python -m pipeline.run --date 2026-05-15  # specifieke datum
python -m pipeline.run --history-days 30  # ook 30 dagen historie
```

Output:
- `app/data/raw-values.json` — vandaag, voor consumptie door de engine
- `app/data/raw-history.json` — wanneer `--history-days > 0`

## Events.json format

```json
[
  { "date": "2026-05-15", "magnitude": 3, "label": "Hypothetisch event" }
]
```

Magnitude conform doc 03 §2.5: 1 (regionaal), 3 (nationaal), 5 (terreur/oorlog/massa-evacuatie).
Codeer-protocol: twee codeurs, κ ≥ 0.75 op 50 historische test-cases vereist voor livegang.
```

## `.github/README.md`

```markdown
# GitHub Actions cron

Dagelijkse run om 23:00 CET (22:00 UTC). Werkflow doet:

1. **Python pipeline** — fetcht echte data waar mogelijk (open-meteo voor KMI, GDELT, Google Trends)
2. **Engine** — combineert echte waarden met synthetische baseline + berekent CN, percentiel, tier
3. **Web build** — produceert statisch dist/
4. **Surge deploy** — pusht naar `les-hautes-alpes-sbi.surge.sh`

## Vereiste secret

`SURGE_TOKEN` — gegenereerd met `npx surge token`. Toegevoegd in
GitHub repo → Settings → Secrets and variables → Actions.

## Handmatig triggeren

Repo → Actions → "Daily SBI Update" → Run workflow.
```
