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

/** Kalendercontext (A6): afgeleid uit de datum, geen meting — bewust zonder z of state. */
export interface ContextSignal {
  code: string;
  name: string;
  plain_name: string;
  raw_value: number;
  unit: string;
  reads: string;
  why: string;
  /** Evidence-grade (B8). Optioneel: oudere data-records missen dit veld. */
  grade?: EvidenceGrade;
  /** Eerlijke bewijskracht-duiding (B8). Optioneel: oudere data-records missen dit veld. */
  evidence_note?: string;
  source: string;
  observation_date: string;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
}

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";
export type EvidenceGrade = "A" | "B" | "C" | "D";

export interface IndicatorBreakdown {
  code: string;
  domain: DomainCode;
  /** Evidence-grade (review §3). Optioneel: oudere data-records missen dit veld.
   *  Grade D wordt in de publieke indicatorlijsten weggelaten. */
  grade?: EvidenceGrade;
  /** Eerlijke bewijskracht-duiding (B8). Optioneel: oudere data-records missen dit veld. */
  evidence_note?: string;
  /** B2: normalisatie van vandaag ("mad_z" = voorlopig, "ecdf" = lange baseline). */
  normalization?: "ecdf" | "mad_z";
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
  /** Echte waarde maar geen verse dagmeting: jaarconstante (A7) of cache-terugval (A8). */
  imputed?: boolean;
  /** Inverse-coded: hoge stress = LAGE onderliggende waarde (bv. consumentenvertrouwen). */
  inverseCoded?: boolean;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
  observation_date: string;
  demographic_reach: number;
  reach_rationale: string;
}

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

/** B3 — bootstrap-onzekerheid rond het dagcijfer. Optioneel: oudere records missen dit. */
export interface DayUncertainty {
  method: string;
  n_draws: number;
  n_indicators: number;
  n_reference: number;
  ci_90_lower: number;
  ci_90_upper: number;
  width_fraction: number;
  uncertainty_flag: "low" | "medium" | "high";
  flag_reason: string;
  /** Null wanneer er geen trekkingen waren (no_scored_indicators). */
  composite_ci_95: [number, number] | null;
  covers: string;
  seed: number;
}

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
      correlation_inverse_vs_equal_12w: number | null;
      composite_range_with_dropouts: [number, number];
      bootstrap_95_ci_around_equal: [number, number] | null;
      status?: Record<string, "not_computed">;
    };
  };
  percentile: {
    short_24m: number;
    fixed_2010_2019: number | null;
    fixed_2010_2019_status?: "not_computed";
    /** B2: true zolang minstens één gescoorde indicator op voorlopige MAD-z draait. */
    normalization_provisional?: boolean;
    /** B2: indicatoren die de eCDF-gate (>=3 jaar seizoenshistorie) haalden. */
    ecdf_active?: string[];
  };
  /** B3 — alleen aanwezig wanneer de bootstrap echt is uitgevoerd. */
  uncertainty?: DayUncertainty;
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  indicator_breakdown: IndicatorBreakdown[];
  secondary_signals: SecondarySignal[];
  /** Kalendercontext (A6) — optioneel: oudere records missen dit veld. */
  context_signals?: ContextSignal[];
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
    /** A7 — optioneel: oudere records missen deze velden. */
    demo_fraction?: number;
    score_label?: "demo" | "echt";
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: string;
  };
  /** SBI v0.4 meet- + trigger-laag (optioneel — oudere records missen dit). */
  v04?: V04Output;
}

// --- SBI v0.4 — meet- + trigger-laag (mirror van engine V04Output) ---

export type KernKlasseLabel = "direct" | "snel" | "traag";
export type KernState = "normaal" | "verhoogd" | "rood" | "ontbreekt";

export interface KernBreakdown {
  code: string;
  domain: DomainCode;
  plain_name: string;
  class: KernKlasseLabel;
  raw_value: number | null;
  z_kort: number | null;
  z_lang: number | null;
  delta_1d: number | null;
  percentile_lang: number | null;
  baseline_lang_jaren: number;
  state: KernState;
  w_meting: number;
  w_trigger: number;
  contribution_meting: number;
  simulated: boolean;
  observation_date: string;
  data_source: { name: string; url: string };
}

export interface TriggerEvent {
  type: "indicator.spike" | "indicator.red" | "composite.amber" | "composite.red" | "emotie.spike";
  fired_at: string;
  scope: "indicator" | "composite";
  code: string | null;
  domain: DomainCode | null;
  plain_name: string | null;
  severity: "hoog" | "let_op";
  z_kort: number | null;
  z_lang: number | null;
  delta_1d: number | null;
  percentile_lang: number | null;
  load_factor: number;
  confirmed_by: string[];
  campaign_hint: string;
  require_manual_approval: boolean;
  cooldown_until: string;
}

export interface V04Output {
  schema_version: string;
  mode: "test" | "live";
  composite: { meting: number; achtergrond: number; load_factor: number };
  baseline: {
    kort_maanden: number;
    lang_maanden_target: number;
    lang_rolling: boolean;
    laatste_herijking: string | null;
  };
  percentile: { lang: number; kort: number; fixed_2010_2019: number | null };
  tier: { current: Tier; days_in_tier: number };
  kern_breakdown: KernBreakdown[];
  triggers: TriggerEvent[];
  trigger_state: {
    last_fired: Record<string, string>;
    recent: Array<{ key: string; fired_at: string; severity: string }>;
  };
}

export interface SparklinePoint {
  date: string;
  composite: number;
  percentile: number;
  tier: Tier;
}
