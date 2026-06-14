/**
 * Referentie-audit (Peter 14/6): de automatische consistentie-/plausibiliteits-
 * controle van het dagpercentiel. Pint het gedrag dat de canary leest.
 */
import { describe, it, expect } from "vitest";
import { auditReferenceConsistency } from "../src/methodology/reference-audit.js";
import { computeDaily } from "../src/index.js";

const VERSION = "test-0.0.0";

/** Bouw een seizoens-passende historie rond een ankerdatum (zelfde dag-van-het-jaar). */
function seasonalHistory(anchor: string, values: number[]): Array<{ date: string; value: number }> {
  // Spreid de punten over ±20 dagen rond het anker in EERDERE jaren, zodat ze in
  // het ±45d-seizoensvenster vallen en lookahead-vrij (< anker) zijn.
  const base = new Date(anchor + "T00:00:00Z");
  return values.map((v, i) => {
    const d = new Date(base.getTime());
    d.setUTCFullYear(d.getUTCFullYear() - (1 + (i % 2)));
    d.setUTCDate(d.getUTCDate() + ((i % 41) - 20));
    return { date: d.toISOString().slice(0, 10), value: v };
  });
}

describe("Referentie-audit — reproduceerbaarheid en gezondheid", () => {
  const DATE = "2026-06-14";

  it("gezonde, gespreide referentie → verdict ok en reproduceerbaar", () => {
    const hist = seasonalHistory(DATE, Array.from({ length: 120 }, (_, i) => -0.3 + (i % 13) * 0.05));
    const a = auditReferenceConsistency(0.0, DATE, hist, undefined as never, VERSION);
    // Herbereken met het gepubliceerde percentiel = het audit-zelf-berekende:
    const pub = a.percentile_recomputed;
    const a2 = auditReferenceConsistency(0.0, DATE, hist, pub, VERSION);
    expect(a2.reproducible).toBe(true);
    expect(a2.degenerate_reference).toBe(false);
    expect(a2.reference_mode).toBe("seasonal");
    expect(a2.verdict).toBe("ok");
    expect(a2.methodology_version).toBe(VERSION);
  });

  it("niet-reproduceerbaar (verkeerd gepubliceerd percentiel) → critical", () => {
    const hist = seasonalHistory(DATE, Array.from({ length: 120 }, (_, i) => -0.3 + (i % 13) * 0.05));
    const real = auditReferenceConsistency(0.0, DATE, hist, undefined as never, VERSION).percentile_recomputed;
    const wrong = (real + 30) % 100;
    const a = auditReferenceConsistency(0.0, DATE, hist, wrong, VERSION);
    expect(a.reproducible).toBe(false);
    expect(a.verdict).toBe("critical");
  });

  it("platte referentie (geen spreiding) → degenerate + critical", () => {
    const hist = seasonalHistory(DATE, Array.from({ length: 120 }, () => 0.5));
    const a = auditReferenceConsistency(0.5, DATE, hist, 50, VERSION);
    expect(a.degenerate_reference).toBe(true);
    expect(a.verdict).toBe("critical");
  });

  it("overgevoelig: extreem percentiel maar composiet ~op het midden → degraded", () => {
    // Sterk geclusterde verdeling: 190 punten net boven het composiet (0,02), 10
    // verspreid eronder. Het composiet (0,0) ligt maar ~0,4 sd onder de mediaan,
    // maar omdat 95% net erboven klontert, valt het percentiel op ~5 (extreem).
    // Dat is precies het lage-variantie-vergrootglas dat we willen vlaggen.
    const vals = [
      ...Array.from({ length: 190 }, () => 0.02),
      ...Array.from({ length: 10 }, (_, i) => -0.1 - i * 0.02),
    ];
    const hist = seasonalHistory(DATE, vals);
    const pub = auditReferenceConsistency(0.0, DATE, hist, undefined as never, VERSION).percentile_recomputed;
    const a = auditReferenceConsistency(0.0, DATE, hist, pub, VERSION);
    expect(pub).toBeLessThanOrEqual(10); // extreem percentiel
    expect(Math.abs(a.composite_z_vs_reference)).toBeLessThan(0.5); // maar ~op het midden
    expect(a.hypersensitive).toBe(true);
    expect(a.verdict).toBe("degraded");
    expect(a.reproducible).toBe(true);
  });

  it("dunne seizoensreferentie → fallback_full + degraded", () => {
    const hist = seasonalHistory(DATE, [0.1, -0.2, 0.0, 0.3, -0.1]); // < MIN_SEASONAL_POINTS
    const a = auditReferenceConsistency(0.0, DATE, hist, 40, VERSION);
    expect(a.reference_mode).toBe("fallback_full");
    expect(["degraded", "critical"]).toContain(a.verdict);
  });
});

describe("Referentie-audit — integratie in computeDaily", () => {
  it("computeDaily levert altijd een reference_audit-blok met het gepubliceerde percentiel", () => {
    const hist = Array.from({ length: 200 }, (_, i) => ({
      date: new Date(Date.parse("2026-06-14T00:00:00Z") - (i + 1) * 86_400_000).toISOString().slice(0, 10),
      value: 10 + (i % 9),
    }));
    const out = computeDaily({
      date: "2026-06-14",
      rawValues: { "I-D5-001": 14 },
      history: { "I-D5-001": hist },
      compositeHistory: hist.map((h) => ({ date: h.date, value: (h.value - 14) / 10 })),
    });
    expect(out.reference_audit).toBeDefined();
    expect(out.reference_audit!.percentile_published).toBe(out.percentile.short_24m);
    // In de productie-keten is het cijfer per constructie reproduceerbaar.
    expect(out.reference_audit!.reproducible).toBe(true);
  });
});
