/**
 * Percentiel-positie.
 * Bron: doc 06_Laag-7 §2.
 *   P(t) = rang van C(t) binnen verdeling C-waarden over voortschrijdende 24m,
 *          uitgedrukt als 0-100.
 */

/**
 * Rank-based percentiel — de positie van waarde x in het distribution-set.
 * Conventie: 0 = laagste, 100 = hoogste. Bij ties: midrank (gemiddeld).
 */
export function percentileRank(x: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  let lower = 0;
  let equal = 0;
  for (const d of distribution) {
    if (d < x) lower++;
    else if (d === x) equal++;
  }
  return ((lower + 0.5 * equal) / distribution.length) * 100;
}
