/**
 * Demografische reikwijdte-weging — Schema 3.
 *
 * METHODOLOGISCHE STATUS
 * ----------------------
 * Dit is een AMENDEMENT op de pre-registratie (doc 00 §13), uitgevoerd op
 * expliciete beslissing van de methodologie-eigenaar. Conform doc 05 wordt het
 * als DERDE wegingsschema PARALLEL toegevoegd — de pre-geregistreerde
 * equal-weights (Schema 1) en evidence-graded (Schema 2) blijven onveranderd
 * berekend en gepubliceerd. Niets wordt vervangen.
 *
 * WAT HET DOET
 * ------------
 * Equal-weights behandelt elke indicator alsof hij de hele bevolking even hard
 * raakt. Dat is niet zo: schoolvakantie-druk raakt gezinnen met kinderen,
 * hypotheekrente raakt huishoudens met een lopend krediet, files raken
 * pendelaars. Dit schema weegt elke indicator naar het AANDEEL van de Belgische
 * bevolking dat hij werkelijk als stressor-blootstelling ervaart.
 *
 * EERLIJKE BEPERKING — DIT IS GEEN MRP
 * ------------------------------------
 * Volwaardige poststratificatie (MRP, Multilevel Regression with
 * Poststratification) vereist surveydata van een gerekruteerd, demografisch
 * gebalanceerd panel waarin elke respondent demografische tags draagt.
 * Gescrapete/publieke data heeft die tags niet. Dit schema is daarom een
 * REIKWIJDTE-benadering: per indicator één bevolkingsaandeel, geen volledige
 * demografische celstructuur. Het is de eerlijke, doenbare tussenstap; echte
 * MRP blijft de target-state en vereist een panel-instrument.
 *
 * BRON VAN DE PERCENTAGES
 * -----------------------
 * Afgeleid van publieke Statbel-demografie (bevolking ~11,7M; ~80% van de
 * huishoudens heeft een wagen; ~30% een lopende hypotheek; ~28% van de
 * huishoudens heeft minderjarige kinderen; beroepsbevolking ~43%;
 * internetgebruik ~95%). Ramingen, geen exacte tellingen.
 */

import type { IndicatorCode } from "../types.js";

export interface ReachEntry {
  reach: number; // fractie 0-1 van de bevolking die de indicator raakt
  rationale: string;
}

export const DEMOGRAPHIC_REACH: Record<IndicatorCode, ReachEntry> = {
  "I-D1-001": { reach: 1.0, rationale: "Daglicht beïnvloedt het circadiaans ritme van iedereen." },
  "I-D1-002": { reach: 1.0, rationale: "Hitte raakt de hele bevolking; kwetsbaarheid skewt naar ouderen." },
  "I-D1-003": { reach: 1.0, rationale: "Koude raakt iedereen; energiekost vergroot de impact." },
  "I-D1-004": { reach: 1.0, rationale: "Iedereen ademt; luchtkwaliteit skewt naar stedelijke gebieden." },
  "I-D2-001": { reach: 0.40, rationale: "Files raken pendelaars; ~65% van de werkenden pendelt met de auto." },
  "I-D2-004": { reach: 0.78, rationale: "~80% van de Belgische huishoudens beschikt over een wagen." },
  "I-D3-001": { reach: 1.0, rationale: "Inflatie raakt elke consument." },
  "I-D3-002": { reach: 1.0, rationale: "Elk huishouden betaalt energie." },
  "I-D3-003": { reach: 0.48, rationale: "Ontslagdreiging raakt werkenden plus hun huishoudens (spillover)." },
  "I-D3-005": { reach: 0.70, rationale: "Werkloosheid raakt de beroepsbevolking en wie ervan afhangt." },
  "I-D3-006": { reach: 0.32, rationale: "~30% van de huishoudens heeft een lopende hypotheek." },
  "I-D4-001": { reach: 0.45, rationale: "Werk-deadlines raken de werkende bevolking (~43%)." },
  "I-D4-002": { reach: 0.28, rationale: "Schoolvakantie-druk raakt gezinnen met schoolgaande kinderen." },
  "I-D5-001": { reach: 0.85, rationale: "Ongeveer 85% volgt regelmatig nieuws." },
  "I-D5-002": { reach: 0.90, rationale: "~95% is internetgebruiker; stress-zoekgedrag is breed gespreid." },
  "I-D5-003": { reach: 1.0, rationale: "Collectieve gebeurtenissen raken het hele land tegelijk." },
  "I-D6-001": { reach: 0.60, rationale: "Vakantie-anticipatie raakt werkenden en studenten." },
  "I-D6-002": { reach: 0.60, rationale: "Het weekdag-ritme raakt wie werkt of studeert." },
  "I-D6-003": { reach: 1.0, rationale: "Klok-verzetten verstoort ieders biologisch ritme." },
  "I-D6-005": { reach: 0.22, rationale: "Examens raken studenten en hun directe gezinsleden." },
};

/** Som van alle reach-waarden — noemer voor de genormaliseerde weging. */
export const TOTAL_REACH = Object.values(DEMOGRAPHIC_REACH).reduce(
  (s, e) => s + e.reach,
  0,
);

/** Genormaliseerd demografisch gewicht van één indicator (telt op tot 1.0). */
export function demographicWeight(code: IndicatorCode): number {
  return DEMOGRAPHIC_REACH[code].reach / TOTAL_REACH;
}
