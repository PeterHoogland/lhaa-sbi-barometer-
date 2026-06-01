/**
 * SBI v0.4 — trigger-engine ("snel & gevoelig").
 * Bron: HANDOVER §2 (v0.4-richtlijn) §4 + §6 (payload) + §9.5 (campaign_hint).
 *
 * Pure functie: gelijke input → gelijke output. De huidige tijd komt binnen via
 * `nowISO` (geen Date.now() binnenin), zodat dezelfde functie de live dagrun én
 * de latere backtest aandrijft. OR-logica: één voldane voorwaarde = vuren.
 *
 * Drempel-modulatie (§3.3): T1 en T2 krijgen × load_factor (hun §4-tekst toont
 * dat expliciet). T3 NIET — het composiet bevat de trage grondlast al, en de
 * load_factor is uit diezelfde grondlast afgeleid; × load_factor zou dubbeltellen
 * (zie de §4-noot onder Trigger 3).
 *
 * Remmen (§4): cooldown per type:code, confirmatie bepaalt severity (niet of het
 * vuurt), en brand-safety zet alle triggers op require_manual_approval.
 *
 * Test-modus: zolang de drempels nog niet via de backtest gekalibreerd zijn en er
 * geen webhook live is, staat `mode = "test"` en krijgt elke trigger
 * require_manual_approval = true. Niets vuurt dus automatisch een campagne af.
 */

import type { IndicatorCode, DomainCode, BrandSafety } from "../types.js";
import { ACHTERGROND_CODES, type KernKlasse } from "../indicators/kern.js";

// --- Configuratie (vast, publiek; via backtest §8 gekalibreerd 2026-06) ---
export const SPIKE_DREMPEL = 1.5; // MAD-eenheden dag-op-dag op de KORTE baseline
export const P70 = 70; // composiet-niveau oranje (T3)
export const P90 = 90; // composiet-niveau rood (T3)
/**
 * Per-indicator-rood (T2) vuurt pas vanaf P95, niet P90. Backtest (742 dagen)
 * gaf 392 indicator.red-triggers op P90 — met 6 actieve kern-codes tegen een
 * dunne rollende baseline tikt er vrijwel dagelijks één boven P90. P95 + langere
 * cooldown houdt "rood" écht uitzonderlijk en voorkomt webhook-spam.
 */
export const INDICATOR_RED_P = 95;
export const COOLDOWN_H: Record<KernKlasse, number> = { direct: 48, snel: 72, traag: 72 };
export const COOLDOWN_COMPOSITE_H = 48;
/** Boven deze dag-op-dag-sprong krijgt een niet-nieuws-spike severity "hoog". */
export const ERNST_DREMPEL = 2.5;
const RECENT_LOG_CAP = 50;

export type Severity = "hoog" | "let_op";
export type TriggerType = "indicator.spike" | "indicator.red" | "composite.amber" | "composite.red";
export type CampaignHint = "brede_geruststelling" | "financieel" | "gericht_weer" | "algemeen";

export interface TriggerEvent {
  type: TriggerType;
  fired_at: string;
  scope: "indicator" | "composite";
  code: IndicatorCode | null;
  domain: DomainCode | null;
  plain_name: string | null;
  severity: Severity;
  z_kort: number | null;
  z_lang: number | null;
  delta_1d: number | null;
  percentile_lang: number | null;
  load_factor: number;
  confirmed_by: string[];
  campaign_hint: CampaignHint;
  require_manual_approval: boolean;
  cooldown_until: string;
}

export interface TriggerState {
  /** Laatste vuur-tijd per "type:code"-sleutel (ISO) — voedt de cooldown. */
  last_fired: Record<string, string>;
  /** Korte log van recente triggers voor transparantie (gecapt). */
  recent: Array<{ key: string; fired_at: string; severity: Severity }>;
}

export const EMPTY_TRIGGER_STATE: TriggerState = { last_fired: {}, recent: [] };

/** Eén kern-indicator zoals de trigger-engine hem ziet. */
export interface CoreTriggerInput {
  code: IndicatorCode;
  domain: DomainCode;
  plain_name: string;
  klasse: KernKlasse;
  z_kort: number;
  z_lang: number;
  delta_1d: number;
  percentile_lang: number;
}

export interface EvaluateTriggersInput {
  perCore: CoreTriggerInput[];
  compositeMeting: number;
  compositePercentileLang: number;
  loadFactor: number;
  brandSafetyFlag: BrandSafety;
  /** Codes die nu bevestigen (wikipedia #4, reddit #8, ontslag-radar #7). */
  confirmedBy: string[];
  priorState: TriggerState;
  nowISO: string;
  mode?: "test" | "live";
}

export interface EvaluateTriggersResult {
  triggers: TriggerEvent[];
  newState: TriggerState;
  mode: "test" | "live";
}

const NEWS_EVENT_CODES = new Set<string>(["I-D5-001", "I-D5-003"]);

/**
 * Grondlast-bronnen (§3.3) vuren geen eigen indicator.red (T2): ze LADEN de
 * drempel via de load_factor. Lieten we ze ook zelf vuren, dan ontstaat een
 * dubbeltelling — een grondlast-bron verlaagt de drempel die hem vervolgens
 * vangt (precies wat we bij verkeer/filezwaarte zagen). Een grondlast-crisis
 * komt naar buiten via T3 (composiet-niveau). Zie ACHTERGROND_CODES + addendum.
 */
const GRONDLAST_SET = new Set<string>(ACHTERGROND_CODES);

function campaignHint(code: IndicatorCode | null, domain: DomainCode | null): CampaignHint {
  if (code === "I-D5-001" || code === "I-D5-003") return "brede_geruststelling";
  // Economie/prijzen: energie, inflatie (D3) en brandstof (D2-004).
  if (domain === "D3" || code === "I-D2-004") return "financieel";
  if (domain === "D1") return "gericht_weer"; // weer (hitte/koude)
  return "algemeen";
}

function cooldownActive(key: string, state: TriggerState, nowISO: string, hours: number): boolean {
  const last = state.last_fired[key];
  if (!last) return false;
  const elapsedH = (Date.parse(nowISO) - Date.parse(last)) / 3_600_000;
  return elapsedH < hours;
}

function cooldownUntil(nowISO: string, hours: number): string {
  return new Date(Date.parse(nowISO) + hours * 3_600_000).toISOString();
}

/**
 * Evalueer de drie triggers met hun remmen. Retourneert de gevuurde events plus
 * de bijgewerkte state (last_fired + recent-log) voor de volgende cyclus.
 */
export function evaluateTriggers(input: EvaluateTriggersInput): EvaluateTriggersResult {
  const mode = input.mode ?? "test";
  const holdForBrandSafety = input.brandSafetyFlag !== "normal";
  const requireManualApproval = mode === "test" || holdForBrandSafety;

  const triggers: TriggerEvent[] = [];
  const lastFired: Record<string, string> = { ...input.priorState.last_fired };

  const fire = (
    key: string,
    cdHours: number,
    event: Omit<TriggerEvent, "fired_at" | "load_factor" | "require_manual_approval" | "cooldown_until">,
  ): void => {
    triggers.push({
      ...event,
      fired_at: input.nowISO,
      load_factor: input.loadFactor,
      require_manual_approval: requireManualApproval,
      cooldown_until: cooldownUntil(input.nowISO, cdHours),
    });
    lastFired[key] = input.nowISO;
  };

  // --- Trigger 1 — Spike (alleen ⚡ direct / 🔆 snel; KORTE baseline via delta_1d) ---
  const spikeThreshold = SPIKE_DREMPEL * input.loadFactor;
  for (const c of input.perCore) {
    if (c.klasse === "traag") continue;
    if (!(c.delta_1d >= spikeThreshold)) continue;
    const key = `indicator.spike:${c.code}`;
    const cdHours = COOLDOWN_H[c.klasse];
    if (cooldownActive(key, input.priorState, input.nowISO, cdHours)) continue;

    const isNewsEvent = NEWS_EVENT_CODES.has(c.code);
    // Confirmatie bepaalt severity, niet of het vuurt (§4 rem B). Nieuws/gebeurtenis:
    // bevestigd door zoekgedrag/sentiment → hoog. Overige spikes: severity op magnitude.
    const severity: Severity = isNewsEvent
      ? input.confirmedBy.length > 0
        ? "hoog"
        : "let_op"
      : c.delta_1d >= ERNST_DREMPEL
        ? "hoog"
        : "let_op";

    fire(key, cdHours, {
      type: "indicator.spike",
      scope: "indicator",
      code: c.code,
      domain: c.domain,
      plain_name: c.plain_name,
      severity,
      z_kort: c.z_kort,
      z_lang: c.z_lang,
      delta_1d: c.delta_1d,
      percentile_lang: c.percentile_lang,
      confirmed_by: isNewsEvent ? input.confirmedBy : [],
      campaign_hint: campaignHint(c.code, c.domain),
    });
  }

  // --- Trigger 2 — Eén rood onderdeel (LANGE baseline-percentiel, P95) ---
  // Grondlast-bronnen (§3.3) zijn uitgesloten: zij laden de drempel i.p.v. zelf
  // te vuren. Een grondlast-crisis komt via T3 (composiet) naar buiten.
  const redThreshold = INDICATOR_RED_P * input.loadFactor;
  for (const c of input.perCore) {
    if (GRONDLAST_SET.has(c.code)) continue;
    if (!(c.percentile_lang >= redThreshold)) continue;
    const key = `indicator.red:${c.code}`;
    const cdHours = COOLDOWN_H[c.klasse];
    if (cooldownActive(key, input.priorState, input.nowISO, cdHours)) continue;

    fire(key, cdHours, {
      type: "indicator.red",
      scope: "indicator",
      code: c.code,
      domain: c.domain,
      plain_name: c.plain_name,
      severity: "hoog",
      z_kort: c.z_kort,
      z_lang: c.z_lang,
      delta_1d: c.delta_1d,
      percentile_lang: c.percentile_lang,
      confirmed_by: input.confirmedBy,
      campaign_hint: campaignHint(c.code, c.domain),
    });
  }

  // --- Trigger 3 — Algemeen niveau (composiet-percentiel; GEEN load_factor, zie kop) ---
  const pct = input.compositePercentileLang;
  if (pct >= P90 && !cooldownActive("composite.red", input.priorState, input.nowISO, COOLDOWN_COMPOSITE_H)) {
    fire("composite.red", COOLDOWN_COMPOSITE_H, {
      type: "composite.red",
      scope: "composite",
      code: null,
      domain: null,
      plain_name: "Algemeen blootstellings-niveau",
      severity: "hoog",
      z_kort: null,
      z_lang: null,
      delta_1d: null,
      percentile_lang: pct,
      confirmed_by: input.confirmedBy,
      campaign_hint: "brede_geruststelling",
    });
  } else if (pct >= P70 && !cooldownActive("composite.amber", input.priorState, input.nowISO, COOLDOWN_COMPOSITE_H)) {
    fire("composite.amber", COOLDOWN_COMPOSITE_H, {
      type: "composite.amber",
      scope: "composite",
      code: null,
      domain: null,
      plain_name: "Algemeen blootstellings-niveau",
      severity: "let_op",
      z_kort: null,
      z_lang: null,
      delta_1d: null,
      percentile_lang: pct,
      confirmed_by: input.confirmedBy,
      campaign_hint: "brede_geruststelling",
    });
  }

  const recent = [
    ...input.priorState.recent,
    ...triggers.map((t) => ({ key: `${t.type}:${t.code ?? "composite"}`, fired_at: t.fired_at, severity: t.severity })),
  ].slice(-RECENT_LOG_CAP);

  return { triggers, newState: { last_fired: lastFired, recent }, mode };
}
