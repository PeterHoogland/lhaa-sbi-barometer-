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

export const MIN_SCALE = 1e-6;

function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1));
}

/**
 * Robuuste spreidingsschaal met fallback-keten (review §4.1): MAD (×1.4826) →
 * IQR/1.349 → klassieke SD → NaN. MAD wordt 0 zodra >50% van de baseline identiek
 * is (telt-indicatoren, gecensureerde data); dan vangt IQR/SD het op. Pas als er
 * ÉCHT geen variatie is, geeft dit NaN terug — expliciet "geen schaal" i.p.v. een
 * stille 0 die als "normaal" zou lezen.
 */
export function robustScale(xs: number[]): number {
  const mad = madScaled(xs);
  if (Number.isFinite(mad) && mad >= MIN_SCALE) return mad;
  const sorted = [...xs].sort((a, b) => a - b);
  const iqr = (quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25)) / 1.349;
  if (Number.isFinite(iqr) && iqr >= MIN_SCALE) return iqr;
  const sd = stdDev(xs);
  if (Number.isFinite(sd) && sd >= MIN_SCALE) return sd;
  return NaN;
}

export interface BaselineStats {
  median: number;
  sigma: number; // MAD-equivalent
  n: number;
}

export function computeBaseline(xs: number[]): BaselineStats {
  return {
    median: median(xs),
    sigma: robustScale(xs),
    n: xs.length,
  };
}

/**
 * Z-score voor één waarde tegen baseline.
 * Doc 04 §2.5: dit is een MAD-Z, niet equivalent aan klassieke Z.
 *
 * Wanneer er GEEN bruikbare schaal is (constante baseline → robustScale geeft NaN):
 * return NaN, NIET 0. De aanroeper markeert dit als "ontbreekt" (review §4.1) —
 * geen-variatie/dataschaarste mag niet als "normaal" verschijnen, en ±∞ kan niet
 * ontstaan (sigma is dan nooit een eindige 0).
 */
export function zscore(x: number, baseline: BaselineStats): number {
  if (!Number.isFinite(baseline.sigma) || baseline.sigma === 0) return NaN;
  return (x - baseline.median) / baseline.sigma;
}
