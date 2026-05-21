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

const TODAY = new Date();

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
    case "I-D5-001": // Nieuwsneg (GDELT tone)
      return 2.0 + 1.5 * Math.sin(yearProg * 1.5) + (Math.random() - 0.5) * 2;
    case "I-D5-002": // Google Trends index 0-100
      return 50 + 10 * Math.sin(yearProg) + (Math.random() - 0.5) * 15;
    case "I-D5-003": // Collectieve gebeurtenissen 0-15
      return Math.random() < 0.05 ? Math.floor(Math.random() * 6) : 0;
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

  const simulatedCodes: IndicatorCode[] = [];
  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    if (meta.deterministic) continue;
    simulatedCodes.push(code);
    const series: Array<{ date: string; value: number }> = [];
    for (let i = historyDays; i > 0; i--) {
      const d = new Date(TODAY.getTime() - i * 86400000);
      series.push({ date: isoDate(d), value: syntheticRawValue(code, d) });
    }
    history[code] = series;
  }

  // Bouw composiet-historie laatste 60 dagen door engine ineen-te-roepen per dag
  const compositeHistory: Array<{ date: string; value: number }> = [];
  const sparkline: Array<{ date: string; composite: number; percentile: number; tier: string }> = [];

  for (let i = 60; i > 0; i--) {
    const d = new Date(TODAY.getTime() - i * 86400000);
    const iso = isoDate(d);

    const rawValues: Partial<Record<IndicatorCode, number>> = {};
    for (const code of simulatedCodes) {
      rawValues[code] = syntheticRawValue(code, d);
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
