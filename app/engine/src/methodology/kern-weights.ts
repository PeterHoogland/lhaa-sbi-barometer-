/**
 * SBI v0.4 — twee gewichtssets (HANDOVER §3.1).
 *
 *   w_meting_i  = bewijslast_i × reikwijdte_i
 *   w_trigger_i = bewijslast_i × reikwijdte_i × snelheidsfactor_i
 *
 * Beide worden genormaliseerd over de 9 kern-indicatoren zodat ze sommeren
 * tot 1. w_meting voedt het meet-composiet (de kleurbol); w_trigger de
 * trigger-laag (de snelheidsfactor maakt snelle bronnen daar zwaarder).
 */

import type { IndicatorCode } from "../types.js";
import { KERN_CODES, bewijslast, reikwijdte, snelheidsfactor } from "../indicators/kern.js";

function rawMeting(code: IndicatorCode): number {
  return bewijslast(code) * reikwijdte(code);
}

function rawTrigger(code: IndicatorCode): number {
  return bewijslast(code) * reikwijdte(code) * snelheidsfactor(code);
}

const SUM_METING = KERN_CODES.reduce((s, c) => s + rawMeting(c), 0);
const SUM_TRIGGER = KERN_CODES.reduce((s, c) => s + rawTrigger(c), 0);

/** Genormaliseerd meet-gewicht van één kern-indicator (de 9 sommeren tot 1). */
export function wMeting(code: IndicatorCode): number {
  return rawMeting(code) / SUM_METING;
}

/** Genormaliseerd trigger-gewicht van één kern-indicator (de 9 sommeren tot 1). */
export function wTrigger(code: IndicatorCode): number {
  return rawTrigger(code) / SUM_TRIGGER;
}

/** Alle w_meting als map — handig voor de runtime en de tests. */
export function allWMeting(): Record<IndicatorCode, number> {
  return Object.fromEntries(KERN_CODES.map((c) => [c, wMeting(c)])) as Record<IndicatorCode, number>;
}

/** Alle w_trigger als map. */
export function allWTrigger(): Record<IndicatorCode, number> {
  return Object.fromEntries(KERN_CODES.map((c) => [c, wTrigger(c)])) as Record<IndicatorCode, number>;
}
