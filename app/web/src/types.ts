// Mirror van engine output-typen (zie ../../engine/src/types.ts)

export type Tier = "green" | "amber" | "red";
export type BrandSafety = "normal" | "elevated" | "block";
export type DomainCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export interface DomainContribution {
  domain: DomainCode;
  contribution: number;
}

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";

export interface IndicatorBreakdown {
  code: string;
  domain: DomainCode;
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
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
}

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

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
    weight_sensitivity: {
      correlation_inverse_vs_equal_12w: number;
      composite_range_with_dropouts: [number, number];
      bootstrap_95_ci_around_equal: [number, number];
    };
  };
  percentile: {
    short_24m: number;
    fixed_2010_2019: number;
  };
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  indicator_breakdown: IndicatorBreakdown[];
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
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: string;
  };
}

export interface SparklinePoint {
  date: string;
  composite: number;
  percentile: number;
  tier: Tier;
}
