/**
 * Wegings-schema's: Schema 1 (equal), Schema 2 (evidence-graded met balance-correctie).
 * Bron: doc 05_Laag-6 §2, §3, Annex A.
 *
 * Beide schema's worden PARALLEL berekend (doc 05 §6) en in elke output gerapporteerd.
 */

import type { DomainCode, IndicatorCode } from "../types.js";
import { INDICATORS, indicatorsByDomain, allDomains } from "../indicators/registry.js";

/** Schema 1 — equal weights (doc 05 §2). */
export function equalDomainWeight(): number {
  return 1 / 6;
}

export function equalIndicatorWeightInDomain(domain: DomainCode): number {
  return 1 / indicatorsByDomain(domain).length;
}

/**
 * Schema 2 — evidence-graded met balance-correctie.
 * Doc 05 §3.3 Annex A — definitieve waarden gepre-registreerd.
 */
export const SCHEMA_2_DOMAIN_WEIGHTS: Record<DomainCode, number> = {
  D1: 0.211,
  D2: 0.135,
  D3: 0.223,
  D4: 0.108,
  D5: 0.155,
  D6: 0.172,
};

// Review §3 — A/B/C/D. D (experimentele proxy) krijgt gewicht 0: telt niet mee in
// de meting. (D-indicatoren worden bovendien overgeslagen in computeComposite.)
const GRADE_WEIGHT = { A: 3, B: 2, C: 1, D: 0 } as const;

export function evidenceIndicatorWeightInDomain(
  indicator: IndicatorCode,
  domain: DomainCode,
): number {
  const all = indicatorsByDomain(domain);
  const totalGradeWeight = all.reduce((sum, m) => sum + GRADE_WEIGHT[m.grade], 0);
  const myGrade = INDICATORS[indicator].grade;
  return GRADE_WEIGHT[myGrade] / totalGradeWeight;
}

export type WeightSchema = "equal" | "evidence";

export function indicatorWeight(
  schema: WeightSchema,
  indicator: IndicatorCode,
  domain: DomainCode,
): number {
  if (schema === "equal") return equalIndicatorWeightInDomain(domain);
  return evidenceIndicatorWeightInDomain(indicator, domain);
}

export function domainWeight(schema: WeightSchema, domain: DomainCode): number {
  if (schema === "equal") return equalDomainWeight();
  return SCHEMA_2_DOMAIN_WEIGHTS[domain];
}

/** Doc 05 §3.3: schema-2-gewichten tellen op tot ~1.000 (rounding-tolerantie). */
export function verifyWeightsSumToOne(schema: WeightSchema): number {
  return allDomains().reduce((s, d) => s + domainWeight(schema, d), 0);
}
