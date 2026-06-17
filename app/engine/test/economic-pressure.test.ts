/**
 * Absolute economische stress-meting "vs normale tijden" (amendement §4.1.9,
 * Peter GO 2026-06-17). Pint de helper-correctheid (normalCdf, MAD-z tegen de
 * vaste 2010-2019 baseline, inverse-codering, winsorize, equal vs demografisch),
 * de eerlijke not_computed-terugval, en de integratie in computeDaily.
 */
import { describe, it, expect } from "vitest";
import {
  computeEconomicPressure,
  normalCdf,
  ECONOMIC_PRESSURE_CODES,
} from "../src/methodology/economic-pressure.js";
import { MAD_SCALE_FACTOR } from "../src/methodology/zscore.js";
import { computeDaily } from "../src/index.js";
import type { IndicatorCode } from "../src/types.js";

/**
 * 120 maandpunten 2010-01..2019-12 die cyclisch [k-1, k, k+1] doorlopen:
 * mediaan = k, MAD = MAD_SCALE_FACTOR (mediaan der |afwijkingen| = 1). Zo is
 * een dagwaarde k + d*MAD exact d sigma boven de normale-decennium-mediaan.
 */
function baseline2010s(k: number): Array<{ date: string; value: number }> {
  const out: Array<{ date: string; value: number }> = [];
  let idx = 0;
  for (let year = 2010; year <= 2019; year++) {
    for (let month = 1; month <= 12; month++) {
      const offset = [-1, 0, 1][idx % 3];
      out.push({ date: `${year}-${String(month).padStart(2, "0")}-01`, value: k + offset });
      idx++;
    }
  }
  return out;
}

const MAD = MAD_SCALE_FACTOR; // = 1.4826

/** Bouw historie: per economische code de 2010s-baseline + één latere dagwaarde
 *  die exact `z` sigma boven (of, voor inverse, onder) de mediaan ligt. */
function economicHistory(
  zByCode: Partial<Record<IndicatorCode, { z: number; inverse?: boolean; k?: number }>>,
): Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> {
  const hist: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};
  for (const code of ECONOMIC_PRESSURE_CODES) {
    const spec = zByCode[code];
    if (!spec) continue;
    const k = spec.k ?? 5;
    const series = baseline2010s(k);
    // inverse: lage onderliggende waarde -> hoge stress; latest onder de mediaan.
    const delta = (spec.inverse ? -spec.z : spec.z) * MAD;
    series.push({ date: "2026-05-01", value: k + delta });
    hist[code] = series;
  }
  return hist;
}

describe("normalCdf (Phi)", () => {
  it("Phi(0) = 0.5", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
  });
  it("Phi(1) ~ 0.8413, Phi(-1) ~ 0.1587 (symmetrie)", () => {
    expect(normalCdf(1)).toBeCloseTo(0.8413, 4);
    expect(normalCdf(-1)).toBeCloseTo(0.1587, 4);
    expect(normalCdf(1) + normalCdf(-1)).toBeCloseTo(1, 6);
  });
  it("monotoon stijgend", () => {
    expect(normalCdf(-2)).toBeLessThan(normalCdf(0));
    expect(normalCdf(0)).toBeLessThan(normalCdf(2));
  });
});

describe("computeEconomicPressure — MAD-z tegen vaste 2010-2019 baseline", () => {
  it("alle indicatoren op de mediaan -> zbar 0 -> score 50", () => {
    const hist = economicHistory({
      "I-D3-001": { z: 0 },
      "I-D2-004": { z: 0 },
      "I-D3-007": { z: 0, inverse: true },
      "I-D3-005": { z: 0 },
      "I-D3-006": { z: 0 },
    });
    const ep = computeEconomicPressure(hist, "2026-06-17");
    expect(ep.status).toBe("computed");
    expect(ep.zbar_equal).toBe(0);
    expect(ep.score).toBe(50);
  });

  it("alle indicatoren +1 sigma (inverse correct) -> zbar 1 -> score 84", () => {
    const hist = economicHistory({
      "I-D3-001": { z: 1 },
      "I-D2-004": { z: 1 },
      "I-D3-007": { z: 1, inverse: true }, // latest ONDER mediaan, z na inverse = +1
      "I-D3-005": { z: 1 },
      "I-D3-006": { z: 1 },
    });
    const ep = computeEconomicPressure(hist, "2026-06-17");
    expect(ep.status).toBe("computed");
    expect(ep.n_indicators).toBe(5);
    expect(ep.zbar_equal).toBe(1);
    expect(ep.score).toBe(84);
    expect(ep.score_demographic).toBe(84); // alle z gelijk -> elke weging geeft 84
    for (const ind of ep.indicators) expect(ind.z).toBe(1);
    // De inverse indicator heeft een latest ONDER de mediaan maar z = +1.
    const cons = ep.indicators.find((i) => i.code === "I-D3-007")!;
    expect(cons.inverse_coded).toBe(true);
    expect(cons.latest_value).toBeLessThan(cons.baseline_median);
    expect(cons.z).toBe(1);
  });

  it("winsorize: een extreme uitschieter wordt op +3 geklemd", () => {
    const hist = economicHistory({
      "I-D3-001": { z: 10 }, // ruw z = 10 -> winsor 3
      "I-D2-004": { z: 0 },
      "I-D3-007": { z: 0, inverse: true },
      "I-D3-005": { z: 0 },
      "I-D3-006": { z: 0 },
    });
    const ep = computeEconomicPressure(hist, "2026-06-17");
    const infl = ep.indicators.find((i) => i.code === "I-D3-001")!;
    expect(infl.z).toBe(3);
    expect(ep.zbar_equal).toBeCloseTo(3 / 5, 6);
  });

  it("lookahead-veilig: een toekomstige waarde telt niet als latest", () => {
    const hist = economicHistory({
      "I-D3-001": { z: 2 },
      "I-D2-004": { z: 2 },
      "I-D3-005": { z: 2 },
    });
    // voeg een nog latere, veel hogere waarde toe NA de asOf
    hist["I-D3-001"]!.push({ date: "2030-01-01", value: 999 });
    const ep = computeEconomicPressure(hist, "2026-06-17");
    const infl = ep.indicators.find((i) => i.code === "I-D3-001")!;
    expect(infl.latest_date).toBe("2026-05-01"); // niet 2030
    expect(infl.z).toBe(2);
  });
});

describe("computeEconomicPressure — eerlijke not_computed", () => {
  it("lege historie -> not_computed, score null (harde regel 2)", () => {
    const ep = computeEconomicPressure({}, "2026-06-17");
    expect(ep.status).toBe("not_computed");
    expect(ep.score).toBeNull();
    expect(ep.zbar_equal).toBeNull();
    expect(ep.n_indicators).toBe(0);
    expect(ep.not_computed_reason).toBeTruthy();
  });

  it("minder dan 3 indicatoren met baseline -> not_computed", () => {
    const hist = economicHistory({ "I-D3-001": { z: 1 }, "I-D2-004": { z: 1 } });
    const ep = computeEconomicPressure(hist, "2026-06-17");
    expect(ep.status).toBe("not_computed");
    expect(ep.n_indicators).toBe(2);
  });

  it("te dunne 2010-2019-baseline (onder de minimumdrempel) telt niet mee", () => {
    // Slechts 12 maandpunten in 2010 -> onder MIN_ECONOMIC_BASELINE_POINTS.
    const thin: Array<{ date: string; value: number }> = [];
    for (let m = 1; m <= 12; m++) thin.push({ date: `2010-${String(m).padStart(2, "0")}-01`, value: 5 + (m % 3) });
    thin.push({ date: "2026-05-01", value: 9 });
    const ep = computeEconomicPressure({ "I-D3-001": thin, "I-D2-004": thin, "I-D3-005": thin }, "2026-06-17");
    expect(ep.status).toBe("not_computed");
  });
});

describe("integratie in computeDaily", () => {
  it("vult output.economic_pressure met een echte 2010-2019 baseline", () => {
    const hist = economicHistory({
      "I-D3-001": { z: 1 },
      "I-D2-004": { z: 1 },
      "I-D3-007": { z: 1, inverse: true },
      "I-D3-005": { z: 1 },
      "I-D3-006": { z: 1 },
    });
    const out = computeDaily({ date: "2026-06-17", history: hist, compositeHistory: [] });
    expect(out.economic_pressure).toBeDefined();
    expect(out.economic_pressure!.status).toBe("computed");
    expect(out.economic_pressure!.score).toBe(84);
    expect(out.economic_pressure!.baseline_window).toBe("2010-2019");
    expect(out.economic_pressure!.mapping).toBe("normal_cdf");
  });

  it("not_computed wanneer de historie geen 2010-2019 dekt (bv. de bridge)", () => {
    // Alleen recente synthetische historie, geen decennium-baseline.
    const recent: Array<{ date: string; value: number }> = [];
    for (let i = 0; i < 40; i++) recent.push({ date: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`, value: 5 });
    const out = computeDaily({
      date: "2026-06-17",
      history: { "I-D3-001": recent, "I-D2-004": recent },
      compositeHistory: [],
    });
    expect(out.economic_pressure!.status).toBe("not_computed");
    expect(out.economic_pressure!.score).toBeNull();
  });
});

describe("label-eerlijkheid", () => {
  it("label benoemt economische druk vs normale tijden, zonder em-dash (§4.1.10)", () => {
    const ep = computeEconomicPressure({}, "2026-06-17");
    expect(ep.label.toLowerCase()).toContain("economische druk");
    expect(ep.label.toLowerCase()).toContain("normale tijden");
    expect(ep.label).not.toContain("—"); // geen em-dash (harde regel 9)
  });
});
