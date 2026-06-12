/**
 * Seizoens-bewuste percentiel-referentie voor het samengestelde cijfer (v0.2).
 *
 * WAAROM (2026-06, na de grilligheid/lage-bias-diagnose). Het publieke percentiel
 * rangschikte de dag van vandaag tegen het HELE 2-jaars-venster. Een rustige
 * junidag werd zo afgezet tegen winters en het crisisjaar 2024 (appels met peren):
 * dat las structureel laag en toonde cross-seizoen-verschillen als grilligheid.
 * We vergelijken nu tegen dezelfde PERIODE van het jaar (± een venster rond
 * dezelfde dag-van-het-jaar, over alle beschikbare jaren). Dat is dezelfde
 * seizoenslogica die de engine al PER INDICATOR toepast (STL), nu op het composiet.
 *
 * EERLIJK: dit pompt niets op. In een echt rustige periode blijft het laag; het
 * stijgt pas als de omstandigheden ongewoon worden VOOR DIT SEIZOEN. Het is geen
 * herijking-naar-een-gewenst-getal, maar een eerlijkere vergelijkingsbasis.
 *
 * LOOKAHEAD-VRIJ: een dag weegt uitsluitend tegen punten met datum ≤ die dag.
 * Te weinig seizoenspunten (koude start / eerste jaar historie) → terugval op het
 * volledige venster i.p.v. een onbetrouwbare schatting (geen artificiële piek).
 */
import { percentileRank } from "./percentile.js";

/** Half-venster rond de dag-van-het-jaar (dagen). ±45 ≈ een seizoenskwartaal. */
export const SEASONAL_WINDOW_DAYS = 45;
/** Onder dit aantal seizoenspunten: terugval op het volledige venster. */
export const MIN_SEASONAL_POINTS = 30;

export interface DatedValue {
  date: string; // ISO YYYY-MM-DD
  value: number;
}

function dayOfYear(dateISO: string): number {
  const d = new Date(dateISO + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return 0;
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.floor((d.getTime() - start) / 86_400_000); // 0..365
}

/** Cyclische afstand in dagen tussen twee dagen-van-het-jaar (0..183). */
export function seasonalDistance(doyA: number, doyB: number): number {
  const raw = Math.abs(doyA - doyB);
  return Math.min(raw, 366 - raw);
}

/** Valt `dateA` binnen het seizoensvenster rond `dateB`? */
export function withinSeason(dateA: string, dateB: string, windowDays: number): boolean {
  return seasonalDistance(dayOfYear(dateA), dayOfYear(dateB)) <= windowDays;
}

/** De waarden uit `history` die in hetzelfde seizoensvenster rond `asOf` vallen. */
export function seasonalReference(history: DatedValue[], asOf: string, windowDays: number): number[] {
  const out: number[] = [];
  for (const h of history) if (withinSeason(h.date, asOf, windowDays)) out.push(h.value);
  return out;
}

/**
 * De referentieset die seasonalPercentile gebruikt: het seizoensvenster, met
 * terugval op de volledige historie onder `minPoints`. Gedeeld met de
 * B3-bootstrap (runtime.ts) zodat percentiel en CI per constructie dezelfde
 * referentie zien — een latere wijziging hier raakt beide tegelijk.
 */
export function seasonalReferenceWithFallback(
  history: DatedValue[],
  asOf: string,
  windowDays: number = SEASONAL_WINDOW_DAYS,
  minPoints: number = MIN_SEASONAL_POINTS,
): number[] {
  const seasonal = seasonalReference(history, asOf, windowDays);
  return seasonal.length >= minPoints ? seasonal : history.map((h) => h.value);
}

/**
 * Seizoens-percentiel van `value` op dag `asOf` t.o.v. `history`. Terugval op het
 * volledige venster als er minder dan `minPoints` seizoenspunten zijn. Lege
 * referentie → percentileRank geeft 50 (zelfde conventie als zonder seizoen).
 */
export function seasonalPercentile(
  value: number,
  asOf: string,
  history: DatedValue[],
  windowDays: number = SEASONAL_WINDOW_DAYS,
  minPoints: number = MIN_SEASONAL_POINTS,
): number {
  return percentileRank(value, seasonalReferenceWithFallback(history, asOf, windowDays, minPoints));
}

/**
 * Lookahead-vrije seizoens-percentiel-historie (voedt de tier-logica). Elke dag
 * weegt uitsluitend tegen punten met datum ≤ die dag, binnen het seizoensvenster
 * (terugval op volledig venster). `history` moet chronologisch oplopend zijn;
 * `today` wordt achteraan toegevoegd.
 */
export function buildSeasonalPercentileHistory(
  history: DatedValue[],
  today: DatedValue,
  windowDays: number = SEASONAL_WINDOW_DAYS,
  minPoints: number = MIN_SEASONAL_POINTS,
): number[] {
  const all = [...history, today];
  const out: number[] = [];
  for (let i = 0; i < all.length; i++) {
    const pt = all[i];
    const seasonal: number[] = [];
    for (let j = 0; j <= i; j++) {
      if (withinSeason(all[j].date, pt.date, windowDays)) seasonal.push(all[j].value);
    }
    const ref = seasonal.length >= minPoints ? seasonal : all.slice(0, i + 1).map((p) => p.value);
    out.push(percentileRank(pt.value, ref));
  }
  return out;
}
