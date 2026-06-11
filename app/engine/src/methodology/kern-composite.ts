/**
 * SBI v0.4 — meet-composiet, achtergronddruk en load-factor.
 * Bron: HANDOVER §2 (v0.4-richtlijn) §3.2 + §3.3.
 *
 *   composite_meting = Σ_kern   ( w_meting_i × z_lang_i ) / Σ_aanwezig w_meting_i
 *   achtergrond      = Σ_traag  ( w_meting_i × z_lang_i ) / Σ_aanwezig w_meting_i
 *   load_factor      = clamp( 1 − k·achtergrond , 0.6 , 1.0 )  // moduleert de drempel
 *
 * De deler is de hernormalisatie over AANWEZIGE kern-codes (A1): een ontbrekende
 * indicator (schaarse of geen echte baseline) mag het composiet niet richting 0
 * verdunnen alsof er "normaal" gemeten is. Zodra alle 9 kern-codes aanwezig zijn
 * is de factor exact 1 en is de formule identiek aan de oorspronkelijke.
 *
 * Beide composieten gebruiken de LANGE baseline (z_lang): het cijfer moet de
 * werkelijke last weerspiegelen, niet schommelen op recente ruis. De load-factor
 * is de brug naar de trigger-laag — hoe hoger de grondlast, hoe lager de
 * drempel waarop een snelle spike vuurt (§3.3).
 */

import type { IndicatorCode, Tier } from "../types.js";
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

/**
 * Hernormalisatie-noemer (A1): Σ w_meting van de kern-codes die met een eindige z
 * in de map aanwezig zijn. Altijd over de VOLLE kern-set berekend — ook voor het
 * achtergrond-deelcomposiet — zodat achtergrond zijn deelsom-semantiek behoudt
 * (achtergrond < meting bij gelijke z) en de factor exact 1 is bij volledige dekking.
 */
function presentWeight(zLang: ZLangMap): number {
  let sum = 0;
  for (const code of KERN_CODES) {
    const z = zLang[code];
    if (z === undefined || !Number.isFinite(z)) continue;
    sum += wMeting(code);
  }
  return sum;
}

/** composite_meting = Σ over de aanwezige kern van w_meting × z_lang, hernormaliseerd. */
export function compositeMeting(zLang: ZLangMap): number {
  const pw = presentWeight(zLang);
  if (pw === 0) return 0; // geen enkele kern-code aanwezig → neutraal én eindig (geen 0/0)
  return weightedSum(KERN_CODES, zLang) / pw;
}

/** achtergrond = Σ over de trage grondlast-bronnen van w_meting × z_lang (§3.3), hernormaliseerd. */
export function achtergrond(zLang: ZLangMap): number {
  const pw = presentWeight(zLang);
  if (pw === 0) return 0;
  return weightedSum(ACHTERGROND_CODES, zLang) / pw;
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

/**
 * v0.4 ZICHTBARE tier-kalibratie (backtest-onderbouwd, 2026-06).
 *
 * De pre-geregistreerde v0.2-tier (P70/P90, 3-dagen-sustained) bleek over 742
 * dagen 97,7% groen — de 3-dagen-regel slikte ~3 op de 4 verhoogde dagen op.
 * Deze v0.4-tier reageert sneller zodat de bezoeker beweging ziet. Dit is een
 * kalibratie van de NOG-NIET-bevroren v0.4-laag (spec §8), niet van de
 * pre-geregistreerde v0.2-tier — die blijft onveranderd meelopen.
 *
 *   oranje : na 1 dag  ≥ P60
 *   rood   : na 2 dagen ≥ P90
 *   afschaling: na 2 dagen onder de drempel (hysteresis)
 *
 * Kalibratie (2026-06, backtest op de vollere kern van 8 indicatoren):
 * oranje blijft agressief (P60, 1 dag) → veel zichtbare "verhoogd"-beweging, eerlijk
 * in een stressvol tijdperk (~16% oranje). Rood is terug naar UITZONDERLIJK (P90,
 * 2 dagen): de agressieve P85/1d gaf 15% rode dagen — te veel om "rood" als echt
 * alarm te laten betekenen. Nu ~5% rood. Blijft de v0.4-laag; v0.2-tier onveranderd.
 */
export const V04_AMBER_P = 60;
export const V04_AMBER_SUSTAIN = 1;
export const V04_RED_P = 90;
export const V04_RED_SUSTAIN = 2;
export const V04_DECAY = 2;

export function computeV04Tier(percentileHistory: number[]): { tier: Tier; daysInTier: number } {
  let tier: Tier = "green";
  let prev: Tier = "green";
  let redRun = 0;
  let amberRun = 0;
  let belowRedRun = 0;
  let belowAmberRun = 0;
  let daysInTier = 0;

  for (const p of percentileHistory) {
    const isRed = p >= V04_RED_P;
    const isAmber = p >= V04_AMBER_P;
    redRun = isRed ? redRun + 1 : 0;
    amberRun = isAmber ? amberRun + 1 : 0;
    belowRedRun = isRed ? 0 : belowRedRun + 1;
    belowAmberRun = isAmber ? 0 : belowAmberRun + 1;

    // Escalatie — snel
    if (redRun >= V04_RED_SUSTAIN) tier = "red";
    else if (amberRun >= V04_AMBER_SUSTAIN && tier !== "red") tier = "amber";

    // Afschaling — met hysteresis
    if (tier === "red" && belowRedRun >= V04_DECAY) tier = isAmber ? "amber" : "green";
    if (tier === "amber" && belowAmberRun >= V04_DECAY) tier = "green";

    daysInTier = tier === prev ? daysInTier + 1 : 1;
    prev = tier;
  }

  return { tier, daysInTier };
}
