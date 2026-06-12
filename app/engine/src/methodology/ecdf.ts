/**
 * B2 — eCDF-normalisatie over een lange seizoensbewuste baseline (CISS-methode;
 * Holló, Kremer & Lo Duca 2012, ECB WP 1426) — amendement 00_Pre-Registratie
 * §4.1.6, methodologie 0.3.2.
 *
 * WAAROM. Percentielen/z-scores op 18-24 maanden historie dragen ±10-12 pp
 * onzekerheid (zie ook de gemeten spread in analysis/sensitivity.py). De
 * CISS-aanpak normaliseert elke indicator via zijn empirische CDF over een zo
 * lang mogelijke historie. Wij passen dat seizoensbewust toe: de referentie is
 * het ±45-dagenvenster rond dezelfde dag-van-het-jaar, over alle beschikbare
 * jaargangen.
 *
 * DE GATE (pre-geregistreerd VOORDAT hij ooit activeert — geen stille switch):
 * een indicator schakelt pas over op eCDF-normalisatie zodra zijn seizoens-
 * referentie ten minste ECDF_MIN_YEARS jaargangen overspant én ECDF_MIN_POINTS
 * punten telt. Tot dan blijft de MAD-z-keten (doc 04 §2.6) gelden en wordt de
 * normalisatie expliciet "voorlopig" gelabeld in de output. Op het moment van
 * registratie (2026-06-12) kwalificeert GEEN enkele indicator (langste echte
 * historie: ~24 maanden); het gedrag van vandaag verandert dus niet.
 *
 * SCHAALKOPPELING. Om eCDF- en MAD-z-indicatoren in één composiet te kunnen
 * blijven aggregeren tijdens de overgang, wordt de eCDF-kans via de probit
 * (inverse normale CDF) naar een z-equivalent gebracht: z = Φ⁻¹(p). De kans
 * wordt geklemd op [1/(2n), 1-1/(2n)] zodat ±∞ per constructie onmogelijk is;
 * winsorization (±3) blijft daarna onverkort gelden. Geen STL voor
 * eCDF-indicatoren: het seizoensvenster zelf is de seizoenscorrectie.
 */

import { percentileRank } from "./percentile.js";
import {
  seasonalReference,
  withinSeason,
  SEASONAL_WINDOW_DAYS,
  type DatedValue,
} from "./seasonal-percentile.js";

/** Gate: minimale spanwijdte (jaren) van de seizoensreferentie. Plan-eis ≥3. */
export const ECDF_MIN_YEARS = 3;
/** Gate: minimaal aantal seizoensreferentiepunten (≈ 1 punt per venster-dag per jaargang). */
export const ECDF_MIN_POINTS = 90;
/**
 * Begrenzing van de referentie op de recentste jaren (plan-anker: "3-5 jaar per
 * seizoensvenster"). Zonder cap zou een decennialange reeks met structurele
 * trend (bv. een prijsindex sinds 1996) "vandaag" permanent als extreem scoren:
 * vergelijken met 1996-niveaus meet geen seizoens-ongewoonheid maar inflatie.
 * Het baseline-drift-argument van doc 04 §8.2 geldt voor de eCDF onverkort.
 */
export const ECDF_MAX_YEARS = 5;

/**
 * Inverse normale CDF (probit), Acklam-benadering (|fout| < 1.15e-9).
 * Input p moet in (0, 1) liggen; de aanroeper klemt.
 */
export function probit(p: number): number {
  if (!(p > 0 && p < 1)) return NaN;
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pLow = 0.02425;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= 1 - pLow) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/**
 * eCDF-z: de empirische kans van `value` binnen `reference` (midrank), geklemd
 * op [1/(2n), 1-1/(2n)], via probit naar z-equivalent. Nooit ±∞; NaN alleen
 * bij lege referentie (aanroeper bewaakt de gate).
 */
export function ecdfZ(value: number, reference: number[]): number {
  const n = reference.length;
  if (n === 0) return NaN;
  const p = percentileRank(value, reference) / 100;
  const floor = 1 / (2 * n);
  const clamped = Math.min(1 - floor, Math.max(floor, p));
  return probit(clamped);
}

export interface EcdfEligibility {
  eligible: boolean;
  nPoints: number;
  spanYears: number;
  /** De seizoensreferentie (alleen gevuld als eligible — anders onnodig werk). */
  reference: number[];
}

/**
 * Gate-evaluatie: seizoensvenster rond `asOf` over de recentste ECDF_MAX_YEARS
 * jaar van de historie (drift-begrenzing). Eligible zodra die venster-punten
 * ≥ ECDF_MIN_YEARS jaargangen overspannen én er ≥ ECDF_MIN_POINTS zijn.
 */
export function ecdfEligibility(
  history: DatedValue[],
  asOf: string,
  windowDays: number = SEASONAL_WINDOW_DAYS,
): EcdfEligibility {
  const cutoffMs = Date.parse(asOf + "T00:00:00Z") - ECDF_MAX_YEARS * 365.25 * 86_400_000;
  const recent = history.filter((h) => Date.parse(h.date + "T00:00:00Z") >= cutoffMs);
  let minDate = "";
  let maxDate = "";
  let n = 0;
  for (const h of recent) {
    if (!withinSeason(h.date, asOf, windowDays)) continue;
    n++;
    if (!minDate || h.date < minDate) minDate = h.date;
    if (!maxDate || h.date > maxDate) maxDate = h.date;
  }
  const spanYears =
    n >= 2
      ? (Date.parse(maxDate + "T00:00:00Z") - Date.parse(minDate + "T00:00:00Z")) / (365.25 * 86_400_000)
      : 0;
  const eligible = n >= ECDF_MIN_POINTS && spanYears >= ECDF_MIN_YEARS;
  return {
    eligible,
    nPoints: n,
    spanYears: Math.round(spanYears * 100) / 100,
    reference: eligible ? seasonalReference(recent, asOf, windowDays) : [],
  };
}
