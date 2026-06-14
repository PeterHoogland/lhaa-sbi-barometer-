/**
 * Afvlakking van het composiet vóór het percentiel (amendement §4.1.8, Peter 14/6).
 *
 * WAAROM. De composiet-dag-tot-dag-sd (~0,166) was bijna gelijk aan de totale sd
 * (~0,179): het composiet had vrijwel geen persistentie en was grotendeels
 * dagruis (vijf snelle bronnen: nieuws, stroom, gebeurtenissen, treinen, lucht).
 * Het krappe seizoenspercentiel blies die ruis op tot dag-tot-dag-sprongen van
 * gemiddeld ~15 en pieken tot 54 percentielpunten — onbruikbaar volatiel voor
 * een publieke barometer. Een voortschrijdend 7-daags gemiddelde maakt er weer
 * een traag evoluerende toestand van (prototype: dag-sprong 3× kleiner).
 *
 * CONSISTENTIE. Zowel de dagwaarde als de hele referentiehistorie worden met
 * hetzelfde trailing venster afgevlakt; je vergelijkt dus afgevlakt tegen
 * afgevlakt (nooit afgevlakt tegen ruw). LOOKAHEAD-VRIJ: elk punt middelt
 * uitsluitend zichzelf en voorgaande dagen.
 */

export interface DatedValue {
  date: string;
  value: number;
}

/** Het pre-geregistreerde afvlakvenster (dagen). Wijzigen = amendement. */
export const SMOOTHING_WINDOW_DAYS = 7;

/**
 * Som van de laatste (window − 1) historiewaarden + het aantal punten dat in de
 * afvlakking van VANDAAG meegaat. De aanroeper berekent
 *   smoothedToday = (pastSum + rawComposite) / count.
 * Bij minder dan (window − 1) historiepunten schuift het venster mee (expanderend).
 */
export function trailingPastSum(
  historyValues: number[],
  window: number = SMOOTHING_WINDOW_DAYS,
): { pastSum: number; count: number } {
  const take = Math.min(Math.max(0, window - 1), historyValues.length);
  let pastSum = 0;
  for (let i = historyValues.length - take; i < historyValues.length; i++) {
    pastSum += historyValues[i];
  }
  return { pastSum, count: take + 1 };
}

/** smoothedToday = trailing-gemiddelde van de laatste `window` dagen t/m vandaag. */
export function smoothedToday(
  historyValues: number[],
  todayValue: number,
  window: number = SMOOTHING_WINDOW_DAYS,
): number {
  const { pastSum, count } = trailingPastSum(historyValues, window);
  return (pastSum + todayValue) / count;
}

/**
 * Vlak elke historiewaarde af met een trailing venster (lookahead-vrij). De
 * vroegste punten gebruiken een korter (expanderend) venster. Veronderstelt dat
 * `history` chronologisch oplopend en aaneengesloten dagelijks is (zo gebouwd in
 * generate-fixture/compute-daily).
 */
export function smoothTrailing(
  history: DatedValue[],
  window: number = SMOOTHING_WINDOW_DAYS,
): DatedValue[] {
  const out: DatedValue[] = new Array(history.length);
  for (let i = 0; i < history.length; i++) {
    const lo = Math.max(0, i - window + 1);
    let sum = 0;
    for (let j = lo; j <= i; j++) sum += history[j].value;
    out[i] = { date: history[i].date, value: sum / (i - lo + 1) };
  }
  return out;
}
