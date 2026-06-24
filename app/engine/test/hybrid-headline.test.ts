import { describe, it, expect } from "vitest";
import {
  computeHybridHeadline,
  blendHeadlineScore,
  HYBRID_W_FAST,
  HYBRID_MIN_DAY_POINTS,
} from "../src/methodology/hybrid-headline.js";
import { normalCdf } from "../src/methodology/economic-pressure.js";
import type { IndicatorCode } from "../src/types.js";

// Live broad_pressure-indicatoren 19/6 (z vs 2010-2019/2017-2019).
const BROAD = [
  { code: "I-D3-001" as IndicatorCode, z: 1.85 }, // CPI        slow
  { code: "I-D2-004" as IndicatorCode, z: 1.27 }, // brandstof  slow
  { code: "I-D3-007" as IndicatorCode, z: 3.0 }, //  vertrouwen slow
  { code: "I-D3-005" as IndicatorCode, z: -1.26 }, // werkloos   slow
  { code: "I-D3-006" as IndicatorCode, z: 0.76 }, // hypotheek   slow
  { code: "I-D3-002" as IndicatorCode, z: 3.0 }, //  energie     slow
  { code: "I-D1-002" as IndicatorCode, z: 3.0 }, //  hitte       fast
  { code: "I-D1-003" as IndicatorCode, z: 0.0 }, //  koude       fast
  { code: "I-D5-001" as IndicatorCode, z: 0.66 }, // nieuws      fast
];
// 17 dagen DATEX-historie (I-D2-001-rt), vandaag = 5.6.
const TRAFFIC_HIST = [
  0.8, 3.1, 30.7, 56.2, 14.2, 7.2, 4.3, 127.6, 0.6, 104.7, 6.3, 2.5, 5.1, 3.5, 107.2, 4.3, 2.3,
];
const TRAFFIC_TODAY = 5.6;
// dagsignaal-helper: verkeer als enige dagsignaal.
const traffic = (value: number | null, hist: number[] = TRAFFIC_HIST) => [
  { code: "I-D2-001-rt", value, history: hist },
];
// OV-historie (STIB-achtig, honderden items), vandaag hoog.
const STIB_HIST = [272, 320, 343, 334, 274, 282, 278, 308, 501, 525, 502, 337, 303, 302, 337, 357, 379];

describe("blendHeadlineScore", () => {
  it("mapt de samengestelde z via de normale CDF (zbar=0 -> 50)", () => {
    expect(blendHeadlineScore(0, 0, 0.3)).toBe(50);
  });
  it("w_fast weegt traag/snel lineair in de z-ruimte", () => {
    const zSlow = 1.437;
    const zFast = 0.95;
    const wf = 0.3;
    const expected = Math.round(100 * normalCdf((1 - wf) * zSlow + wf * zFast));
    expect(blendHeadlineScore(zSlow, zFast, wf)).toBe(expected);
  });
});

describe("computeHybridHeadline", () => {
  it("reproduceert de geijkte dagkop (~90) met verkeer als dagsignaal", () => {
    const r = computeHybridHeadline(BROAD, traffic(TRAFFIC_TODAY));
    expect(r.status).toBe("computed");
    expect(r.z_slow).toBeCloseTo(1.44, 1);
    expect(r.w_fast).toBe(HYBRID_W_FAST);
    expect(r.day_signals).toHaveLength(1);
    expect(r.day_signals[0].code).toBe("I-D2-001-rt");
    expect(r.day_signals[0].n_reference).toBe(TRAFFIC_HIST.length + 1);
    expect(Math.abs(r.day_signals[0].z)).toBeLessThan(1); // 5.6 ~ mediaan -> ~neutraal
    expect(r.score).toBeGreaterThanOrEqual(87);
    expect(r.score).toBeLessThanOrEqual(93);
  });

  it("OV (STIB/De Lijn) telt mee als extra dagsignaal, net als verkeer (§4.1.15)", () => {
    const r = computeHybridHeadline(BROAD, [
      { code: "I-D2-001-rt", value: TRAFFIC_TODAY, history: TRAFFIC_HIST },
      { code: "I-D2-stib", value: 525, history: STIB_HIST }, // hoog -> stress omhoog
      { code: "I-D2-delijn", value: 413, history: STIB_HIST },
    ]);
    expect(r.status).toBe("computed");
    expect(r.day_signals.map((d) => d.code)).toEqual(["I-D2-001-rt", "I-D2-stib", "I-D2-delijn"]);
    // hoge STIB-waarde (525 = top van de eigen historie) geeft positieve z
    expect(r.day_signals.find((d) => d.code === "I-D2-stib")!.z).toBeGreaterThan(0);
    expect(r.components.filter((c) => c.band === "fast").length).toBe(3 + 3); // 3 broad-fast + 3 dagsignalen
  });

  it("ademt: een kalme dag (geen hitte, rustig verkeer, kalm nieuws) leest lager", () => {
    const calmBroad = BROAD.map((i) =>
      i.code === "I-D1-002" ? { ...i, z: 0 } : i.code === "I-D5-001" ? { ...i, z: -1.5 } : i,
    );
    const hot = computeHybridHeadline(BROAD, traffic(TRAFFIC_TODAY)).score!;
    const calm = computeHybridHeadline(calmBroad, traffic(2.0)).score!;
    expect(calm).toBeLessThan(hot);
    expect(calm).toBeGreaterThanOrEqual(70);
  });

  it("verkeer-spike duwt de kop omhoog t.o.v. een rustige filedag", () => {
    const spike = computeHybridHeadline(BROAD, traffic(110)).score!;
    const quiet = computeHybridHeadline(BROAD, traffic(2.0)).score!;
    expect(spike).toBeGreaterThan(quiet);
  });

  it("laat een dagsignaal eerlijk weg bij te dunne historie (< drempel)", () => {
    const r = computeHybridHeadline(BROAD, traffic(TRAFFIC_TODAY, TRAFFIC_HIST.slice(0, HYBRID_MIN_DAY_POINTS - 1)));
    expect(r.day_signals).toHaveLength(0);
    expect(r.status).toBe("computed"); // snel telt nog op weer+nieuws
    expect(r.components.find((c) => c.code === "I-D2-001-rt")).toBeUndefined();
  });

  it("not_computed bij onvoldoende structurele dekking", () => {
    const r = computeHybridHeadline(BROAD.slice(6), []); // alleen de 3 snelle, geen dagsignalen
    expect(r.status).toBe("not_computed");
    expect(r.score).toBeNull();
  });

  it("pollen + lucht tellen als STRESS-dagsignaal mee in de kop (§4.1.16)", () => {
    const POLLEN_HIST = [5, 8, 12, 6, 20, 15, 9, 11, 7, 18, 25, 10, 14, 22, 4]; // 15 punten
    const withoutEnv = computeHybridHeadline(BROAD, traffic(TRAFFIC_TODAY)).score!;
    const withPollen = computeHybridHeadline(BROAD, [
      { code: "I-D2-001-rt", value: TRAFFIC_TODAY, history: TRAFFIC_HIST },
      { code: "I-D1-010", value: 60, history: POLLEN_HIST }, // 60 = boven heel de historie -> extreem
    ]).score!;
    expect(withPollen).toBeGreaterThan(withoutEnv);
    // pollen telt als fast-(stress)component, niet als mobiliteit
    const r = computeHybridHeadline(BROAD, [{ code: "I-D1-010", value: 60, history: POLLEN_HIST }]);
    expect(r.components.some((c) => c.code === "I-D1-010" && c.band === "fast")).toBe(true);
  });

  it("een rustige avondspits maskeert de hitte NIET meer (relief-vloer, §4.1.16)", () => {
    // hitte op +3; verkeer zeer laag (0.5 = onder heel de historie -> sterk negatieve z).
    // Onder de oude middeling at dat de hitte op (~85); nu is verlichting gevloerd.
    const quiet = computeHybridHeadline(BROAD, traffic(0.5)).score!;
    const neutral = computeHybridHeadline(BROAD, traffic(TRAFFIC_TODAY)).score!;
    expect(quiet).toBeGreaterThanOrEqual(88); // hitte + anker blijven domineren
    expect(quiet).toBeGreaterThanOrEqual(neutral - 2); // verlichting is begrensd, geen sloophamer
  });
});
