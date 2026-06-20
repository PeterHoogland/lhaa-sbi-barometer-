import { describe, it, expect } from "vitest";
import {
  computeHybridHeadline,
  blendHeadlineScore,
  HYBRID_W_FAST,
  HYBRID_MIN_TRAFFIC_POINTS,
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
// 18 dagen DATEX-historie (I-D2-001-rt), vandaag = 5.6.
const TRAFFIC_HIST = [
  0.8, 3.1, 30.7, 56.2, 14.2, 7.2, 4.3, 127.6, 0.6, 104.7, 6.3, 2.5, 5.1, 3.5, 107.2, 4.3, 2.3,
];
const TRAFFIC_TODAY = 5.6;

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
    const r = computeHybridHeadline(BROAD, TRAFFIC_TODAY, TRAFFIC_HIST);
    expect(r.status).toBe("computed");
    // anker = 6 trage codes; z_slow = (1.85+1.27+3-1.26+0.76+3)/6 = 1.437
    expect(r.z_slow).toBeCloseTo(1.44, 1);
    expect(r.w_fast).toBe(HYBRID_W_FAST);
    // verkeer telt mee (18 punten >= drempel), neutraal vandaag (mediane filedag)
    expect(r.traffic).not.toBeNull();
    expect(r.traffic!.n_reference).toBe(TRAFFIC_HIST.length + 1);
    expect(Math.abs(r.traffic!.z)).toBeLessThan(1); // 5.6 ~ mediaan -> ~neutraal
    // kop in de geijkte band rond 88-92
    expect(r.score).toBeGreaterThanOrEqual(87);
    expect(r.score).toBeLessThanOrEqual(93);
  });

  it("ademt: een kalme dag (geen hitte, rustig verkeer, kalm nieuws) leest lager", () => {
    const calmBroad = BROAD.map((i) =>
      i.code === "I-D1-002" ? { ...i, z: 0 } : i.code === "I-D5-001" ? { ...i, z: -1.5 } : i,
    );
    const hot = computeHybridHeadline(BROAD, TRAFFIC_TODAY, TRAFFIC_HIST).score!;
    const calm = computeHybridHeadline(calmBroad, 2.0, TRAFFIC_HIST).score!;
    expect(calm).toBeLessThan(hot);
    // blijft eerlijk verankerd (niet misleidend laag): VERHOOGD-band
    expect(calm).toBeGreaterThanOrEqual(70);
  });

  it("verkeer-spike duwt de kop omhoog t.o.v. een rustige filedag", () => {
    const spike = computeHybridHeadline(BROAD, 110, TRAFFIC_HIST).score!;
    const quiet = computeHybridHeadline(BROAD, 2.0, TRAFFIC_HIST).score!;
    expect(spike).toBeGreaterThan(quiet);
  });

  it("laat verkeer eerlijk weg bij te dunne historie (< drempel)", () => {
    const r = computeHybridHeadline(BROAD, TRAFFIC_TODAY, TRAFFIC_HIST.slice(0, HYBRID_MIN_TRAFFIC_POINTS - 1));
    expect(r.traffic).toBeNull();
    expect(r.status).toBe("computed"); // snel telt nog op weer+nieuws
    expect(r.components.find((c) => c.code === "I-D2-001-rt")).toBeUndefined();
  });

  it("not_computed bij onvoldoende structurele dekking", () => {
    const r = computeHybridHeadline(BROAD.slice(6), null, []); // alleen de 3 snelle
    expect(r.status).toBe("not_computed");
    expect(r.score).toBeNull();
  });
});
