/**
 * Daily runtime: orkestreert één SBI-berekening voor één datum.
 *
 * Pipeline (volgt doc 03_Laag-4 §5.3):
 *   [1] EXTRACT       — input bestaat al (rawValues + history)
 *   [2] VALIDATE      — schema-check op input
 *   [3] TRANSFORM     — STL waar voorgeschreven
 *   [4] HARMONIZE     — Z-scoring, inverse-codering, winsorize
 *   [5] DECORRELATE   — D5-decorrelatie-protocol (doc 03 §4.4)
 *   [6] AGGREGATE     — composite per Schema 1 + 2
 *   [7] SIGNAL        — percentiel + tier-logica
 */

import type {
  IndicatorCode,
  DailyOutput,
  IndicatorBreakdown,
  SecondarySignal,
  ContextSignal,
  Tier,
  BrandSafety,
  V04Output,
  KernBreakdown,
} from "./types.js";
import { INDICATOR_CODES, INDICATORS, contextIndicators, scoredDomains } from "./indicators/registry.js";
import { computeAllDeterministic } from "./indicators/deterministic.js";
import { PLAIN, zToState } from "./indicators/plain-language.js";
import { computeBaseline, zscore } from "./methodology/zscore.js";
import { stlResidual } from "./methodology/stl.js";
import { winsorize } from "./methodology/winsorize.js";
import {
  computeComposite,
  computeCompositeWithoutD5,
  computeDemographicComposite,
  pearsonCorrelation,
  type ZMap,
} from "./methodology/composite.js";
import { DEMOGRAPHIC_REACH } from "./methodology/demographic-reach.js";
import { indicatorWeight, domainWeight } from "./methodology/weights.js";
import { percentileRank } from "./methodology/percentile.js";
import {
  seasonalPercentile,
  buildSeasonalPercentileHistory,
  seasonalReferenceWithFallback,
} from "./methodology/seasonal-percentile.js";
import { auditReferenceConsistency, type ReferenceAudit } from "./methodology/reference-audit.js";
import { SMOOTHING_WINDOW_DAYS, trailingPastSum, smoothTrailing } from "./methodology/smoothing.js";
import { computeEconomicPressure, computeBroadPressure } from "./methodology/economic-pressure.js";
import {
  bootstrapDayUncertainty,
  seedFromString,
  type BootstrapIndicatorInput,
  type DayUncertainty,
} from "./methodology/bootstrap.js";
import { ecdfEligibility, ecdfZ } from "./methodology/ecdf.js";
import { computeTier } from "./methodology/tier.js";
import { computeConditionLevel } from "./methodology/condition-level.js";
// --- SBI v0.4 modules ---
import { windowedZ, sliceTrailing, spanYears, type HistPoint } from "./methodology/baseline-window.js";
import { KERN_CODES, klasse } from "./indicators/kern.js";
import { wMeting, wTrigger } from "./methodology/kern-weights.js";
import { compositeMeting, achtergrond, loadFactor, computeV04Tier, type ZLangMap } from "./methodology/kern-composite.js";
import {
  evaluateTriggers,
  EMPTY_TRIGGER_STATE,
  P70,
  P90,
  type TriggerState,
  type CoreTriggerInput,
} from "./methodology/triggers.js";

// 0.3.0 (2026-06-11, BLOK A): D6-kalendercontext uit het composiet (A6),
// hernormalisatie gewichten 1/6→1/5 + Schema-2 pro rata.
// 0.3.1 (2026-06-12): tier dagelijks reactief (SUSTAINED_DAYS 3→1, Peter GO) +
// I-D2-009 herdefinitie naar Infrabel-vertragingsgraad. Zie CHANGELOG.md.
// 0.3.2 (2026-06-12, B2/amendement §4.1.6): eCDF-normalisatie pre-geregistreerd
// met 3-jaarsgate (vandaag kwalificeert geen indicator: gedrag ongewijzigd);
// normalisatie expliciet "voorlopig" gelabeld tot de gate opent.
// 0.3.3 (2026-06-13, amendement §4.1.7, Peter GO): geharmoniseerde
// recency-vensters voor de v0.2 MAD-z-baseline — dagbronnen rollend 24
// maanden, maand-/jaarritmebronnen rollend 60 maanden; eCDF-pad ongewijzigd.
// 0.3.4 (2026-06-14, amendement §4.1.8, Peter GO): afvlakking — het gepubliceerde
// percentiel rust op het 7-daags trailing gemiddelde van het composiet (tegen de
// evenzo afgevlakte referentie); tier, bootstrap-band en referentie-audit volgen.
// Lost het whipsawen op (composiet had bijna geen persistentie). Ruw composiet
// blijft zichtbaar (composite.equal); v0.4-pad krijgt dezelfde behandeling bij
// zijn go-live.
// 0.3.5 (2026-06-17, amendement §4.1.9, Peter GO): additieve absolute economische
// stress-meting "vs normale tijden" (vaste 2010-2019 baseline, 100*Phi(zbar),
// economie-only) als apart `economic_pressure`-blok. Verandert NIETS aan het brede
// cijfer/percentiel/composiet; operationaliseert de in §6.1 pre-geregistreerde
// vaste baseline binnen zijn eerlijke datagrens. Zie methodology/economic-pressure.ts.
// 0.3.6 (2026-06-17, amendement §4.1.10, Peter GO): formele HERDEFINITIE van het
// publieke hoofdcijfer. De Index toont voortaan de absolute economische meting
// "vs normale tijden" (economic_pressure.score) als hoofdgetal i.p.v. het relatieve
// seizoenspercentiel. Reden: het relatieve percentiel leest misleidend laag omdat
// het tegen de zware crisisjaren 2024-2025 vergelijkt; de absolute meting toont
// eerlijk hoe verheven de economische druk is t.o.v. normale tijden. De engine-
// BEREKENING is ongewijzigd (composiet/percentiel blijven berekend en in de output
// voor transparantie); de wijziging zit in de gepubliceerde KOP + claim-mitigatie.
// 0.3.7 (2026-06-17, amendement §4.1.11, Peter GO): het hoofdcijfer verbreed van
// economie-only naar een BREDE absolute meting (economie + energie + weer), elk
// tegen zijn eigen 2010-2019-normaal. Weer (hitte/koude) en energie kregen via
// backfill een echte pre-2020-baseline met exact de live-fetcher-maat. Lost de
// 87-vs-19-incoherentie op: één coherent breed cijfer. Lucht/nieuws/Wikipedia
// blijven relatief (geen betrouwbare historische maat), eerlijke datagrens.
const METHODOLOGY_VERSION = "0.3.7";
const PIPELINE_VERSION = "0.2.0-mvp";

export interface DailyComputeInput {
  date: string; // ISO YYYY-MM-DD
  /** Ruwe waarden per indicator voor vandaag. Deterministische indicatoren
   *  worden anders door de engine zelf gevuld via computeAllDeterministic(). */
  rawValues?: Partial<Record<IndicatorCode, number>>;
  /** Historische archive voor Z-baseline + percentiel. */
  history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>>;
  /** Historische composiet-waarden (laatste 24m) voor percentile-rank. */
  compositeHistory: Array<{ date: string; value: number }>;
  /** Welke indicatoren komen uit demo/mock-data — eerlijk gerapporteerd. */
  simulatedIndicators?: IndicatorCode[];
  /** Indicatoren die imputed waren (LCF/interpolation). */
  imputedIndicators?: IndicatorCode[];
  /** Per indicator: datum/periode waar de data naar verwijst (uit pipeline). */
  observationDates?: Partial<Record<IndicatorCode, string>>;
  /** Secundaire signalen (Reddit e.d.) — passthrough, niet in composiet. */
  secondarySignals?: SecondarySignal[];
  /** Brand-safety override — typisch bij nationale rouw (doc 06 §7). */
  brandSafety?: { flag: "elevated" | "block"; reason: string; expires_estimated: string };
  // --- SBI v0.4 inputs (optioneel; ontbreken = lege/neutrale defaults) ---
  /**
   * Codes met een ECHTE historische baseline (geen synthetische fixture-vulling).
   * Alleen deze tellen mee in composite_meting en kunnen v0.4-triggers vuren —
   * een synthetische baseline (andere schaal/verdeling) zou valse z-scores en
   * valse triggers geven. Undefined = behandel alle meegegeven historie als echt
   * (zo werken directe engine-aanroepen en unit-tests).
   */
  realBaselineCodes?: IndicatorCode[];
  /** Vorige trigger-state (cooldown-bookkeeping uit data/trigger-state.json). */
  priorTriggerState?: TriggerState;
  /** Rollende historie van composite_meting — voedt v0.4-percentiel + tier. */
  compositeMetingHistory?: Array<{ date: string; value: number }>;
  /** Bevestigingssignalen voor de trigger-severity (reddit #8, ontslag-radar #7, emotie). */
  confirmationSignals?: { redditElevated?: boolean; layoffRadarElevated?: boolean; emotieElevated?: boolean };
  /** Emotie-spike-input (V6 2b): lading + percentiel binnen de eigen historie + #punten. */
  emotieSignal?: { value: number; percentileLang: number; nHistory: number };
  /** Huidige tijd (ISO) voor trigger fired_at/cooldown. Default: nu. */
  nowISO?: string;
  /**
   * B3 — bereken de bootstrap-onzekerheid rond het dagcijfer (≥2000 trekkingen).
   * Bewust opt-in: de warm-up-loops (generate-fixture-reconstructie, backtest)
   * roepen computeDaily honderden keren aan en zouden anders minutenlang
   * bootstrappen. De twee productie-dagschrijvers (generate-fixture vandaag,
   * compute-daily-bridge) zetten dit expliciet aan.
   */
  computeUncertainty?: boolean;
  /** Aantal bootstrap-trekkingen (default DEFAULT_BOOTSTRAP_DRAWS = 2000); tests verlagen dit. */
  bootstrapDraws?: number;
}

/**
 * Minimaal aantal historiepunten voor een betrouwbare v0.2-baseline-Z. Onder deze
 * drempel scoren we de indicator NIET: hij wordt uitgesloten uit het composiet en
 * krijgt state "ontbreekt" — i.p.v. een neutrale 0 die als "normaal" zou lezen
 * (review §0-bis.3: dataschaarste mag geen geruststelling tonen).
 *
 * NB: de v0.4-laag hanteert bewust een lagere drempel (MIN_POINTS_FOR_Z = 8 in
 * methodology/baseline-window.ts) omdat maandbronnen in een 18-maands venster
 * maar ~12–18 punten hebben; de "ontbreekt"-conventie is in beide lagen gelijk.
 */
const MIN_HISTORY_FOR_Z = 30;

/**
 * Amendement §4.1.7 (2026-06-13, Peter GO): geharmoniseerde recency-vensters
 * voor de v0.2 MAD-z-baseline. Vóór dit amendement woog elke indicator tegen
 * zijn VOLLEDIGE beschikbare historie (heterogeen: ~2 jaar voor dagbronnen
 * tot 30 jaar voor brandstof), waardoor "ongewoon" per indicator iets anders
 * betekende en z-groottes onderling slecht vergelijkbaar waren. Nu:
 *   • dagbronnen — rollend 24 maanden (dezelfde groundroot als het
 *     gepubliceerde 24m-seizoenspercentiel);
 *   • maand-/jaarritmebronnen — rollend 60 maanden (n ≈ 58-62 punten voor een
 *     stabiele MAD; een 24m-venster zou met n ≈ 24 onder MIN_HISTORY_FOR_Z
 *     duiken en die bronnen uit de index gooien; 60m is consistent met de
 *     pre-geregistreerde eCDF-drift-cap van 5 jaar, §4.1.6).
 * Het venster is voortschuivend en lookahead-veilig (sliceTrailing neemt
 * uitsluitend punten ≤ de rekendatum) en geldt ALLEEN voor het MAD-z-pad:
 * de eCDF-gate beoordeelt de volle historie (anders kan hij nooit openen).
 */
const Z_WINDOW_MONTHS_DAILY = 24;
const Z_WINDOW_MONTHS_SLOW = 60;
/** Bronnen met maand- of jaarritme-historie (doc 03 §2-§3; zelfde set als doc 04 §2.7). */
const SLOW_CADENCE_CODES: ReadonlySet<string> = new Set([
  "I-D2-001", // filezwaarte — jaarcijfer
  "I-D2-004", // brandstof — maandelijkse HICP-backfill, dagelijkse be.STAT sinds juni 2026
  "I-D3-001", // inflatie (CPI)
  "I-D3-003", // collectieve ontslagen
  "I-D3-005", // werkloosheid
  "I-D3-006", // hypotheekrente
  "I-D3-007", // consumentenvertrouwen
]);

export function computeDaily(input: DailyComputeInput): DailyOutput {
  // [1] EXTRACT — vul deterministische indicatoren altijd zelf in
  const today = new Date(input.date + "T12:00:00Z");
  const detValues = computeAllDeterministic(today);
  const raw: Partial<Record<IndicatorCode, number>> = { ...input.rawValues };
  for (const [code, value] of Object.entries(detValues)) {
    raw[code as IndicatorCode] = value;
  }

  // [2-3-4] Per indicator: STL → Z (short + fixed) → inverse-coding → winsorize
  const zShort: ZMap = {};
  const missing: IndicatorCode[] = [];
  // B3: de exacte (effectiveValue, baseline)-paren van de gescoorde indicatoren,
  // zodat de bootstrap dezelfde keten hertrekt als de hoofdberekening.
  const bootstrapInputs: BootstrapIndicatorInput[] = [];
  // B2: welke normalisatie elke gescoorde indicator vandaag kreeg (eerlijk
  // gelabeld in de breakdown; "voorlopig" zolang de eCDF-gate dicht is).
  const normalizationByCode: Partial<Record<IndicatorCode, "ecdf" | "mad_z">> = {};

  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    // Kalendercontext (A6): afgeleid uit de datum, geen meting — krijgt géén
    // z-score en telt niet mee in het composiet. NIET in `missing` (het is geen
    // datafalen); verschijnt apart in context_signals.
    if (meta.contextOnly) continue;
    const x = raw[code];
    if (x === undefined || !Number.isFinite(x)) {
      missing.push(code);
      continue;
    }

    // Geen ECHTE baseline: de reconstructie vult de historie van dunne indicatoren
    // synthetisch op (~730 punten), waardoor de MIN_HISTORY-check hieronder niet
    // grijpt en de indicator tegen VERZONNEN data wordt gescoord (bv. trein I-D2-009
    // met 6 echte punten → valse z). Sluit zulke codes uit i.p.v. ze het echte cijfer
    // te laten beïnvloeden (Peter: alles echt). De v0.4-laag doet dit al via
    // `baselineReal`; dit trekt de v0.2-laag gelijk. Deterministische indicatoren
    // (kalender, daglicht) zijn berekend en altijd geldig, dus uitgezonderd.
    if (!meta.deterministic && input.realBaselineCodes && !input.realBaselineCodes.includes(code)) {
      missing.push(code);
      continue;
    }

    // Volledige historie: alleen voor de eCDF-gate (die heeft ≥3 jaargangen
    // nodig en kent zijn eigen 5-jaars-drift-cap, §4.1.6).
    const histFull = input.history[code] ?? [];

    // B2 (amendement §4.1.6, methodologie 0.3.2): zodra de seizoensreferentie
    // van een indicator ≥3 jaargangen overspant én ≥90 punten telt (begrensd op
    // de recentste 5 jaar, drift-cap), schakelt die indicator over op
    // eCDF-normalisatie (CISS-methode; probit van het seizoensvenster-
    // percentiel). Geen STL hier: het seizoensvenster ís de seizoenscorrectie.
    // Op registratiedatum kwalificeert alleen I-D5-003 (3 jaar dagdata); de
    // rest blijft MAD-z met "voorlopig"-label tot de gate opent.
    const ecdf = ecdfEligibility(histFull, input.date);
    if (ecdf.eligible) {
      let z = ecdfZ(x, ecdf.reference);
      if (!Number.isFinite(z)) {
        missing.push(code);
        continue;
      }
      if (meta.inverseCoded) z = -z;
      zShort[code] = winsorize(z).value;
      normalizationByCode[code] = "ecdf";
      if (meta.grade !== "D") {
        bootstrapInputs.push({
          code,
          effectiveValue: x,
          baselineValues: ecdf.reference,
          inverseCoded: meta.inverseCoded,
          method: "ecdf",
        });
      }
      continue;
    }

    // §4.1.7: geharmoniseerd recency-venster voor de MAD-z-baseline
    // (dag 24m / maand-jaarritme 60m, rollend, lookahead-veilig).
    const hist = sliceTrailing(
      histFull,
      input.date,
      SLOW_CADENCE_CODES.has(code) ? Z_WINDOW_MONTHS_SLOW : Z_WINDOW_MONTHS_DAILY,
    );

    let effectiveValue = x;
    let baselineValues = hist.map((h) => h.value);
    if (meta.applyStl && hist.length > 0) {
      const stl = stlResidual(x, input.date, hist);
      if (stl.applied) {
        // STL toegepast: de dagwaarde is gedetrend (residu ~rond 0). De
        // baseline moet dan OOK uit gedetrende historiepunten komen —
        // anders weeg je een residu tegen een ruwe niveau-verdeling en
        // slaat de Z kunstmatig naar de winsor-limiet (-3).
        effectiveValue = stl.residual;
        baselineValues = hist
          .map((h) => stlResidual(h.value, h.date, hist))
          .filter((r) => r.applied)
          .map((r) => r.residual);
      }
    }

    if (baselineValues.length < MIN_HISTORY_FOR_Z) {
      // Onvoldoende historie voor een betrouwbare baseline → behandel als ontbrekend
      // (uitgesloten uit het composiet, state "ontbreekt"), NIET als neutrale 0 die
      // als "normaal" zou lezen (review §0-bis.3).
      // Adversariële review 13/6: de check staat op baselineValues (de verdeling
      // waar de z écht tegen weegt), niet op hist — na STL-filtering kan de
      // residuenset kleiner zijn dan de ruwe historie (punten zonder voorgaand
      // jaar binnen het venster kunnen niet gedetrend worden en vallen eruit).
      missing.push(code);
      continue;
    }

    const baseline = computeBaseline(baselineValues);
    let z = zscore(effectiveValue, baseline);
    if (!Number.isFinite(z)) {
      // Geen bruikbare schaal — de baseline heeft (bijna) geen variatie. Twee gevallen:
      // (a) de dagwaarde ligt OP of ONDER de mediaan → per definitie GEEN hoge
      //     uitschieter. Dat is geen datagebrek maar een gemeten "geen uitschieter"
      //     (bv. Kou: in Brussel zakt de temperatuur zelden onder −5°C, dus de
      //     koude-overschrijding is vrijwel altijd 0). Score z=0 → state "normaal"
      //     i.p.v. het alarmerend-ogende "ontbreekt". Cijfer-neutraal: z=0 levert geen
      //     bijdrage en de domeingewichten zijn vast (review §4.1 blijft gerespecteerd
      //     voor het écht-ambigue geval hieronder).
      // (b) de dagwaarde ligt BOVEN een platte baseline → geen schaal om te wegen hoe
      //     uitzonderlijk → blijf "ontbreekt" (geen stille geruststelling).
      if (!meta.inverseCoded && effectiveValue <= baseline.median) {
        z = 0;
      } else {
        missing.push(code);
        continue;
      }
    }
    if (meta.inverseCoded) z = -z;
    const { value } = winsorize(z);
    zShort[code] = value;
    normalizationByCode[code] = "mad_z";
    // Grade D (diagnostisch) wordt door computeComposite in élke trekking
    // overgeslagen: meenemen zou n_indicators overdrijven (21 i.p.v. de 20 die
    // het cijfer dragen) en ~5% van de trekkingen verspillen.
    if (meta.grade !== "D") {
      bootstrapInputs.push({
        code,
        effectiveValue,
        baselineValues,
        inverseCoded: meta.inverseCoded,
        method: "mad",
      });
    }
  }

  // [5] DECORRELATE — D5-monitor (doc 03 §4.4 stap 2)
  const d5Cross = compute7dCrossCorrelation(
    "I-D5-001",
    "I-D5-003",
    input.history,
  );

  // [6] AGGREGATE
  const equal = computeComposite(zShort, "equal");
  const evidence = computeComposite(zShort, "evidence");
  const withoutD5 = computeCompositeWithoutD5(zShort, "equal");

  // §4.1.8 — Afvlakking: het gepubliceerde cijfer is het 7-daags trailing
  // gemiddelde van het composiet (tegen de evenzo afgevlakte referentie), zodat
  // de barometer een traag evoluerende toestand toont i.p.v. dagruis. Het RUWE
  // composiet blijft in de output (transparantie). Zie methodology/smoothing.ts.
  const histValues = input.compositeHistory.map((h) => h.value);
  const { pastSum, count } = trailingPastSum(histValues, SMOOTHING_WINDOW_DAYS);
  const smoothedComposite = (pastSum + equal.composite) / count;
  const smoothedHistory = smoothTrailing(input.compositeHistory, SMOOTHING_WINDOW_DAYS);

  // B3 — echte bootstrap-onzekerheid rond het dagcijfer. Opt-in (zie
  // DailyComputeInput.computeUncertainty): de referentieset is exact dezelfde
  // (afgevlakte) als die van seasonalPercentile hieronder, en elke trekking
  // wordt met dezelfde trailing-afvlakking doorgerekend (§4.1.8).
  let uncertainty: DayUncertainty | undefined;
  if (input.computeUncertainty) {
    uncertainty = bootstrapDayUncertainty({
      indicators: bootstrapInputs,
      percentileReference: seasonalReferenceWithFallback(smoothedHistory, input.date),
      smoothing: { pastSum, count },
      nDraws: input.bootstrapDraws,
      seed: seedFromString(input.date),
    });
  }

  // Weegafhankelijkheids-diagnostiek (doc 05 §4 — informational, geen pass/fail).
  // bootstrap_95_ci_around_equal is sinds B3 een ECHTE resample-bootstrap (zelfde
  // trekkingen als het dag-CI); zonder computeUncertainty, en óók wanneer er geen
  // trekkingen waren (no_scored_indicators → composite_ci_95 null), blijft hij
  // eerlijk null + "not_computed" — geen veld dat een niet-uitgevoerde berekening
  // suggereert.
  const realCompositeCi = uncertainty?.composite_ci_95 ?? null;
  const weightSensitivity = {
    correlation_inverse_vs_equal_12w: null as number | null, // vereist 12w parallelle historie van beide gewichtschema's
    composite_range_with_dropouts: estimateDropoutRange(zShort),
    bootstrap_95_ci_around_equal: realCompositeCi,
    status: {
      correlation_inverse_vs_equal_12w: "not_computed" as const,
      ...(realCompositeCi ? {} : { bootstrap_95_ci_around_equal: "not_computed" as const }),
    },
  };

  // [7] SIGNAL — seizoens-bewust percentiel: vergelijk vandaag tegen dezelfde
  // periode van het jaar (± venster), niet tegen het hele 2-jaars-blok. Een
  // rustige junidag wordt zo tegen vroegere junidagen gewogen i.p.v. tegen winters
  // (eerlijker + minder cross-seizoen-grilligheid). Terugval op het volledige
  // venster bij te weinig seizoenspunten. Zie methodology/seasonal-percentile.ts.
  // Gepubliceerd cijfer: seizoenspercentiel van het AFGEVLAKTE composiet tegen
  // de afgevlakte referentie (§4.1.8). Het ruwe percentiel houden we apart voor
  // de media-diagnostiek hieronder (raw vs raw, like-for-like).
  const percShort = seasonalPercentile(smoothedComposite, input.date, smoothedHistory);
  const percShortRaw = seasonalPercentile(equal.composite, input.date, input.compositeHistory);

  // Automatische referentie-audit (Peter 14/6): reproduceer het gepubliceerde
  // percentiel uit zijn eigen (afgevlakte) referentie en weeg af of die
  // consistent, gezond en niet overgevoelig is. Draait elke cyclus; de canary
  // (healthcheck.py) leest het verdict. Zie methodology/reference-audit.ts.
  const referenceAudit: ReferenceAudit = auditReferenceConsistency(
    smoothedComposite,
    input.date,
    smoothedHistory,
    Math.round(percShort),
    METHODOLOGY_VERSION,
  );

  // Tier-logica vereist een geschiedenis van (seizoens-)percentielen, lookahead-vrij;
  // op het AFGEVLAKTE composiet, zodat ook de tier/campagne niet op dagruis flipt.
  const percentileHistory = buildSeasonalPercentileHistory(smoothedHistory, {
    date: input.date,
    value: smoothedComposite,
  });
  const tierResult = computeTier(percentileHistory);

  // Tier history 30d (asymmetrisch, geen kortere lookback)
  const tierHistory30d: Tier[] = tierResult.tierHistory.slice(-30);

  // Top 3 domains
  const topThree = equal.domainContributions.slice(0, 3);

  // Conditie-Niveau (CN) — publieke 5-bands-schaal afgeleid van tier + percentile + brand-safety
  const brandSafetyFlag = input.brandSafety?.flag ?? "normal";
  const cn = computeConditionLevel(tierResult.tier, percShort, brandSafetyFlag);

  // Per-indicator publieksvriendelijke breakdown — alle gemeten indicatoren uit de
  // registry (kalendercontext uitgezonderd: die staat in context_signals, A6).
  const indicatorBreakdown: IndicatorBreakdown[] = INDICATOR_CODES
    .filter((code) => !INDICATORS[code].contextOnly)
    .map((code) => {
    const meta = INDICATORS[code];
    const plain = PLAIN[code];
    const z = zShort[code];
    const rawValue = raw[code] ?? null;
    const isMissing = z === undefined;
    // Grade D = experimentele proxy → telt niet mee in het cijfer (review §3), dus
    // ook géén contributie in de breakdown/top-3 (consistent met computeComposite).
    const isDiagnostic = meta.grade === "D";
    const contribution = isMissing || isDiagnostic
      ? 0
      : indicatorWeight("equal", code, meta.domain) * domainWeight("equal", meta.domain) * (z as number);
    return {
      code,
      domain: meta.domain,
      grade: meta.grade,
      evidence_note: plain.evidenceNote,
      normalization: normalizationByCode[code],
      plain_name: plain.plain,
      why: plain.why,
      reads: plain.reads,
      unit: plain.unit,
      raw_value: rawValue,
      z_short: isMissing ? null : (z as number),
      contribution,
      state: isMissing ? "ontbreekt" : zToState(z as number),
      source: meta.source,
      simulated: (input.simulatedIndicators ?? []).includes(code),
      imputed: (input.imputedIndicators ?? []).includes(code),
      inverseCoded: meta.inverseCoded,
      data_source: plain.dataSource,
      references: plain.references,
      observation_date:
        input.observationDates?.[code] ?? (meta.deterministic ? input.date : input.date),
      demographic_reach: DEMOGRAPHIC_REACH[code].reach,
      reach_rationale: DEMOGRAPHIC_REACH[code].rationale,
    };
  });

  // A7: gewogen demo-aandeel van het cijfer (voor data_quality + demo-banner).
  const demoFraction = computeDemoFraction(zShort, input.simulatedIndicators ?? []);

  // Kalendercontext (A6): de D6-signalen als context — zonder z-score of state.
  // De ruwe waarde komt uit computeAllDeterministic (altijd geldig, geen meting).
  const contextSignals: ContextSignal[] = contextIndicators().map((meta) => {
    const plain = PLAIN[meta.code];
    return {
      code: meta.code,
      name: meta.name,
      plain_name: plain.plain,
      raw_value: Math.round((raw[meta.code] ?? 0) * 1000) / 1000,
      unit: plain.unit,
      reads: plain.reads,
      why: plain.why,
      grade: meta.grade,
      evidence_note: plain.evidenceNote,
      source: meta.source,
      observation_date: input.date,
      data_source: plain.dataSource,
      references: plain.references,
    };
  });

  // --- SBI v0.4 — meet- + trigger-laag (additief; v0.2-output blijft ongemoeid) ---
  const nowISO = input.nowISO ?? new Date().toISOString();
  const v04 = computeV04({
    date: input.date,
    raw,
    history: input.history,
    simulated: input.simulatedIndicators ?? [],
    realBaselineCodes: input.realBaselineCodes,
    observationDates: input.observationDates,
    compositeMetingHistory: input.compositeMetingHistory ?? [],
    brandSafetyFlag,
    confirmation: input.confirmationSignals ?? {},
    emotieSignal: input.emotieSignal,
    priorTriggerState: input.priorTriggerState ?? EMPTY_TRIGGER_STATE,
    nowISO,
    computeUncertainty: input.computeUncertainty,
    bootstrapDraws: input.bootstrapDraws,
  });

  return {
    timestamp: new Date().toISOString(),
    week_iso: isoWeek(input.date),
    condition_level: {
      value: cn.level,
      name: cn.name,
      banner_active: cn.bannerActive,
      copy_key: cn.copyKey,
    },
    composite: {
      equal: round2(equal.composite),
      // §4.1.8: het 7-daags afgevlakte composiet dat het percentiel voedt
      // (transparant naast het ruwe dagcomposiet).
      equal_smoothed: round2(smoothedComposite),
      evidence_graded: round2(evidence.composite),
      demographic: round2(computeDemographicComposite(zShort)),
      weight_sensitivity: {
        correlation_inverse_vs_equal_12w: weightSensitivity.correlation_inverse_vs_equal_12w,
        composite_range_with_dropouts: [
          round2(weightSensitivity.composite_range_with_dropouts[0]),
          round2(weightSensitivity.composite_range_with_dropouts[1]),
        ],
        bootstrap_95_ci_around_equal: weightSensitivity.bootstrap_95_ci_around_equal,
        status: weightSensitivity.status,
      },
    },
    percentile: {
      short_24m: Math.round(percShort),
      // §4.1.8: het venster waarover het composiet is afgevlakt vóór dit
      // percentiel (transparant; 0/afwezig zou "ruw" betekenen).
      smoothing_window_days: SMOOTHING_WINDOW_DAYS,
      // Niet berekend: het BREDE composiet kan niet tegen een vaste 2010-2019
      // baseline (de meeste indicatoren bestaan pas sinds 2024). Blijft eerlijk
      // null/not_computed (review §0-bis.1). De economie-ONLY variant "vs normale
      // tijden" leeft apart in output.economic_pressure (amendement §4.1.9).
      fixed_2010_2019: null,
      fixed_2010_2019_status: "not_computed",
      // B2: eerlijk "voorlopig" zolang niet elke gescoorde indicator de
      // eCDF-gate (≥3 jaar seizoenshistorie) gehaald heeft.
      normalization_provisional: Object.values(normalizationByCode).some((m) => m === "mad_z"),
      ecdf_active: INDICATOR_CODES.filter((c) => normalizationByCode[c] === "ecdf"),
    },
    // Automatische consistentie-/plausibiliteitscontrole van het dagpercentiel
    // (Peter 14/6); de canary alarmeert bij "critical".
    reference_audit: referenceAudit,
    // B3: alleen aanwezig als de bootstrap echt gedraaid heeft (opt-in) — een
    // afwezig veld is eerlijker dan een verzonnen interval.
    ...(uncertainty ? { uncertainty } : {}),
    // Absolute economische stress-meting "vs normale tijden" (2010-2019),
    // amendement §4.1.9. Behouden voor transparantie (economie-only sub-view).
    economic_pressure: computeEconomicPressure(input.history, input.date),
    // BREDE absolute meting (§4.1.11): economie + energie + weer, elk vs zijn eigen
    // 2010-2019-normaal. Sinds 0.3.7 het publieke hoofdcijfer (frontend leest
    // broad_pressure.score). Zie methodology/economic-pressure.ts.
    broad_pressure: computeBroadPressure(input.history, input.date),
    tier: {
      current: tierResult.tier,
      days_in_tier: tierResult.daysInTier,
      tier_history_30d: tierHistory30d,
    },
    top_contributing_domains: topThree.map((c) => ({
      domain: c.domain,
      contribution: round2(c.contribution),
    })),
    indicator_breakdown: indicatorBreakdown.map((b) => ({
      ...b,
      raw_value: b.raw_value === null ? null : Math.round(b.raw_value * 1000) / 1000,
      z_short: b.z_short === null ? null : Math.round(b.z_short * 100) / 100,
      contribution: round2(b.contribution),
    })),
    secondary_signals: (input.secondarySignals ?? []).map((s) => ({
      ...s,
      value: Math.round(s.value * 1000) / 1000,
    })),
    context_signals: contextSignals,
    media_cluster_diagnostic: {
      d5_cross_correlation_7d: round2(d5Cross),
      composite_without_d5: round2(withoutD5),
      // Like-for-like op de RUWE basis (withoutD5 heeft geen eigen afgevlakte
      // historie): raw percentiel zónder D5 vs raw percentiel mét D5.
      media_contribution_percentile_points: Math.abs(
        Math.round(seasonalPercentile(withoutD5, input.date, input.compositeHistory) - percShortRaw),
      ),
    },
    brand_safety: input.brandSafety
      ? {
          flag: input.brandSafety.flag,
          reason: input.brandSafety.reason,
          expires_estimated: input.brandSafety.expires_estimated,
        }
      : { flag: "normal", reason: null, expires_estimated: null },
    data_quality: {
      indicators_with_imputed_data: input.imputedIndicators ?? [],
      indicators_missing: missing,
      indicators_simulated: input.simulatedIndicators ?? [],
      // A7: gewogen demo-aandeel in het cijfer + label. Het label wordt op de
      // ONafgeronde fractie bepaald (geen flapperen rond de drempel door round2).
      demo_fraction: round2(demoFraction),
      score_label: demoFraction >= DEMO_FRACTION_THRESHOLD ? "demo" : "echt",
      pipeline_version: PIPELINE_VERSION,
      methodology_version: METHODOLOGY_VERSION,
      implementation_stage: "minimum_viable_pipeline",
    },
    v04,
  };
}

// --- helpers ---

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function isoWeek(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00Z");
  const target = new Date(d.valueOf());
  const day = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function compute7dCrossCorrelation(
  codeA: IndicatorCode,
  codeB: IndicatorCode,
  history: DailyComputeInput["history"],
): number {
  const a = history[codeA]?.slice(-7).map((h) => h.value) ?? [];
  const b = history[codeB]?.slice(-7).map((h) => h.value) ?? [];
  if (a.length < 3 || b.length < 3 || a.length !== b.length) return 0;
  return pearsonCorrelation(a, b);
}

/** Drempel waarboven de hele dagscore als "demo" gelabeld wordt (A7). */
export const DEMO_FRACTION_THRESHOLD = 0.3;

/**
 * Gewogen demo-aandeel ÍN het cijfer (A7): het aandeel van het equal-gewicht dat
 * uit gesimuleerde indicatoren komt, genormaliseerd over de indicatoren die
 * werkelijk meetellen (z aanwezig, grade ≠ D, geen kalendercontext) — gespiegeld
 * aan de uitsluitingen van computeComposite. Een simulated indicator die niet
 * scoort (missing) beïnvloedt het cijfer niet en telt dus bewust niet mee.
 * Keerzijde, ook bewust: op een dag waarop bijna alles ontbreekt en één
 * simulated indicator wél scoort, is de fractie hoog — het cijfer ís dan
 * vooral demo.
 */
export function computeDemoFraction(z: ZMap, simulated: IndicatorCode[]): number {
  let counted = 0;
  let demo = 0;
  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    if (z[code] === undefined) continue;
    if (meta.grade === "D") continue;
    if (meta.contextOnly) continue;
    const w = indicatorWeight("equal", code, meta.domain) * domainWeight("equal", meta.domain);
    counted += w;
    if (simulated.includes(code)) demo += w;
  }
  return counted > 0 ? demo / counted : 0;
}

function estimateDropoutRange(z: ZMap): [number, number] {
  // Bereken composiet met telkens één gescoord domein weggelaten — neem min/max
  const composites: number[] = [];
  for (const domain of scoredDomains()) {
    const withoutDomain: ZMap = { ...z };
    for (const code of INDICATOR_CODES) {
      if (INDICATORS[code].domain === domain) delete withoutDomain[code];
    }
    composites.push(computeComposite(withoutDomain, "equal").composite);
  }
  return [Math.min(...composites), Math.max(...composites)];
}

export function buildPercentileHistory(
  compositeHistory: Array<{ date: string; value: number }>,
  todaysComposite: number,
): number[] {
  // Lookahead-vrij: het percentiel op dag t weegt UITSLUITEND tegen punten t/m t
  // (geen toekomst). Zo is elke dag identiek aan wat op dat moment berekenbaar was —
  // cruciaal voor een eerlijke tier-historie én de "lookahead-vrij"-claim van de
  // backtest (review §0-bis.2). compositeHistory bevat hier al enkel het verleden.
  const values = [...compositeHistory.map((h) => h.value), todaysComposite];
  return values.map((v, i) => percentileRank(v, values.slice(0, i + 1)));
}

// ===================================================================
// SBI v0.4 — meet- + trigger-laag
// ===================================================================

const KORT_MAANDEN = 18;
const LANG_MAANDEN = 120;
/** Wikipedia (#4) z_kort-drempel om als bevestiging van een nieuws-spike te tellen. */
const CONFIRM_Z = 1.0;

interface ComputeV04Params {
  date: string;
  raw: Partial<Record<IndicatorCode, number>>;
  history: DailyComputeInput["history"];
  simulated: IndicatorCode[];
  realBaselineCodes?: IndicatorCode[];
  observationDates?: Partial<Record<IndicatorCode, string>>;
  compositeMetingHistory: Array<{ date: string; value: number }>;
  brandSafetyFlag: BrandSafety;
  confirmation: { redditElevated?: boolean; layoffRadarElevated?: boolean; emotieElevated?: boolean };
  emotieSignal?: { value: number; percentileLang: number; nHistory: number };
  priorTriggerState: TriggerState;
  nowISO: string;
  /** B3 voor de v0.4-laag: bereken het bootstrap-CI rond percentile.lang (opt-in, ~kost). */
  computeUncertainty?: boolean;
  bootstrapDraws?: number;
}

/**
 * Bouwt het volledige v0.4-blok: per kern-indicator de dubbele baseline
 * (z_kort/z_lang/delta_1d/percentile_lang), het meet-composiet + achtergrond +
 * load_factor, en de trigger-evaluatie. Puur t.o.v. de gegeven inputs.
 */
function computeV04(p: ComputeV04Params): V04Output {
  const zLangMap: ZLangMap = {};
  const kernBreakdown: KernBreakdown[] = [];
  const perCore: CoreTriggerInput[] = [];
  // B3-v0.4: de exacte (effectiveValue, lange-baseline)-paren van de gescoorde
  // kern-codes, zodat de bootstrap dezelfde z_lang-keten hertrekt als
  // compositeMeting. Alleen gevuld bij computeUncertainty (kost ~seconden).
  const v04BootstrapInputs: BootstrapIndicatorInput[] = [];
  let wikiZkort = 0;

  for (const code of KERN_CODES) {
    const meta = INDICATORS[code];
    const plain = PLAIN[code];
    const series = sortByDate(p.history[code] ?? []);
    const rawToday = p.raw[code];
    const hasToday = rawToday !== undefined && Number.isFinite(rawToday);
    // Alleen codes met een ECHTE baseline tellen mee; synthetische fixture-historie
    // (andere schaal/verdeling) zou valse z-scores en valse triggers opleveren.
    const baselineReal = !p.realBaselineCodes || p.realBaselineCodes.includes(code);

    if (!hasToday || !baselineReal) {
      // Geen dagwaarde óf geen echte baseline → telt niet mee in composiet/triggers.
      const longSlice = sliceTrailing(series, p.date, LANG_MAANDEN);
      kernBreakdown.push({
        code,
        domain: meta.domain,
        plain_name: plain.plain,
        class: klasse(code),
        raw_value: hasToday ? round3(rawToday as number) : null,
        z_kort: null,
        z_lang: null,
        delta_1d: null,
        percentile_lang: null,
        baseline_lang_jaren: baselineReal ? Math.round(spanYears(longSlice)) : 0,
        state: "ontbreekt",
        w_meting: round3(wMeting(code)),
        w_trigger: round3(wTrigger(code)),
        contribution_meting: 0,
        simulated: p.simulated.includes(code) || !baselineReal,
        observation_date: p.observationDates?.[code] ?? p.date,
        data_source: plain.dataSource,
      });
      continue;
    }

    const value = rawToday as number;
    const merged = mergeToday(series, p.date, value);
    // STL-seizoenscorrectie alleen op het LANGE venster (meer data per kalendermoment,
    // §2). Het korte venster (~18m) heeft toch zelden ≥3 cycli en stuurt vooral spikes.
    const zl = windowedZ(value, merged, p.date, LANG_MAANDEN, meta);
    const zk = windowedZ(value, merged, p.date, KORT_MAANDEN, { applyStl: false });

    // Geen geldige lange-baseline-z → "ontbreekt", conform de v0.2-conventie
    // (MIN_HISTORY_FOR_Z): dataschaarste mag niet als z=0 ("normaal") in het
    // composiet lekken en het cijfer verdunnen. Eén uitzondering, gespiegeld aan
    // de v0.2-nuance in de z-loop hierboven: een vlakke baseline ("no_scale") met
    // een dagwaarde op of onder de mediaan is een gemeten "geen uitschieter"
    // (bv. koude-overschrijding 0 in de zomer) → z_lang = 0, state "normaal".
    // De 9 kern-codes zijn alle non-inverse, dus de inverse-tak vervalt hier.
    if (!zl.applied) {
      const flatNoOutlier =
        zl.reason === "no_scale" &&
        zl.distribution.length > 0 &&
        zl.effectiveValue <= computeBaseline(zl.distribution).median;
      if (!flatNoOutlier) {
        // NIET in zLangMap (composiet hernormaliseert over aanwezige codes) en
        // NIET in perCore (een schaarse code mag ook geen T1/T2-trigger voeden).
        kernBreakdown.push({
          code,
          domain: meta.domain,
          plain_name: plain.plain,
          class: klasse(code),
          raw_value: round3(value),
          z_kort: null,
          z_lang: null,
          delta_1d: null,
          percentile_lang: null,
          baseline_lang_jaren: Math.round(zl.jaren),
          state: "ontbreekt",
          w_meting: round3(wMeting(code)),
          w_trigger: round3(wTrigger(code)),
          contribution_meting: 0,
          simulated: p.simulated.includes(code),
          observation_date: p.observationDates?.[code] ?? p.date,
          data_source: plain.dataSource,
        });
        continue;
      }
    }

    // delta_1d = z_kort(t) − z_kort(t−1), op dezelfde korte baseline.
    let delta1d = 0;
    const prev = lastBefore(series, p.date);
    if (prev && zk.applied) {
      const zkPrev = windowedZ(prev.value, merged, prev.date, KORT_MAANDEN, { applyStl: false });
      if (zkPrev.applied) delta1d = zk.z - zkPrev.z;
    }

    // Na de guard hierboven: zl.applied, óf het vlakke-baseline-"geen uitschieter"-
    // geval (waar zl.z al 0 is). zl.z is hier dus altijd een gemeten waarde.
    const zLang = zl.z;
    const zKort = zk.applied ? zk.z : 0;
    const pctLang =
      zl.applied && zl.distribution.length > 0 ? percentileRank(zl.effectiveValue, zl.distribution) : 0;

    zLangMap[code] = zLang;
    // Spiegel exact de z_lang-keten in de bootstrap: hertrek zl.distribution
    // (de lange-venster-verdeling, residuen bij STL) en herscoor zl.effectiveValue.
    // Kern-codes zijn alle non-inverse en MAD (geen eCDF op het v0.4-pad).
    if (p.computeUncertainty) {
      v04BootstrapInputs.push({
        code,
        effectiveValue: zl.effectiveValue,
        baselineValues: zl.distribution,
        inverseCoded: false,
        method: "mad",
      });
    }
    if (code === "I-D5-002") wikiZkort = zKort;

    const wm = wMeting(code);
    const state: KernBreakdown["state"] = pctLang >= P90 ? "rood" : pctLang >= P70 ? "verhoogd" : "normaal";

    kernBreakdown.push({
      code,
      domain: meta.domain,
      plain_name: plain.plain,
      class: klasse(code),
      raw_value: round3(value),
      z_kort: round2(zKort),
      z_lang: round2(zLang),
      delta_1d: round2(delta1d),
      // Vlakke-baseline-geval (no_scale op mediaan): er ís geen percentiel
      // berekend — publiceer null, geen 0 die "laagste ooit" suggereert.
      percentile_lang: zl.applied ? Math.round(pctLang) : null,
      baseline_lang_jaren: Math.round(zl.jaren),
      state,
      w_meting: round3(wm),
      w_trigger: round3(wTrigger(code)),
      contribution_meting: round2(wm * zLang),
      simulated: p.simulated.includes(code),
      observation_date: p.observationDates?.[code] ?? p.date,
      data_source: plain.dataSource,
    });

    perCore.push({
      code,
      domain: meta.domain,
      plain_name: plain.plain,
      klasse: klasse(code),
      z_kort: zKort,
      z_lang: zLang,
      delta_1d: delta1d,
      percentile_lang: pctLang,
    });
  }

  const compMeting = compositeMeting(zLangMap);
  const achterg = achtergrond(zLangMap);
  const lf = loadFactor(achterg);

  // Percentiel van composite_meting binnen zijn rollende historie (lang + kort venster).
  const metingDist = p.compositeMetingHistory.map((h) => h.value);
  const pctMetingLang =
    metingDist.length > 0 ? percentileRank(compMeting, [...metingDist, compMeting]) : 50;
  const kortDist = sliceTrailing(p.compositeMetingHistory as HistPoint[], p.date, KORT_MAANDEN).map(
    (h) => h.value,
  );
  const pctMetingKort =
    kortDist.length > 0 ? percentileRank(compMeting, [...kortDist, compMeting]) : pctMetingLang;

  // v0.4-tier uit de percentiel-historie van composite_meting (eigen snelle regel).
  const metingPercHist = buildPercentileHistory(p.compositeMetingHistory, compMeting);
  const v04Tier = computeV04Tier(metingPercHist);

  // B3-v0.4: bootstrap-CI rond percentile.lang. Aggregeert met compositeMeting
  // (kern-gewichten, NIET equal) tegen exact dezelfde referentie als de
  // gepubliceerde lang-score, zodat band en getal op dezelfde maat staan. Eigen
  // seed-suffix zodat de v0.4-trekkingen niet correleren met de v0.2-bootstrap.
  let uncertainty: DayUncertainty | undefined;
  if (p.computeUncertainty) {
    uncertainty = bootstrapDayUncertainty({
      indicators: v04BootstrapInputs,
      percentileReference: metingDist,
      aggregate: compositeMeting,
      nDraws: p.bootstrapDraws,
      seed: seedFromString(p.date + ":v04"),
    });
  }

  // Bevestigingssignalen voor de trigger-severity (§4 rem B; reddit nooit zelfstandig).
  const confirmedBy: string[] = [];
  if (wikiZkort >= CONFIRM_Z) confirmedBy.push("I-D5-002");
  if (p.confirmation.redditElevated) confirmedBy.push("I-D5-006S");
  if (p.confirmation.layoffRadarElevated) confirmedBy.push("I-D3-003S");
  if (p.confirmation.emotieElevated) confirmedBy.push("I-D5-emotie");

  const trig = evaluateTriggers({
    perCore,
    compositeMeting: compMeting,
    compositePercentileLang: pctMetingLang,
    loadFactor: lf,
    brandSafetyFlag: p.brandSafetyFlag,
    confirmedBy,
    emotie: p.emotieSignal,
    priorState: p.priorTriggerState,
    nowISO: p.nowISO,
  });

  return {
    schema_version: "0.4.0",
    mode: trig.mode,
    composite: {
      meting: round2(compMeting),
      achtergrond: round2(achterg),
      load_factor: round2(lf),
    },
    baseline: {
      kort_maanden: KORT_MAANDEN,
      lang_maanden_target: LANG_MAANDEN,
      lang_rolling: true,
      laatste_herijking: null,
    },
    percentile: {
      lang: Math.round(pctMetingLang),
      kort: Math.round(pctMetingKort),
      fixed_2010_2019: null,
    },
    tier: { current: v04Tier.tier, days_in_tier: v04Tier.daysInTier },
    kern_breakdown: kernBreakdown,
    triggers: trig.triggers,
    trigger_state: trig.newState,
    ...(uncertainty ? { uncertainty } : {}),
  };
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

function sortByDate<T extends { date: string }>(series: T[]): T[] {
  return [...series].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function mergeToday(
  series: Array<{ date: string; value: number }>,
  date: string,
  value: number,
): Array<{ date: string; value: number }> {
  const without = series.filter((pt) => pt.date !== date);
  without.push({ date, value });
  return sortByDate(without);
}

function lastBefore(
  series: Array<{ date: string; value: number }>,
  date: string,
): { date: string; value: number } | null {
  let best: { date: string; value: number } | null = null;
  for (const pt of series) {
    if (pt.date < date && (best === null || pt.date > best.date)) best = pt;
  }
  return best;
}
