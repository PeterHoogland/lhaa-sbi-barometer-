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
export {
  decideBrandSafety,
  VERDRIET_SHARE_MIN,
  VERDRIET_SPIKE_P,
  MIN_VERDRIET_HISTORY,
  VERDRIET_COLD_START_FLOOR,
  BRAND_SAFETY_EXPIRY_DAYS,
  type VerdrietSignal,
  type BrandSafetyDecision,
} from "./methodology/brand-safety.js";
export { computeDaily, buildPercentileHistory, type DailyComputeInput } from "./runtime.js";

// --- SBI v0.4 — meet- + trigger-laag ---
export {
  KERN_CODES,
  SNELHEIDSFACTOR,
  ACHTERGROND_CODES,
  isKern,
  klasse,
  snelheidsfactor,
  bewijslast,
  triggerGewicht,
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
  computeV04Tier,
  LOAD_K,
  LOAD_CLAMP_MIN,
  LOAD_CLAMP_MAX,
  V04_AMBER_P,
  V04_RED_P,
  V04_AMBER_SUSTAIN,
  V04_RED_SUSTAIN,
  V04_DECAY,
  type ZLangMap,
} from "./methodology/kern-composite.js";
export {
  evaluateTriggers,
  EMPTY_TRIGGER_STATE,
  SPIKE_DREMPEL,
  P70 as TRIGGER_P70,
  P90 as TRIGGER_P90,
  INDICATOR_RED_P,
  COOLDOWN_H,
  ERNST_DREMPEL,
  type TriggerEvent,
  type TriggerState,
  type CoreTriggerInput,
  type EvaluateTriggersInput,
  type EvaluateTriggersResult,
  type Severity,
  type TriggerType,
  type CampaignHint,
} from "./methodology/triggers.js";

// --- SBI v0.4 — campagne-webhook (trigger-uitgang) ---
export {
  buildWebhookPayload,
  dispatchTriggers,
  WEBHOOK_SCHEMA,
  DEFAULT_TIMEOUT_MS,
  type WebhookPayload,
  type WebhookBarometer,
  type WebhookSummary,
  type DispatchOptions,
  type DispatchResult,
  type DispatchStatus,
} from "./webhook.js";
