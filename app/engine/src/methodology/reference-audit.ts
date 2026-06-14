/**
 * Referentie-audit — automatische consistentie- en plausibiliteitscontrole van
 * het gepubliceerde dagpercentiel, elke cyclus na de verwerking.
 *
 * WAAROM (Peter, 2026-06-14). Toen het cijfer onverwacht laag stond, moest een
 * mens handmatig nagaan of de dag wel tegen een CONSISTENTE referentie werd
 * vergeleken (geen appels-met-peren door een methodologie-wijziging) en of de
 * lage waarde een echt signaal was of een artefact. Die controle hoort
 * geautomatiseerd: deze audit reproduceert het percentiel uit zijn eigen
 * referentie en weegt af of de referentie betrouwbaar is.
 *
 * WAT HET CONTROLEERT
 *   1. REPRODUCEERBAAR — het gepubliceerde (afgeronde) percentiel is exact
 *      percentileRank(composiet, referentie). Faalt dit, dan is het cijfer tegen
 *      een ANDERE referentie berekend dan het record beweert → kritiek.
 *   2. NIET-DEGENERAAT — de referentie heeft echte spreiding (sd > 0). Een platte
 *      referentie maakt elk percentiel betekenisloos → kritiek.
 *   3. SEIZOENSMATCH — de referentie komt uit het seizoensvenster, niet de
 *      volledige-historie-terugval (cross-seizoen vergelijking) en heeft genoeg
 *      punten → anders gedegradeerd (informatief, geen storing).
 *   4. OVERGEVOELIGHEID — een extreem percentiel (≤10 of ≥90) terwijl het
 *      composiet maar een fractie van het referentie-midden afwijkt, betekent
 *      dat een tiny beweging het getal hard laat zwaaien (lage-variantie-
 *      vergrootglas). Gedegradeerd: het cijfer is correct maar fragiel; lees het
 *      relatief, niet absoluut.
 *
 * Het stempelt ook de methodologie-versie, zodat een toekomstige wijziging die
 * de referentie zou persisteren onder een andere versie hier opvalt.
 */
import { percentileRank } from "./percentile.js";
import { seasonalReferenceWithFallback, seasonalReference, SEASONAL_WINDOW_DAYS, MIN_SEASONAL_POINTS, type DatedValue } from "./seasonal-percentile.js";

/** Onder dit aantal referentiepunten is het percentiel zelf al wankel. */
export const MIN_REFERENCE_POINTS = 30;
/** Spreiding (sd) onder deze grens telt als "geen variatie" → degeneraat. */
export const MIN_REFERENCE_SD = 1e-4;
/** Een percentiel ≤ dit of ≥ (100 − dit) heet "extreem" voor de overgevoeligheidstest. */
export const EXTREME_PERCENTILE = 10;
/** |z| onder deze grens bij een extreem percentiel = overgevoelig (lage variantie). */
export const HYPERSENSITIVE_Z = 0.5;

export type AuditVerdict = "ok" | "degraded" | "critical";

export interface ReferenceAudit {
  methodology_version: string;
  n_reference: number;
  reference_mode: "seasonal" | "fallback_full";
  reference_window_days: number;
  reference_median: number;
  reference_sd: number;
  composite: number;
  /** (composiet − referentie-mediaan) / referentie-sd; "hoe ver van het midden". */
  composite_z_vs_reference: number;
  percentile_published: number;
  percentile_recomputed: number;
  /** Het record berekent het percentiel tegen exact de referentie die het noemt. */
  reproducible: boolean;
  degenerate_reference: boolean;
  thin_reference: boolean;
  /** Extreem percentiel maar composiet nauwelijks van het midden af (fragiel cijfer). */
  hypersensitive: boolean;
  verdict: AuditVerdict;
  notes: string[];
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const mid = n >> 1;
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(values: number[], mean: number): number {
  if (values.length === 0) return NaN;
  let s = 0;
  for (const v of values) s += (v - mean) * (v - mean);
  return Math.sqrt(s / values.length);
}

/**
 * Audit het gepubliceerde percentiel tegen zijn eigen referentie.
 *
 * @param composite          het gepubliceerde composiet (equal)
 * @param date               de rekendatum (ISO)
 * @param compositeHistory   dezelfde historie die seasonalPercentile zag
 * @param publishedPercentile het gepubliceerde (afgeronde) percentiel
 * @param methodologyVersion stempel; alle referentiepunten zijn deze run berekend
 */
export function auditReferenceConsistency(
  composite: number,
  date: string,
  compositeHistory: DatedValue[],
  publishedPercentile: number,
  methodologyVersion: string,
): ReferenceAudit {
  const notes: string[] = [];

  // Exact dezelfde referentie als seasonalPercentile (gedeelde helper).
  const reference = seasonalReferenceWithFallback(compositeHistory, date);
  // Bepaal of het seizoensvenster zelf volstond of dat de volledige-historie-
  // terugval is gebruikt (cross-seizoen, minder zuiver).
  const seasonalOnly = seasonalReference(compositeHistory, date, SEASONAL_WINDOW_DAYS);
  const usedFallback = seasonalOnly.length < MIN_SEASONAL_POINTS;

  const n = reference.length;
  const sorted = [...reference].sort((a, b) => a - b);
  const mean = n ? reference.reduce((s, v) => s + v, 0) / n : NaN;
  const med = median(sorted);
  const sd = stddev(reference, mean);

  const recomputed = n ? Math.round(percentileRank(composite, reference)) : publishedPercentile;
  const reproducible = recomputed === publishedPercentile;

  const degenerate = !(sd > MIN_REFERENCE_SD);
  const thin = n < MIN_REFERENCE_POINTS;

  const z = degenerate ? 0 : (composite - med) / sd;
  const extreme = publishedPercentile <= EXTREME_PERCENTILE || publishedPercentile >= 100 - EXTREME_PERCENTILE;
  const hypersensitive = !degenerate && extreme && Math.abs(z) < HYPERSENSITIVE_Z;

  let verdict: AuditVerdict = "ok";
  if (!reproducible) {
    verdict = "critical";
    notes.push(
      `Percentiel niet reproduceerbaar: gepubliceerd ${publishedPercentile}, herberekend ${recomputed} uit dezelfde referentie. Mogelijk een methodologie-inconsistentie.`,
    );
  }
  if (degenerate) {
    verdict = "critical";
    notes.push(`Referentie zonder spreiding (sd ${sd.toFixed(6)}): elk percentiel is betekenisloos.`);
  }
  if (verdict !== "critical") {
    if (thin) {
      verdict = "degraded";
      notes.push(`Dunne referentie (${n} punten < ${MIN_REFERENCE_POINTS}): percentiel is onzeker.`);
    }
    if (usedFallback) {
      verdict = "degraded";
      notes.push(
        `Seizoensvenster te dun (${seasonalOnly.length} punten); terugval op de volledige historie (cross-seizoen vergelijking).`,
      );
    }
    if (hypersensitive) {
      verdict = "degraded";
      notes.push(
        `Overgevoelig: percentiel ${publishedPercentile} terwijl het composiet maar ${z.toFixed(2)} sd van het referentie-midden ligt. Kleine bewegingen zwaaien het getal hard; lees relatief, niet absoluut.`,
      );
    }
  }
  if (notes.length === 0) notes.push("Percentiel reproduceerbaar tegen een gezonde seizoensreferentie.");

  return {
    methodology_version: methodologyVersion,
    n_reference: n,
    reference_mode: usedFallback ? "fallback_full" : "seasonal",
    reference_window_days: SEASONAL_WINDOW_DAYS,
    reference_median: Math.round(med * 1000) / 1000,
    reference_sd: Math.round(sd * 1000) / 1000,
    composite: Math.round(composite * 1000) / 1000,
    composite_z_vs_reference: Number.isFinite(z) ? Math.round(z * 100) / 100 : 0,
    percentile_published: publishedPercentile,
    percentile_recomputed: recomputed,
    reproducible,
    degenerate_reference: degenerate,
    thin_reference: thin,
    hypersensitive,
    verdict,
    notes,
  };
}
