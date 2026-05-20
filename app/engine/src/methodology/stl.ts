/**
 * Vereenvoudigde seizoensdecompositie.
 * Bron: doc 04_Laag-5 §3 — STL (Cleveland et al. 1990).
 *
 * Beperking voor MVP (doc 03_Laag-4 §5.6 staat minimum viable pipeline toe):
 * we gebruiken een naïeve dag-van-jaar mediaan-subtractie i.p.v. volledige
 * Loess-gebaseerde STL. Dit is een bekende vereenvoudiging — wordt vervangen
 * in target architecture door statsmodels.tsa.STL (Python) of equivalent.
 *
 * Wanneer < 3 seizoenscycli beschikbaar (doc 04 §3.4): geen STL toegepast.
 */

import { median } from "./zscore.js";

const MIN_CYCLES_FOR_STL = 3;
const DAYS_PER_YEAR = 365;

export interface StlResult {
  residual: number; // X(t) - S(t) — wat de Z-scoring gebruikt
  seasonalComponent: number;
  applied: boolean; // false wanneer < 3 cycli
}

/** Dag-van-jaar (1..366). */
export function dayOfYear(isoDate: string): number {
  const d = new Date(isoDate + "T12:00:00Z");
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Bereken STL-residu voor één waarde tegen historische archive.
 * Methode: groepeer historie per dag-van-jaar (±7 dagen window),
 * neem mediaan = seizoenscomponent, return X - S.
 */
export function stlResidual(
  value: number,
  date: string,
  history: Array<{ date: string; value: number }>,
): StlResult {
  const targetDoy = dayOfYear(date);
  const targetYear = new Date(date + "T12:00:00Z").getUTCFullYear();

  const cyclesAvailable = new Set(
    history.map((h) => new Date(h.date + "T12:00:00Z").getUTCFullYear()),
  ).size;

  if (cyclesAvailable < MIN_CYCLES_FOR_STL) {
    return { residual: value, seasonalComponent: 0, applied: false };
  }

  // Verzamel historische waarden met DOY binnen ±7 dagen, uit voorgaande jaren
  const window = 7;
  const sameSeasonValues = history
    .filter((h) => {
      const hYear = new Date(h.date + "T12:00:00Z").getUTCFullYear();
      if (hYear >= targetYear) return false;
      const hDoy = dayOfYear(h.date);
      const diff = Math.min(
        Math.abs(hDoy - targetDoy),
        DAYS_PER_YEAR - Math.abs(hDoy - targetDoy),
      );
      return diff <= window;
    })
    .map((h) => h.value);

  if (sameSeasonValues.length < 10) {
    return { residual: value, seasonalComponent: 0, applied: false };
  }

  const seasonal = median(sameSeasonValues);
  return { residual: value - seasonal, seasonalComponent: seasonal, applied: true };
}
