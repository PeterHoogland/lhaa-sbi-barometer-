/**
 * SBI v0.4 — unit-tests voor de meet- + trigger-laag.
 * Bron: HANDOVER §2 (v0.4-richtlijn) §1–§4.
 *
 * Dekt: getrimde baselines (window), de twee gewichtssets (som 1), het
 * meet-composiet + load-factor-clamp, en de drie triggers met hun remmen
 * (cooldown, confirmatie-severity, brand-safety-hold).
 */

import { describe, it, expect } from "vitest";
import {
  KERN_CODES,
  ACHTERGROND_CODES,
  wMeting,
  wTrigger,
  compositeMeting,
  achtergrond,
  loadFactor,
  computeV04Tier,
  sliceTrailing,
  spanYears,
  windowedZ,
  evaluateTriggers,
  EMPTY_TRIGGER_STATE,
  INDICATOR_RED_P,
  computeDaily,
  type ZLangMap,
  type CoreTriggerInput,
  type EvaluateTriggersInput,
} from "../src/index.js";

function daysAgoISO(base: string, n: number): string {
  const d = new Date(Date.parse(base + "T00:00:00Z") - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

describe("Getrimde baseline — sliceTrailing (v0.4 §2)", () => {
  const series = [
    { date: "2024-01-01", value: 1 },
    { date: "2025-01-01", value: 2 },
    { date: "2026-01-01", value: 3 },
    { date: "2026-05-01", value: 4 },
  ];

  it("18-maands venster vanaf 2026-06-01 pakt de laatste 3 punten", () => {
    const slice = sliceTrailing(series, "2026-06-01", 18); // cutoff 2024-12-01
    expect(slice.map((p) => p.value)).toEqual([2, 3, 4]);
  });

  it("6-maands venster pakt alleen de laatste 2 punten", () => {
    const slice = sliceTrailing(series, "2026-06-01", 6); // cutoff 2025-12-01
    expect(slice.map((p) => p.value)).toEqual([3, 4]);
  });

  it("lekt geen toekomst (datum > asOf wordt uitgesloten)", () => {
    const slice = sliceTrailing(series, "2025-06-01", 120);
    expect(slice.map((p) => p.value)).toEqual([1, 2]);
  });

  it("spanYears meet de overspanning van de slice", () => {
    expect(spanYears(series)).toBeCloseTo(2.33, 1);
  });
});

describe("Getrimde MAD-Z — windowedZ (v0.4 §2)", () => {
  const daily: Array<{ date: string; value: number }> = [];
  for (let i = 60; i >= 1; i--) daily.push({ date: daysAgoISO("2026-06-01", i), value: 10 + (i % 7) });
  const merged = [...daily, { date: "2026-06-01", value: 25 }];

  it("levert een positieve z voor een waarde ver boven de mediaan", () => {
    const z = windowedZ(25, merged, "2026-06-01", 18, { applyStl: false });
    expect(z.applied).toBe(true);
    expect(z.z).toBeGreaterThan(2);
    expect(z.n).toBeGreaterThan(8);
  });

  it("geeft z = 0 (niet toegepast) bij te weinig historie", () => {
    const tiny = [
      { date: "2026-05-30", value: 1 },
      { date: "2026-05-31", value: 2 },
    ];
    const z = windowedZ(99, tiny, "2026-06-01", 18, { applyStl: false });
    expect(z.applied).toBe(false);
    expect(z.z).toBe(0);
  });
});

describe("Twee gewichtssets (v0.4 §3.1)", () => {
  it("w_meting sommeert over de 9 kern tot 1", () => {
    const sum = KERN_CODES.reduce((s, c) => s + wMeting(c), 0);
    expect(sum).toBeCloseTo(1.0, 6);
  });

  it("w_trigger sommeert over de 9 kern tot 1", () => {
    const sum = KERN_CODES.reduce((s, c) => s + wTrigger(c), 0);
    expect(sum).toBeCloseTo(1.0, 6);
  });

  it("snelle bronnen wegen relatief zwaarder in w_trigger dan in w_meting", () => {
    // Negatief nieuws (⚡ direct, snelheidsfactor 1.5) moet in trigger zwaarder.
    expect(wTrigger("I-D5-001")).toBeGreaterThan(wMeting("I-D5-001"));
    // Inflatie (🐢 traag, 0.4) moet in trigger juist lichter.
    expect(wTrigger("I-D3-001")).toBeLessThan(wMeting("I-D3-001"));
  });
});

describe("Meet-composiet + load-factor (v0.4 §3.2/§3.3)", () => {
  it("composite_meting = Σ w_meting bij alle z_lang = 1 → 1.0", () => {
    const z: ZLangMap = {};
    for (const c of KERN_CODES) z[c] = 1;
    expect(compositeMeting(z)).toBeCloseTo(1.0, 6);
  });

  it("achtergrond telt alleen de trage grondlast-bronnen", () => {
    const z: ZLangMap = {};
    for (const c of KERN_CODES) z[c] = 1;
    const expected = ACHTERGROND_CODES.reduce((s, c) => s + wMeting(c), 0);
    expect(achtergrond(z)).toBeCloseTo(expected, 6);
    expect(achtergrond(z)).toBeLessThan(compositeMeting(z));
  });

  it("load_factor clampt op [0.6, 1.0]", () => {
    expect(loadFactor(0)).toBeCloseTo(1.0, 6); // rust → normale drempel
    expect(loadFactor(-5)).toBeCloseTo(1.0, 6); // negatief → nooit boven 1
    expect(loadFactor(100)).toBeCloseTo(0.6, 6); // hoge grondlast → max -40%
    expect(loadFactor(1)).toBeCloseTo(0.85, 6); // 1 - 0.15·1
  });
});

describe("Trigger-engine (v0.4 §4)", () => {
  const NOW = "2026-06-01T08:00:00Z";
  const base: EvaluateTriggersInput = {
    perCore: [],
    compositeMeting: 0,
    compositePercentileLang: 0,
    loadFactor: 1,
    brandSafetyFlag: "normal",
    confirmedBy: [],
    priorState: EMPTY_TRIGGER_STATE,
    nowISO: NOW,
  };
  const newsSpike: CoreTriggerInput = {
    code: "I-D5-001",
    domain: "D5",
    plain_name: "Negatief nieuws",
    klasse: "direct",
    z_kort: 2.4,
    z_lang: 1.1,
    delta_1d: 2.0,
    percentile_lang: 55,
  };

  it("T1 spike vuurt bij delta_1d ≥ drempel; in test-modus require_manual_approval", () => {
    const r = evaluateTriggers({ ...base, perCore: [newsSpike] });
    expect(r.triggers).toHaveLength(1);
    expect(r.triggers[0].type).toBe("indicator.spike");
    expect(r.triggers[0].severity).toBe("let_op"); // geen bevestiging
    expect(r.triggers[0].require_manual_approval).toBe(true);
  });

  it("Bevestiging (#4/#8) tilt de severity van een nieuws-spike naar hoog", () => {
    const r = evaluateTriggers({ ...base, perCore: [newsSpike], confirmedBy: ["I-D5-002"] });
    expect(r.triggers[0].severity).toBe("hoog");
    expect(r.triggers[0].confirmed_by).toContain("I-D5-002");
  });

  it("Cooldown onderdrukt een herhaalde spike binnen het venster", () => {
    const first = evaluateTriggers({ ...base, perCore: [newsSpike] });
    const within = evaluateTriggers({
      ...base,
      perCore: [newsSpike],
      priorState: first.newState,
      nowISO: "2026-06-01T20:00:00Z", // 12u later < 24u
    });
    expect(within.triggers).toHaveLength(0);
    const after = evaluateTriggers({
      ...base,
      perCore: [newsSpike],
      priorState: first.newState,
      nowISO: "2026-06-03T09:00:00Z", // > 24u
    });
    expect(after.triggers).toHaveLength(1);
  });

  it("Trage bronnen krijgen geen spike-trigger (alleen ⚡/🔆)", () => {
    const infl: CoreTriggerInput = {
      code: "I-D3-001",
      domain: "D3",
      plain_name: "Inflatie",
      klasse: "traag",
      z_kort: 3,
      z_lang: 3,
      delta_1d: 5,
      percentile_lang: 50,
    };
    const r = evaluateTriggers({ ...base, perCore: [infl] });
    expect(r.triggers.filter((t) => t.type === "indicator.spike")).toHaveLength(0);
  });

  it("Emotie-spike (2b) vuurt bij percentiel ≥ 90 met genoeg eigen historie", () => {
    const r = evaluateTriggers({ ...base, emotie: { value: 12, percentileLang: 93, nHistory: 30 } });
    const emo = r.triggers.filter((t) => t.type === "emotie.spike");
    expect(emo).toHaveLength(1);
    expect(emo[0].code).toBe("I-D5-emotie");
    expect(emo[0].severity).toBe("let_op"); // 90 ≤ p < 95
    expect(emo[0].require_manual_approval).toBe(true); // test-modus
  });

  it("Emotie-spike: cold-start (historie < MIN) vuurt NIET", () => {
    const r = evaluateTriggers({ ...base, emotie: { value: 12, percentileLang: 99, nHistory: 5 } });
    expect(r.triggers.filter((t) => t.type === "emotie.spike")).toHaveLength(0);
  });

  it("Emotie-spike vuurt niet onder de percentiel-drempel", () => {
    const r = evaluateTriggers({ ...base, emotie: { value: 12, percentileLang: 80, nHistory: 30 } });
    expect(r.triggers.filter((t) => t.type === "emotie.spike")).toHaveLength(0);
  });

  it("Emotie-spike: severity hoog bij percentiel ≥ 95", () => {
    const r = evaluateTriggers({ ...base, emotie: { value: 20, percentileLang: 97, nHistory: 30 } });
    const emo = r.triggers.filter((t) => t.type === "emotie.spike");
    expect(emo[0].severity).toBe("hoog");
  });

  // NB: niet-grondlast-code (hitte) — grondlast-bronnen vuren geen eigen T2 (§3.3).
  const redCore = (pct: number): CoreTriggerInput => ({
    code: "I-D1-002",
    domain: "D1",
    plain_name: "Hitte",
    klasse: "snel",
    z_kort: 0,
    z_lang: 3,
    delta_1d: 0,
    percentile_lang: pct,
  });

  it("T2 vuurt 'rood' pas vanaf P95 (getemd), niet meer op P92", () => {
    expect(INDICATOR_RED_P).toBe(95);
    const onder = evaluateTriggers({ ...base, perCore: [redCore(92)] });
    expect(onder.triggers.find((t) => t.type === "indicator.red")).toBeUndefined();
    const boven = evaluateTriggers({ ...base, perCore: [redCore(96)] });
    const t2 = boven.triggers.find((t) => t.type === "indicator.red");
    expect(t2).toBeDefined();
    expect(t2!.severity).toBe("hoog");
  });

  it("Grondlast-bron (§3.3 / Pad A) vuurt GÉÉN eigen indicator.red, ook op extreem percentiel", () => {
    // Verkeer (filezwaarte) + brandstof zijn grondlast: ze laden de drempel,
    // maar mogen niet zelf vuren (anders dubbeltelling). Een niet-grondlast-bron
    // op hetzelfde percentiel vuurt wél — zo is de uitsluiting gericht, niet globaal.
    const verkeer: CoreTriggerInput = {
      code: "I-D2-001", domain: "D2", plain_name: "Filezwaarte", klasse: "traag",
      z_kort: 0, z_lang: 4.4, delta_1d: 0, percentile_lang: 99,
    };
    const brandstof: CoreTriggerInput = {
      code: "I-D2-004", domain: "D2", plain_name: "Brandstof", klasse: "traag",
      z_kort: 0, z_lang: 4, delta_1d: 0, percentile_lang: 99,
    };
    const r = evaluateTriggers({ ...base, perCore: [verkeer, brandstof, redCore(99)] });
    const reds = r.triggers.filter((t) => t.type === "indicator.red");
    expect(reds.map((t) => t.code)).toEqual(["I-D1-002"]); // alleen de niet-grondlast-bron
  });

  it("T3 composiet: P70 → amber/let_op, P90 → red/hoog", () => {
    const amber = evaluateTriggers({ ...base, compositePercentileLang: 75 });
    expect(amber.triggers.find((t) => t.type === "composite.amber")?.severity).toBe("let_op");
    const red = evaluateTriggers({ ...base, compositePercentileLang: 95 });
    expect(red.triggers.find((t) => t.type === "composite.red")?.severity).toBe("hoog");
  });

  it("Brand-safety zet require_manual_approval, ook in live-modus", () => {
    const held = evaluateTriggers({ ...base, mode: "live", perCore: [newsSpike], brandSafetyFlag: "block" });
    expect(held.triggers[0].require_manual_approval).toBe(true);
    const free = evaluateTriggers({ ...base, mode: "live", perCore: [newsSpike], brandSafetyFlag: "normal" });
    expect(free.triggers[0].require_manual_approval).toBe(false);
  });
});

describe("v0.4 zichtbare tier (oranje 1d≥P60, rood 2d≥P90)", () => {
  it("rustige reeks blijft groen", () => {
    expect(computeV04Tier([20, 30, 40, 50, 55]).tier).toBe("green");
  });

  it("één dag ≥ P60 → oranje (agressief)", () => {
    expect(computeV04Tier([40, 40, 61]).tier).toBe("amber");
  });

  it("één dag ≥ P90 is nog géén rood, maar wel oranje", () => {
    expect(computeV04Tier([40, 95]).tier).toBe("amber");
  });

  it("twee opeenvolgende dagen ≥ P90 → rood (uitzonderlijk)", () => {
    expect(computeV04Tier([40, 92, 93]).tier).toBe("red");
  });

  it("afschaling na 2 dagen onder de drempel", () => {
    expect(computeV04Tier([90, 90, 40, 40]).tier).toBe("green");
    // 1 dag onder is nog niet genoeg
    expect(computeV04Tier([90, 90, 40]).tier).toBe("red");
  });
});

describe("Integratie — computeDaily levert een v04-blok", () => {
  it("v04 bestaat, met 9 kern-breakdowns en een eindig composiet", () => {
    const out = computeDaily({ date: "2026-06-01", rawValues: {}, history: {}, compositeHistory: [] });
    expect(out.v04).toBeDefined();
    expect(out.v04!.kern_breakdown).toHaveLength(9);
    expect(Number.isFinite(out.v04!.composite.meting)).toBe(true);
    expect(out.v04!.composite.load_factor).toBeGreaterThanOrEqual(0.6);
    expect(out.v04!.composite.load_factor).toBeLessThanOrEqual(1.0);
    // Zonder dagwaarden zijn alle kern "ontbreekt" en is er niets te vuren.
    expect(out.v04!.kern_breakdown.every((k) => k.state === "ontbreekt")).toBe(true);
    expect(out.v04!.triggers).toHaveLength(0);
  });
});
