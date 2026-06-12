/**
 * B3 — echte bootstrap-betrouwbaarheidsinterval rond het dagcijfer
 * (02_VERBETERPLAN BLOK B; vervangt de bewuste `not_computed`-placeholders).
 *
 * METHODE (baseline-resampling): voor elke gescoorde indicator hertrekken we de
 * baseline (met teruglegging, zelfde n), herberekenen we de volledige z-keten
 * met EXACT dezelfde productiefuncties (computeBaseline → zscore →
 * geen-schaal-splitsing → inverse-codering → winsorize), aggregeren we met
 * computeComposite en zetten we het resultaat om naar het seizoenspercentiel
 * tegen DEZELFDE referentieset als het gepubliceerde dagcijfer. De spreiding
 * van die percentielen over ≥2000 trekkingen is het 90%-interval.
 *
 * WAT DIT DEKT (en eerlijk: wat niet): de schattingsonzekerheid van de
 * baselines (mediaan/schaal uit een eindige steekproef) en de doorvertaling
 * daarvan naar het dagpercentiel. Het dekt GEEN bronfouten, modelkeuzes
 * (winsor-grens, STL) of afhankelijkheid tussen indicator-baselines
 * (indicatoren worden onafhankelijk hertrokken). Die bredere onzekerheid is
 * het domein van de gevoeligheidsanalyse (B4, OECD/JRC stap 7).
 *
 * DETERMINISTISCH: geseede PRNG (mulberry32, seed uit de datum) zodat dezelfde
 * dag reproduceerbaar hetzelfde interval geeft — vereist voor audit en tests.
 */

import type { IndicatorCode } from "../types.js";
import { computeBaseline, zscore } from "./zscore.js";
import { winsorize } from "./winsorize.js";
import { computeComposite, type ZMap } from "./composite.js";
import { percentileRank } from "./percentile.js";
import { ecdfZ } from "./ecdf.js";

/** Aantal trekkingen in productie (plan-eis: ≥ 2000). */
export const DEFAULT_BOOTSTRAP_DRAWS = 2000;
/** Onder dit aantal referentiepunten is het dagpercentiel zelf al wankel → flag "high". */
export const MIN_RELIABLE_REFERENCE = 30;

/** Drempels op de CI-breedte als fractie van de 0-100-schaal (plan B3). */
export const UNCERTAINTY_LOW_MAX = 0.10; // exclusief: width < 0.10 → low
export const UNCERTAINTY_MEDIUM_MAX = 0.20; // inclusief: 0.10 ≤ width ≤ 0.20 → medium

export type UncertaintyFlag = "low" | "medium" | "high";

export function classifyUncertainty(widthFraction: number): UncertaintyFlag {
  if (widthFraction < UNCERTAINTY_LOW_MAX) return "low";
  if (widthFraction <= UNCERTAINTY_MEDIUM_MAX) return "medium";
  return "high";
}

/** Eén gescoorde indicator zoals de hoofd-z-loop hem zag. */
export interface BootstrapIndicatorInput {
  code: IndicatorCode;
  /** Dagwaarde zoals gescoord (bij STL: het residu; bij eCDF: de ruwe waarde). */
  effectiveValue: number;
  /** De exacte baseline-/referentieset van de hoofdberekening. */
  baselineValues: number[];
  inverseCoded: boolean;
  /** Normalisatie van de hoofdberekening (B2): de trekking spiegelt dezelfde keten. */
  method: "mad" | "ecdf";
}

export interface DayUncertainty {
  method: "baseline_resample_bootstrap";
  n_draws: number;
  n_indicators: number;
  n_reference: number;
  /** 90%-interval van het dagpercentiel (percentielpunten, 0-100). */
  ci_90_lower: number;
  ci_90_upper: number;
  /** (upper - lower) / 100. */
  width_fraction: number;
  uncertainty_flag: UncertaintyFlag;
  /** Waarom de flag is wat hij is — "ci_width" tenzij een structurele reden overheerst. */
  flag_reason: "ci_width" | "thin_reference" | "no_scored_indicators";
  /** 95%-interval van het equal-composiet zelf (z-eenheden) — vult
   *  bootstrap_95_ci_around_equal. Null wanneer er geen trekkingen waren
   *  (no_scored_indicators): geen veld dat een niet-uitgevoerde berekening
   *  suggereert. */
  composite_ci_95: [number, number] | null;
  /** Eerlijk over dekking: baseline-schattingsonzekerheid, geen bron-/modelfout. */
  covers: string;
  seed: number;
}

/** FNV-1a hash → 32-bit seed uit een string (typisch de datum). */
export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — klein, snel, deterministisch; ruim voldoende voor resampling. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kwantiel met lineaire interpolatie over een GESORTEERDE array. */
function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}

export interface BootstrapDayInput {
  indicators: BootstrapIndicatorInput[];
  /** Dezelfde referentieset die seasonalPercentile voor vandaag gebruikte. */
  percentileReference: number[];
  nDraws?: number;
  seed: number;
}

/**
 * Bootstrap van het dagcijfer. Spiegelt per trekking de z-loop-regels van
 * runtime.ts exact: geen schaal + dagwaarde op/onder de hertrokken mediaan
 * (niet-inverse) = gemeten z=0; geen schaal erboven = indicator valt uit die
 * trekking (zoals "ontbreekt" uit het composiet valt).
 */
export function bootstrapDayUncertainty(input: BootstrapDayInput): DayUncertainty {
  // Ongeldige nDraws (0, negatief, NaN) zou NaN-kwantielen opleveren die na
  // JSON.stringify als null publiceren met een misleidende flag_reason — val
  // terug op de default in plaats van stil corrupt te rapporteren.
  const requested = input.nDraws ?? DEFAULT_BOOTSTRAP_DRAWS;
  const nDraws =
    Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : DEFAULT_BOOTSTRAP_DRAWS;
  const ref = input.percentileReference;
  const rng = mulberry32(input.seed);

  const covers =
    "Baseline-schattingsonzekerheid (resampling per indicator, onafhankelijk; referentieset en dagwaarde worden vastgehouden); dekt geen bronfouten, modelkeuzes of referentie-steekproefruis boven de 30-puntsgrens, zie gevoeligheidsanalyse (B4).";

  if (input.indicators.length === 0) {
    // Composiet is dan constant 0; een smal interval suggereren zou
    // schijnzekerheid zijn → volledig bereik + flag "high".
    return {
      method: "baseline_resample_bootstrap",
      n_draws: 0,
      n_indicators: 0,
      n_reference: ref.length,
      ci_90_lower: 0,
      ci_90_upper: 100,
      width_fraction: 1,
      uncertainty_flag: "high",
      flag_reason: "no_scored_indicators",
      // Geen trekkingen = geen composiet-CI. [0,0] zou als "echt gebootstrapt"
      // doorstromen naar bootstrap_95_ci_around_equal (placeholder-regel).
      composite_ci_95: null,
      covers,
      seed: input.seed,
    };
  }

  const percentileDraws: number[] = new Array(nDraws);
  const compositeDraws: number[] = new Array(nDraws);

  for (let b = 0; b < nDraws; b++) {
    const zMap: ZMap = {};
    for (const ind of input.indicators) {
      const n = ind.baselineValues.length;
      const resampled: number[] = new Array(n);
      for (let i = 0; i < n; i++) {
        resampled[i] = ind.baselineValues[Math.floor(rng() * n)];
      }
      let z: number;
      if (ind.method === "ecdf") {
        // B2-spiegel: hertrokken seizoensreferentie → eCDF-z (probit, geklemd).
        z = ecdfZ(ind.effectiveValue, resampled);
        if (!Number.isFinite(z)) continue;
      } else {
        const baseline = computeBaseline(resampled);
        z = zscore(ind.effectiveValue, baseline);
        if (!Number.isFinite(z)) {
          // Spiegel van runtime.ts: vlakke hertrokken baseline.
          if (!ind.inverseCoded && ind.effectiveValue <= baseline.median) {
            z = 0;
          } else {
            continue; // valt uit deze trekking, zoals "ontbreekt"
          }
        }
      }
      if (ind.inverseCoded) z = -z;
      zMap[ind.code] = winsorize(z).value;
    }
    const composite = computeComposite(zMap, "equal").composite;
    compositeDraws[b] = composite;
    percentileDraws[b] = percentileRank(composite, ref);
  }

  percentileDraws.sort((a, b) => a - b);
  compositeDraws.sort((a, b) => a - b);

  // Eerst afronden zoals gepubliceerd, dán classificeren: de flag moet exact
  // volgen uit de velden die een lezer in latest.json ziet, anders kan het
  // record op een drempelrand zijn eigen gedocumenteerde regel tegenspreken
  // (bv. ware breedte 0,0999 → "low" terwijl het JSON 0.100 toont).
  const lower = Math.round(quantileSorted(percentileDraws, 0.05) * 10) / 10;
  const upper = Math.round(quantileSorted(percentileDraws, 0.95) * 10) / 10;
  const widthFraction = Math.round(((upper - lower) / 100) * 1000) / 1000;

  const thinReference = ref.length < MIN_RELIABLE_REFERENCE;
  const flag: UncertaintyFlag = thinReference ? "high" : classifyUncertainty(widthFraction);

  return {
    method: "baseline_resample_bootstrap",
    n_draws: nDraws,
    n_indicators: input.indicators.length,
    n_reference: ref.length,
    ci_90_lower: lower,
    ci_90_upper: upper,
    width_fraction: widthFraction,
    uncertainty_flag: flag,
    flag_reason: thinReference ? "thin_reference" : "ci_width",
    composite_ci_95: [
      Math.round(quantileSorted(compositeDraws, 0.025) * 1000) / 1000,
      Math.round(quantileSorted(compositeDraws, 0.975) * 1000) / 1000,
    ],
    covers,
    seed: input.seed,
  };
}
