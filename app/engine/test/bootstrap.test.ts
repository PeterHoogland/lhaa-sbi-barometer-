/**
 * B3 — bootstrap-CI rond het dagcijfer (02_VERBETERPLAN BLOK B).
 * Pint: determinisme (geseed), flag-drempels, eerlijke "high" bij dunne
 * referentie of nul indicatoren, en de runtime-integratie (opt-in veld,
 * bootstrap_95_ci_around_equal alleen echt gevuld als er echt gebootstrapt is).
 */

import { describe, it, expect } from "vitest";
import {
  bootstrapDayUncertainty,
  classifyUncertainty,
  seedFromString,
  mulberry32,
  computeDaily,
  MIN_RELIABLE_REFERENCE,
  type BootstrapIndicatorInput,
} from "../src/index.js";

/** Deterministische pseudo-baseline (geen Math.random: tests blijven reproduceerbaar). */
function syntheticBaseline(n: number, center: number, spread: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    // som van 3 uniforme trekkingen ≈ klokvormig, voldoende voor MAD-stabiliteit
    out.push(center + spread * (rng() + rng() + rng() - 1.5));
  }
  return out;
}

function indicatorInput(
  code: string,
  value: number,
  baseline: number[],
  inverse = false,
): BootstrapIndicatorInput {
  return {
    code: code as BootstrapIndicatorInput["code"],
    effectiveValue: value,
    baselineValues: baseline,
    inverseCoded: inverse,
  };
}

const WIDE_REFERENCE = syntheticBaseline(200, 0, 1.2, 42); // composiet-referentie ~N(0, …)

describe("classifyUncertainty (B3-drempels)", () => {
  it("low onder 0.10, medium tot en met 0.20, high erboven", () => {
    expect(classifyUncertainty(0.099)).toBe("low");
    expect(classifyUncertainty(0.1)).toBe("medium");
    expect(classifyUncertainty(0.2)).toBe("medium");
    expect(classifyUncertainty(0.201)).toBe("high");
  });
});

describe("bootstrapDayUncertainty", () => {
  const indicators = [
    indicatorInput("I-D1-002", 1.5, syntheticBaseline(400, 1.0, 0.8, 7)),
    indicatorInput("I-D3-002", 80, syntheticBaseline(400, 78, 10, 11)),
    indicatorInput("I-D5-001", -2.1, syntheticBaseline(400, -2.5, 0.9, 13)),
  ];

  it("is deterministisch: zelfde seed = identiek resultaat", () => {
    const a = bootstrapDayUncertainty({
      indicators,
      percentileReference: WIDE_REFERENCE,
      nDraws: 300,
      seed: seedFromString("2026-06-12"),
    });
    const b = bootstrapDayUncertainty({
      indicators,
      percentileReference: WIDE_REFERENCE,
      nDraws: 300,
      seed: seedFromString("2026-06-12"),
    });
    expect(a).toEqual(b);
  });

  it("geeft een geldig, geordend interval met n_draws en flag", () => {
    const r = bootstrapDayUncertainty({
      indicators,
      percentileReference: WIDE_REFERENCE,
      nDraws: 500,
      seed: 1234,
    });
    expect(r.n_draws).toBe(500);
    expect(r.n_indicators).toBe(3);
    expect(r.ci_90_lower).toBeLessThanOrEqual(r.ci_90_upper);
    expect(r.ci_90_lower).toBeGreaterThanOrEqual(0);
    expect(r.ci_90_upper).toBeLessThanOrEqual(100);
    // Reviewfix: flag en width_fraction volgen exact uit de GEPUBLICEERDE
    // (afgeronde) grenzen — een lezer van latest.json reproduceert de vlag.
    expect(r.width_fraction).toBe(
      Math.round(((r.ci_90_upper - r.ci_90_lower) / 100) * 1000) / 1000,
    );
    expect(r.flag_reason).toBe("ci_width");
    expect(r.uncertainty_flag).toBe(classifyUncertainty(r.width_fraction));
    expect(r.composite_ci_95).not.toBeNull();
    expect(r.composite_ci_95![0]).toBeLessThanOrEqual(r.composite_ci_95![1]);
  });

  it("ongeldige nDraws (0, negatief, NaN) vallen terug op de default i.p.v. NaN-kwantielen", () => {
    for (const bad of [0, -5, Number.NaN]) {
      const r = bootstrapDayUncertainty({
        indicators: [indicators[0]],
        percentileReference: WIDE_REFERENCE,
        nDraws: bad,
        seed: 9,
      });
      expect(r.n_draws).toBe(2000);
      expect(Number.isFinite(r.ci_90_lower)).toBe(true);
      expect(Number.isFinite(r.ci_90_upper)).toBe(true);
    }
  });

  it("dunne percentiel-referentie (< MIN_RELIABLE_REFERENCE) = eerlijk high", () => {
    const r = bootstrapDayUncertainty({
      indicators,
      percentileReference: WIDE_REFERENCE.slice(0, MIN_RELIABLE_REFERENCE - 1),
      nDraws: 200,
      seed: 99,
    });
    expect(r.uncertainty_flag).toBe("high");
    expect(r.flag_reason).toBe("thin_reference");
  });

  it("nul gescoorde indicatoren = high met volledig bereik, geen schijnzekerheid", () => {
    const r = bootstrapDayUncertainty({
      indicators: [],
      percentileReference: WIDE_REFERENCE,
      nDraws: 200,
      seed: 5,
    });
    expect(r.uncertainty_flag).toBe("high");
    expect(r.flag_reason).toBe("no_scored_indicators");
    expect(r.ci_90_lower).toBe(0);
    expect(r.ci_90_upper).toBe(100);
    expect(r.n_draws).toBe(0);
    // Reviewfix: geen trekkingen = geen composiet-CI (placeholder-regel) —
    // [0,0] zou als echt gebootstrapt veld doorstromen naar weight_sensitivity.
    expect(r.composite_ci_95).toBeNull();
  });

  it("vlakke baseline met dagwaarde op de mediaan crasht niet (z=0-pad)", () => {
    const flat = indicatorInput("I-D1-003", 0, new Array(120).fill(0));
    const r = bootstrapDayUncertainty({
      indicators: [flat, ...indicators],
      percentileReference: WIDE_REFERENCE,
      nDraws: 200,
      seed: 7,
    });
    expect(Number.isFinite(r.ci_90_lower)).toBe(true);
    expect(Number.isFinite(r.ci_90_upper)).toBe(true);
  });

  it("strakke baselines + ruime referentie geven een smaller interval dan grillige baselines", () => {
    const tight = [
      indicatorInput("I-D1-002", 1.0, syntheticBaseline(700, 1.0, 0.2, 21)),
      indicatorInput("I-D3-002", 78, syntheticBaseline(700, 78, 1.0, 22)),
    ];
    const noisy = [
      indicatorInput("I-D1-002", 1.0, syntheticBaseline(40, 1.0, 3.0, 23)),
      indicatorInput("I-D3-002", 78, syntheticBaseline(40, 78, 25, 24)),
    ];
    const rTight = bootstrapDayUncertainty({
      indicators: tight, percentileReference: WIDE_REFERENCE, nDraws: 400, seed: 31,
    });
    const rNoisy = bootstrapDayUncertainty({
      indicators: noisy, percentileReference: WIDE_REFERENCE, nDraws: 400, seed: 31,
    });
    expect(rTight.width_fraction).toBeLessThan(rNoisy.width_fraction);
  });
});

describe("runtime-integratie (opt-in)", () => {
  // Voldoende historie voor I-D1-002 (hitte, applyStl) is omslachtig; daglicht
  // en kalenderindicatoren zijn deterministisch en hebben geen historie nodig.
  // We bouwen historie voor één niet-STL-indicator (I-D3-006 hypotheekrente).
  function dateNDaysAgo(n: number, from: string): string {
    const d = new Date(from + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  }
  const TODAY = "2026-06-12";
  const rng = mulberry32(77);
  const hist = Array.from({ length: 120 }, (_, i) => ({
    date: dateNDaysAgo(120 - i, TODAY),
    value: 3 + rng(),
  }));
  const compositeHistory = Array.from({ length: 120 }, (_, i) => ({
    date: dateNDaysAgo(120 - i, TODAY),
    value: (rng() - 0.5) * 2,
  }));

  it("computeUncertainty: true levert uncertainty + echt gevulde bootstrap_95_ci", () => {
    const out = computeDaily({
      date: TODAY,
      rawValues: { "I-D3-006": 3.6 },
      history: { "I-D3-006": hist },
      compositeHistory,
      computeUncertainty: true,
      bootstrapDraws: 200,
    });
    expect(out.uncertainty).toBeDefined();
    expect(out.uncertainty!.n_draws).toBe(200);
    expect(out.composite.weight_sensitivity.bootstrap_95_ci_around_equal).not.toBeNull();
    expect(
      out.composite.weight_sensitivity.status?.bootstrap_95_ci_around_equal,
    ).toBeUndefined();
  });

  it("grade D (I-D3-003) telt niet mee in n_indicators: hij draagt het cijfer niet", () => {
    const out = computeDaily({
      date: TODAY,
      rawValues: { "I-D3-006": 3.6, "I-D3-003": 3.4 },
      history: { "I-D3-006": hist, "I-D3-003": hist },
      compositeHistory,
      computeUncertainty: true,
      bootstrapDraws: 100,
    });
    // I-D3-003 wordt wel ge-z-scoord (breakdown), maar computeComposite slaat
    // grade D in elke trekking over — meetellen zou n_indicators overdrijven.
    expect(out.uncertainty!.n_indicators).toBe(1);
  });

  it("zonder computeUncertainty blijft het veld weg en de status eerlijk not_computed", () => {
    const out = computeDaily({
      date: TODAY,
      rawValues: { "I-D3-006": 3.6 },
      history: { "I-D3-006": hist },
      compositeHistory,
    });
    expect(out.uncertainty).toBeUndefined();
    expect(out.composite.weight_sensitivity.bootstrap_95_ci_around_equal).toBeNull();
    expect(out.composite.weight_sensitivity.status?.bootstrap_95_ci_around_equal).toBe(
      "not_computed",
    );
  });
});
