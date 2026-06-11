/**
 * Registry-synchronisatietest (A2/A3): de registry is de single source of truth
 * voor elke indicatortelling. Deze suite faalt zodra:
 *  • een indicator stil wordt toegevoegd of verwijderd (canonieke snapshot);
 *  • een gescoorde indicator niet in pre-registratie + amendementen staat;
 *  • web-copy of pipeline-constanten een andere telling claimen dan de registry.
 *
 * Een indicator toevoegen raakt voortaan bewust vier plekken: registry +
 * AMENDED_CODES + CHANGELOG/amendement-doc + (automatisch) deze test.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  INDICATORS,
  INDICATOR_CODES,
  indicatorsByDomain,
  allDomains,
  scoredDomains,
  contextIndicators,
  PRE_REGISTERED_CODES,
  AMENDED_CODES,
  KERN_CODES,
  ACHTERGROND_CODES,
  computeDaily,
  toPublicOutput,
} from "../src/index.js";

const CANONICAL_CODES = [
  "I-D1-001", "I-D1-002", "I-D1-003", "I-D1-004", "I-D1-009", "I-D1-010",
  "I-D2-001", "I-D2-004", "I-D2-009",
  "I-D3-001", "I-D3-002", "I-D3-003", "I-D3-005", "I-D3-006", "I-D3-007", "I-D3-009",
  "I-D4-001", "I-D4-002",
  "I-D5-001", "I-D5-002", "I-D5-003",
  "I-D6-001", "I-D6-002", "I-D6-003", "I-D6-005",
] as const;

function fileAt(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf-8");
}

describe("Canonieke telling (bevroren snapshot)", () => {
  it("registry bevat exact de 25 canonieke codes", () => {
    expect([...INDICATOR_CODES].sort()).toEqual([...CANONICAL_CODES].sort());
  });

  it("per-domein-telling: D1=6, D2=3, D3=7, D4=2, D5=3, D6=4", () => {
    const counts = Object.fromEntries(
      allDomains().map((d) => [d, indicatorsByDomain(d).length]),
    );
    expect(counts).toEqual({ D1: 6, D2: 3, D3: 7, D4: 2, D5: 3, D6: 4 });
  });

  it("gescoord=20, gemeten=21, context=4, diagnostisch (grade D)=1", () => {
    const metas = INDICATOR_CODES.map((c) => INDICATORS[c]);
    const context = metas.filter((m) => m.contextOnly);
    const gemeten = metas.filter((m) => !m.contextOnly);
    const gescoord = gemeten.filter((m) => m.grade !== "D");
    const diagnostisch = gemeten.filter((m) => m.grade === "D");
    expect(context.map((m) => m.code).sort()).toEqual([
      "I-D6-001", "I-D6-002", "I-D6-003", "I-D6-005",
    ]);
    expect(gemeten).toHaveLength(21);
    expect(gescoord).toHaveLength(20);
    expect(diagnostisch.map((m) => m.code)).toEqual(["I-D3-003"]);
    expect(contextIndicators().map((m) => m.code).sort()).toEqual(
      context.map((m) => m.code).sort(),
    );
  });

  it("gescoorde domeinen zijn D1-D5 (D6 = contextlaag, A6)", () => {
    expect(scoredDomains()).toEqual(["D1", "D2", "D3", "D4", "D5"]);
  });

  it("deterministische codes zijn exact de bekende 7", () => {
    const det = INDICATOR_CODES.filter((c) => INDICATORS[c].deterministic).sort();
    expect(det).toEqual([
      "I-D1-001", "I-D4-001", "I-D4-002",
      "I-D6-001", "I-D6-002", "I-D6-003", "I-D6-005",
    ]);
  });
});

describe("Pre-registratie-reconciliatie (A2)", () => {
  it("PRE_REGISTERED (20) ∪ AMENDED (5) === registry, en disjunct", () => {
    expect(PRE_REGISTERED_CODES).toHaveLength(20);
    expect(AMENDED_CODES).toHaveLength(5);
    const union = [...PRE_REGISTERED_CODES, ...AMENDED_CODES].sort();
    expect(union).toEqual([...INDICATOR_CODES].sort());
    const overlap = PRE_REGISTERED_CODES.filter((c) => AMENDED_CODES.includes(c));
    expect(overlap).toEqual([]);
  });

  it("geen gescoorde indicator buiten pre-registratie + amendementen (A2-acceptatie)", () => {
    const geregistreerd = new Set([...PRE_REGISTERED_CODES, ...AMENDED_CODES]);
    const onbekend = INDICATOR_CODES.filter(
      (c) => INDICATORS[c].grade !== "D" && !INDICATORS[c].contextOnly && !geregistreerd.has(c),
    );
    expect(onbekend).toEqual([]);
  });

  it("Peters gedocumenteerde grade-overrides blijven zoals vastgelegd (niet 'terugcorrigeren')", () => {
    expect(INDICATORS["I-D3-003"].grade).toBe("D"); // override: uit het cijfer
    expect(INDICATORS["I-D5-001"].grade).toBe("C"); // bevroren GDELT, bewuste keuze 2026-06-02
    expect(INDICATORS["I-D5-002"].grade).toBe("C"); // bronwissel naar Wikipedia
  });
});

describe("v0.4-subset", () => {
  it("KERN_CODES (9) ⊆ registry, geen grade D, geen context; ACHTERGROND ⊆ KERN", () => {
    expect(KERN_CODES).toHaveLength(9);
    for (const c of KERN_CODES) {
      expect(INDICATOR_CODES).toContain(c);
      expect(INDICATORS[c].grade).not.toBe("D");
      expect(INDICATORS[c].contextOnly).not.toBe(true);
    }
    for (const c of ACHTERGROND_CODES) expect(KERN_CODES).toContain(c);
  });
});

describe("Cross-file synchronisatie (faalt bij divergentie)", () => {
  const gemeten = INDICATOR_CODES.filter((c) => !INDICATORS[c].contextOnly).length;

  it("web-copy claimt dezelfde telling als de registry", () => {
    const copy = fileAt("../../web/src/copy.ts");
    const m = copy.match(/(\d+) gemeten indicatoren/);
    expect(m, "copy.ts: verwacht '<n> gemeten indicatoren'").not.toBeNull();
    expect(Number(m![1])).toBe(gemeten);
    const methodology = fileAt("../../web/src/components/Methodology.tsx");
    for (const match of methodology.matchAll(/(\d+) gemeten (?:indicatoren|elementen)/g)) {
      expect(Number(match[1])).toBe(gemeten);
    }
  });

  it("pipeline-constanten volgen de registry", () => {
    const hc = fileAt("../../pipeline/pipeline/healthcheck.py");
    const hcM = hc.match(/EXPECTED_SCORED_INDICATORS = (\d+)/);
    expect(hcM).not.toBeNull();
    expect(Number(hcM![1])).toBe(gemeten);
    const vl = fileAt("../../pipeline/pipeline/verify_live.py");
    const vlM = vl.match(/EXPECTED_INDICATORS = (\d+)/);
    expect(vlM).not.toBeNull();
    expect(Number(vlM![1])).toBe(gemeten);
  });

  it("runtime-output telt evenveel breakdown-entries als de registry gemeten codes heeft", () => {
    const out = computeDaily({ date: "2026-06-01", rawValues: {}, history: {}, compositeHistory: [] });
    expect(out.indicator_breakdown).toHaveLength(gemeten);
    const dEntry = out.indicator_breakdown.find((b) => b.code === "I-D3-003");
    expect(dEntry?.contribution).toBe(0); // grade D: diagnostisch, telt niet mee
  });
});

describe("Test-modus lekt niet (A3) — toPublicOutput", () => {
  it("v04 in test-modus wordt gestript; v0.2-velden blijven byte-identiek", () => {
    const out = computeDaily({ date: "2026-06-01", rawValues: {}, history: {}, compositeHistory: [] });
    expect(out.v04?.mode).toBe("test");
    const pub = toPublicOutput(out);
    expect(pub.v04).toBeUndefined();
    const { v04: _a, ...restOut } = out;
    const { v04: _b, ...restPub } = pub;
    expect(JSON.stringify(restPub)).toBe(JSON.stringify(restOut));
  });

  it("v04 in live-modus blijft staan", () => {
    const out = computeDaily({ date: "2026-06-01", rawValues: {}, history: {}, compositeHistory: [] });
    const live = { ...out, v04: { ...out.v04!, mode: "live" as const } };
    expect(toPublicOutput(live).v04).toBeDefined();
  });
});
