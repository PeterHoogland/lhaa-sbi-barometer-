/**
 * Winsorization tegen extreme outliers.
 * Bron: doc 04_Laag-5 §4 — Z_winsorized = clip(Z, -3, +3).
 *
 * Doc 04 §4.1 disclaimer: ±3 is conventionele drempel zonder specifieke
 * empirische basis; multiverse-toets in laag 8 varieert ±2.5 en ±3.5.
 */

export const WINSOR_BOUND = 3;

export function winsorize(z: number, bound = WINSOR_BOUND): { value: number; clipped: boolean } {
  if (z > bound) return { value: bound, clipped: true };
  if (z < -bound) return { value: -bound, clipped: true };
  return { value: z, clipped: false };
}
