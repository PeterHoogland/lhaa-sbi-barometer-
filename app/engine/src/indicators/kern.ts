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
  "I-D2-001", // verkeer (filezwaarte)           🐢 traag (Pad A)
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
  "I-D2-001": "traag", // Pad A: filezwaarte is een trage grondlast-maat, geen dag-spike
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
 *
 * v0.4 Pad A (2026-06): verkeer (filezwaarte) is hier toegevoegd als structurele
 * grondlast-bron. De filezwaarte staat op een historisch record (2024 = +57,6%
 * t.o.v. 2013) en laadt dus de achtergrond, net als de economische grondlast.
 * Amendement — zie MASTERDOCUMENT-v0.4-addendum.
 */
export const ACHTERGROND_CODES: IndicatorCode[] = [
  "I-D3-002", // energie
  "I-D2-004", // brandstof
  "I-D3-001", // inflatie
  "I-D2-001", // verkeer (filezwaarte) — Pad A: structurele grondlast
];

/**
 * Bewijslast ∈ {0,1,2,3} — peer-reviewed steun voor de stress-link. Afgeleid van de
 * evidence-grade (review §3): A→3, B→2, C→1, D→0. D = experimentele proxy → GÉÉN
 * meet-gewicht (uit het cijfer). Voedt w_meting.
 */
const GRADE_METING: Record<string, number> = { A: 3, B: 2, C: 1, D: 0 };
export function bewijslast(code: IndicatorCode): number {
  return GRADE_METING[INDICATORS[code].grade] ?? 2;
}

/**
 * Trigger-gewicht-basis per grade: A→3, B→2, C→1, D→1. Anders dan w_meting telt een
 * D-proxy hier WÉL mee — media-/proxy-signalen blijven snelle campagnetriggers
 * (review §3 + eis "trigger gevoelig houden"). Voedt w_trigger.
 */
const GRADE_TRIGGER: Record<string, number> = { A: 3, B: 2, C: 1, D: 1 };
export function triggerGewicht(code: IndicatorCode): number {
  return GRADE_TRIGGER[INDICATORS[code].grade] ?? 2;
}

/** Reikwijdte ∈ [0,1] — bevolkingsaandeel dat geraakt wordt (= demographic_reach). */
export function reikwijdte(code: IndicatorCode): number {
  return DEMOGRAPHIC_REACH[code].reach;
}
