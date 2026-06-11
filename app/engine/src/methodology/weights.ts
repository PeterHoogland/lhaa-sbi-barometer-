/**
 * Wegings-schema's: Schema 1 (equal), Schema 2 (evidence-graded met balance-correctie).
 * Bron: doc 05_Laag-6 §2, §3, Annex A.
 *
 * Beide schema's worden PARALLEL berekend (doc 05 §6) en in elke output gerapporteerd.
 */

import type { DomainCode, IndicatorCode } from "../types.js";
import { INDICATORS, indicatorsByDomain, scoredDomains } from "../indicators/registry.js";

/**
 * Schema 1 — equal weights (doc 05 §2), over de GESCOORDE domeinen.
 * A6-amendement: D6 (kalendercontext) telt niet meer mee in het composiet,
 * dus elk gescoord domein weegt 1/5 (was 1/6). Zie CHANGELOG + amendement-annex.
 */
export function equalDomainWeight(): number {
  return 1 / scoredDomains().length;
}

export function equalIndicatorWeightInDomain(domain: DomainCode): number {
  return 1 / indicatorsByDomain(domain).length;
}

/**
 * Schema 2 — evidence-graded met balance-correctie.
 * Doc 05 §3.3 Annex A — oorspronkelijk gepre-registreerde waarden (mét D6).
 * BEVROREN HISTORIEK: deze tabel is de afleiding van 2026 en wordt niet
 * herschreven; de actieve gewichten komen uit schema2DomainWeight() hieronder,
 * die pro rata hernormaliseert over de gescoorde domeinen (A6).
 */
export const SCHEMA_2_DOMAIN_WEIGHTS: Record<DomainCode, number> = {
  D1: 0.211,
  D2: 0.135,
  D3: 0.223,
  D4: 0.108,
  D5: 0.155,
  D6: 0.172,
};

/** Som van de pre-geregistreerde Schema-2-gewichten over de gescoorde domeinen. */
const SCHEMA_2_SCORED_SUM = scoredDomains().reduce((s, d) => s + SCHEMA_2_DOMAIN_WEIGHTS[d], 0);

/**
 * Actief Schema-2-gewicht (A6): pro-rata hernormalisatie van de bevroren tabel
 * over de gescoorde domeinen, zodat de gewichten weer tot ~1 sommeren zonder de
 * onderlinge verhoudingen te wijzigen. Contextdomeinen (D6) krijgen gewicht 0.
 */
export function schema2DomainWeight(domain: DomainCode): number {
  if (!scoredDomains().includes(domain)) return 0;
  return SCHEMA_2_DOMAIN_WEIGHTS[domain] / SCHEMA_2_SCORED_SUM;
}

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
  // Contextdomeinen (D6, A6) hebben géén gewicht in het composiet.
  if (!scoredDomains().includes(domain)) return 0;
  if (schema === "equal") return equalDomainWeight();
  return schema2DomainWeight(domain);
}

/** Doc 05 §3.3: de actieve gewichten tellen over de gescoorde domeinen op tot ~1.000. */
export function verifyWeightsSumToOne(schema: WeightSchema): number {
  return scoredDomains().reduce((s, d) => s + domainWeight(schema, d), 0);
}
