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
import { EMPTY_TRIGGER_STATE, type TriggerState } from "../methodology/triggers.js";
import { dispatchTriggers } from "../webhook.js";

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
const TRIGGER_STATE_OUT = resolve(__dirname, "../../../data/trigger-state.json");

/** Lees de cooldown-state van de vorige run (leeg bij eerste keer/corrupt). */
function loadTriggerState(path: string): TriggerState {
  if (!existsSync(path)) return EMPTY_TRIGGER_STATE;
  try {
    const s = JSON.parse(readFileSync(path, "utf-8"));
    if (s && typeof s === "object" && s.last_fired) return s as TriggerState;
  } catch {
    // corrupt — val terug op leeg
  }
  return EMPTY_TRIGGER_STATE;
}

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
    case "I-D2-001": // Filezwaarte — jaar-op-jaar % verandering (Pad A v2, YoY). Fallback rond de mediane jaargroei (~6%); mag negatief.
      return 6 + 6 * Math.cos(yearProg - 0.5) + (Math.random() - 0.5) * 6;
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

async function generate(): Promise<void> {
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

  // Bouw composiet-historie door de engine per dag in te roepen. Het venster is
  // ~2 jaar zodat de percentielen (v0.2 short_24m én v0.4 lang) tegen een ECHTE
  // 2-jaars-verdeling rekenen — niet tegen 60 dagen (dat overdreef de stand en
  // botste met de "afgelopen twee jaar"-tekst). De sparkline toont de laatste 60.
  const PERCENTILE_WINDOW_DAYS = 730;
  const SPARKLINE_DAYS = 60;
  const compositeHistory: Array<{ date: string; value: number }> = [];
  const compositeMetingHistory: Array<{ date: string; value: number }> = [];
  const sparkline: Array<{ date: string; composite: number; percentile: number; tier: string }> = [];

  for (let i = PERCENTILE_WINDOW_DAYS; i > 0; i--) {
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
      compositeMetingHistory,
      simulatedIndicators: simulatedCodes,
      realBaselineCodes,
    });

    compositeHistory.push({ date: iso, value: out.composite.equal });
    if (out.v04) compositeMetingHistory.push({ date: iso, value: out.v04.composite.meting });
    if (i <= SPARKLINE_DAYS) {
      sparkline.push({
        date: iso,
        composite: out.composite.equal,
        percentile: out.percentile.short_24m,
        tier: out.tier.current,
      });
    }
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

  // v0.4: cooldown-state van de vorige run + bevestigingssignalen uit de secundaire laag.
  const priorTriggerState = loadTriggerState(TRIGGER_STATE_OUT);
  const radarSignal = secondarySignals.find((s) => s.code === "I-D3-003S");
  const confirmationSignals = {
    // Ontslag-radar = aantal ontslag-thema-artikels; ≥ 1 telt als bevestiging.
    layoffRadarElevated: radarSignal ? radarSignal.value >= 1 : false,
    // Reddit-valentie-conventie nog niet vastgelegd → conservatief geen bevestiging.
    // (Confirmation bepaalt enkel severity, nooit of een trigger vuurt.)
    redditElevated: false,
  };

  const todayOutput = computeDaily({
    date: todayIso,
    rawValues: { ...todayRaw, ...detToday } as Partial<Record<IndicatorCode, number>>,
    history,
    compositeHistory,
    compositeMetingHistory,
    simulatedIndicators: stillSimulatedToday,
    realBaselineCodes,
    observationDates,
    secondarySignals,
    priorTriggerState,
    confirmationSignals,
  });

  // Persisteer de bijgewerkte cooldown-state voor de volgende run.
  if (todayOutput.v04) {
    writeFileSync(TRIGGER_STATE_OUT, JSON.stringify(todayOutput.v04.trigger_state, null, 2));
  }

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
    // v0.4 additief (embed-clients kunnen dit negeren tot de UI het toont)
    composite_meting: todayOutput.v04?.composite.meting ?? null,
    load_factor: todayOutput.v04?.composite.load_factor ?? null,
    triggers_count: todayOutput.v04?.triggers.length ?? 0,
    v04_mode: todayOutput.v04?.mode ?? null,
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
  if (todayOutput.v04) {
    const v = todayOutput.v04;
    console.log(`  v0.4 composite_meting: ${v.composite.meting} (load_factor ${v.composite.load_factor}, mode ${v.mode})`);
    console.log(`  v0.4 triggers: ${v.triggers.length}`);
    for (const t of v.triggers) {
      console.log(`    → ${t.type} ${t.code ?? ""} severity=${t.severity} approval=${t.require_manual_approval}`);
    }
  }

  // v0.4 — campagne-webhook (trigger-uitgang). Stuurt de triggers van deze run
  // naar CAMPAIGN_WEBHOOK_URL; lege/ongezette URL → dry-run die de payload logt.
  // Faalt nooit de build (dispatchTriggers vangt alles op). Zie src/webhook.ts.
  await dispatchTriggers(todayOutput, {
    url: process.env.CAMPAIGN_WEBHOOK_URL,
    token: process.env.CAMPAIGN_WEBHOOK_TOKEN,
    sentAtISO: new Date().toISOString(),
    logger: (m) => console.log(m),
  });
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
