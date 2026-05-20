/**
 * Composiet-berekening.
 * Bron: doc 06_Laag-7 §1.
 *   Z_weighted(i, t) = w_indicator(i ∈ D) × Z_short(i, t)
 *   D_score(D, t)    = Σ_{i ∈ D} Z_weighted(i, t)
 *   C(t)             = Σ_D [w_domain(D) × D_score(D, t)]
 *
 * Plus mediacyclus-decorrelatie-protocol (doc 03 §4.4):
 * - composite_without_d5 voor sensitivity
 * - d5_cross_correlation_7d-monitor
 */

import type { DomainCode, DomainContribution, IndicatorCode } from "../types.js";
import { allDomains, indicatorsByDomain } from "../indicators/registry.js";
import { indicatorWeight, domainWeight, type WeightSchema } from "./weights.js";

/** Resultaat van per-indicator z-scoring (inverse-coded, winsorized). */
export type ZMap = Partial<Record<IndicatorCode, number>>;

export interface CompositeResult {
  composite: number;
  domainScores: Record<DomainCode, number>;
  domainContributions: DomainContribution[];
}

export function computeComposite(zScores: ZMap, schema: WeightSchema): CompositeResult {
  const domainScores: Record<DomainCode, number> = {
    D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0,
  };

  for (const domain of allDomains()) {
    let domainSum = 0;
    for (const meta of indicatorsByDomain(domain)) {
      const z = zScores[meta.code];
      if (z === undefined) continue; // missing — zie doc 03 §1.3
      const w = indicatorWeight(schema, meta.code, domain);
      domainSum += w * z;
    }
    domainScores[domain] = domainSum;
  }

  let composite = 0;
  const contributions: DomainContribution[] = [];

  for (const domain of allDomains()) {
    const wd = domainWeight(schema, domain);
    const contrib = wd * domainScores[domain];
    composite += contrib;
    contributions.push({ domain, contribution: contrib });
  }

  // Sorted descending door |contribution| voor "top contributors"
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return { composite, domainScores, domainContributions: contributions };
}

/**
 * Mediacyclus-decorrelatie (doc 03 §4.4 stap 3).
 * "Non-media baseline": composiet zonder D5.
 */
export function computeCompositeWithoutD5(zScores: ZMap, schema: WeightSchema): number {
  const filteredZ: ZMap = { ...zScores };
  for (const meta of indicatorsByDomain("D5")) {
    delete filteredZ[meta.code];
  }
  // Herschalen: de overige 5 domeinen krijgen weight-verdeling pro rata
  let composite = 0;
  const totalRemainingWeight = allDomains()
    .filter((d) => d !== "D5")
    .reduce((s, d) => s + domainWeight(schema, d), 0);

  for (const domain of allDomains()) {
    if (domain === "D5") continue;
    let domainSum = 0;
    for (const meta of indicatorsByDomain(domain)) {
      const z = filteredZ[meta.code];
      if (z === undefined) continue;
      domainSum += indicatorWeight(schema, meta.code, domain) * z;
    }
    composite += (domainWeight(schema, domain) / totalRemainingWeight) * domainSum;
  }

  return composite;
}

/** Pearson-correlatie voor twee gelijklange reeksen (gebruikt voor D5-monitor). */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const ex = xs[i] - mx;
    const ey = ys[i] - my;
    num += ex * ey;
    dx += ex * ex;
    dy += ey * ey;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}
