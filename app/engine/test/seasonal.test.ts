import { describe, it, expect } from "vitest";
import {
  seasonalDistance,
  withinSeason,
  seasonalReference,
  seasonalPercentile,
  buildSeasonalPercentileHistory,
} from "../src/methodology/seasonal-percentile.js";

describe("Seizoens-afstand (cyclisch)", () => {
  it("1 jan en 31 dec liggen ~1 dag uit elkaar (wraparound)", () => {
    expect(seasonalDistance(0, 364)).toBeLessThanOrEqual(2);
  });
  it("zelfde dag = 0", () => {
    expect(seasonalDistance(150, 150)).toBe(0);
  });
  it("half jaar uit elkaar ~183", () => {
    expect(seasonalDistance(0, 183)).toBe(183);
  });
});

describe("withinSeason", () => {
  it("twee junidagen vallen samen binnen ±45", () => {
    expect(withinSeason("2024-06-10", "2026-06-02", 45)).toBe(true);
  });
  it("juni en december vallen niet samen", () => {
    expect(withinSeason("2024-12-15", "2026-06-02", 45)).toBe(false);
  });
  it("juni en januari vallen samen via de jaargrens (wraparound)", () => {
    expect(withinSeason("2025-12-28", "2026-01-10", 45)).toBe(true);
  });
});

describe("seasonalReference + percentiel", () => {
  // 3 jaar dagdata: zomer hoog, winter laag (sinus). Een gemiddelde zomerdag moet
  // ~midden scoren tegen andere zomerdagen, NIET extreem (zoals tegen het hele jaar).
  const history: Array<{ date: string; value: number }> = [];
  for (let i = 0; i < 365 * 3; i++) {
    const d = new Date(Date.UTC(2023, 0, 1) + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const doy = i % 365;
    const seasonal = Math.sin((doy / 365) * 2 * Math.PI - Math.PI / 2); // -1 winter, +1 zomer
    history.push({ date: iso, value: seasonal });
  }

  it("seizoensreferentie pakt alleen dezelfde periode (veel minder punten dan het volledige venster)", () => {
    const ref = seasonalReference(history, "2026-07-01", 45);
    expect(ref.length).toBeGreaterThan(30);
    expect(ref.length).toBeLessThan(history.length / 2);
  });

  it("een typische zomerwaarde scoort midden tegen zomerdagen, maar hoog tegen het hele jaar", () => {
    const julyValue = 0.95; // hoog in absolute zin, maar normaal voor juli
    const seasonalP = seasonalPercentile(julyValue, "2026-07-01", history, 45, 30);
    const fullYearP =
      (history.filter((h) => h.value < julyValue).length / history.length) * 100;
    expect(seasonalP).toBeLessThan(85); // niet extreem voor het seizoen
    expect(fullYearP).toBeGreaterThan(90); // wel extreem tegen het hele jaar
    expect(seasonalP).toBeLessThan(fullYearP); // seizoen corrigeert de oneerlijkheid
  });

  it("te weinig seizoenspunten → terugval op het volledige venster", () => {
    const tiny = history.slice(0, 5);
    const p = seasonalPercentile(0.5, "2026-07-01", tiny, 45, 30);
    // valt terug op alle 5 punten i.p.v. een lege seizoensset
    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });
});

describe("buildSeasonalPercentileHistory is lookahead-vrij", () => {
  it("elke dag weegt enkel tegen punten met datum ≤ die dag", () => {
    const hist = [
      { date: "2026-01-01", value: 0 },
      { date: "2026-01-02", value: 10 },
      { date: "2026-01-03", value: -10 },
    ];
    const out = buildSeasonalPercentileHistory(hist, { date: "2026-01-04", value: 5 }, 45, 1);
    // eerste dag: enkel zichzelf → 50
    expect(out[0]).toBe(50);
    // tweede dag (10) is het hoogste van {0,10} → 75 (midrank boven)
    expect(out[1]).toBeGreaterThan(50);
    expect(out.length).toBe(4);
  });
});
