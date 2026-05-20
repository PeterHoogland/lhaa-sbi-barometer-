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
  pearsonCorrelation,
} from "./methodology/composite.js";
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
