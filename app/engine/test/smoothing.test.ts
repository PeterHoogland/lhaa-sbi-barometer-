/**
 * Afvlakking (§4.1.8, Peter 14/6): 7-daags trailing gemiddelde van het composiet
 * vóór het percentiel. Pint de helper-correctheid + de integratie in computeDaily.
 */
import { describe, it, expect } from "vitest";
import {
  SMOOTHING_WINDOW_DAYS,
  trailingPastSum,
  smoothedToday,
  smoothTrailing,
  smoothTrailingByDate,
} from "../src/methodology/smoothing.js";
import { computeDaily } from "../src/index.js";

describe("Afvlakking-helpers", () => {
  it("trailingPastSum pakt de laatste (window-1) waarden + telt vandaag mee", () => {
    const hist = [1, 2, 3, 4, 5, 6, 7, 8]; // 8 dagen
    const { pastSum, count } = trailingPastSum(hist, 7);
    // laatste 6 historiewaarden: 3..8 = 33; count = 7 (incl. vandaag)
    expect(pastSum).toBe(33);
    expect(count).toBe(7);
  });

  it("smoothedToday = trailing-gemiddelde t/m vandaag", () => {
    const hist = [10, 10, 10, 10, 10, 10]; // 6 dagen
    expect(smoothedToday(hist, 3, 7)).toBeCloseTo((60 + 3) / 7, 10);
  });

  it("expanderend venster bij korte historie", () => {
    const { pastSum, count } = trailingPastSum([2, 4], 7); // maar 2 punten
    expect(pastSum).toBe(6);
    expect(count).toBe(3); // 2 + vandaag
  });

  it("smoothTrailing vlakt elk punt af, lookahead-vrij", () => {
    const hist = [
      { date: "2026-06-01", value: 0 },
      { date: "2026-06-02", value: 3 },
      { date: "2026-06-03", value: 6 },
    ];
    const out = smoothTrailing(hist, 7);
    expect(out[0].value).toBe(0); // alleen zichzelf
    expect(out[1].value).toBe(1.5); // (0+3)/2
    expect(out[2].value).toBe(3); // (0+3+6)/3
  });

  it("dempt dag-tot-dag-ruis aantoonbaar (sd van het afgevlakte << ruwe)", () => {
    // Wisselende reeks +1/-1: ruwe dag-tot-dag-beweging groot, afgevlakt klein.
    const raw = Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 1 : -1));
    const dated = raw.map((v, i) => ({
      date: new Date(Date.parse("2026-01-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10),
      value: v,
    }));
    const sm = smoothTrailing(dated, 7).map((d) => d.value);
    const dd = (xs: number[]) =>
      xs.slice(1).reduce((s, v, i) => s + Math.abs(v - xs[i]), 0) / (xs.length - 1);
    expect(dd(sm)).toBeLessThan(dd(raw) / 3); // minstens 3x rustiger
  });
});

describe("Afvlakking — integratie in computeDaily (§4.1.8)", () => {
  // Bouw een ruizige composiet-historie + bijpassende indicator-historie.
  const dayISO = (i: number) =>
    new Date(Date.parse("2026-06-14T00:00:00Z") - i * 86_400_000).toISOString().slice(0, 10);
  const indicatorHist = Array.from({ length: 200 }, (_, i) => ({
    date: dayISO(200 - i),
    value: 10 + (i % 9),
  }));
  const compositeHistory = Array.from({ length: 200 }, (_, i) => ({
    date: dayISO(200 - i),
    value: i % 2 === 0 ? 0.25 : -0.25, // sterk wisselend
  }));

  const out = computeDaily({
    date: "2026-06-14",
    rawValues: { "I-D5-001": 14 },
    history: { "I-D5-001": indicatorHist },
    compositeHistory,
    computeUncertainty: true,
    bootstrapDraws: 200,
  });

  it("publiceert het ruwe én het afgevlakte composiet + het venster", () => {
    expect(out.composite.equal_smoothed).toBeTypeOf("number");
    expect(out.percentile.smoothing_window_days).toBe(SMOOTHING_WINDOW_DAYS);
    // Afgevlakt ligt dichter bij 0 dan een uiterste ruwe dag (ruis gedempt).
    expect(Math.abs(out.composite.equal_smoothed!)).toBeLessThanOrEqual(
      Math.abs(out.composite.equal) + 0.2,
    );
  });

  it("het percentiel blijft reproduceerbaar tegen de AFGEVLAKTE referentie (audit)", () => {
    expect(out.reference_audit!.reproducible).toBe(true);
    expect(out.reference_audit!.percentile_published).toBe(out.percentile.short_24m);
  });

  it("de onzekerheidsband is op het afgevlakte cijfer berekend (smal, low/medium)", () => {
    // Door de afvlakking is de baseline-onzekerheid van het 7-daags cijfer klein.
    expect(out.uncertainty!.uncertainty_flag).not.toBe("high");
    const lo = out.uncertainty!.ci_90_lower;
    const hi = out.uncertainty!.ci_90_upper;
    expect(out.percentile.short_24m).toBeGreaterThanOrEqual(lo - 1);
    expect(out.percentile.short_24m).toBeLessThanOrEqual(hi + 1);
  });
});

/**
 * §4.1.17 — datum-bewuste variant. De energiereeks (I-D3-002) heeft een gat
 * 2020-2024; een positioneel venster zou daar 2019-waarden met 2024-waarden
 * middelen. Het venster moet dus KALENDERdagen tellen.
 */
describe("smoothTrailingByDate telt kalenderdagen, niet posities", () => {
  it("middelt niet over een gat heen", () => {
    const reeks = [
      { date: "2019-12-30", value: 100 },
      { date: "2019-12-31", value: 100 },
      { date: "2024-05-21", value: 10 }, // na een gat van jaren
      { date: "2024-05-22", value: 20 },
    ];
    const uit = smoothTrailingByDate(reeks, 7);
    // het punt na het gat mag ALLEEN zichzelf middelen
    expect(uit[2].value).toBe(10);
    // en het volgende punt alleen de twee post-gat-waarden
    expect(uit[3].value).toBe(15);
    // positioneel zou 2024-05-21 uitkomen op (100+100+10)/3 = 70
    expect(smoothTrailing(reeks, 7)[2].value).toBeCloseTo(70, 6);
  });

  it("vlakt een weekcyclus weg en is lookahead-vrij", () => {
    // 4 weken: werkdagen 100, weekend 40 (zoals de day-ahead stroomprijs)
    const reeks = Array.from({ length: 28 }, (_, i) => {
      const dag = new Date(Date.UTC(2026, 0, 5 + i)); // 5 jan 2026 = maandag
      const we = dag.getUTCDay() === 0 || dag.getUTCDay() === 6;
      return { date: dag.toISOString().slice(0, 10), value: we ? 40 : 100 };
    });
    const uit = smoothTrailingByDate(reeks, 7);
    // vanaf dag 7 is elk venster een volledige week -> constant weekgemiddelde
    const staart = uit.slice(6).map((p) => p.value);
    const verwacht = (5 * 100 + 2 * 40) / 7;
    for (const v of staart) expect(v).toBeCloseTo(verwacht, 6);
    // lookahead-vrij: het eerste punt kent alleen zichzelf
    expect(uit[0].value).toBe(100);
  });
});
