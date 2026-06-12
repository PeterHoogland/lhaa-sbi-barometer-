/**
 * SBI v0.4 — backtest (HANDOVER §2 v0.4-richtlijn §8).
 *
 * Draait de engine dag-na-dag over de ECHTE historie (geen netwerk, geen
 * synthetische vulling) en aggregeert hoe vaak/hoe lang de v0.4-meting oranje of
 * rood haalt, en hoeveel triggers er vuren. Zo zie je objectief of de huidige
 * (ongekalibreerde) drempels te streng of te los staan — vóór je ze bijstelt.
 *
 * Lookahead-vrij voor wat GERAPPORTEERD wordt: alle geaggregeerde stats komen uit
 * de v0.4-laag (windowedZ = trailing slice ≤ dag t) en de composiet-historie wordt
 * progressief opgebouwd (push ná elke dag). Bekende, bewuste beperking: de
 * v0.2-z-laag binnen computeDaily krijgt per dag de VOLLEDIGE per-indicator-historie
 * en heeft dus een residuele lookahead via de z-baseline. Die v0.2-waarden worden
 * hier niet gerapporteerd; per-dag clippen zou de v0.2-composietreeks verschuiven
 * en de facto een herkalibratie van de v0.4-drempels zijn — alleen doen als bewuste
 * beslissing met vóór/ná-vergelijking (zie verbeterplan A5).
 * Run: npm run backtest [-- --from YYYY-MM-DD].
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { INDICATOR_CODES, INDICATORS } from "../indicators/registry.js";
import { computeDaily } from "../runtime.js";
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
  type TriggerState,
} from "../index.js";
import type { IndicatorCode, Tier } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = resolve(__dirname, "../../../data/history");
const CALIBRATION_OUT = resolve(__dirname, "../../../data/backtest-calibration.json");

type Series = Array<{ date: string; value: number }>;

function loadHistory(): Partial<Record<IndicatorCode, Series>> {
  const out: Partial<Record<IndicatorCode, Series>> = {};
  for (const code of INDICATOR_CODES) {
    const p = resolve(HISTORY_DIR, `${code}.json`);
    if (!existsSync(p)) continue;
    try {
      const rows = JSON.parse(readFileSync(p, "utf-8")) as Series;
      if (Array.isArray(rows) && rows.length > 0) {
        out[code] = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
      }
    } catch {
      /* skip corrupt */
    }
  }
  return out;
}

/** Laatste waarde met datum ≤ asOf (dekt zowel dag- als maandreeksen). */
function valueAsOf(series: Series, asOf: string): number | undefined {
  let val: number | undefined;
  for (const p of series) {
    if (p.date <= asOf) val = p.value;
    else break;
  }
  return val;
}

function isoAddDays(iso: string, days: number): string {
  const d = new Date(Date.parse(iso + "T00:00:00Z") + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function pct(arr: number[], q: number): number {
  if (arr.length === 0) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor((q / 100) * s.length));
  return s[i];
}

function main(): void {
  const args = process.argv.slice(2);
  const fromArg = args.indexOf("--from");
  const history = loadHistory();

  const realBaselineCodes = INDICATOR_CODES.filter((c) => (history[c]?.length ?? 0) >= 60);

  // Startdatum: default vanaf het begin van de echte nieuws-reeks (kern komt dan
  // grotendeels online); eerder leveren alleen de economische bronnen een waarde.
  const start = fromArg >= 0 ? args[fromArg + 1] : history["I-D5-001"]?.[0]?.date ?? "2024-05-21";
  const today = new Date();
  const end = today.toISOString().slice(0, 10);

  const compositeHistory: Array<{ date: string; value: number }> = [];
  const compositeMetingHistory: Array<{ date: string; value: number }> = [];
  let triggerState: TriggerState = { last_fired: {}, recent: [] };

  const tierDays: Record<Tier, number> = { green: 0, amber: 0, red: 0 };
  const pctLang: number[] = [];
  const loadFactors: number[] = [];
  const triggersByType: Record<string, number> = {};
  const triggersBySeverity: Record<string, number> = {};
  const triggersByMonth: Record<string, number> = {};
  let totalTriggers = 0;
  let nDays = 0;

  for (let d = start; d <= end; d = isoAddDays(d, 1)) {
    const rawValues: Partial<Record<IndicatorCode, number>> = {};
    for (const code of INDICATOR_CODES) {
      const s = history[code];
      if (!s) continue;
      const v = valueAsOf(s, d);
      if (v !== undefined) rawValues[code] = v;
    }

    const out = computeDaily({
      date: d,
      rawValues,
      history,
      compositeHistory,
      compositeMetingHistory,
      simulatedIndicators: [],
      realBaselineCodes,
      priorTriggerState: triggerState,
      nowISO: d + "T08:00:00Z",
    });

    compositeHistory.push({ date: d, value: out.composite.equal });
    if (out.v04) {
      const v = out.v04;
      compositeMetingHistory.push({ date: d, value: v.composite.meting });
      tierDays[v.tier.current]++;
      pctLang.push(v.percentile.lang);
      loadFactors.push(v.composite.load_factor);
      triggerState = v.trigger_state;
      for (const t of v.triggers) {
        totalTriggers++;
        triggersByType[t.type] = (triggersByType[t.type] ?? 0) + 1;
        triggersBySeverity[t.severity] = (triggersBySeverity[t.severity] ?? 0) + 1;
        const ym = t.fired_at.slice(0, 7);
        triggersByMonth[ym] = (triggersByMonth[ym] ?? 0) + 1;
      }
    }
    nDays++;
  }

  const daysGE = (t: number) => pctLang.filter((p) => p >= t).length;
  const f = (n: number) => `${n} (${((100 * n) / nDays).toFixed(1)}%)`;

  console.log(`\n=== SBI v0.4 BACKTEST ===`);
  console.log(`periode: ${start} → ${end}  (${nDays} dagen)`);
  console.log(`echte baselines: ${realBaselineCodes.length}/${INDICATOR_CODES.length}  [${realBaselineCodes.join(", ")}]`);
  console.log(`parameters: SPIKE_DREMPEL=${SPIKE_DREMPEL}  P70=${TRIGGER_P70}  P90=${TRIGGER_P90}  k=${LOAD_K}  sustained=${SUSTAINED_DAYS}d  baseline kort=18m/lang=120m`);

  console.log(`\nv0.4-tier-verdeling (composiet, met ${SUSTAINED_DAYS}-dagen-regel):`);
  console.log(`  groen: ${f(tierDays.green)}   oranje: ${f(tierDays.amber)}   rood: ${f(tierDays.red)}`);

  console.log(`\ncomposiet-percentiel (lang venster):`);
  console.log(`  mediaan ${pct(pctLang, 50)}  ·  P90 ${pct(pctLang, 90)}  ·  max ${Math.max(...pctLang)}`);
  console.log(`  dagen ≥ P70: ${f(daysGE(70))}   dagen ≥ P90: ${f(daysGE(90))}`);

  console.log(`\nload_factor: mediaan ${pct(loadFactors, 50).toFixed(2)}  ·  min ${Math.min(...loadFactors).toFixed(2)}`);

  console.log(`\ntriggers: ${totalTriggers} totaal  (${(totalTriggers / (nDays / 30)).toFixed(1)} per maand gemiddeld)`);
  console.log(`  per type:`, JSON.stringify(triggersByType));
  console.log(`  per severity:`, JSON.stringify(triggersBySeverity));
  const months = Object.keys(triggersByMonth).sort();
  console.log(`  drukste maanden:`, months.map((m) => `${m}:${triggersByMonth[m]}`).slice(-6).join("  "));

  // C2: maak "gekalibreerd" verifieerbaar. Dit artefact legt vast met welke
  // drempels deze backtest draaide, over welke periode en met welk resultaat;
  // test/calibration.test.ts pint de engine-constanten op dit bestand, zodat
  // een drempel niet stil kan wijzigen zonder her-backtest (zelfde patroon als
  // de registry-synchronisatietest). Bewust gecommit artefact, geen CI-output.
  const calibration = {
    generated_at: end,
    period: { start, end, n_days: nDays },
    real_baseline_codes: realBaselineCodes,
    thresholds: {
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
    },
    results: {
      tier_days: tierDays,
      pct_lang_median: pct(pctLang, 50),
      pct_lang_p90: pct(pctLang, 90),
      days_ge_p70: daysGE(70),
      days_ge_p90: daysGE(90),
      load_factor_median: Math.round(pct(loadFactors, 50) * 100) / 100,
      total_triggers: totalTriggers,
      triggers_by_type: triggersByType,
      triggers_by_severity: triggersBySeverity,
    },
    note:
      "Drempels zoals geverifieerd door deze backtest-run (lookahead-vrij voor de gerapporteerde v0.4-stats; zie de bewuste-beperking-noot bovenaan dit script). Wijzig een drempel nooit zonder her-run + nieuw artefact + CHANGELOG.",
  };
  writeFileSync(CALIBRATION_OUT, JSON.stringify(calibration, null, 2) + "\n", "utf-8");
  console.log(`\nkalibratie-artefact: ${CALIBRATION_OUT}`);
  console.log("");
}

main();
