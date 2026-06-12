/**
 * B8 — evidence-grading zichtbaar en eerlijk (02_VERBETERPLAN BLOK B).
 * Deze suite pint:
 *  • elke geregistreerde indicator heeft een inhoudelijke evidenceNote;
 *  • user-facing copy bevat geen em-dash (huisregel CLAUDE.md §9);
 *  • signalen die niet meetellen (grade D, kalendercontext) zeggen dat
 *    expliciet in hun note — geen stille schijn van meetellen;
 *  • de notes claimen geen "gereduceerd gewicht" in het hoofdcijfer
 *    (het publieke cijfer gebruikt gelijke domeingewichten; alleen het
 *    parallelle evidence-schema weegt op grade — zie weights.ts).
 */

import { describe, it, expect } from "vitest";
import { INDICATORS, INDICATOR_CODES } from "../src/index.js";
import { PLAIN } from "../src/indicators/plain-language.js";

const EM_DASH = "—";

describe("B8 · evidenceNote per indicator", () => {
  it("elke geregistreerde indicator heeft een inhoudelijke evidenceNote", () => {
    for (const code of INDICATOR_CODES) {
      const note = PLAIN[code].evidenceNote;
      expect(note, `${code} mist evidenceNote`).toBeTruthy();
      expect(note.length, `${code}: evidenceNote te kort om inhoudelijk te zijn`).toBeGreaterThanOrEqual(60);
    }
  });

  it("grade D zegt expliciet dat hij niet meetelt in het cijfer", () => {
    for (const code of INDICATOR_CODES) {
      if (INDICATORS[code].grade !== "D") continue;
      expect(
        PLAIN[code].evidenceNote.includes("telt") && PLAIN[code].evidenceNote.includes("niet mee"),
        `${code} (grade D): note moet expliciet zeggen dat hij niet meetelt`,
      ).toBe(true);
    }
  });

  it("kalendercontext (contextOnly) zegt expliciet dat hij niet meetelt", () => {
    for (const code of INDICATOR_CODES) {
      if (!INDICATORS[code].contextOnly) continue;
      expect(
        PLAIN[code].evidenceNote.includes("telt") && PLAIN[code].evidenceNote.includes("niet mee"),
        `${code} (contextOnly): note moet expliciet zeggen dat hij niet meetelt`,
      ).toBe(true);
    }
  });

  it("notes claimen geen gereduceerd gewicht in het hoofdcijfer (equal-schema kent dat niet)", () => {
    for (const code of INDICATOR_CODES) {
      expect(
        PLAIN[code].evidenceNote.includes("gereduceerd gewicht"),
        `${code}: "gereduceerd gewicht" geldt alleen in het evidence-controleschema, niet in het hoofdcijfer`,
      ).toBe(false);
      expect(
        PLAIN[code].why.includes("gereduceerd gewicht"),
        `${code}: why-copy mag geen gewichtsclaim over het hoofdcijfer maken`,
      ).toBe(false);
    }
  });
});

describe("B8 · user-facing copy zonder em-dash (huisregel)", () => {
  it("plain/why/reads/evidenceNote/bronnamen/referentielabels bevatten geen em-dash", () => {
    for (const code of INDICATOR_CODES) {
      const p = PLAIN[code];
      const fields: Array<[string, string]> = [
        ["plain", p.plain],
        ["why", p.why],
        ["reads", p.reads],
        ["evidenceNote", p.evidenceNote],
        ["dataSource.name", p.dataSource.name],
        ...p.references.map((r, i): [string, string] => [`references[${i}].label`, r.label]),
      ];
      for (const [field, value] of fields) {
        expect(value.includes(EM_DASH), `${code}.${field} bevat een em-dash: "${value}"`).toBe(false);
      }
    }
  });
});
