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
import { toPublicOutput } from "../publish.js";
import { INDICATORS, INDICATOR_CODES } from "../indicators/registry.js";
import type { IndicatorCode } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_VALUES = resolve(__dirname, "../../../data/raw-values.json");
const RAW_HISTORY = resolve(__dirname, "../../../data/raw-history.json");
const COMPOSITE_HISTORY = resolve(__dirname, "../../../data/composite-history.json");
const OUT_DATA = resolve(__dirname, "../../../data/latest.json");
const OUT_WEB = resolve(__dirname, "../../../web/public/data/latest.json");
const EXPERT_DATA = resolve(__dirname, "../../../data/latest-expert.json");
const EXPERT_WEB = resolve(__dirname, "../../../web/public/data/latest-expert.json");
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
  "I-D2-009S": "Treinverstoringen iRail-teller (ongeplande storingen)",
  "I-D2-flights": "Vluchtvertragingen Brussel (AeroDataBox, aandeel >= 15 min, in opbouw)",
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
    // B3: productie-dagschrijver → bootstrap-CI rond het dagcijfer.
    computeUncertainty: true,
  });

  // Update composite-history. LET OP (A6-schaalbreuk, 2026-06-11): waarden van
  // vóór methodologie 0.3.0 bevatten de D6-kalenderbijdrage en 1/6-gewichten;
  // nieuwe waarden niet. Een gemengd bestand vertekent percentiel/tier tot de
  // oude waarden uit het 730-dagenvenster gerold zijn. Het productiepad
  // (generate-fixture, daily.yml) herrekent de volledige historie per run en
  // heeft hier geen last van; wie deze bridge gebruikt moet composite-history.json
  // éénmalig regenereren onder 0.3.0 (zie CHANGELOG).
  compositeHistory.push({ date: today.target_date, value: output.composite.equal });
  const trimmed = compositeHistory.slice(-730);

  // Update sparkline (last 60 entries)
  const spark = trimmed.slice(-60).map((c) => ({
    date: c.date,
    composite: c.value,
    percentile: 0,
    tier: "green" as const,
  }));

  // A3: het publieke latest.json bevat in test-modus GEEN v0.4-blok (zelfde
  // helper als generate-fixture); de volledige output gaat naar het expliciete
  // expert-kanaal (healthcheck leest latest-expert.json eerst).
  const publicOutput = toPublicOutput(output);
  for (const target of [OUT_DATA, OUT_WEB]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(publicOutput, null, 2));
  }
  for (const target of [EXPERT_DATA, EXPERT_WEB]) {
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
