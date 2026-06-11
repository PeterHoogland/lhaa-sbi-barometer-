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
  ContextSignal,
  Tier,
  BrandSafety,
  V04Output,
  KernBreakdown,
} from "./types.js";
import { INDICATOR_CODES, INDICATORS, contextIndicators, scoredDomains } from "./indicators/registry.js";
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
import { seasonalPercentile, buildSeasonalPercentileHistory } from "./methodology/seasonal-percentile.js";
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

// 0.3.0 (2026-06-11, BLOK A): D6-kalendercontext uit het composiet (A6),
// hernormalisatie gewichten 1/6→1/5 + Schema-2 pro rata. Zie CHANGELOG.md.
const METHODOLOGY_VERSION = "0.3.0";
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
  /** Bevestigingssignalen voor de trigger-severity (reddit #8, ontslag-radar #7, emotie). */
  confirmationSignals?: { redditElevated?: boolean; layoffRadarElevated?: boolean; emotieElevated?: boolean };
  /** Emotie-spike-input (V6 2b): lading + percentiel binnen de eigen historie + #punten. */
  emotieSignal?: { value: number; percentileLang: number; nHistory: number };
  /** Huidige tijd (ISO) voor trigger fired_at/cooldown. Default: nu. */
  nowISO?: string;
}

/**
 * Minimaal aantal historiepunten voor een betrouwbare v0.2-baseline-Z. Onder deze
 * drempel scoren we de indicator NIET: hij wordt uitgesloten uit het composiet en
 * krijgt state "ontbreekt" — i.p.v. een neutrale 0 die als "normaal" zou lezen
 * (review §0-bis.3: dataschaarste mag geen geruststelling tonen).
 *
 * NB: de v0.4-laag hanteert bewust een lagere drempel (MIN_POINTS_FOR_Z = 8 in
 * methodology/baseline-window.ts) omdat maandbronnen in een 18-maands venster
 * maar ~12–18 punten hebben; de "ontbreekt"-conventie is in beide lagen gelijk.
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
    // Kalendercontext (A6): afgeleid uit de datum, geen meting — krijgt géén
    // z-score en telt niet mee in het composiet. NIET in `missing` (het is geen
    // datafalen); verschijnt apart in context_signals.
    if (meta.contextOnly) continue;
    const x = raw[code];
    if (x === undefined || !Number.isFinite(x)) {
      missing.push(code);
      continue;
    }

    // Geen ECHTE baseline: de reconstructie vult de historie van dunne indicatoren
    // synthetisch op (~730 punten), waardoor de MIN_HISTORY-check hieronder niet
    // grijpt en de indicator tegen VERZONNEN data wordt gescoord (bv. trein I-D2-009
    // met 6 echte punten → valse z). Sluit zulke codes uit i.p.v. ze het echte cijfer
    // te laten beïnvloeden (Peter: alles echt). De v0.4-laag doet dit al via
    // `baselineReal`; dit trekt de v0.2-laag gelijk. Deterministische indicatoren
    // (kalender, daglicht) zijn berekend en altijd geldig, dus uitgezonderd.
    if (!meta.deterministic && input.realBaselineCodes && !input.realBaselineCodes.includes(code)) {
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
      // Geen bruikbare schaal — de baseline heeft (bijna) geen variatie. Twee gevallen:
      // (a) de dagwaarde ligt OP of ONDER de mediaan → per definitie GEEN hoge
      //     uitschieter. Dat is geen datagebrek maar een gemeten "geen uitschieter"
      //     (bv. Kou: in Brussel zakt de temperatuur zelden onder −5°C, dus de
      //     koude-overschrijding is vrijwel altijd 0). Score z=0 → state "normaal"
      //     i.p.v. het alarmerend-ogende "ontbreekt". Cijfer-neutraal: z=0 levert geen
      //     bijdrage en de domeingewichten zijn vast (review §4.1 blijft gerespecteerd
      //     voor het écht-ambigue geval hieronder).
      // (b) de dagwaarde ligt BOVEN een platte baseline → geen schaal om te wegen hoe
      //     uitzonderlijk → blijf "ontbreekt" (geen stille geruststelling).
      if (!meta.inverseCoded && effectiveValue <= baseline.median) {
        z = 0;
      } else {
        missing.push(code);
        continue;
      }
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

  // [7] SIGNAL — seizoens-bewust percentiel: vergelijk vandaag tegen dezelfde
  // periode van het jaar (± venster), niet tegen het hele 2-jaars-blok. Een
  // rustige junidag wordt zo tegen vroegere junidagen gewogen i.p.v. tegen winters
  // (eerlijker + minder cross-seizoen-grilligheid). Terugval op het volledige
  // venster bij te weinig seizoenspunten. Zie methodology/seasonal-percentile.ts.
  const percShort = seasonalPercentile(equal.composite, input.date, input.compositeHistory);

  // Tier-logica vereist een geschiedenis van (seizoens-)percentielen, lookahead-vrij.
  const percentileHistory = buildSeasonalPercentileHistory(input.compositeHistory, {
    date: input.date,
    value: equal.composite,
  });
  const tierResult = computeTier(percentileHistory);

  // Tier history 30d (asymmetrisch, geen kortere lookback)
  const tierHistory30d: Tier[] = tierResult.tierHistory.slice(-30);

  // Top 3 domains
  const topThree = equal.domainContributions.slice(0, 3);

  // Conditie-Niveau (CN) — publieke 5-bands-schaal afgeleid van tier + percentile + brand-safety
  const brandSafetyFlag = input.brandSafety?.flag ?? "normal";
  const cn = computeConditionLevel(tierResult.tier, percShort, brandSafetyFlag);

  // Per-indicator publieksvriendelijke breakdown — alle gemeten indicatoren uit de
  // registry (kalendercontext uitgezonderd: die staat in context_signals, A6).
  const indicatorBreakdown: IndicatorBreakdown[] = INDICATOR_CODES
    .filter((code) => !INDICATORS[code].contextOnly)
    .map((code) => {
    const meta = INDICATORS[code];
    const plain = PLAIN[code];
    const z = zShort[code];
    const rawValue = raw[code] ?? null;
    const isMissing = z === undefined;
    // Grade D = experimentele proxy → telt niet mee in het cijfer (review §3), dus
    // ook géén contributie in de breakdown/top-3 (consistent met computeComposite).
    const isDiagnostic = meta.grade === "D";
    const contribution = isMissing || isDiagnostic
      ? 0
      : indicatorWeight("equal", code, meta.domain) * domainWeight("equal", meta.domain) * (z as number);
    return {
      code,
      domain: meta.domain,
      grade: meta.grade,
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
      imputed: (input.imputedIndicators ?? []).includes(code),
      inverseCoded: meta.inverseCoded,
      data_source: plain.dataSource,
      references: plain.references,
      observation_date:
        input.observationDates?.[code] ?? (meta.deterministic ? input.date : input.date),
      demographic_reach: DEMOGRAPHIC_REACH[code].reach,
      reach_rationale: DEMOGRAPHIC_REACH[code].rationale,
    };
  });

  // A7: gewogen demo-aandeel van het cijfer (voor data_quality + demo-banner).
  const demoFraction = computeDemoFraction(zShort, input.simulatedIndicators ?? []);

  // Kalendercontext (A6): de D6-signalen als context — zonder z-score of state.
  // De ruwe waarde komt uit computeAllDeterministic (altijd geldig, geen meting).
  const contextSignals: ContextSignal[] = contextIndicators().map((meta) => {
    const plain = PLAIN[meta.code];
    return {
      code: meta.code,
      name: meta.name,
      plain_name: plain.plain,
      raw_value: Math.round((raw[meta.code] ?? 0) * 1000) / 1000,
      unit: plain.unit,
      reads: plain.reads,
      why: plain.why,
      source: meta.source,
      observation_date: input.date,
      data_source: plain.dataSource,
      references: plain.references,
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
    emotieSignal: input.emotieSignal,
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
    context_signals: contextSignals,
    media_cluster_diagnostic: {
      d5_cross_correlation_7d: round2(d5Cross),
      composite_without_d5: round2(withoutD5),
      media_contribution_percentile_points: Math.abs(
        Math.round(seasonalPercentile(withoutD5, input.date, input.compositeHistory) - percShort),
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
      // A7: gewogen demo-aandeel in het cijfer + label. Het label wordt op de
      // ONafgeronde fractie bepaald (geen flapperen rond de drempel door round2).
      demo_fraction: round2(demoFraction),
      score_label: demoFraction >= DEMO_FRACTION_THRESHOLD ? "demo" : "echt",
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

/** Drempel waarboven de hele dagscore als "demo" gelabeld wordt (A7). */
export const DEMO_FRACTION_THRESHOLD = 0.3;

/**
 * Gewogen demo-aandeel ÍN het cijfer (A7): het aandeel van het equal-gewicht dat
 * uit gesimuleerde indicatoren komt, genormaliseerd over de indicatoren die
 * werkelijk meetellen (z aanwezig, grade ≠ D, geen kalendercontext) — gespiegeld
 * aan de uitsluitingen van computeComposite. Een simulated indicator die niet
 * scoort (missing) beïnvloedt het cijfer niet en telt dus bewust niet mee.
 * Keerzijde, ook bewust: op een dag waarop bijna alles ontbreekt en één
 * simulated indicator wél scoort, is de fractie hoog — het cijfer ís dan
 * vooral demo.
 */
export function computeDemoFraction(z: ZMap, simulated: IndicatorCode[]): number {
  let counted = 0;
  let demo = 0;
  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    if (z[code] === undefined) continue;
    if (meta.grade === "D") continue;
    if (meta.contextOnly) continue;
    const w = indicatorWeight("equal", code, meta.domain) * domainWeight("equal", meta.domain);
    counted += w;
    if (simulated.includes(code)) demo += w;
  }
  return counted > 0 ? demo / counted : 0;
}

function estimateDropoutRange(z: ZMap): [number, number] {
  // Bereken composiet met telkens één gescoord domein weggelaten — neem min/max
  const composites: number[] = [];
  for (const domain of scoredDomains()) {
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
  confirmation: { redditElevated?: boolean; layoffRadarElevated?: boolean; emotieElevated?: boolean };
  emotieSignal?: { value: number; percentileLang: number; nHistory: number };
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

    // Geen geldige lange-baseline-z → "ontbreekt", conform de v0.2-conventie
    // (MIN_HISTORY_FOR_Z): dataschaarste mag niet als z=0 ("normaal") in het
    // composiet lekken en het cijfer verdunnen. Eén uitzondering, gespiegeld aan
    // de v0.2-nuance in de z-loop hierboven: een vlakke baseline ("no_scale") met
    // een dagwaarde op of onder de mediaan is een gemeten "geen uitschieter"
    // (bv. koude-overschrijding 0 in de zomer) → z_lang = 0, state "normaal".
    // De 9 kern-codes zijn alle non-inverse, dus de inverse-tak vervalt hier.
    if (!zl.applied) {
      const flatNoOutlier =
        zl.reason === "no_scale" &&
        zl.distribution.length > 0 &&
        zl.effectiveValue <= computeBaseline(zl.distribution).median;
      if (!flatNoOutlier) {
        // NIET in zLangMap (composiet hernormaliseert over aanwezige codes) en
        // NIET in perCore (een schaarse code mag ook geen T1/T2-trigger voeden).
        kernBreakdown.push({
          code,
          domain: meta.domain,
          plain_name: plain.plain,
          class: klasse(code),
          raw_value: round3(value),
          z_kort: null,
          z_lang: null,
          delta_1d: null,
          percentile_lang: null,
          baseline_lang_jaren: Math.round(zl.jaren),
          state: "ontbreekt",
          w_meting: round3(wMeting(code)),
          w_trigger: round3(wTrigger(code)),
          contribution_meting: 0,
          simulated: p.simulated.includes(code),
          observation_date: p.observationDates?.[code] ?? p.date,
          data_source: plain.dataSource,
        });
        continue;
      }
    }

    // delta_1d = z_kort(t) − z_kort(t−1), op dezelfde korte baseline.
    let delta1d = 0;
    const prev = lastBefore(series, p.date);
    if (prev && zk.applied) {
      const zkPrev = windowedZ(prev.value, merged, prev.date, KORT_MAANDEN, { applyStl: false });
      if (zkPrev.applied) delta1d = zk.z - zkPrev.z;
    }

    // Na de guard hierboven: zl.applied, óf het vlakke-baseline-"geen uitschieter"-
    // geval (waar zl.z al 0 is). zl.z is hier dus altijd een gemeten waarde.
    const zLang = zl.z;
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
  if (p.confirmation.emotieElevated) confirmedBy.push("I-D5-emotie");

  const trig = evaluateTriggers({
    perCore,
    compositeMeting: compMeting,
    compositePercentileLang: pctMetingLang,
    loadFactor: lf,
    brandSafetyFlag: p.brandSafetyFlag,
    confirmedBy,
    emotie: p.emotieSignal,
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
