/**
 * C2 — kalibratie-synchronisatietest (02_VERBETERPLAN BLOK C).
 * De claim "de triggerdrempels zijn gekalibreerd via de backtest" is alleen
 * verifieerbaar als (a) er een artefact bestaat dat vastlegt met welke
 * drempels, periode en n de backtest draaide, en (b) de engine-constanten
 * daar aantoonbaar mee samenvallen. Deze suite faalt zodra iemand een
 * drempel wijzigt zonder her-backtest + nieuw artefact + CHANGELOG —
 * hetzelfde bewuste-frictie-patroon als registry.test.ts.
 *
 * Artefact: app/data/backtest-calibration.json (gecommit, geen CI-output);
 * schrijver: src/cli/backtest.ts.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  SPIKE_DREMPEL,
  TRIGGER_P70,
  TRIGGER_P90,
  LOAD_K,
  SUSTAINED_DAYS,
  COOLDOWN_H,
  ERNST_DREMPEL,
  V04_AMBER_P,
  V04_RED_P,
  V04_AMBER_SUSTAIN,
  V04_RED_SUSTAIN,
} from "../src/index.js";

const artifact = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../data/backtest-calibration.json", import.meta.url)),
    "utf-8",
  ),
) as {
  generated_at: string;
  period: { start: string; end: string; n_days: number };
  thresholds: Record<string, unknown>;
};

describe("C2 · backtest-kalibratie verifieerbaar", () => {
  it("artefact bestaat met datum, periode en n", () => {
    expect(artifact.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(artifact.period.start < artifact.period.end).toBe(true);
    expect(artifact.period.n_days).toBeGreaterThanOrEqual(300);
  });

  it("engine-drempels vallen exact samen met het gekalibreerde artefact", () => {
    const t = artifact.thresholds;
    expect(SPIKE_DREMPEL).toBe(t.SPIKE_DREMPEL);
    expect(TRIGGER_P70).toBe(t.TRIGGER_P70);
    expect(TRIGGER_P90).toBe(t.TRIGGER_P90);
    expect(LOAD_K).toBe(t.LOAD_K);
    expect(SUSTAINED_DAYS).toBe(t.SUSTAINED_DAYS);
    // COOLDOWN_H en ERNST_DREMPEL zijn per-klasse-objecten: diepe gelijkheid.
    expect(COOLDOWN_H).toStrictEqual(t.COOLDOWN_H);
    expect(ERNST_DREMPEL).toStrictEqual(t.ERNST_DREMPEL);
    expect(V04_AMBER_P).toBe(t.V04_AMBER_P);
    expect(V04_RED_P).toBe(t.V04_RED_P);
    expect(V04_AMBER_SUSTAIN).toBe(t.V04_AMBER_SUSTAIN);
    expect(V04_RED_SUSTAIN).toBe(t.V04_RED_SUSTAIN);
  });
});
