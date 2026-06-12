/**
 * B2 — eCDF-normalisatie met 3-jaarsgate (amendement §4.1.6, methodologie 0.3.2).
 * Pint: probit-correctheid, klemming (nooit ±∞), de gate (dicht onder 3 jaar of
 * 90 punten — vandaag dus voor alle echte indicatoren), en de runtime-labels
 * (normalization per indicator + percentiel "voorlopig" zolang de gate dicht is).
 */

import { describe, it, expect } from "vitest";
import {
  probit,
  ecdfZ,
  ecdfEligibility,
  ECDF_MIN_POINTS,
  ECDF_MIN_YEARS,
  computeDaily,
  mulberry32,
} from "../src/index.js";

function dateNDaysAgo(n: number, from: string): string {
  const d = new Date(from + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const TODAY = "2026-06-12";

describe("probit (inverse normale CDF, Acklam)", () => {
  it("bekende kwantielen", () => {
    expect(probit(0.5)).toBeCloseTo(0, 9);
    expect(probit(0.975)).toBeCloseTo(1.959964, 5);
    expect(probit(0.025)).toBeCloseTo(-1.959964, 5);
    expect(probit(0.8413)).toBeCloseTo(1.0, 3);
  });
  it("buiten (0,1) eerlijk NaN", () => {
    expect(Number.isNaN(probit(0))).toBe(true);
    expect(Number.isNaN(probit(1))).toBe(true);
  });
});

describe("ecdfZ", () => {
  const ref = Array.from({ length: 200 }, (_, i) => i); // 0..199
  it("mediaan-waarde geeft z ~ 0", () => {
    expect(ecdfZ(99.5, ref)).toBeCloseTo(0, 1);
  });
  it("extreme waarde wordt geklemd: nooit ±Infinity", () => {
    const zHigh = ecdfZ(10_000, ref);
    const zLow = ecdfZ(-10_000, ref);
    expect(Number.isFinite(zHigh)).toBe(true);
    expect(Number.isFinite(zLow)).toBe(true);
    // klem op 1 - 1/(2n) → probit(0.9975) ≈ 2.81 bij n=200
    expect(zHigh).toBeCloseTo(probit(1 - 1 / 400), 6);
    expect(zLow).toBeCloseTo(probit(1 / 400), 6);
  });
  it("monotoon: hogere waarde geeft hogere z", () => {
    expect(ecdfZ(150, ref)).toBeGreaterThan(ecdfZ(50, ref));
  });
  it("lege referentie geeft NaN (gate bewaakt dit)", () => {
    expect(Number.isNaN(ecdfZ(1, []))).toBe(true);
  });
});

describe("eCDF-gate (ecdfEligibility)", () => {
  function seasonalHistory(years: number, from: string): Array<{ date: string; value: number }> {
    // dagelijkse punten over `years` jaar terug — het ±45d-venster pikt er
    // per jaargang ~91 uit.
    const rng = mulberry32(5);
    const out: Array<{ date: string; value: number }> = [];
    for (let i = years * 365; i >= 1; i--) {
      out.push({ date: dateNDaysAgo(i, from), value: rng() });
    }
    return out;
  }

  it("dicht bij 2 jaar historie (de huidige productie-situatie)", () => {
    const e = ecdfEligibility(seasonalHistory(2, TODAY), TODAY);
    expect(e.eligible).toBe(false);
    expect(e.spanYears).toBeLessThan(ECDF_MIN_YEARS);
  });

  it("open bij 4 jaar dagelijkse historie", () => {
    const e = ecdfEligibility(seasonalHistory(4, TODAY), TODAY);
    expect(e.eligible).toBe(true);
    expect(e.nPoints).toBeGreaterThanOrEqual(ECDF_MIN_POINTS);
    expect(e.spanYears).toBeGreaterThanOrEqual(ECDF_MIN_YEARS);
    expect(e.reference.length).toBe(e.nPoints);
  });

  it("dicht bij lange maar dunne historie (maandbron: te weinig punten in het venster)", () => {
    // 10 jaar maandelijkse punten → ~15 venster-punten binnen de 5-jaarscap,
    // ver onder ECDF_MIN_POINTS. Pint ook de drift-bescherming: een decennia-
    // lange maandreeks (bv. prijsindex sinds 1996) komt er niet doorheen.
    const monthly: Array<{ date: string; value: number }> = [];
    for (let m = 120; m >= 1; m--) {
      monthly.push({ date: dateNDaysAgo(m * 30, TODAY), value: m });
    }
    const e = ecdfEligibility(monthly, TODAY);
    expect(e.eligible).toBe(false);
    expect(e.nPoints).toBeLessThan(ECDF_MIN_POINTS);
  });

  it("referentie begrensd op de recentste 5 jaar (drift-cap): oude jaargangen tellen niet mee", () => {
    const e10 = ecdfEligibility(seasonalHistory(10, TODAY), TODAY);
    const e5 = ecdfEligibility(seasonalHistory(5, TODAY), TODAY);
    expect(e10.eligible).toBe(true);
    // 10 jaar historie levert (vrijwel) dezelfde referentie-omvang als 5 jaar:
    // alles ouder dan ECDF_MAX_YEARS valt buiten de vergelijkingsbasis.
    expect(Math.abs(e10.nPoints - e5.nPoints)).toBeLessThanOrEqual(2);
    expect(e10.spanYears).toBeLessThanOrEqual(5.01);
  });
});

describe("runtime-integratie (B2-labels)", () => {
  const rng = mulberry32(11);
  const shortHist = Array.from({ length: 120 }, (_, i) => ({
    date: dateNDaysAgo(120 - i, TODAY),
    value: 3 + rng(),
  }));
  const longHist = Array.from({ length: 4 * 365 }, (_, i) => ({
    date: dateNDaysAgo(4 * 365 - i, TODAY),
    value: 3 + rng(),
  }));
  const compositeHistory = Array.from({ length: 120 }, (_, i) => ({
    date: dateNDaysAgo(120 - i, TODAY),
    value: (rng() - 0.5) * 2,
  }));

  it("korte historie blijft MAD-z en het percentiel is 'voorlopig'", () => {
    const out = computeDaily({
      date: TODAY,
      rawValues: { "I-D3-006": 3.6 },
      history: { "I-D3-006": shortHist },
      compositeHistory,
    });
    const ind = out.indicator_breakdown.find((b) => b.code === "I-D3-006")!;
    expect(ind.normalization).toBe("mad_z");
    expect(out.percentile.normalization_provisional).toBe(true);
    expect(out.percentile.ecdf_active).toEqual([]);
  });

  it("4 jaar seizoenshistorie opent de gate: normalization 'ecdf' + geregistreerd in ecdf_active", () => {
    const out = computeDaily({
      date: TODAY,
      rawValues: { "I-D3-006": 3.6 },
      history: { "I-D3-006": longHist },
      compositeHistory,
      computeUncertainty: true,
      bootstrapDraws: 100,
    });
    const ind = out.indicator_breakdown.find((b) => b.code === "I-D3-006")!;
    expect(ind.normalization).toBe("ecdf");
    expect(out.percentile.ecdf_active).toContain("I-D3-006");
    expect(ind.z_short).not.toBeNull();
    expect(Number.isFinite(ind.z_short!)).toBe(true);
    // bootstrap draait ook op het eCDF-pad
    expect(out.uncertainty).toBeDefined();
    expect(Number.isFinite(out.uncertainty!.ci_90_lower)).toBe(true);
  });
});
