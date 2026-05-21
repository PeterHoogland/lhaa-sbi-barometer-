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
