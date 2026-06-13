/**
 * Engine unit tests — reproduceren voorbeelden uit de methodologie-documenten.
 *
 * Bronnen:
 *  • doc 04_Laag-5 §7 — voorbeeld-Z-scores (hitte, file, energie, nieuwsneg., dagen-tot-vakantie)
 *  • doc 05_Laag-6 Annex A — Schema 2 definitieve gewichten
 *  • doc 06_Laag-7 §3 — drempels (70, 90) en 3-dagen-sustained-regel
 */

import { describe, it, expect } from "vitest";
import {
  computeBaseline,
  zscore,
  winsorize,
  computeComposite,
  computeTier,
  domainWeight,
  verifyWeightsSumToOne,
  SCHEMA_2_DOMAIN_WEIGHTS,
  daylightHours,
  percentileRank,
  computeConditionLevel,
  buildPercentileHistory,
  computeDaily,
  computeDemoFraction,
  DEMO_FRACTION_THRESHOLD,
} from "../src/index.js";

describe("Z-scoring (doc 04 §7)", () => {
  // Helper: bouw een baseline direct uit median + sigma
  const baselineFromMedSigma = (median: number, sigma: number) => ({ median, sigma, n: 100 });

  it("Hitte: (34.2 - 22.1) / 5.4 ≈ +2.24", () => {
    const z = zscore(34.2, baselineFromMedSigma(22.1, 5.4));
    expect(z).toBeCloseTo(2.24, 1);
  });

  it("Filezwaarte: (8400 - 6200) / 1100 = +2.00", () => {
    const z = zscore(8400, baselineFromMedSigma(6200, 1100));
    expect(z).toBeCloseTo(2.0, 2);
  });

  it("Energie: (95 - 78) / 12 ≈ +1.42", () => {
    const z = zscore(95, baselineFromMedSigma(78, 12));
    expect(z).toBeCloseTo(1.42, 1);
  });

  it("Nieuwsneg STL-residu: 3.1 / 1.8 ≈ +1.72", () => {
    const z = zscore(3.1, baselineFromMedSigma(0, 1.8));
    expect(z).toBeCloseTo(1.72, 1);
  });

  it("Dagen tot vakantie: (41 - 28) / 19 ≈ +0.68", () => {
    const z = zscore(41, baselineFromMedSigma(28, 19));
    expect(z).toBeCloseTo(0.68, 1);
  });
});

describe("Winsorization (doc 04 §4)", () => {
  it("clipt op +3", () => {
    expect(winsorize(4.5).value).toBe(3);
    expect(winsorize(4.5).clipped).toBe(true);
  });
  it("clipt op -3", () => {
    expect(winsorize(-3.7).value).toBe(-3);
  });
  it("laat normale waarden ongemoeid", () => {
    expect(winsorize(1.5).value).toBe(1.5);
    expect(winsorize(1.5).clipped).toBe(false);
  });
});

describe("Wegingen (doc 05 Annex A)", () => {
  it("Schema 2 gewichten exact zoals pre-geregistreerd", () => {
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D1).toBe(0.211);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D2).toBe(0.135);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D3).toBe(0.223);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D4).toBe(0.108);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D5).toBe(0.155);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D6).toBe(0.172);
  });

  it("Schema 1 gewichten zijn 1/5 per gescoord domein; D6 (context) weegt 0 (A6)", () => {
    expect(domainWeight("equal", "D1")).toBeCloseTo(1 / 5, 5);
    expect(domainWeight("equal", "D5")).toBeCloseTo(1 / 5, 5);
    expect(domainWeight("equal", "D6")).toBe(0);
  });

  it("Schema 2 actief: pro-rata hernormaliseerd zonder D6, verhoudingen bewaard (A6)", () => {
    expect(domainWeight("evidence", "D6")).toBe(0);
    // Verhouding D1/D3 blijft die van de bevroren tabel: 0.211/0.223
    expect(domainWeight("evidence", "D1") / domainWeight("evidence", "D3")).toBeCloseTo(
      0.211 / 0.223,
      5,
    );
  });

  it("Schema 2 sommeert tot ~1.0 (rounding-tolerantie)", () => {
    expect(verifyWeightsSumToOne("evidence")).toBeCloseTo(1.0, 2);
  });

  it("Schema 1 sommeert exact tot 1.0", () => {
    expect(verifyWeightsSumToOne("equal")).toBeCloseTo(1.0, 5);
  });
});

describe("Tier-logica (doc 06 §3 + amendement 2026-06-12: dagelijks reactief)", () => {
  it("één dag ≥ 90 → direct rood (dagregel)", () => {
    const result = computeTier([50, 50, 50, 95]);
    expect(result.tier).toBe("red");
    expect(result.daysInTier).toBe(1);
  });

  it("één dag in 70-90 → direct oranje", () => {
    const result = computeTier([60, 50, 75]);
    expect(result.tier).toBe("amber");
  });

  it("afschalen volgt de dag: onder de drempel → direct groen", () => {
    const result = computeTier([95, 95, 50]);
    expect(result.tier).toBe("green");
    expect(result.daysInTier).toBe(1);
  });

  it("tier volgt de dagband exact (geen meerdaags geheugen meer)", () => {
    const result = computeTier([50, 75, 95, 75, 50]);
    expect(result.tierHistory).toEqual(["green", "amber", "red", "amber", "green"]);
  });

  it("daysInTier telt een aaneengesloten reeks in dezelfde band", () => {
    const result = computeTier([50, 75, 78, 82]);
    expect(result.tier).toBe("amber");
    expect(result.daysInTier).toBe(3);
  });
});

describe("Percentile rank", () => {
  it("Mediaan = 50e percentiel", () => {
    expect(percentileRank(5, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeCloseTo(50, 0);
  });

  it("Hoogste waarde > 90e percentiel", () => {
    expect(percentileRank(10, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeGreaterThan(90);
  });
});

describe("Daglichturen — NOAA Solar (Brussel 50.85°N)", () => {
  it("Zomerzonnewende (21 juni) ≈ 16+ uur", () => {
    const h = daylightHours(new Date("2026-06-21T12:00:00Z"));
    expect(h).toBeGreaterThan(16);
    expect(h).toBeLessThan(17);
  });

  it("Winterzonnewende (21 dec) ≈ 7-8 uur", () => {
    const h = daylightHours(new Date("2026-12-21T12:00:00Z"));
    expect(h).toBeGreaterThan(7);
    expect(h).toBeLessThan(8.5);
  });

  it("Lente-equinox (20 mrt) ≈ 12 uur", () => {
    const h = daylightHours(new Date("2026-03-20T12:00:00Z"));
    expect(h).toBeGreaterThan(11.5);
    expect(h).toBeLessThan(12.5);
  });
});

describe("Conditie-Niveau (publieke 5-bands)", () => {
  it("CN 1 — green + P<50", () => {
    const cn = computeConditionLevel("green", 30, "normal");
    expect(cn.level).toBe(1);
    expect(cn.bannerActive).toBe(false);
  });

  it("CN 2 — green + 50≤P<70", () => {
    const cn = computeConditionLevel("green", 60, "normal");
    expect(cn.level).toBe(2);
    expect(cn.bannerActive).toBe(false);
  });

  it("CN 3 — amber (banner aan)", () => {
    const cn = computeConditionLevel("amber", 75, "normal");
    expect(cn.level).toBe(3);
    expect(cn.bannerActive).toBe(true);
    expect(cn.copyKey).toBe("venster_opent");
  });

  it("CN 4 — red (banner aan, verhoogd)", () => {
    const cn = computeConditionLevel("red", 95, "normal");
    expect(cn.level).toBe(4);
    expect(cn.bannerActive).toBe(true);
    expect(cn.copyKey).toBe("conditie_piek");
  });

  it("CN 5 — brand-safety override OVER-RIJDT andere tier (banner UIT)", () => {
    const cn = computeConditionLevel("red", 95, "elevated");
    expect(cn.level).toBe(5);
    expect(cn.bannerActive).toBe(false);
    expect(cn.copyKey).toBe("brand_safety");
  });

  it("CN 5 — block ook override", () => {
    expect(computeConditionLevel("amber", 75, "block").level).toBe(5);
    expect(computeConditionLevel("green", 30, "block").level).toBe(5);
  });
});

describe("Composite met Schema 1", () => {
  it("Berekent gewogen som over alle domeinen", () => {
    const z = {
      "I-D1-001": 0.5,
      "I-D1-002": 1.0,
      "I-D1-003": 0.0,
      "I-D1-004": 0.5,
      "I-D2-001": 1.5,
      "I-D2-004": 0.5,
      "I-D3-001": 1.0,
      "I-D3-002": 1.0,
      "I-D3-003": 1.0,
      "I-D3-005": 1.0,
      "I-D3-006": 1.0,
      "I-D4-001": 0.5,
      "I-D4-002": 0.5,
      "I-D5-001": 0.8,
      "I-D5-002": 0.8,
      "I-D5-003": 0.8,
      "I-D6-001": 0.3,
      "I-D6-002": 0.3,
      "I-D6-003": 0.3,
      "I-D6-005": 0.3,
    } as const;
    const result = computeComposite(z, "equal");
    expect(result.composite).toBeGreaterThan(0);
    // A6: D6 (kalendercontext) telt niet meer mee → 5 gescoorde domeinen.
    expect(result.domainContributions).toHaveLength(5);
    expect(result.domainContributions.find((c) => c.domain === "D6")).toBeUndefined();
  });

  it("kalendercontext beïnvloedt het composiet niet (A6)", () => {
    const meetwaarden = { "I-D1-002": 1.0, "I-D3-001": 1.0, "I-D5-001": 0.8 } as const;
    const zonder = computeComposite({ ...meetwaarden }, "equal");
    const met = computeComposite(
      { ...meetwaarden, "I-D6-001": 3, "I-D6-002": 3, "I-D6-003": 3, "I-D6-005": 3 },
      "equal",
    );
    expect(met.composite).toBeCloseTo(zonder.composite, 10);
  });
});

describe("Kalendercontext D6 (A6) — context, geen meting", () => {
  it("D6 staat niet in indicator_breakdown of indicators_missing, wél in context_signals", () => {
    // 2026-06-01 valt in de examenperiode (ho2 + cse overlappen).
    const out = computeDaily({
      date: "2026-06-01",
      rawValues: {},
      history: {},
      compositeHistory: [],
    });
    const breakdownCodes = out.indicator_breakdown.map((b) => b.code);
    for (const code of ["I-D6-001", "I-D6-002", "I-D6-003", "I-D6-005"] as const) {
      expect(breakdownCodes).not.toContain(code);
      expect(out.data_quality.indicators_missing).not.toContain(code);
    }
    expect(out.context_signals.map((c) => c.code).sort()).toEqual([
      "I-D6-001",
      "I-D6-002",
      "I-D6-003",
      "I-D6-005",
    ]);
    const examens = out.context_signals.find((c) => c.code === "I-D6-005")!;
    expect(examens.raw_value).toBeGreaterThanOrEqual(1); // het ís examenperiode
    expect(examens).not.toHaveProperty("z_short");
    expect(examens).not.toHaveProperty("state");
    expect(examens.observation_date).toBe("2026-06-01");
  });

  it("de kalender verandert composite.equal niet (geen circulaire kalenderbijdrage)", () => {
    // Identieke meetinputs op een dag mét (1 juni) en zonder (1 oktober) examens:
    // alleen de kalender verschilt, het cijfer mag dat niet doen.
    const mkHist = (anchor: string) =>
      Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.parse(anchor + "T00:00:00Z") - (i + 1) * 86_400_000)
          .toISOString()
          .slice(0, 10),
        value: 10 + (i % 5),
      }));
    const juni = computeDaily({
      date: "2026-06-01", // examenperiode
      rawValues: { "I-D5-001": 12 },
      history: { "I-D5-001": mkHist("2026-06-01") },
      compositeHistory: [],
    });
    const oktober = computeDaily({
      date: "2026-10-01", // geen examenperiode
      rawValues: { "I-D5-001": 12 },
      history: { "I-D5-001": mkHist("2026-10-01") },
      compositeHistory: [],
    });
    const juniExamens = juni.context_signals.find((c) => c.code === "I-D6-005")!;
    const oktExamens = oktober.context_signals.find((c) => c.code === "I-D6-005")!;
    expect(juniExamens.raw_value).toBeGreaterThan(oktExamens.raw_value); // kalender verschilt écht
    expect(juni.composite.equal).toBeCloseTo(oktober.composite.equal, 2); // het cijfer niet
  });
});

describe("Demo-fractie (A7) — gewogen demo-aandeel + score_label", () => {
  it("≥30% gewogen demo-aandeel → demo_fraction ≥ 0.3 (alle D1-codes + D5 simulated)", () => {
    // D1 (6 codes) + D5 (3 codes) = 2 van de 5 gescoorde domeinen volledig demo
    // → gewogen aandeel 0.4 bij volledige dekking.
    const z = {
      "I-D1-001": 0.5, "I-D1-002": 0.5, "I-D1-003": 0.5, "I-D1-004": 0.5,
      "I-D1-009": 0.5, "I-D1-010": 0.5,
      "I-D2-001": 0.5, "I-D2-004": 0.5, "I-D2-009": 0.5,
      "I-D3-001": 0.5, "I-D3-002": 0.5, "I-D3-005": 0.5, "I-D3-006": 0.5,
      "I-D3-007": 0.5, "I-D3-009": 0.5,
      "I-D4-001": 0.5, "I-D4-002": 0.5,
      "I-D5-001": 0.5, "I-D5-002": 0.5, "I-D5-003": 0.5,
    } as const;
    const simulated = [
      "I-D1-001", "I-D1-002", "I-D1-003", "I-D1-004", "I-D1-009", "I-D1-010",
      "I-D5-001", "I-D5-002", "I-D5-003",
    ] as const;
    const f = computeDemoFraction({ ...z }, [...simulated]);
    // Demo-gewicht D1+D5 = 0.4; de noemer mist het 1/7-aandeel van grade-D
    // I-D3-003 binnen D3 (consistent met computeComposite) → 0.4 / (1 − 0.2/7).
    expect(f).toBeCloseTo(0.4 / (1 - 0.2 / 7), 5);
    expect(f).toBeGreaterThanOrEqual(DEMO_FRACTION_THRESHOLD);
  });

  it("geen simulated → fractie 0; integratie: score_label 'echt' en demo_fraction 0", () => {
    expect(computeDemoFraction({ "I-D1-002": 1 }, [])).toBe(0);
    const out = computeDaily({ date: "2026-06-01", rawValues: {}, history: {}, compositeHistory: [] });
    expect(out.data_quality.demo_fraction).toBe(0);
    expect(out.data_quality.score_label).toBe("echt");
  });

  it("simulated-maar-niet-gescoord (missing) telt niet mee", () => {
    // I-D2-009 simulated maar zonder z (ontbreekt) → beïnvloedt het cijfer niet.
    const f = computeDemoFraction({ "I-D1-002": 1, "I-D3-001": 1 }, ["I-D2-009"]);
    expect(f).toBe(0);
  });

  it("grade-D-indicator telt niet mee in de fractie (consistent met computeComposite)", () => {
    const f = computeDemoFraction({ "I-D1-002": 1, "I-D3-003": 2 }, ["I-D3-003"]);
    expect(f).toBe(0);
  });

  it("één simulated indicator die als enige scoort → fractie 1 (het cijfer ís dan demo)", () => {
    expect(computeDemoFraction({ "I-D3-006": 0.2 }, ["I-D3-006"])).toBe(1);
  });

  it("integratie: simulated codes met echte baseline zetten demo_fraction in data_quality", () => {
    const mkHist = () =>
      Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.parse("2026-06-01T00:00:00Z") - (i + 1) * 86_400_000)
          .toISOString()
          .slice(0, 10),
        value: 10 + (i % 5),
      }));
    const out = computeDaily({
      date: "2026-06-01",
      rawValues: { "I-D5-001": 12, "I-D1-002": 12 },
      history: { "I-D5-001": mkHist(), "I-D1-002": mkHist() },
      compositeHistory: [],
      simulatedIndicators: ["I-D5-001"],
    });
    // Gescoord: I-D5-001 + I-D1-002 + deterministische codes (daglicht, deadlines,
    // schoolvakantie — geen historie nodig? wel: zonder 30 punten zijn die missing).
    // Hier scoren alleen de twee met echte historie → demo-aandeel = w(D5)/.
    expect(out.data_quality.demo_fraction).toBeGreaterThan(0);
    expect(out.data_quality.indicators_simulated).toContain("I-D5-001");
  });
});

describe("buildPercentileHistory — lookahead-vrij (review §0-bis.2)", () => {
  it("een bevroren dag verandert niet als er latere data bijkomt", () => {
    const hist3 = [
      { date: "2025-01-01", value: 10 },
      { date: "2025-01-02", value: 20 },
      { date: "2025-01-03", value: 30 },
    ];
    // [10,20,30] + 'vandaag' 40
    const a = buildPercentileHistory(hist3, 40);
    // dezelfde dagen, nu met een extra TOEKOMST-dag (50) erachter
    const b = buildPercentileHistory([...hist3, { date: "2025-01-04", value: 40 }], 50);
    // de percentielen van dag 0..3 mogen niet wijzigen door de latere dag
    expect(b.slice(0, 4)).toEqual(a);
  });

  it("dag t weegt alleen tegen punten t/m t (geen verdunning door latere dagen)", () => {
    const ph = buildPercentileHistory(
      [
        { date: "2025-01-01", value: 1 },
        { date: "2025-01-02", value: 2 },
      ],
      3,
    );
    expect(ph[0]).toBe(50); // enige punt → midrank
    expect(ph[ph.length - 1]).toBeGreaterThan(ph[0]); // laatste = hoogste tot nu
  });
});

describe("Onvoldoende historie → 'ontbreekt', niet 'normaal' (review §0-bis.3)", () => {
  it("een indicator met < 30 historiepunten wordt uitgesloten en toont 'ontbreekt'", () => {
    const thinHistory = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-05-${String(i + 1).padStart(2, "0")}`,
      value: 100 + i,
    }));
    const out = computeDaily({
      date: "2026-06-01",
      rawValues: { "I-D2-001": 200 }, // verse waarde, maar te weinig baseline
      history: { "I-D2-001": thinHistory },
      compositeHistory: [],
    });
    const verkeer = out.indicator_breakdown.find((b) => b.code === "I-D2-001");
    expect(verkeer?.state).toBe("ontbreekt"); // NIET "normaal"
    expect(verkeer?.z_short).toBeNull();
    expect(out.data_quality.indicators_missing).toContain("I-D2-001");
  });
});

describe("Robuuste z-score bij MAD = 0 (review §4.1)", () => {
  it("MAD=0 maar wél spreiding → eindige z via IQR-fallback (geen stille 0)", () => {
    // mediaan 0; >50% nullen → MAD=0; maar er is spreiding → IQR vangt het op
    const baseline = computeBaseline([0, 0, 0, 0, 0, 0, 1, 2, 3, 4]);
    const z = zscore(4, baseline);
    expect(Number.isFinite(z)).toBe(true);
    expect(z).not.toBe(0);
  });
  it("volledig constante baseline → NaN (geen schaal), niet 0 en niet ±∞", () => {
    const z = zscore(5, computeBaseline([5, 5, 5, 5, 5]));
    expect(Number.isNaN(z)).toBe(true);
  });
});

describe("Baseline-vensters §4.1.7 (v0.3.3): dag 24m / maand-jaarritme 60m, rollend", () => {
  const DAY_MS = 86_400_000;
  /** i hele maanden vóór het anker, op de 1e van de maand (ISO). */
  const monthBack = (anchor: string, i: number): string => {
    const d = new Date(anchor + "T00:00:00Z");
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    return d.toISOString().slice(0, 10);
  };
  const dayBack = (anchor: string, i: number): string =>
    new Date(Date.parse(anchor + "T00:00:00Z") - i * DAY_MS).toISOString().slice(0, 10);

  it("maandbron (I-D3-006) weegt tegen de laatste 60 maanden, niet de volle historie", () => {
    // 18 jaar maanddata: oud regime ~100, recentste ~59 maanden ~3. Vandaag 3,2:
    // binnen het 60m-venster gewoon (|z| klein); tegen de volle historie zou de
    // mediaan ~100 zijn en de z op de winsor-grens -3 klemmen.
    const hist = Array.from({ length: 216 }, (_, k) => {
      const i = 215 - k; // oudste eerst
      return {
        date: monthBack("2026-06-13", i),
        value: i < 60 ? 3.0 + (i % 5) * 0.1 : 100 + (i % 5),
      };
    });
    const out = computeDaily({
      date: "2026-06-13",
      rawValues: { "I-D3-006": 3.2 },
      history: { "I-D3-006": hist },
      compositeHistory: [],
    });
    expect(out.data_quality.indicators_missing).not.toContain("I-D3-006");
    const row = out.indicator_breakdown.find((b) => b.code === "I-D3-006")!;
    expect(row).toBeDefined();
    expect(row.z_short).toBeGreaterThan(-3); // niet tegen het oude regime geklemd
    expect(Math.abs(row.z_short)).toBeLessThan(2); // gewoon binnen het recente regime
  });

  it("dagbron (I-D5-001): punten ouder dan 24 maanden tellen niet mee in de baseline", () => {
    // 40 oude punten (ouder dan 24m) + 29 recente: het venster laat n=29 over,
    // onder MIN_HISTORY_FOR_Z (30) → eerlijk "ontbreekt". Zonder venster zou
    // n=69 de indicator (tegen verouderde data) gewoon scoren.
    const oud = Array.from({ length: 40 }, (_, i) => ({
      date: dayBack("2026-06-13", 800 + i),
      value: 100 + (i % 3),
    }));
    const recent = Array.from({ length: 29 }, (_, i) => ({
      date: dayBack("2026-06-13", 1 + i),
      value: 10 + (i % 3),
    }));
    const out = computeDaily({
      date: "2026-06-13",
      rawValues: { "I-D5-001": 10 },
      history: { "I-D5-001": [...oud, ...recent] },
      compositeHistory: [],
    });
    expect(out.data_quality.indicators_missing).toContain("I-D5-001");

    // Tegenproef: 31 recente punten → wél gescoord, tegen het recente regime.
    const recent31 = Array.from({ length: 31 }, (_, i) => ({
      date: dayBack("2026-06-13", 1 + i),
      value: 10 + (i % 3),
    }));
    const out2 = computeDaily({
      date: "2026-06-13",
      rawValues: { "I-D5-001": 10 },
      history: { "I-D5-001": [...oud, ...recent31] },
      compositeHistory: [],
    });
    expect(out2.data_quality.indicators_missing).not.toContain("I-D5-001");
    const row = out2.indicator_breakdown.find((b) => b.code === "I-D5-001")!;
    expect(Math.abs(row.z_short)).toBeLessThan(2); // ~mediaan van het recente regime
  });

  it("eCDF-gate (§4.1.6) blijft de VOLLE historie zien: 3+ jaargangen dagdata kwalificeert nog steeds", () => {
    // 3,1 jaar dagdata — het 24m-venster zou de gate (≥3 jaargangen) onmogelijk
    // maken als hij op de getrimde reeks keek; hij moet op de volle reeks blijven.
    const hist = Array.from({ length: 1130 }, (_, k) => ({
      date: dayBack("2026-06-13", 1130 - k),
      value: 1 + ((k % 11) / 10),
    }));
    const out = computeDaily({
      date: "2026-06-13",
      rawValues: { "I-D5-001": 1.3 },
      history: { "I-D5-001": hist },
      compositeHistory: [],
    });
    const row = out.indicator_breakdown.find((b) => b.code === "I-D5-001")!;
    expect(row).toBeDefined();
    expect(row.normalization).toBe("ecdf");
  });
});
