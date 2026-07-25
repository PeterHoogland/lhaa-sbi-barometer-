/**
 * SBI v0.4 — campagne-webhook (de trigger-uitgang).
 * Bron: HANDOVER-v0.4.md §4.2 (open punt: configureerbare POST naar
 * CAMPAIGN_WEBHOOK_URL, dry-run/log als leeg) + triggers.ts (de events zelf).
 *
 * Twee lagen, net als de rest van de engine:
 *  - `buildWebhookPayload` is PUUR (gelijke input → gelijke output, tijd via
 *    `sentAtISO`) en dus testbaar zonder netwerk.
 *  - `dispatchTriggers` is de onzuivere rand: één POST, met time-out, die ELKE
 *    fout opvangt en logt. De webhook mag NOOIT de dag-build of de deploy breken
 *    — een gemiste campagne-ping is hersteldbaar, een gebroken deploy niet.
 *
 * Geen automatische campagne: in `mode = "test"` (en bij brand-safety) draagt
 * elke trigger `require_manual_approval = true`. Die vlag + `mode` reizen mee in
 * de payload, zodat de ontvanger (Make/Zapier/eigen endpoint) beslist of er écht
 * iets start. De barometer levert het signaal; een mens (of een downstream-gate)
 * keurt het goed.
 *
 * DEDUP — bewust GEEN aparte dispatch-state. `evaluateTriggers` plaatst een event
 * alleen in `triggers[]` als de cooldown (48-72u) verlopen is; de cooldown leeft
 * in `app/data/trigger-state.json`, dat getrackt is en door CI teruggecommit
 * wordt. Deploys serialiseren (`concurrency: deploy-${ref}`, cancel-in-progress
 * false), dus run N persisteert de state vóór run N+1 die uitcheckt. `triggers[]`
 * = exact "wat deze run nieuw vuurt". Een tweede state-bestand zou dezelfde
 * commit/race-oppervlakte toevoegen zonder iets extra op te lossen → niet doen.
 */

import type { DailyOutput, BrandSafety, ConditionLevel } from "./types.js";
import type { TriggerEvent, CampaignHint, Severity } from "./methodology/triggers.js";

/** Schema-tag in de payload, zodat de ontvanger op versie kan vastpinnen. */
export const WEBHOOK_SCHEMA = "lhaa-sbi-webhook/v1";
/** Time-out voor de POST (ms). CI-budget is ruim; we willen alleen niet hangen. */
export const DEFAULT_TIMEOUT_MS = 10_000;

export interface WebhookBarometer {
  timestamp: string;
  week_iso: string;
  condition_level: { value: ConditionLevel; name: string };
  /** v0.4-kern-tier (green/amber/red) — de publieke kleurbol. */
  tier: string;
  composite_meting: number;
  load_factor: number;
  percentile_lang: number;
  brand_safety_flag: BrandSafety;
  mode: "test" | "live";
}

export interface WebhookSummary {
  trigger_count: number;
  /** "hoog" als één trigger hoog is, anders "let_op". */
  highest_severity: Severity;
  /** Distincte campagne-hints (de per-type routing) — om snel op te routeren. */
  campaign_hints: CampaignHint[];
  /** True zodra één trigger handmatige goedkeuring vraagt (in test-modus altijd). */
  requires_manual_approval: boolean;
}

export interface WebhookPayload {
  schema: string;
  sent_at: string;
  barometer: WebhookBarometer;
  summary: WebhookSummary;
  /** De volledige events — inclusief campaign_hint, severity en approval-vlag. */
  triggers: TriggerEvent[];
}

/**
 * Bouw de payload uit een daily-output. Geeft `null` wanneer er niets te melden
 * is (geen v0.4-blok of nul triggers) — de aanroeper stuurt dan niets.
 */
export function buildWebhookPayload(output: DailyOutput, sentAtISO: string): WebhookPayload | null {
  const v04 = output.v04;
  if (!v04 || v04.triggers.length === 0) return null;
  const triggers = v04.triggers;

  const highestSeverity: Severity = triggers.some((t) => t.severity === "hoog") ? "hoog" : "let_op";
  const campaignHints: CampaignHint[] = [...new Set(triggers.map((t) => t.campaign_hint))];

  return {
    schema: WEBHOOK_SCHEMA,
    sent_at: sentAtISO,
    barometer: {
      timestamp: output.timestamp,
      week_iso: output.week_iso,
      condition_level: { value: output.condition_level.value, name: output.condition_level.name },
      tier: v04.tier.current,
      composite_meting: v04.composite.meting,
      load_factor: v04.composite.load_factor,
      percentile_lang: v04.percentile.lang,
      brand_safety_flag: output.brand_safety.flag,
      mode: v04.mode,
    },
    summary: {
      trigger_count: triggers.length,
      highest_severity: highestSeverity,
      campaign_hints: campaignHints,
      requires_manual_approval: triggers.some((t) => t.require_manual_approval),
    },
    triggers,
  };
}

export type DispatchStatus = "no_triggers" | "dry_run" | "sent" | "failed";

export interface DispatchResult {
  status: DispatchStatus;
  trigger_count: number;
  /** Of er een endpoint geconfigureerd was (CAMPAIGN_WEBHOOK_URL niet-leeg). */
  url_configured: boolean;
  http_status?: number;
  error?: string;
}

export interface DispatchOptions {
  /** Endpoint-URL. Leeg/ongezet → dry-run (alleen loggen, niets versturen). */
  url?: string;
  /** Optioneel bearer-token; wordt als `Authorization: Bearer …` meegestuurd. */
  token?: string;
  /** ISO-tijd die als `sent_at` in de payload komt (injecteerbaar voor tests). */
  sentAtISO: string;
  timeoutMs?: number;
  /** Injecteerbare fetch voor tests; standaard de globale `fetch`. */
  fetchImpl?: typeof fetch;
  /** Logger; standaard stil (CLI geeft `console.log`). */
  logger?: (msg: string) => void;
}

/**
 * Verstuur de triggers van deze run naar het campagne-endpoint. Stuurt niets bij
 * nul triggers of bij een lege URL (dan dry-run-log). Gooit NOOIT — fouten komen
 * terug als `{ status: "failed", … }` en worden gelogd, zodat de build doorgaat.
 */
export async function dispatchTriggers(output: DailyOutput, opts: DispatchOptions): Promise<DispatchResult> {
  const log = opts.logger ?? (() => {});
  const url = (opts.url ?? "").trim();
  const urlConfigured = url.length > 0;

  const payload = buildWebhookPayload(output, opts.sentAtISO);
  if (!payload) {
    log("  Webhook: geen triggers vandaag → niets te versturen.");
    return { status: "no_triggers", trigger_count: 0, url_configured: urlConfigured };
  }

  const count = payload.summary.trigger_count;
  const hints = payload.summary.campaign_hints.join(", ");
  const modeNote =
    payload.barometer.mode === "test"
      ? " (mode=test → require_manual_approval; downstream mag NIET autostarten)"
      : "";

  if (!urlConfigured) {
    log(`  Webhook DRY-RUN: ${count} trigger(s), hints=[${hints}]${modeNote}.`);
    log("  Zet CAMPAIGN_WEBHOOK_URL om écht te versturen. Payload die verstuurd zou worden:");
    log(JSON.stringify(payload, null, 2));
    return { status: "dry_run", trigger_count: count, url_configured: false };
  }

  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (opts.token) headers["authorization"] = `Bearer ${opts.token}`;

    const res = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      log(`  Webhook FOUT: HTTP ${res.status} bij ${count} trigger(s). Niet-fataal — build gaat door.`);
      return { status: "failed", trigger_count: count, url_configured: true, http_status: res.status, error: `HTTP ${res.status}` };
    }
    log(`  Webhook VERSTUURD: ${count} trigger(s) → HTTP ${res.status}, hints=[${hints}]${modeNote}.`);
    return { status: "sent", trigger_count: count, url_configured: true, http_status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`  Webhook FOUT: ${msg} bij ${count} trigger(s). Niet-fataal — build gaat door.`);
    return { status: "failed", trigger_count: count, url_configured: true, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
