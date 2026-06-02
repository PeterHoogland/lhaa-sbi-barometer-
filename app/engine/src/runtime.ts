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
  BrandSafety,
  V04Output,
  KernBreakdown,
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
// --- SBI v0.4 modules ---
import { windowedZ, sliceTrailing, spanYears, type HistPoint } from "./methodology/baseline-window.js";
import { KERN_CODES, klasse } from "./indicators/kern.js";
import { wMeting, wTrigger } from "./methodology/kern-weights.js";
import { compositeMeting, achtergrond, loadFactor, computeV04Tier, type ZLangMap } from "./methodology/kern-composite.js";
import {
  evaluateTriggers,
  EMPTY_TRIGGER_STATE,
  P70,
  P90,
  type TriggerState,
  type CoreTriggerInput,
} from "./methodology/triggers.js";

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
  // --- SBI v0.4 inputs (optioneel; ontbreken = lege/neutrale defaults) ---
  /**
   * Codes met een ECHTE historische baseline (geen synthetische fixture-vulling).
   * Alleen deze tellen mee in composite_meting en kunnen v0.4-triggers vuren —
   * een synthetische baseline (andere schaal/verdeling) zou valse z-scores en
   * valse triggers geven. Undefined = behandel alle meegegeven historie als echt
   * (zo werken directe engine-aanroepen en unit-tests).
   */
  realBaselineCodes?: IndicatorCode[];
  /** Vorige trigger-state (cooldown-bookkeeping uit data/trigger-state.json). */
  priorTriggerState?: TriggerState;
  /** Rollende historie van composite_meting — voedt v0.4-percentiel + tier. */
  compositeMetingHistory?: Array<{ date: string; value: number }>;
  /** Bevestigingssignalen voor de trigger-severity (reddit #8, ontslag-radar #7). */
  confirmationSignals?: { redditElevated?: boolean; layoffRadarElevated?: boolean };
  /** Huidige tijd (ISO) voor trigger fired_at/cooldown. Default: nu. */
  nowISO?: string;
}

/**
 * Minimaal aantal historiepunten voor een betrouwbare v0.2-baseline-Z. Onder deze
 * drempel scoren we de indicator NIET: hij wordt uitgesloten uit het composiet en
 * krijgt state "ontbreekt" — i.p.v. een neutrale 0 die als "normaal" zou lezen
 * (review §0-bis.3: dataschaarste mag geen geruststelling tonen).
 */
const MIN_HISTORY_FOR_Z = 30;

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

    if (hist.length < MIN_HISTORY_FOR_Z) {
      // Onvoldoende historie voor een betrouwbare baseline → behandel als ontbrekend
      // (uitgesloten uit het composiet, state "ontbreekt"), NIET als neutrale 0 die
      // als "normaal" zou lezen (review §0-bis.3).
      missing.push(code);
      continue;
    }

    const baseline = computeBaseline(baselineValues);
    let z = zscore(effectiveValue, baseline);
    if (!Number.isFinite(z)) {
      // Geen bruikbare schaal (geen variatie in de baseline) → behandel als ontbrekend
      // i.p.v. een stille 0/"normaal" (review §4.1).
      missing.push(code);
      continue;
    }
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

  // Weegafhankelijkheids-diagnostiek (doc 05 §4 — informational, geen pass/fail).
  // Twee velden zijn (nog) NIET berekend → expliciet null + status, géén verzonnen
  // getal dat een uitgevoerde meting suggereert (review §0-bis.1).
  const weightSensitivity = {
    correlation_inverse_vs_equal_12w: null as number | null, // vereist 12w parallelle historie van beide gewichtschema's
    composite_range_with_dropouts: estimateDropoutRange(zShort),
    bootstrap_95_ci_around_equal: null as [number, number] | null, // echte resample-bootstrap volgt later (§4.4)
    status: {
      correlation_inverse_vs_equal_12w: "not_computed" as const,
      bootstrap_95_ci_around_equal: "not_computed" as const,
    },
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

  // --- SBI v0.4 — meet- + trigger-laag (additief; v0.2-output blijft ongemoeid) ---
  const nowISO = input.nowISO ?? new Date().toISOString();
  const v04 = computeV04({
    date: input.date,
    raw,
    history: input.history,
    simulated: input.simulatedIndicators ?? [],
    realBaselineCodes: input.realBaselineCodes,
    observationDates: input.observationDates,
    compositeMetingHistory: input.compositeMetingHistory ?? [],
    brandSafetyFlag,
    confirmation: input.confirmationSignals ?? {},
    priorTriggerState: input.priorTriggerState ?? EMPTY_TRIGGER_STATE,
    nowISO,
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
        bootstrap_95_ci_around_equal: weightSensitivity.bootstrap_95_ci_around_equal,
        status: weightSensitivity.status,
      },
    },
    percentile: {
      short_24m: Math.round(percShort),
      // Niet berekend: vereist een aparte vaste 2010–2019 baseline (review §0-bis.1).
      // Geen kopie van short_24m onder een andere naam publiceren.
      fixed_2010_2019: null,
      fixed_2010_2019_status: "not_computed",
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
    v04,
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

export function buildPercentileHistory(
  compositeHistory: Array<{ date: string; value: number }>,
  todaysComposite: number,
): number[] {
  // Lookahead-vrij: het percentiel op dag t weegt UITSLUITEND tegen punten t/m t
  // (geen toekomst). Zo is elke dag identiek aan wat op dat moment berekenbaar was —
  // cruciaal voor een eerlijke tier-historie én de "lookahead-vrij"-claim van de
  // backtest (review §0-bis.2). compositeHistory bevat hier al enkel het verleden.
  const values = [...compositeHistory.map((h) => h.value), todaysComposite];
  return values.map((v, i) => percentileRank(v, values.slice(0, i + 1)));
}

// ===================================================================
// SBI v0.4 — meet- + trigger-laag
// ===================================================================

const KORT_MAANDEN = 18;
const LANG_MAANDEN = 120;
/** Wikipedia (#4) z_kort-drempel om als bevestiging van een nieuws-spike te tellen. */
const CONFIRM_Z = 1.0;

interface ComputeV04Params {
  date: string;
  raw: Partial<Record<IndicatorCode, number>>;
  history: DailyComputeInput["history"];
  simulated: IndicatorCode[];
  realBaselineCodes?: IndicatorCode[];
  observationDates?: Partial<Record<IndicatorCode, string>>;
  compositeMetingHistory: Array<{ date: string; value: number }>;
  brandSafetyFlag: BrandSafety;
  confirmation: { redditElevated?: boolean; layoffRadarElevated?: boolean };
  priorTriggerState: TriggerState;
  nowISO: string;
}

/**
 * Bouwt het volledige v0.4-blok: per kern-indicator de dubbele baseline
 * (z_kort/z_lang/delta_1d/percentile_lang), het meet-composiet + achtergrond +
 * load_factor, en de trigger-evaluatie. Puur t.o.v. de gegeven inputs.
 */
function computeV04(p: ComputeV04Params): V04Output {
  const zLangMap: ZLangMap = {};
  const kernBreakdown: KernBreakdown[] = [];
  const perCore: CoreTriggerInput[] = [];
  let wikiZkort = 0;

  for (const code of KERN_CODES) {
    const meta = INDICATORS[code];
    const plain = PLAIN[code];
    const series = sortByDate(p.history[code] ?? []);
    const rawToday = p.raw[code];
    const hasToday = rawToday !== undefined && Number.isFinite(rawToday);
    // Alleen codes met een ECHTE baseline tellen mee; synthetische fixture-historie
    // (andere schaal/verdeling) zou valse z-scores en valse triggers opleveren.
    const baselineReal = !p.realBaselineCodes || p.realBaselineCodes.includes(code);

    if (!hasToday || !baselineReal) {
      // Geen dagwaarde óf geen echte baseline → telt niet mee in composiet/triggers.
      const longSlice = sliceTrailing(series, p.date, LANG_MAANDEN);
      kernBreakdown.push({
        code,
        domain: meta.domain,
        plain_name: plain.plain,
        class: klasse(code),
        raw_value: hasToday ? round3(rawToday as number) : null,
        z_kort: null,
        z_lang: null,
        delta_1d: null,
        percentile_lang: null,
        baseline_lang_jaren: baselineReal ? Math.round(spanYears(longSlice)) : 0,
        state: "ontbreekt",
        w_meting: round3(wMeting(code)),
        w_trigger: round3(wTrigger(code)),
        contribution_meting: 0,
        simulated: p.simulated.includes(code) || !baselineReal,
        observation_date: p.observationDates?.[code] ?? p.date,
        data_source: plain.dataSource,
      });
      continue;
    }

    const value = rawToday as number;
    const merged = mergeToday(series, p.date, value);
    // STL-seizoenscorrectie alleen op het LANGE venster (meer data per kalendermoment,
    // §2). Het korte venster (~18m) heeft toch zelden ≥3 cycli en stuurt vooral spikes.
    const zl = windowedZ(value, merged, p.date, LANG_MAANDEN, meta);
    const zk = windowedZ(value, merged, p.date, KORT_MAANDEN, { applyStl: false });

    // delta_1d = z_kort(t) − z_kort(t−1), op dezelfde korte baseline.
    let delta1d = 0;
    const prev = lastBefore(series, p.date);
    if (prev && zk.applied) {
      const zkPrev = windowedZ(prev.value, merged, prev.date, KORT_MAANDEN, { applyStl: false });
      if (zkPrev.applied) delta1d = zk.z - zkPrev.z;
    }

    const zLang = zl.applied ? zl.z : 0;
    const zKort = zk.applied ? zk.z : 0;
    const pctLang =
      zl.applied && zl.distribution.length > 0 ? percentileRank(zl.effectiveValue, zl.distribution) : 0;

    zLangMap[code] = zLang;
    if (code === "I-D5-002") wikiZkort = zKort;

    const wm = wMeting(code);
    const state: KernBreakdown["state"] = pctLang >= P90 ? "rood" : pctLang >= P70 ? "verhoogd" : "normaal";

    kernBreakdown.push({
      code,
      domain: meta.domain,
      plain_name: plain.plain,
      class: klasse(code),
      raw_value: round3(value),
      z_kort: round2(zKort),
      z_lang: round2(zLang),
      delta_1d: round2(delta1d),
      percentile_lang: Math.round(pctLang),
      baseline_lang_jaren: Math.round(zl.jaren),
      state,
      w_meting: round3(wm),
      w_trigger: round3(wTrigger(code)),
      contribution_meting: round2(wm * zLang),
      simulated: p.simulated.includes(code),
      observation_date: p.observationDates?.[code] ?? p.date,
      data_source: plain.dataSource,
    });

    perCore.push({
      code,
      domain: meta.domain,
      plain_name: plain.plain,
      klasse: klasse(code),
      z_kort: zKort,
      z_lang: zLang,
      delta_1d: delta1d,
      percentile_lang: pctLang,
    });
  }

  const compMeting = compositeMeting(zLangMap);
  const achterg = achtergrond(zLangMap);
  const lf = loadFactor(achterg);

  // Percentiel van composite_meting binnen zijn rollende historie (lang + kort venster).
  const metingDist = p.compositeMetingHistory.map((h) => h.value);
  const pctMetingLang =
    metingDist.length > 0 ? percentileRank(compMeting, [...metingDist, compMeting]) : 50;
  const kortDist = sliceTrailing(p.compositeMetingHistory as HistPoint[], p.date, KORT_MAANDEN).map(
    (h) => h.value,
  );
  const pctMetingKort =
    kortDist.length > 0 ? percentileRank(compMeting, [...kortDist, compMeting]) : pctMetingLang;

  // v0.4-tier uit de percentiel-historie van composite_meting (eigen snelle regel).
  const metingPercHist = buildPercentileHistory(p.compositeMetingHistory, compMeting);
  const v04Tier = computeV04Tier(metingPercHist);

  // Bevestigingssignalen voor de trigger-severity (§4 rem B; reddit nooit zelfstandig).
  const confirmedBy: string[] = [];
  if (wikiZkort >= CONFIRM_Z) confirmedBy.push("I-D5-002");
  if (p.confirmation.redditElevated) confirmedBy.push("I-D5-006S");
  if (p.confirmation.layoffRadarElevated) confirmedBy.push("I-D3-003S");

  const trig = evaluateTriggers({
    perCore,
    compositeMeting: compMeting,
    compositePercentileLang: pctMetingLang,
    loadFactor: lf,
    brandSafetyFlag: p.brandSafetyFlag,
    confirmedBy,
    priorState: p.priorTriggerState,
    nowISO: p.nowISO,
  });

  return {
    schema_version: "0.4.0",
    mode: trig.mode,
    composite: {
      meting: round2(compMeting),
      achtergrond: round2(achterg),
      load_factor: round2(lf),
    },
    baseline: {
      kort_maanden: KORT_MAANDEN,
      lang_maanden_target: LANG_MAANDEN,
      lang_rolling: true,
      laatste_herijking: null,
    },
    percentile: {
      lang: Math.round(pctMetingLang),
      kort: Math.round(pctMetingKort),
      fixed_2010_2019: null,
    },
    tier: { current: v04Tier.tier, days_in_tier: v04Tier.daysInTier },
    kern_breakdown: kernBreakdown,
    triggers: trig.triggers,
    trigger_state: trig.newState,
  };
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

function sortByDate<T extends { date: string }>(series: T[]): T[] {
  return [...series].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function mergeToday(
  series: Array<{ date: string; value: number }>,
  date: string,
  value: number,
): Array<{ date: string; value: number }> {
  const without = series.filter((pt) => pt.date !== date);
  without.push({ date, value });
  return sortByDate(without);
}

function lastBefore(
  series: Array<{ date: string; value: number }>,
  date: string,
): { date: string; value: number } | null {
  let best: { date: string; value: number } | null = null;
  for (const pt of series) {
    if (pt.date < date && (best === null || pt.date > best.date)) best = pt;
  }
  return best;
}
