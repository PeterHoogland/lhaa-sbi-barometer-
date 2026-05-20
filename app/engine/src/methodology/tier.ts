/**
 * Drie-tier-signaal met 3-dagen sustained-duration regel.
 * Bron: doc 06_Laag-7 §3.
 *
 * Drempels (pre-geregistreerd):
 *   Groen  P(t) < 70
 *   Oranje 70 ≤ P(t) < 90, gehandhaafd ≥ 3 opeenvolgende dagen
 *   Rood   P(t) ≥ 90, gehandhaafd ≥ 3 opeenvolgende dagen
 *
 * Decay: tier-afschaling pas na 3 dagen onder drempel (doc 00 §8.2).
 *
 * Rechtvaardiging 3-dagen: doc 06 §3.5 (cortisol-cyclus, allostatic load
 * literatuur McEwen 2007).
 */

import type { Tier } from "../types.js";

export const AMBER_THRESHOLD = 70;
export const RED_THRESHOLD = 90;
export const SUSTAINED_DAYS = 3;

/** Band waar dit percentiel formeel in valt — geen tier-uitspraak, alleen band. */
function percentileBand(p: number): Tier {
  if (p >= RED_THRESHOLD) return "red";
  if (p >= AMBER_THRESHOLD) return "amber";
  return "green";
}

/**
 * Bereken huidige tier uit reeks recente percentielen.
 * Asymmetrische logica: trage overgangen omhoog én omlaag (doc 06 §3.4).
 *
 * @param percentileHistory percentielen in chronologische volgorde, laatste = vandaag
 * @returns tier-stand vandaag, plus aantal dagen in deze tier
 */
export function computeTier(
  percentileHistory: number[],
): { tier: Tier; daysInTier: number; tierHistory: Tier[] } {
  if (percentileHistory.length === 0) {
    return { tier: "green", daysInTier: 0, tierHistory: [] };
  }

  // Stap 1: bereken band per dag
  const bands = percentileHistory.map(percentileBand);

  // Stap 2: pas sustained-duration regel toe voor opwaartse én neerwaartse overgangen
  const tiers: Tier[] = [];
  let currentTier: Tier = "green";
  let candidateTier: Tier = "green";
  let candidateRun = 0;

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (band === candidateTier) {
      candidateRun++;
    } else {
      candidateTier = band;
      candidateRun = 1;
    }
    if (candidateRun >= SUSTAINED_DAYS && candidateTier !== currentTier) {
      currentTier = candidateTier;
    }
    tiers.push(currentTier);
  }

  // Stap 3: tel hoe lang in huidige tier
  let daysInTier = 1;
  for (let i = tiers.length - 2; i >= 0; i--) {
    if (tiers[i] === currentTier) daysInTier++;
    else break;
  }

  return { tier: currentTier, daysInTier, tierHistory: tiers };
}
