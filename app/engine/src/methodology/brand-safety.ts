/**
 * Brand-safety — automatische CTA-pauze bij een verdriet-/rouwpiek in het nieuws.
 *
 * WAAROM (Peter, 2026-06-03): bij nationale rouw na twee zware ongevallen "merkte"
 * de barometer niets. Het publieke cijfer meet OMGEVINGSDRUK, geen emotie, en hoort
 * dus NIET te stijgen door rouw (dat blijft eerlijk). Maar een toerisme-merk dat
 * "kom tot rust in de Alpen" toont op een rouwdag is tone-deaf. Daarom koppelen we
 * de verdriet-lading van de nieuws-headlines (emotie-laag, grade-D, al gemeten in
 * lexicon_emotion_nl.py) aan een brand-safety-vlag die ENKEL de commerciële CTA
 * pauzeert. NIET het cijfer.
 *
 * Trigger-/veiligheidslaag, geen meting. De vlag zet bovendien alle campagne-triggers
 * op require_manual_approval (zie triggers.ts `holdForBrandSafety`) en de condition-
 * level op CN 5 (condition-level.ts; banner-override, géén hogere stress-score).
 *
 * ASYMMETRIE (bewuste keuze): een vals positief (CTA even verborgen op een niet-
 * rouwdag) kost een gemiste klik; een vals negatief (CTA tijdens nationale rouw) kost
 * merkschade. We kiezen daarom de beschermende kant, maar houden twee remmen tegen
 * valse positieven:
 *   1. AANDEEL — verdriet moet een LEIDENDE emotie zijn (geen woede-/angstdag).
 *   2. PIEK    — verdriet moet ongewoon hoog zijn voor zichzelf (percentiel binnen de
 *                eigen historie), of, zolang die historie nog te dun is, boven een
 *                absolute cold-start-vloer.
 *
 * ⚠️ De numerieke drempels hieronder zijn PROVISOIR. De verdriet-historie begint
 * pas op te bouwen (zie data/history/I-D5-verdriet.json). Te kalibreren met Peter
 * zodra ~3-4 weken echte verdriet-data zijn verzameld. Zie HANDOVER §3 punt 8.
 */

import type { BrandSafety } from "../types.js";

/** Verdriet moet minstens dit aandeel van de totale emotie-lading zijn om als
 *  "rouwdag" (en niet woede-/angstdag) te tellen. Calibratie-vrije rem: hij weegt
 *  verdriet tegen de andere drie emoties van DEZELFDE dag, geen absolute schaal. */
export const VERDRIET_SHARE_MIN = 0.4;
/** Verdriet-piek = percentiel binnen de eigen historie ≥ deze drempel (top-decile). */
export const VERDRIET_SPIKE_P = 90;
/** Minimaal aantal eigen historiepunten voor een betrouwbaar verdriet-percentiel. */
export const MIN_VERDRIET_HISTORY = 20;
/** Cold-start: zolang er < MIN_VERDRIET_HISTORY punten zijn, kan "ongewoon hoog"
 *  niet relatief bepaald worden. Dan geldt een absolute vloer (matches per 100
 *  woorden). PROVISOIR — anker: een normale dag heeft ~0,1-0,2 verdriet; deze vloer
 *  ligt ruim daarboven (ongeveer zo luid als de hele emotie-lading van een rustige
 *  dag), zodat hij niet vuurt op gewone dagen maar wel op een uitgesproken rouwdag. */
export const VERDRIET_COLD_START_FLOOR = 0.5;
/** Hoe lang de vlag vooruit als "geschat actief" geldt (de vlag wordt elke dag
 *  opnieuw bepaald; dit is enkel het transparante `expires_estimated`-veld). */
export const BRAND_SAFETY_EXPIRY_DAYS = 2;

export interface VerdrietSignal {
  /** Verdriet-intensiteit vandaag (matches per 100 woorden), of null bij geen data. */
  intensity: number | null;
  /** Totale emotie-lading vandaag (woede+angst+verdriet+walging) — voor het aandeel. */
  totalEmotie: number | null;
  /** Percentiel van vandaag binnen de eigen verdriet-historie (0-100), of null. */
  percentile: number | null;
  /** Aantal historiepunten in de eigen verdriet-reeks. */
  historyN: number;
}

export interface BrandSafetyDecision {
  flag: BrandSafety;
  reason: string | null;
  expires_estimated: string | null;
}

const NORMAL: BrandSafetyDecision = { flag: "normal", reason: null, expires_estimated: null };

/**
 * Beslist of de commerciële CTA gepauzeerd moet worden op basis van de verdriet-
 * lading van het nieuws. Pure functie: gelijke input → gelijke output (geen Date.now()
 * binnenin; `todayISO` komt mee zodat dezelfde functie de live dagrun én een latere
 * backtest aandrijft). Vuurt nooit zelf "block" — block blijft voorbehouden aan een
 * door een mens bevestigde catastrofe (events.json), niet aan een lexicon-signaal.
 */
export function decideBrandSafety(sig: VerdrietSignal, todayISO: string): BrandSafetyDecision {
  if (sig.intensity === null || !Number.isFinite(sig.intensity) || sig.intensity <= 0) return NORMAL;
  if (sig.totalEmotie === null || !(sig.totalEmotie > 0)) return NORMAL;

  // Rem 1 — AANDEEL: verdriet moet een leidende emotie zijn (rouw, geen woede/angst).
  const share = sig.intensity / sig.totalEmotie;
  if (share < VERDRIET_SHARE_MIN) return NORMAL;

  // Rem 2 — PIEK: ongewoon hoog t.o.v. de eigen historie, of (cold-start) absoluut.
  const hasHistory = sig.historyN >= MIN_VERDRIET_HISTORY;
  const spike = hasHistory
    ? sig.percentile !== null && sig.percentile >= VERDRIET_SPIKE_P
    : sig.intensity >= VERDRIET_COLD_START_FLOOR;
  if (!spike) return NORMAL;

  const expires = new Date(
    Date.parse(todayISO.slice(0, 10) + "T12:00:00Z") + BRAND_SAFETY_EXPIRY_DAYS * 86_400_000,
  ).toISOString();
  const basis = hasHistory
    ? `top ${100 - VERDRIET_SPIKE_P}% van de eigen verdriet-historie`
    : "voorlopige drempel, de eigen historie is nog kort";
  return {
    flag: "elevated",
    reason: `Verhoogde rouw- en verdriettoon in het nieuws van vandaag (${basis}).`,
    expires_estimated: expires,
  };
}
