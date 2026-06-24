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
 * DAGSIGNALEN (verkeer I-D2-001-rt DATEX-filezwaarte; OV I-D2-stib + I-D2-delijn,
 * §4.1.15). Geen 2010-2019-archief, dus geen "vs normaal"-anker mogelijk; ze wegen
 * mee als DAGSIGNAAL via de empirische CDF van hun eigen (nog korte, aangroeiende)
 * historie -> probit-z. Per constructie begrensd; n_reference per signaal gerapporteerd
 * zodat de dunne basis zichtbaar blijft. Onder MIN_DAY_POINTS valt een dagsignaal
 * eerlijk weg (z_fast dan zonder dat signaal). OV meet iets NIEUWS (geen dubbeltelling),
 * vandaar opname; nieuws-/social-varianten blijven secundair (zouden dubbel tellen).
 *
 * PUUR. Geen file-IO; de aanroeper (runtime) levert de broad_pressure-indicatoren
 * en de dagsignalen (code + waarde + eigen historie).
 */

import type { IndicatorCode, HybridComponent, HybridHeadline, HybridDaySignal } from "../types.js";
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

/** Snelle STRESS-codes uit broad_pressure (dagelijks variabel, stressoren). */
export const HYBRID_FAST_CODES: IndicatorCode[] = [
  "I-D1-002", // hitte
  "I-D1-003", // koude
  "I-D5-001", // nieuwstoon
];

/**
 * Omgevings-stress DAGSIGNALEN (§4.1.16, Peter GO 2026-06-24): pollen + luchtkwaliteit.
 * Ze hebben geen 2010-2019-anker (niet reproduceerbaar), dus ze komen — net als verkeer/
 * OV — als dagsignaal binnen (ECDF vs eigen rollende historie). Maar het zijn STRESSOREN:
 * ze tellen vol mee in de stress-term, niet als verlichting. Voorheen voedden ze alleen
 * het relatieve percentiel en niet de kop; sinds §4.1.16 staan ze in het hoofdcijfer.
 */
export const HYBRID_ENV_STRESS_DAY_CODES: ReadonlySet<string> = new Set(["I-D1-010", "I-D1-004"]);

/**
 * Mobiliteits-DAGSIGNALEN (verkeer + OV). Deze kunnen VERLICHTING aangeven (lege wegen =
 * minder stress) en mogen dus negatief zijn, maar begrensd (HYBRID_MOBILITY_RELIEF_FLOOR).
 */
export const HYBRID_MOBILITY_DAY_CODES: ReadonlySet<string> = new Set([
  "I-D2-001-rt",
  "I-D2-stib",
  "I-D2-delijn",
]);

/** Ademknop: gewicht van de snelle beweging in de samengestelde z (Peter 19/6). */
export const HYBRID_W_FAST = 0.30;

/**
 * Binnen z_fast: gewicht van de mobiliteits-(verlichtings-)term t.o.v. de stress-term
 * (§4.1.16). Mobiliteit is een kleine modificator, geen gelijke stem: zo kan een rustige
 * avondspits een hittegolf niet uitvlakken.
 */
export const HYBRID_W_MOBILITY = 0.20;

/**
 * Verlichting (negatieve mobiliteits-z) mag de snelle laag hoogstens met dit bedrag
 * verlagen. Lege wegen geven milde verlichting, geen sloophamer die de stress
 * (hitte/pollen/lucht) volledig wegpoetst (§4.1.16).
 */
export const HYBRID_MOBILITY_RELIEF_FLOOR = -0.5;

/** Minimale dekking voor een geldige kop. */
export const HYBRID_MIN_SLOW = 4;
export const HYBRID_MIN_FAST = 2;
/** Een dagsignaal (verkeer/OV/pollen/lucht) telt pas mee vanaf zoveel historische dagpunten. */
export const HYBRID_MIN_DAY_POINTS = 10;

/** Bindend, user-facing. Geen em-dash (harde regel 9). */
export const HYBRID_LABEL =
  "Dagelijkse druk t.o.v. normale tijden (2010-2019): de structurele kosten van " +
  "levensonderhoud en energie, gecombineerd met de omstandigheden van vandaag " +
  "(weer, luchtkwaliteit, pollen, nieuws, verkeer en openbaar vervoer). Geen meting van individuele stress.";

/** Een dagsignaal-input: code + waarde van vandaag + eigen (korte) historie. */
export interface DayProxyInput {
  code: string;
  value: number | null;
  history: ReadonlyArray<number>;
}

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
 * de dagsignalen (verkeer + OV: waarde + eigen historie). not_computed wanneer er
 * te weinig structurele of snelle codes met een eindige z aanwezig zijn.
 */
export function computeHybridHeadline(
  broadIndicators: ReadonlyArray<{ code: IndicatorCode; z: number }>,
  dayProxies: ReadonlyArray<DayProxyInput>,
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

  // STRESS-term: de snelle stressoren uit broad_pressure (hitte/koude/nieuws). Pollen +
  // luchtkwaliteit komen hieronder als dagsignaal bij (eigen historie), ook als stress.
  const stressFastZ: number[] = [];
  for (const code of HYBRID_FAST_CODES) {
    const z = zByCode.get(code);
    if (z === undefined) continue;
    stressFastZ.push(z);
    components.push({ code, z, band: "fast" });
  }

  // Dagsignalen: ECDF van vandaag binnen de eigen (aangroeiende) historie -> probit-z,
  // gewinsoriseerd. Self-inclusief, begrensd; n_reference toont de dunne basis. Mobiliteit
  // (verkeer/OV) kan VERLICHTING geven (negatief) en wordt apart en begrensd verrekend;
  // omgevings-stress (pollen/lucht) telt vol mee in de stress-term (§4.1.16).
  const daySignals: HybridDaySignal[] = [];
  const mobilityZ: number[] = [];
  for (const dp of dayProxies) {
    const finiteHist = (dp.history ?? []).filter((v) => Number.isFinite(v));
    if (dp.value === null || !Number.isFinite(dp.value) || finiteHist.length < HYBRID_MIN_DAY_POINTS) {
      continue;
    }
    const reference = [...finiteHist, dp.value];
    const z = Math.round(winsorize(ecdfZ(dp.value, reference)).value * 100) / 100;
    daySignals.push({ code: dp.code, value: Math.round(dp.value * 1000) / 1000, z, n_reference: reference.length });
    components.push({ code: dp.code, z, band: "fast" });
    if (HYBRID_MOBILITY_DAY_CODES.has(dp.code)) {
      mobilityZ.push(z);
    } else {
      // omgevings-stress (pollen/lucht) en elk ander niet-mobiliteits-dagsignaal = stress
      stressFastZ.push(z);
    }
  }

  if (slowZ.length < HYBRID_MIN_SLOW || stressFastZ.length < HYBRID_MIN_FAST) {
    return {
      status: "not_computed",
      score: null,
      z_slow: null,
      z_fast: null,
      w_fast: wFast,
      combined_z: null,
      day_signals: daySignals,
      components,
      label: HYBRID_LABEL,
      not_computed_reason:
        `onvoldoende dekking: ${slowZ.length}/${HYBRID_SLOW_CODES.length} traag ` +
        `(min ${HYBRID_MIN_SLOW}), ${stressFastZ.length} snel-stress (min ${HYBRID_MIN_FAST})`,
    };
  }

  const zSlow = mean(slowZ);
  const zStressFast = mean(stressFastZ);
  // Mobiliteit als kleine, BEGRENSDE modificator: verlichting (negatief) wordt op
  // HYBRID_MOBILITY_RELIEF_FLOOR gevloerd zodat lege wegen de stress niet wegpoetsen;
  // drukte (positief) telt gewoon mee. Geen mobiliteitssignaal -> z_fast = de stress-term.
  const zFast =
    mobilityZ.length > 0
      ? (1 - HYBRID_W_MOBILITY) * zStressFast +
        HYBRID_W_MOBILITY * Math.max(mean(mobilityZ), HYBRID_MOBILITY_RELIEF_FLOOR)
      : zStressFast;
  const combined = (1 - wFast) * zSlow + wFast * zFast;
  return {
    status: "computed",
    score: Math.round(100 * normalCdf(combined)),
    z_slow: Math.round(zSlow * 100) / 100,
    z_fast: Math.round(zFast * 100) / 100,
    w_fast: wFast,
    combined_z: Math.round(combined * 100) / 100,
    day_signals: daySignals,
    components,
    label: HYBRID_LABEL,
  };
}
