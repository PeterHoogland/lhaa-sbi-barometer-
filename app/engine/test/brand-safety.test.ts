/**
 * Brand-safety — unit-tests voor de verdriet-/rouw-gestuurde CTA-pauze.
 * Bron: HANDOVER §3 punt 8 (blinde vlek nationale rouw). Pure functie, dus we
 * pinnen de LOGICA (de twee remmen + cold-start), niet de exacte kalibratie van
 * de provisoire drempels.
 */

import { describe, it, expect } from "vitest";
import {
  decideBrandSafety,
  VERDRIET_SHARE_MIN,
  VERDRIET_COLD_START_FLOOR,
  MIN_VERDRIET_HISTORY,
  type VerdrietSignal,
} from "../src/index.js";

const TODAY = "2026-06-03";

function sig(over: Partial<VerdrietSignal>): VerdrietSignal {
  return { intensity: null, totalEmotie: null, percentile: null, historyN: 0, ...over };
}

describe("decideBrandSafety — geen data / lege dag", () => {
  it("geen verdriet-waarde → normal", () => {
    expect(decideBrandSafety(sig({}), TODAY).flag).toBe("normal");
  });

  it("verdriet = 0 → normal", () => {
    expect(decideBrandSafety(sig({ intensity: 0, totalEmotie: 0.4 }), TODAY).flag).toBe("normal");
  });

  it("geen totale emotie-lading (deling door 0) → normal, geen crash", () => {
    expect(decideBrandSafety(sig({ intensity: 0.8, totalEmotie: 0 }), TODAY).flag).toBe("normal");
  });
});

describe("decideBrandSafety — Rem 1: aandeel (rouw vs woede/angst)", () => {
  it("woededag: hoge totale lading maar verdriet is een klein aandeel → normal", () => {
    // verdriet 0.6 maar totaal 3.0 → aandeel 0.2 < 0.4: dit is geen rouwdag.
    const d = decideBrandSafety(sig({ intensity: 0.6, totalEmotie: 3.0, historyN: 0 }), TODAY);
    expect(d.flag).toBe("normal");
  });

  it("rouwdag: verdriet is de leidende emotie én boven de cold-start-vloer → elevated", () => {
    // aandeel 0.8/1.0 = 0.8 ≥ 0.4 en intensiteit 0.8 ≥ vloer.
    const d = decideBrandSafety(sig({ intensity: 0.8, totalEmotie: 1.0, historyN: 0 }), TODAY);
    expect(d.flag).toBe("elevated");
    expect(d.reason).toBeTruthy();
    expect(d.expires_estimated).toBeTruthy();
  });

  it("aandeel precies onder de drempel → normal", () => {
    const justUnder = VERDRIET_SHARE_MIN - 0.01;
    const total = 2.0;
    const d = decideBrandSafety(
      sig({ intensity: total * justUnder, totalEmotie: total, historyN: 0 }),
      TODAY,
    );
    expect(d.flag).toBe("normal");
  });
});

describe("decideBrandSafety — Rem 2: piek (cold-start, absolute vloer)", () => {
  it("leidend aandeel maar onder de cold-start-vloer → normal", () => {
    // aandeel 0.1/0.15 = 0.67 ≥ 0.4, maar intensiteit 0.1 < vloer → rustige dag.
    const d = decideBrandSafety(sig({ intensity: 0.1, totalEmotie: 0.15, historyN: 5 }), TODAY);
    expect(d.flag).toBe("normal");
  });

  it("leidend aandeel én op de cold-start-vloer → elevated", () => {
    const d = decideBrandSafety(
      sig({ intensity: VERDRIET_COLD_START_FLOOR, totalEmotie: VERDRIET_COLD_START_FLOOR, historyN: 0 }),
      TODAY,
    );
    expect(d.flag).toBe("elevated");
  });
});

describe("decideBrandSafety — Rem 2: piek (met historie, percentiel)", () => {
  const enoughHistory = MIN_VERDRIET_HISTORY;

  it("genoeg historie + percentiel-piek (top-decile) + leidend aandeel → elevated", () => {
    // Lage absolute intensiteit (onder de vloer), maar mét historie telt het
    // percentiel: een rustige reeks waarin vandaag tóch uitzonderlijk is.
    const d = decideBrandSafety(
      sig({ intensity: 0.3, totalEmotie: 0.5, percentile: 96, historyN: enoughHistory }),
      TODAY,
    );
    expect(d.flag).toBe("elevated");
  });

  it("genoeg historie maar percentiel niet hoog → normal (ook al haalt het de vloer)", () => {
    const d = decideBrandSafety(
      sig({ intensity: 0.9, totalEmotie: 1.2, percentile: 60, historyN: enoughHistory }),
      TODAY,
    );
    expect(d.flag).toBe("normal");
  });

  it("met historie negeert de cold-start-vloer en gebruikt het percentiel", () => {
    // Hoge intensiteit boven de vloer, maar het percentiel is laag → geen piek.
    const d = decideBrandSafety(
      sig({ intensity: 5.0, totalEmotie: 8.0, percentile: 40, historyN: enoughHistory }),
      TODAY,
    );
    expect(d.flag).toBe("normal");
  });
});

describe("decideBrandSafety — vlag-vorm", () => {
  it("vuurt nooit zelfstandig 'block' (block blijft mensenwerk)", () => {
    const d = decideBrandSafety(sig({ intensity: 50, totalEmotie: 50, percentile: 100, historyN: 99 }), TODAY);
    expect(d.flag).toBe("elevated");
  });

  it("expires_estimated ligt na vandaag", () => {
    const d = decideBrandSafety(sig({ intensity: 0.8, totalEmotie: 1.0 }), TODAY);
    expect(Date.parse(d.expires_estimated!)).toBeGreaterThan(Date.parse(TODAY + "T12:00:00Z"));
  });
});
