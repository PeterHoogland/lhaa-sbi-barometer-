/**
 * Core types for the SBI engine.
 * Reference: doc 02_Laag-3, doc 03_Laag-4, doc 04_Laag-5, doc 06_Laag-7.
 */

import type { TriggerEvent, TriggerState } from "./methodology/triggers.js";

export type IndicatorCode =
  | "I-D1-001" // Daglichturen
  | "I-D1-002" // Hitte
  | "I-D1-003" // Kou
  | "I-D1-004" // Luchtkwaliteit
  | "I-D1-009" // Wateroverlast (amendement Laag 3)
  | "I-D1-010" // Pollen (amendement Laag 3)
  | "I-D2-001" // Filezwaarte
  | "I-D2-004" // Brandstofprijzen
  | "I-D2-009" // Treinverstoringen (amendement Laag 3)
  | "I-D3-001" // CPI inflatie
  | "I-D3-002" // Energieprijzen
  | "I-D3-003" // Aangekondigde collectieve ontslagen
  | "I-D3-005" // Werkloosheidscijfer
  | "I-D3-006" // Hypotheekrente
  | "I-D3-007" // Consumentenvertrouwen (amendement 2026-06, Peter GO)
  | "I-D3-009" // Stroomnet-druk (amendement Laag 3)
  | "I-D4-001" // Kalendarische deadlinepieken
  | "I-D4-002" // Schoolvakantie-zonder-opvang
  | "I-D5-001" // Nieuwsnegativiteits-index
  | "I-D5-002" // Google Trends stress-termen
  | "I-D5-003" // Negatieve collectieve gebeurtenissen
  | "I-D6-001" // Dagen tot vakantie
  | "I-D6-002" // Weekdag-cyclus
  | "I-D6-003" // Klok-verzetten
  | "I-D6-005"; // Examenperiode

export type DomainCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export type EvidenceGrade = "A" | "B" | "C" | "D";

/** Per indicator: meta-info bevroren uit doc 02 §10. */
export interface IndicatorMeta {
  code: IndicatorCode;
  name: string;
  domain: DomainCode;
  grade: EvidenceGrade;
  /** Inverse-codering: indien true, Z wordt vermenigvuldigd met -1 voor optelbaarheid (doc 04 §5). */
  inverseCoded: boolean;
  /** STL toepassen op deze indicator? (doc 04 §3.2) */
  applyStl: boolean;
  /** Bron-disclaimer (doc 03 §2). */
  source: string;
  /** True wanneer indicator volledig uit kalender/astronomie afleidbaar is (Tier A). */
  deterministic: boolean;
}

/** Eén meetpunt voor één indicator op één datum. */
export interface RawSample {
  code: IndicatorCode;
  date: string; // ISO YYYY-MM-DD
  value: number;
  /** True wanneer waarde uit imputatie of mock komt (doc 03 §1.3 + transparency). */
  imputed?: boolean;
  /** True wanneer waarde uit fixture-/demo-data komt — eerlijke vlag voor MVP. */
  simulated?: boolean;
}

/** Volledige historische archief — gebruikt voor Z-baseline en percentiel. */
export type HistoricalArchive = Record<IndicatorCode, RawSample[]>;

/** Tier-stand per doc 06 §3. */
export type Tier = "green" | "amber" | "red";

/** Brand-safety-vlag per doc 06 §7. */
export type BrandSafety = "normal" | "elevated" | "block";

/** Domein-bijdrage in composite (doc 06 §5). */
export interface DomainContribution {
  domain: DomainCode;
  contribution: number;
}

/** Per-indicator detail voor de publieke UI. Niet de pre-geregistreerde wiskunde
 *  zelf — dat is `zScores` in de runtime — maar een leesbare projectie ervan. */
export interface IndicatorBreakdown {
  code: IndicatorCode;
  domain: DomainCode;
  /** Evidence-grade (review §3). D = experimentele proxy: telt niet mee in het
   *  cijfer en wordt in de publieke indicatorlijsten niet getoond. */
  grade: EvidenceGrade;
  plain_name: string;
  why: string;
  reads: string;
  unit: string;
  raw_value: number | null;        // ruwe waarde uit pipeline/deterministisch
  z_short: number | null;          // Z-score na inverse + winsorize (null = missing)
  contribution: number;            // w_indicator × w_domain × z (signed)
  state: "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";
  source: string;
  simulated: boolean;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
  /** Datum/periode waar de onderliggende data naar verwijst.
   *  Dagelijkse bron: YYYY-MM-DD. Maandelijkse bron (ECB): YYYY-MM. */
  observation_date: string;
  /** Geschat aandeel van de bevolking dat deze indicator raakt (0-1). */
  demographic_reach: number;
  /** Korte onderbouwing van het reach-percentage. */
  reach_rationale: string;
}

/** Conditie-Niveau (CN) — publieke 5-bands-schaal voor banner-activatie. */
export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

/** Secundaire / sensitiviteits-indicator. Telt NIET mee in het composiet
 *  of de banner-logica (doc 02 §10). Apart getoond, expliciet gelabeld. */
export interface SecondarySignal {
  code: string;
  name: string;
  value: number;
  source: string;
  simulated: boolean;
  observation_date: string;
}

// --- SBI v0.4 — meet- + trigger-laag (additief naast de v0.2-output) ---

/** Snelheidsklasse-label zoals het in de payload verschijnt (HANDOVER §1/§5). */
export type KernKlasseLabel = "direct" | "snel" | "traag";

/** Per kern-indicator detail voor de v0.4-laag (HANDOVER §5 datacontract). */
export interface KernBreakdown {
  code: IndicatorCode;
  domain: DomainCode;
  plain_name: string;
  class: KernKlasseLabel;
  raw_value: number | null;
  z_kort: number | null; // korte baseline (~18m) → spikes
  z_lang: number | null; // lange rolling baseline (~120m) → niveaus
  delta_1d: number | null; // dag-op-dag op z_kort
  percentile_lang: number | null; // positie binnen de lange rolling verdeling
  baseline_lang_jaren: number; // werkelijk beschikbare historie (eerlijk gemarkeerd)
  state: "normaal" | "verhoogd" | "rood" | "ontbreekt";
  w_meting: number;
  w_trigger: number;
  contribution_meting: number;
  simulated: boolean;
  observation_date: string;
  data_source: { name: string; url: string };
}

/** Het volledige v0.4-blok (HANDOVER §6 payload-uitbreiding). */
export interface V04Output {
  schema_version: string;
  mode: "test" | "live";
  composite: {
    meting: number; // Σ w_meting × z_lang over de 9 kern (de kleurbol)
    achtergrond: number; // Σ w_meting × z_lang over de trage grondlast-bronnen
    load_factor: number; // clamp(1 − k·achtergrond, 0.6, 1.0)
  };
  baseline: {
    kort_maanden: number;
    lang_maanden_target: number;
    lang_rolling: boolean;
    laatste_herijking: string | null;
  };
  percentile: {
    lang: number; // composite_meting-percentiel in de lange rolling verdeling
    kort: number; // idem in het korte venster
    fixed_2010_2019: number | null;
  };
  tier: {
    current: Tier;
    days_in_tier: number;
  };
  kern_breakdown: KernBreakdown[];
  triggers: TriggerEvent[];
  /** Cooldown-bookkeeping voor de volgende cyclus (transparant; UI negeert dit). */
  trigger_state: TriggerState;
}

/** Volledig daily-output-record — conform doc 06 §4.1. */
export interface DailyOutput {
  timestamp: string; // ISO
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
    /** Schema 3 — demografische reikwijdte-weging (parallel, amendement). */
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
  };
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  /** Volledige per-indicator detail — voor publieke transparantie. */
  indicator_breakdown: IndicatorBreakdown[];
  /** Secundaire signalen (bv. Reddit) — NIET in composiet, apart getoond. */
  secondary_signals: SecondarySignal[];
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
    indicators_with_imputed_data: IndicatorCode[];
    indicators_missing: IndicatorCode[];
    indicators_simulated: IndicatorCode[];
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: "minimum_viable_pipeline" | "target_architecture";
  };
  /** SBI v0.4 meet- + trigger-laag. Optioneel: ouder geschreven records missen dit. */
  v04?: V04Output;
}
