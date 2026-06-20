/**
 * HYBRIDE DAGKOP "niveau x beweging" — amendement §4.1.14 (Peter GO 2026-06-19).
 *
 * WAAROM. De brede absolute meting (broad_pressure, §4.1.11) leest eerlijk-hoog
 * "vs normale tijden" maar beweegt nauwelijks van dag tot dag: drie indicatoren
 * staan op de winsor-kap, de economische grondlast pint een hoge bodem, en
 * Phi verzadigt aan de top. Verkeer zit er bovendien niet in (geen 2010-2019-
 * archief). Peter wil een kop die de STRUCTURELE druk (kosten van levensonderhoud,
 * energie) combineert met de DAGELIJKSE omstandigheden (weer, nieuws, verkeer),
 * eerlijk-hoog verankerd maar zichtbaar ademend.
 *
 * METHODE. Hergebruikt de per-indicator z's van broad_pressure (elk MAD-z vs zijn
 * eigen 2010-2019/2017-2019-normaal, scale-discipline behouden, harde regel 5) en
 * splitst ze in een TRAAG anker en een SNELLE beweging:
 *   z_slow = gemiddelde z van de 6 structurele codes (kosten + energie)
 *   z_fast = gemiddelde z van de snelle codes (hitte/koude/nieuws) + verkeer
 *   kop    = round( 100 * Phi( (1-w_fast)*z_slow + w_fast*z_fast ) )
 * Eén samengestelde z-score -> normale CDF (zelfde mapping als broad_pressure,
 * geen additieve plak-punten -> geen plafond-verzadiging). w_fast is de ademknop.
 *
 * VERKEER (I-D2-001-rt, DATEX-dagfilezwaarte). Geen 2010-2019-archief, dus geen
 * "vs normaal"-anker mogelijk; het weegt mee als DAGSIGNAAL via de empirische CDF
 * van zijn eigen (nog korte, aangroeiende) historie -> probit-z. Per constructie
 * begrensd; n_reference wordt gerapporteerd zodat de dunne basis zichtbaar blijft.
 * Onder MIN_TRAFFIC_POINTS valt verkeer eerlijk weg (z_fast dan zonder verkeer).
 *
 * PUUR. Geen file-IO; de aanroeper (runtime) levert de broad_pressure-indicatoren,
 * de verkeerswaarde en zijn historie.
 */

import type { IndicatorCode, HybridComponent, HybridHeadline } from "../types.js";
import { normalCdf } from "./economic-pressure.js";
import { ecdfZ } from "./ecdf.js";
import { winsorize } from "./winsorize.js";

/** Trage, structurele codes (kosten van levensonderhoud + energie) — het anker. */
export const HYBRID_SLOW_CODES: IndicatorCode[] = [
  "I-D3-001", // inflatie (CPI)
  "I-D2-004", // brandstofprijs
  "I-D3-007", // consumentenvertrouwen (inverse)
  "I-D3-005", // werkloosheid
  "I-D3-006", // hypotheekrente
  "I-D3-002", // energieprijs
];

/** Snelle codes uit broad_pressure (dagelijks variabel) — de beweging (excl. verkeer). */
export const HYBRID_FAST_CODES: IndicatorCode[] = [
  "I-D1-002", // hitte
  "I-D1-003", // koude
  "I-D5-001", // nieuwstoon
];

/** Ademknop: gewicht van de snelle beweging in de samengestelde z (Peter 19/6). */
export const HYBRID_W_FAST = 0.30;

/** Minimale dekking voor een geldige kop. */
export const HYBRID_MIN_SLOW = 4;
export const HYBRID_MIN_FAST = 2;
/** Verkeer telt pas mee als dagsignaal vanaf zoveel historische dagpunten. */
export const HYBRID_MIN_TRAFFIC_POINTS = 10;

/** Bindend, user-facing. Geen em-dash (harde regel 9). */
export const HYBRID_LABEL =
  "Dagelijkse druk t.o.v. normale tijden (2010-2019): de structurele kosten van " +
  "levensonderhoud en energie, gecombineerd met de omstandigheden van vandaag " +
  "(weer, nieuws, verkeer). Geen meting van individuele stress.";

function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/**
 * Kernformule (apart voor testbaarheid): samengestelde z -> 0-100 via de normale
 * CDF, identiek aan de broad_pressure-mapping. w_fast bepaalt de ademruimte.
 */
export function blendHeadlineScore(zSlow: number, zFast: number, wFast: number): number {
  return Math.round(100 * normalCdf((1 - wFast) * zSlow + wFast * zFast));
}

/**
 * Bereken de hybride dagkop uit de broad_pressure-indicatoren (met hun z) plus
 * het dagelijkse verkeer (waarde + eigen historie). not_computed wanneer er te
 * weinig structurele of snelle codes met een eindige z aanwezig zijn.
 */
export function computeHybridHeadline(
  broadIndicators: ReadonlyArray<{ code: IndicatorCode; z: number }>,
  trafficValue: number | null,
  trafficHistory: ReadonlyArray<number>,
  wFast: number = HYBRID_W_FAST,
): HybridHeadline {
  const zByCode = new Map<string, number>();
  for (const i of broadIndicators) {
    if (Number.isFinite(i.z)) zByCode.set(i.code, i.z);
  }

  const components: HybridComponent[] = [];
  const slowZ: number[] = [];
  for (const code of HYBRID_SLOW_CODES) {
    const z = zByCode.get(code);
    if (z === undefined) continue;
    slowZ.push(z);
    components.push({ code, z, band: "slow" });
  }
  const fastZ: number[] = [];
  for (const code of HYBRID_FAST_CODES) {
    const z = zByCode.get(code);
    if (z === undefined) continue;
    fastZ.push(z);
    components.push({ code, z, band: "fast" });
  }

  // Verkeer als dagsignaal: ECDF van vandaag binnen zijn eigen (aangroeiende)
  // historie -> probit-z, gewinsoriseerd. Self-inclusief, per constructie begrensd.
  let traffic: HybridHeadline["traffic"] = null;
  const finiteHist = trafficHistory.filter((v) => Number.isFinite(v));
  if (
    trafficValue !== null &&
    Number.isFinite(trafficValue) &&
    finiteHist.length >= HYBRID_MIN_TRAFFIC_POINTS
  ) {
    const reference = [...finiteHist, trafficValue];
    const tz = Math.round(winsorize(ecdfZ(trafficValue, reference)).value * 100) / 100;
    traffic = { value: Math.round(trafficValue * 1000) / 1000, z: tz, n_reference: reference.length };
    fastZ.push(tz);
    components.push({ code: "I-D2-001-rt", z: tz, band: "fast" });
  }

  if (slowZ.length < HYBRID_MIN_SLOW || fastZ.length < HYBRID_MIN_FAST) {
    return {
      status: "not_computed",
      score: null,
      z_slow: null,
      z_fast: null,
      w_fast: wFast,
      combined_z: null,
      traffic,
      components,
      label: HYBRID_LABEL,
      not_computed_reason:
        `onvoldoende dekking: ${slowZ.length}/${HYBRID_SLOW_CODES.length} traag ` +
        `(min ${HYBRID_MIN_SLOW}), ${fastZ.length} snel (min ${HYBRID_MIN_FAST})`,
    };
  }

  const zSlow = mean(slowZ);
  const zFast = mean(fastZ);
  const combined = (1 - wFast) * zSlow + wFast * zFast;
  return {
    status: "computed",
    score: Math.round(100 * normalCdf(combined)),
    z_slow: Math.round(zSlow * 100) / 100,
    z_fast: Math.round(zFast * 100) / 100,
    w_fast: wFast,
    combined_z: Math.round(combined * 100) / 100,
    traffic,
    components,
    label: HYBRID_LABEL,
  };
}
