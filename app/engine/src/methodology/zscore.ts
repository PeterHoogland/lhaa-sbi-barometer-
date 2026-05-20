/**
 * Z-scoring met mediaan + MAD (Median Absolute Deviation).
 * Bron: doc 04_Laag-5 §2 — dubbele baseline (24m voortschrijdend + 2010-2019 vast).
 *
 * Belangrijk: we gebruiken robuste statistiek (mediaan + MAD ×1.4826)
 * in plaats van klassiek gemiddelde + SD. Reden: hittegolven of crises
 * in de baseline-periode zouden anders de baseline scheef trekken (doc 04 §2.1).
 */

export const MAD_SCALE_FACTOR = 1.4826; // MAD → SD-equivalent voor normale verdeling

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** MAD = mediaan(|x - mediaan(x)|), geschaald naar SD-equivalent. */
export function madScaled(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const med = median(xs);
  const deviations = xs.map((x) => Math.abs(x - med));
  return MAD_SCALE_FACTOR * median(deviations);
}

export interface BaselineStats {
  median: number;
  sigma: number; // MAD-equivalent
  n: number;
}

export function computeBaseline(xs: number[]): BaselineStats {
  return {
    median: median(xs),
    sigma: madScaled(xs),
    n: xs.length,
  };
}

/**
 * Z-score voor één waarde tegen baseline.
 * Doc 04 §2.5: dit is een MAD-Z, niet equivalent aan klassieke Z.
 *
 * Wanneer σ = 0 (constant baseline) of NaN: return 0 zodat de indicator
 * geen artificiële piek genereert (eerlijker dan ∞).
 */
export function zscore(x: number, baseline: BaselineStats): number {
  if (!Number.isFinite(baseline.sigma) || baseline.sigma === 0) return 0;
  return (x - baseline.median) / baseline.sigma;
}
