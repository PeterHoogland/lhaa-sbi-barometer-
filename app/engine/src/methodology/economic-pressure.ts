/**
 * Absolute economische stress-meting "vs normale tijden" — amendement §4.1.9.
 *
 * WAAROM. Het brede cijfer is een rollend SEIZOENSPERCENTIEL: het meet hoe
 * ongewoon vandaag is t.o.v. de laatste 24 maanden. In 2026 is dat genuinely
 * kalm (~20) — de meeste indicatoren zijn rustig vergeleken met 2024-2025 (zie
 * verslag 07 + memory lage-scores-2026-genuine). Dat cijfer NIET oppompen (harde
 * regel 1). De eerlijke aanvulling is een ABSOLUTE meting: hoe verheven staan de
 * economische stressoren t.o.v. een VASTE "normale" periode (2010-2019)? Inflatie,
 * brandstof en consumentenvertrouwen zijn t.o.v. dat decennium ECHT verhoogd.
 *
 * HARDE GRENS (waarom economie-only). Alleen indicatoren met een echte
 * 2010-2019-historie kunnen "vs normale tijden" gemeten worden. Weer/nieuws/
 * verkeer/pollen bestaan pas sinds 2024; energie (I-D3-002) start pas in 2024 en
 * valt er dus OOK uit. De vijf met een echt decennium-segment:
 *   I-D3-001 inflatie, I-D2-004 brandstof, I-D3-007 consumentenvertrouwen
 *   (inverse), I-D3-005 werkloosheid, I-D3-006 hypotheekrente.
 *
 * METHODE (scale-discipline, harde regel 5). Per indicator wordt de LAATSTE
 * waarde (<= asOf) vergeleken met de 2010-2019-waarden van DEZELFDE reeks (zelfde
 * historiebestand, zelfde eenheid, geen STL): een absolute "vs normaal decennium"-
 * meting hoort het niveau te lezen, niet het seizoensresidu. MAD-z (mediaan + MAD
 * x1.4826, identiek aan zscore.ts), inverse-codering uit de registry, winsorize
 * (+/-3) zoals de brede keten. Composiet = gewogen gemiddelde van de per-indicator
 * z; mapping naar 0-100 via de normale CDF (Peter-beslissing 2026-06-17):
 *   score = round(100 * Phi(zbar)),  zbar=0 (exact normaal decennium) -> 50.
 *
 * EERLIJK. Dit pompt niets op: in een rustige periode blijft het laag; het stijgt
 * pas als de stressoren ongewoon zijn vergeleken met normale tijden. En het is een
 * APART, smaller construct: het mag niet "de Nationale Stress Barometer" heten.
 *
 * PUUR. Geen file-IO; de aanroeper (runtime) levert de historie. Productie levert
 * de volledige reeks (generate-fixture leest app/data/history/*.json integraal);
 * de bridge met een kort raw-history-venster valt eerlijk terug op not_computed.
 */

import type { IndicatorCode, EconomicPressure } from "../types.js";
import { INDICATORS } from "../indicators/registry.js";
import { median, robustScale } from "./zscore.js";
import { winsorize } from "./winsorize.js";
import { DEMOGRAPHIC_REACH } from "./demographic-reach.js";

export const ECONOMIC_BASELINE_START = "2010-01-01";
export const ECONOMIC_BASELINE_END = "2019-12-31";
export const ECONOMIC_BASELINE_WINDOW = "2010-2019";

/** Minimale 2010-2019-baselinepunten per indicator (~3 jaar maanddata). */
export const MIN_ECONOMIC_BASELINE_POINTS = 36;
/** Minimaal aantal indicatoren met geldige baseline voor een composiet. */
export const MIN_ECONOMIC_INDICATORS = 3;

/**
 * De economische indicatoren met een echte 2010-2019-historie. Energie (I-D3-002)
 * valt er bewust uit: zijn reeks begint pas in 2024 (harde grens, geen ijkpunt).
 */
export const ECONOMIC_PRESSURE_CODES: IndicatorCode[] = [
  "I-D3-001", // inflatie (CPI YoY %)
  "I-D2-004", // brandstofprijs (EUR/L)
  "I-D3-007", // consumentenvertrouwen (inverse-coded)
  "I-D3-005", // werkloosheid (%)
  "I-D3-006", // hypotheekrente (%)
];

/**
 * User-facing label. Sinds amendement §4.1.10 (Peter GO 17/6) is deze absolute
 * meting HET publieke hoofdcijfer van de Index (niet langer enkel een parallelle
 * tweede meting). De claim-mitigatie verschuift mee: het cijfer meet economische
 * druk t.o.v. normale tijden, geen individuele stress. Geen em-dash (harde regel 9).
 */
export const ECONOMIC_PRESSURE_LABEL =
  "Economische druk op gezinnen t.o.v. normale tijden (2010-2019).";

/**
 * De BREDE absolute meting (amendement §4.1.11, Peter GO 17/6): de 5 economische
 * + weer (hitte/koude) + energie. Deze drie kregen via backfill een echte
 * pre-2020-baseline met exact dezelfde maat als de live-fetcher (open-meteo
 * 2010-2019 voor Tmax/Tmin; energy-charts 2016-2019 dag-gemiddelde EUR/MWh).
 * Lucht/nieuws/Wikipedia ontbreken bewust: hun historische maat is niet
 * betrouwbaar te reproduceren (geen RSS-archief / Pattern.nl-lexicon voor
 * 2016-2019), dus geen Hitte-bug-risico. Eerlijke, uitbreidbare datagrens.
 */
export const BROAD_PRESSURE_CODES: IndicatorCode[] = [
  ...ECONOMIC_PRESSURE_CODES,
  "I-D1-002", // hitte: max(0, Tmax - 30)
  "I-D1-003", // koude: max(0, -5 - Tmin)
  "I-D3-002", // energieprijs: dag-gemiddelde EUR/MWh
];

/** Bindend, user-facing. Publieke hoofdcijfer-label (§4.1.11). Geen em-dash. */
export const BROAD_PRESSURE_LABEL =
  "Brede druk t.o.v. normale tijden (2010-2019): kosten van levensonderhoud, energie en weer. Geen meting van individuele stress.";

export const ECONOMIC_PRESSURE_MAPPING = "normal_cdf" as const;

export interface DatedValue {
  date: string; // ISO YYYY-MM-DD
  value: number;
}

/**
 * Normale CDF (Zelen & Severo, Abramowitz & Stegun 26.2.17; |fout| < 7.5e-8).
 * Phi(0) = 0.5, Phi(+inf) -> 1. Forward-tegenhanger van de probit in ecdf.ts.
 */
export function normalCdf(z: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const invSqrt2Pi = 0.3989422804014327;
  const az = Math.abs(z);
  const t = 1 / (1 + p * az);
  const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  const tail = invSqrt2Pi * Math.exp((-az * az) / 2) * poly;
  return z >= 0 ? 1 - tail : tail;
}

function latestAtOrBefore(series: DatedValue[], asOf: string): DatedValue | null {
  let best: DatedValue | null = null;
  for (const p of series) {
    if (!Number.isFinite(p.value)) continue;
    if (p.date <= asOf && (best === null || p.date > best.date)) best = p;
  }
  return best;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

function notComputed(
  indicators: EconomicPressure["indicators"],
  label: string,
  reason: string,
): EconomicPressure {
  return {
    status: "not_computed",
    score: null,
    zbar_equal: null,
    zbar_demographic: null,
    score_demographic: null,
    baseline_window: ECONOMIC_BASELINE_WINDOW,
    mapping: ECONOMIC_PRESSURE_MAPPING,
    label,
    n_indicators: indicators.length,
    indicators,
    not_computed_reason: reason,
  };
}

/**
 * Bereken een absolute "vs normale tijden"-meting voor `asOf` over `codes`. Per
 * indicator: MAD-z van de laatste waarde (<= asOf, lookahead-veilig) tegen de
 * 2010-2019-baseline van diezelfde reeks (energie heeft daarbinnen 2016-2019),
 * inverse-codering + winsorize, gemapt via 100*Phi(zbar). not_computed wanneer
 * minder dan MIN_ECONOMIC_INDICATORS een toereikende baseline hebben.
 */
export function computeAbsolutePressure(
  codes: IndicatorCode[],
  label: string,
  history: Partial<Record<IndicatorCode, DatedValue[]>>,
  asOf: string,
): EconomicPressure {
  const indicators: EconomicPressure["indicators"] = [];

  for (const code of codes) {
    const series = history[code] ?? [];
    const baseline = series
      .filter((p) => p.date >= ECONOMIC_BASELINE_START && p.date <= ECONOMIC_BASELINE_END)
      .map((p) => p.value)
      .filter((v) => Number.isFinite(v));
    if (baseline.length < MIN_ECONOMIC_BASELINE_POINTS) continue;

    const latest = latestAtOrBefore(series, asOf);
    if (!latest) continue;

    const med = median(baseline);
    // robustScale = MAD -> IQR -> SD (zoals engine/zscore.ts), zodat een vlakke
    // baseline (bv. weer: meestal 0) niet stilletjes wordt uitgesloten.
    const scale = robustScale(baseline);
    const meta = INDICATORS[code];
    let z: number;
    if (Number.isFinite(scale) && scale > 0) {
      z = (latest.value - med) / scale;
    } else if (!meta.inverseCoded && latest.value <= med) {
      // Vlakke baseline + dagwaarde op/onder de mediaan = gemeten "geen
      // uitschieter" -> z = 0 (zoals de hoofd-engine), MEETELLEN, niet uitsluiten.
      // Anders zou een neutrale indicator (weer) de meting omhoog vertekenen.
      z = 0;
    } else {
      continue; // geen schaal en wel een uitschieter -> eerlijk uitsluiten
    }
    if (meta.inverseCoded) z = -z;
    z = winsorize(z).value;

    indicators.push({
      code,
      plain_name: meta.name,
      latest_value: round3(latest.value),
      latest_date: latest.date,
      baseline_median: round3(med),
      baseline_mad: round3(Number.isFinite(scale) ? scale : 0),
      n_baseline: baseline.length,
      z: round2(z),
      inverse_coded: meta.inverseCoded,
    });
  }

  if (indicators.length < MIN_ECONOMIC_INDICATORS) {
    return notComputed(
      indicators,
      label,
      `slechts ${indicators.length} van ${codes.length} indicatoren hebben een ` +
        `toereikende baseline (min ${MIN_ECONOMIC_INDICATORS})`,
    );
  }

  const zbarEqual = indicators.reduce((s, i) => s + i.z, 0) / indicators.length;

  let weightedZ = 0;
  let totalReach = 0;
  for (const i of indicators) {
    const reach = DEMOGRAPHIC_REACH[i.code].reach;
    weightedZ += i.z * reach;
    totalReach += reach;
  }
  const zbarDem = totalReach > 0 ? weightedZ / totalReach : zbarEqual;

  return {
    status: "computed",
    score: Math.round(100 * normalCdf(zbarEqual)),
    zbar_equal: round2(zbarEqual),
    zbar_demographic: round2(zbarDem),
    score_demographic: Math.round(100 * normalCdf(zbarDem)),
    baseline_window: ECONOMIC_BASELINE_WINDOW,
    mapping: ECONOMIC_PRESSURE_MAPPING,
    label,
    n_indicators: indicators.length,
    indicators,
  };
}

/** Economie-only absolute meting (§4.1.9) — behouden voor transparantie. */
export function computeEconomicPressure(
  history: Partial<Record<IndicatorCode, DatedValue[]>>,
  asOf: string,
): EconomicPressure {
  return computeAbsolutePressure(ECONOMIC_PRESSURE_CODES, ECONOMIC_PRESSURE_LABEL, history, asOf);
}

/** BREDE absolute meting (§4.1.11) — economie + energie + weer; publiek hoofdcijfer. */
export function computeBroadPressure(
  history: Partial<Record<IndicatorCode, DatedValue[]>>,
  asOf: string,
): EconomicPressure {
  return computeAbsolutePressure(BROAD_PRESSURE_CODES, BROAD_PRESSURE_LABEL, history, asOf);
}
