/**
 * SBI v0.4 — meet-composiet, achtergronddruk en load-factor.
 * Bron: HANDOVER §2 (v0.4-richtlijn) §3.2 + §3.3.
 *
 *   composite_meting = Σ_kern   ( w_meting_i × z_lang_i )      // de kleurbol
 *   achtergrond      = Σ_traag  ( w_meting_i × z_lang_i )      // economische grondlast
 *   load_factor      = clamp( 1 − k·achtergrond , 0.6 , 1.0 )  // moduleert de drempel
 *
 * Beide composieten gebruiken de LANGE baseline (z_lang): het cijfer moet de
 * werkelijke last weerspiegelen, niet schommelen op recente ruis. De load-factor
 * is de brug naar de trigger-laag — hoe hoger de grondlast, hoe lager de
 * drempel waarop een snelle spike vuurt (§3.3).
 */

import type { IndicatorCode } from "../types.js";
import { KERN_CODES, ACHTERGROND_CODES } from "../indicators/kern.js";
import { wMeting } from "./kern-weights.js";

export type ZLangMap = Partial<Record<IndicatorCode, number>>;

function weightedSum(codes: IndicatorCode[], zLang: ZLangMap): number {
  let sum = 0;
  for (const code of codes) {
    const z = zLang[code];
    if (z === undefined || !Number.isFinite(z)) continue;
    sum += wMeting(code) * z;
  }
  return sum;
}

/** composite_meting = Σ over de 9 kern van w_meting × z_lang. */
export function compositeMeting(zLang: ZLangMap): number {
  return weightedSum(KERN_CODES, zLang);
}

/** achtergrond = Σ over de trage grondlast-bronnen van w_meting × z_lang (§3.3). */
export function achtergrond(zLang: ZLangMap): number {
  return weightedSum(ACHTERGROND_CODES, zLang);
}

/** k uit §3.3 (te kalibreren via backtest, daarna bevriezen). */
export const LOAD_K = 0.15;
/** Clamp-grenzen uit §3.3 — de drempel zakt max. 40%, stijgt nooit boven normaal. */
export const LOAD_CLAMP_MIN = 0.6;
export const LOAD_CLAMP_MAX = 1.0;

/**
 * load_factor = clamp(1 − k·achtergrond, 0.6, 1.0). Hoge grondlast → lager dan 1
 * (gevoeliger). Lage/negatieve grondlast → 1.0 (normale, strenge drempel).
 */
export function loadFactor(achtergrondValue: number, k = LOAD_K): number {
  const raw = 1 - k * achtergrondValue;
  return Math.min(LOAD_CLAMP_MAX, Math.max(LOAD_CLAMP_MIN, raw));
}
