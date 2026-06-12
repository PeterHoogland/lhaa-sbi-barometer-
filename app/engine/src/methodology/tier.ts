/**
 * Drie-tier-signaal — DAGELIJKS reactief sinds het amendement van 2026-06-12.
 * Bron: doc 06_Laag-7 §3 + amendement (00_Pre-Registratie §4.1.5, Peter GO).
 *
 * Drempels (ongewijzigd):
 *   Groen  P(t) < 70
 *   Oranje 70 ≤ P(t) < 90
 *   Rood   P(t) ≥ 90
 *
 * De NORM blijft het seizoensbewuste 24-maands percentiel (vandaag gewogen
 * tegen dezelfde periode van het jaar, 730 dagen terug — seasonal-percentile.ts).
 * Wat wijzigde is de REACTIESNELHEID: de tier volgt de dagband direct
 * (SUSTAINED_DAYS = 1), zowel omhoog als omlaag. Cijfer, label en banner zijn
 * daardoor elke dag onderling consistent; er is geen meerdaags geheugen meer
 * dat een "LAAG"-dag met een actieve banner kan combineren.
 *
 * Historiek: de oorspronkelijke pre-registratie eiste 3 opeenvolgende dagen
 * (rechtvaardiging doc 06 §3.5, McEwen 2007). De backtest toonde 97,7% groen:
 * de regel slikte vrijwel elke verhoogde periode op. Verwacht gevolg van de
 * dagregel, per definitie van het percentiel: banner actief op ~30% van de
 * dagen (≥ P70), waarvan ~10% rood (≥ P90) — afgestemd op een reactieve
 * campagne die het venster opent zodra de dag zelf ongewoon zwaar is.
 */

import type { Tier } from "../types.js";

export const AMBER_THRESHOLD = 70;
export const RED_THRESHOLD = 90;
/** 1 = dagelijks reactief (amendement 2026-06-12); was 3 (sustained-regel). */
export const SUSTAINED_DAYS = 1;

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
