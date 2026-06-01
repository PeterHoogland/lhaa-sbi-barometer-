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

// --- SBI v0.4 — meet- + trigger-laag ---
export {
  KERN_CODES,
  SNELHEIDSFACTOR,
  ACHTERGROND_CODES,
  isKern,
  klasse,
  snelheidsfactor,
  bewijslast,
  reikwijdte,
  type KernKlasse,
} from "./indicators/kern.js";
export { wMeting, wTrigger, allWMeting, allWTrigger } from "./methodology/kern-weights.js";
export {
  sliceTrailing,
  spanYears,
  windowedZ,
  MIN_POINTS_FOR_Z,
  type HistPoint,
} from "./methodology/baseline-window.js";
export {
  compositeMeting,
  achtergrond,
  loadFactor,
  LOAD_K,
  LOAD_CLAMP_MIN,
  LOAD_CLAMP_MAX,
  type ZLangMap,
} from "./methodology/kern-composite.js";
export {
  evaluateTriggers,
  EMPTY_TRIGGER_STATE,
  SPIKE_DREMPEL,
  P70 as TRIGGER_P70,
  P90 as TRIGGER_P90,
  COOLDOWN_H,
  ERNST_DREMPEL,
  type TriggerEvent,
  type TriggerState,
  type CoreTriggerInput,
  type EvaluateTriggersInput,
  type EvaluateTriggersResult,
  type Severity,
  type TriggerType,
} from "./methodology/triggers.js";
