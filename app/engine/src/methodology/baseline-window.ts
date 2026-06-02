/**
 * SBI v0.4 — getrimde (rolling) baselines voor de dubbele-baseline-normalisatie.
 * Bron: HANDOVER §2 (v0.4-richtlijn) §2.
 *
 * We berekenen per indicator TWEE MAD-Z-scores naast elkaar:
 *   • z_kort  — venster ~18 maanden  → gevoelig, recent (spikes, delta_1d)
 *   • z_lang  — venster ~120 maanden → betrouwbaar, crisis-bewust (niveaus, P70/P90)
 *
 * Hergebruikt de bestaande robuuste statistiek (median + MAD via
 * computeBaseline/zscore) en de seizoenscorrectie (stlResidual). Geen nieuwe
 * statistiek — alleen het venster verschilt. Het lange venster is voortschuivend
 * (rolling, niet bevroren) tegen structurele drift (§2).
 *
 * Belangrijk tegen lookahead-bias (cruciaal voor de latere backtest): de slice
 * neemt uitsluitend punten met datum ≤ asOf. Toekomst lekt nooit in de baseline.
 */

import type { IndicatorMeta } from "../types.js";
import { computeBaseline, zscore } from "./zscore.js";
import { stlResidual } from "./stl.js";

export interface HistPoint {
  date: string; // ISO YYYY-MM-DD
  value: number;
}

/**
 * Minimaal aantal punten voor een zinvolle MAD-Z. Lager dan de v2-drempel van 30
 * omdat maandelijkse bronnen (inflatie, ontslagen) legitiem maar ~12–18 punten in
 * een venster van 18 maanden hebben. Onder deze drempel geven we z = 0 terug
 * (geen artificiële piek), conform de v0.2-conventie bij te weinig historie.
 */
export const MIN_POINTS_FOR_Z = 8;

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365.25;

function toUtc(date: string): number {
  return Date.parse(date + "T00:00:00Z");
}

/** Punten binnen het voortschuivende venster (asOf − months, asOf]. */
export function sliceTrailing(series: HistPoint[], asOf: string, months: number): HistPoint[] {
  const asOfTime = toUtc(asOf);
  const cutoff = new Date(asOfTime);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const cutoffTime = cutoff.getTime();
  return series.filter((p) => {
    const t = toUtc(p.date);
    return Number.isFinite(t) && t > cutoffTime && t <= asOfTime;
  });
}

/** Aantal jaren dat een (gesorteerde) slice beslaat — voedt baseline_lang_jaren. */
export function spanYears(slice: HistPoint[]): number {
  if (slice.length < 2) return 0;
  let min = Infinity;
  let max = -Infinity;
  for (const p of slice) {
    const t = toUtc(p.date);
    if (t < min) min = t;
    if (t > max) max = t;
  }
  return (max - min) / MS_PER_DAY / DAYS_PER_YEAR;
}

export interface WindowedZ {
  z: number;
  n: number; // aantal punten in het venster
  jaren: number; // werkelijk beslagen historie (afgerond elders)
  applied: boolean; // false = te weinig historie → z = 0
  /** De waarde op de schaal waarop gewogen wordt (raw of STL-residu). */
  effectiveValue: number;
  /** De verdeling waartegen gewogen wordt (voor percentiel-berekening). */
  distribution: number[];
}

/**
 * Bereken één getrimde MAD-Z. Past STL-seizoenscorrectie toe waar `meta.applyStl`
 * en het venster ≥ 3 cycli heeft (stlResidual valt anders netjes terug op raw).
 * Inverse-codering blijft de verantwoordelijkheid van de aanroeper (de 9 kern-
 * indicatoren zijn alle non-inverse, dus hier niet nodig).
 */
export function windowedZ(
  value: number,
  series: HistPoint[],
  asOf: string,
  months: number,
  meta: Pick<IndicatorMeta, "applyStl">,
): WindowedZ {
  const slice = sliceTrailing(series, asOf, months);
  const jaren = spanYears(slice);

  if (slice.length < MIN_POINTS_FOR_Z) {
    return { z: 0, n: slice.length, jaren, applied: false, effectiveValue: value, distribution: slice.map((p) => p.value) };
  }

  let effectiveValue = value;
  let distribution = slice.map((p) => p.value);

  if (meta.applyStl) {
    const stl = stlResidual(value, asOf, slice);
    if (stl.applied) {
      const residuals = slice
        .map((p) => stlResidual(p.value, p.date, slice))
        .filter((r) => r.applied)
        .map((r) => r.residual);
      // Alleen overschakelen op de residu-schaal als er genoeg residuen overblijven.
      if (residuals.length >= MIN_POINTS_FOR_Z) {
        effectiveValue = stl.residual;
        distribution = residuals;
      }
    }
  }

  const baseline = computeBaseline(distribution);
  const z = zscore(effectiveValue, baseline);
  if (!Number.isFinite(z)) {
    // Geen bruikbare schaal (geen variatie) → niet toegepast i.p.v. een artificiële 0 (§4.1).
    return { z: 0, n: slice.length, jaren, applied: false, effectiveValue, distribution };
  }
  return { z, n: slice.length, jaren, applied: true, effectiveValue, distribution };
}
