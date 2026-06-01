/**
 * SBI v0.4 — kern-indicator-configuratie (de reken-bron van waarheid).
 * Bron: HANDOVER §2 (v0.4-richtlijn) §1 + §3.
 *
 * Dit is de ENGINE-side tegenhanger van de display-only `web/src/lib/kern.ts`.
 * Hier leven de getallen die de v0.4-meet- en trigger-laag aandrijven.
 *
 * "Weer (hitte/koude)" telt conceptueel als één kern maar bestaat uit twee
 * codes (I-D1-002 + I-D1-003) → 9 codes ≈ "10 kern-indicatoren".
 *
 * De twee secundaire kern-signalen uit v0.4 §1 (#7 I-D3-003S ontslag-radar,
 * #8 I-D5-006S reddit) zitten NIET in deze lijst: ze tellen niet mee in
 * composite_meting (TOEGANG §5) en voeden alleen de trigger/confirmatie-laag.
 */

import type { IndicatorCode } from "../types.js";
import { INDICATORS } from "./registry.js";
import { DEMOGRAPHIC_REACH } from "../methodology/demographic-reach.js";

/** Snelheidsklasse per HANDOVER §1 — bepaalt de snelheidsfactor in w_trigger. */
export type KernKlasse = "direct" | "snel" | "traag";

/** De 9 primaire kern-codes (HANDOVER §1), in volgorde van het document. */
export const KERN_CODES: IndicatorCode[] = [
  "I-D5-001", // negatief nieuws (toon)         ⚡ direct
  "I-D2-001", // verkeer & ongevallen           ⚡ direct
  "I-D5-003", // oorlog / grote gebeurtenis      ⚡ direct
  "I-D5-002", // stress-zoekgedrag (Wikipedia)   ⚡ direct
  "I-D1-002", // hitte                           🔆 snel
  "I-D1-003", // koude                           🔆 snel
  "I-D3-002", // energieprijs                    🔆 snel
  "I-D2-004", // brandstofprijs                  🐢 traag
  "I-D3-001", // inflatie                        🐢 traag
];

const KERN_SET = new Set<string>(KERN_CODES);

export function isKern(code: string): code is IndicatorCode {
  return KERN_SET.has(code);
}

/** Snelheidsklasse per kern-code (HANDOVER §1). */
const KLASSE_MAP: Record<string, KernKlasse> = {
  "I-D5-001": "direct",
  "I-D2-001": "direct",
  "I-D5-003": "direct",
  "I-D5-002": "direct",
  "I-D1-002": "snel",
  "I-D1-003": "snel",
  "I-D3-002": "snel",
  "I-D2-004": "traag",
  "I-D3-001": "traag",
};

export function klasse(code: IndicatorCode): KernKlasse {
  const k = KLASSE_MAP[code];
  if (!k) throw new Error(`klasse(): ${code} is geen kern-indicator`);
  return k;
}

/** Snelheidsfactor per klasse (HANDOVER §1) — telt alleen mee in w_trigger. */
export const SNELHEIDSFACTOR: Record<KernKlasse, number> = {
  direct: 1.5,
  snel: 1.0,
  traag: 0.4,
};

export function snelheidsfactor(code: IndicatorCode): number {
  return SNELHEIDSFACTOR[klasse(code)];
}

/**
 * Achtergrond-load-set (HANDOVER §3.3): de economische grondlast-bronnen die
 * de trigger-drempel opladen.
 *
 * LET OP — dit is bewust NIET gelijk aan `klasse === "traag"`. §3.3 noemt
 * expliciet energie, brandstof én inflatie. Energie heeft snelheidsklasse
 * 🔆 snel (voor w_trigger) maar telt wél als grondlast-bron voor de
 * achtergrond. De twee begrippen — trigger-snelheid en grondlast — zijn
 * gescheiden; dat is precies de v0.4-kerngedachte (zware trage bronnen laden
 * de drempel i.p.v. zelf te vuren).
 */
export const ACHTERGROND_CODES: IndicatorCode[] = [
  "I-D3-002", // energie
  "I-D2-004", // brandstof
  "I-D3-001", // inflatie
];

/**
 * Bewijslast ∈ {1,2,3} — peer-reviewed steun voor de stress-link (HANDOVER §3.1).
 * Afgeleid van de bevroren evidence-grade uit de registry (doc 02): A→3, B→2.
 * Er zit geen grade-C in de kern, dus de waarde 1 komt in de kern niet voor.
 */
export function bewijslast(code: IndicatorCode): number {
  return INDICATORS[code].grade === "A" ? 3 : 2;
}

/** Reikwijdte ∈ [0,1] — bevolkingsaandeel dat geraakt wordt (= demographic_reach). */
export function reikwijdte(code: IndicatorCode): number {
  return DEMOGRAPHIC_REACH[code].reach;
}
