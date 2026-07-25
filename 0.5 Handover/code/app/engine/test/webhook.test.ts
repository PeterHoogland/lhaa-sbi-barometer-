/**
 * SBI v0.4 — unit-tests voor de campagne-webhook (trigger-uitgang).
 * Bron: src/webhook.ts.
 *
 * Dekt: payload-bouw (null bij geen triggers, summary-afleiding, mode-passthrough)
 * en de dispatch (dry-run bij lege URL, POST met auth-header, en fout-tolerantie:
 * een 5xx of een gegooide fetch breekt nooit de build).
 */

import { describe, it, expect, vi } from "vitest";
import {
  buildWebhookPayload,
  dispatchTriggers,
  WEBHOOK_SCHEMA,
  type DailyOutput,
  type TriggerEvent,
} from "../src/index.js";

const NOW = "2026-06-01T09:00:00Z";

function mkTrigger(over: Partial<TriggerEvent> = {}): TriggerEvent {
  return {
    type: "composite.amber",
    fired_at: "2026-06-01T08:00:00Z",
    scope: "composite",
    code: null,
    domain: null,
    plain_name: "Algemeen blootstellings-niveau",
    severity: "let_op",
    z_kort: null,
    z_lang: null,
    delta_1d: null,
    percentile_lang: 75,
    load_factor: 1,
    confirmed_by: [],
    campaign_hint: "brede_geruststelling",
    require_manual_approval: true,
    cooldown_until: "2026-06-03T08:00:00Z",
    ...over,
  };
}

/** Minimale daily-output met enkel de velden die de payload-bouw uitleest. */
function mkOutput(triggers: TriggerEvent[], opts: { mode?: "test" | "live" } = {}): DailyOutput {
  return {
    timestamp: "2026-06-01T08:00:00Z",
    week_iso: "2026-W23",
    condition_level: { value: 3, name: "Verhoogd", banner_active: true, copy_key: "cn3" },
    brand_safety: { flag: "normal", reason: null, expires_estimated: null },
    v04: {
      schema_version: "0.4.0",
      mode: opts.mode ?? "test",
      composite: { meting: 0.42, achtergrond: 0.1, load_factor: 0.9 },
      baseline: { kort_maanden: 18, lang_maanden_target: 120, lang_rolling: true, laatste_herijking: null },
      percentile: { lang: 75, kort: 70, fixed_2010_2019: null },
      tier: { current: "amber", days_in_tier: 1 },
      kern_breakdown: [],
      triggers,
      trigger_state: { last_fired: {}, recent: [] },
    },
  } as unknown as DailyOutput;
}

/** Nep-fetch: dispatch leest alleen res.ok + res.status. */
function fakeFetch(res: { ok: boolean; status: number }) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => res as unknown as Response);
}

describe("buildWebhookPayload (puur)", () => {
  it("geeft null zonder v0.4-blok", () => {
    const out = { timestamp: NOW, week_iso: "2026-W23" } as unknown as DailyOutput;
    expect(buildWebhookPayload(out, NOW)).toBeNull();
  });

  it("geeft null bij nul triggers", () => {
    expect(buildWebhookPayload(mkOutput([]), NOW)).toBeNull();
  });

  it("zet schema, sent_at en de barometer-meta correct", () => {
    const p = buildWebhookPayload(mkOutput([mkTrigger()]), NOW)!;
    expect(p.schema).toBe(WEBHOOK_SCHEMA);
    expect(p.sent_at).toBe(NOW);
    expect(p.barometer.timestamp).toBe("2026-06-01T08:00:00Z");
    expect(p.barometer.tier).toBe("amber");
    expect(p.barometer.composite_meting).toBe(0.42);
    expect(p.barometer.load_factor).toBe(0.9);
    expect(p.barometer.percentile_lang).toBe(75);
    expect(p.barometer.mode).toBe("test");
    expect(p.barometer.condition_level).toEqual({ value: 3, name: "Verhoogd" });
  });

  it("leidt severity, distincte hints en approval af uit de triggers", () => {
    const triggers = [
      mkTrigger({ severity: "let_op", campaign_hint: "financieel", require_manual_approval: false }),
      mkTrigger({ severity: "hoog", campaign_hint: "financieel", require_manual_approval: false }),
      mkTrigger({ severity: "let_op", campaign_hint: "gericht_weer", require_manual_approval: true }),
    ];
    const p = buildWebhookPayload(mkOutput(triggers), NOW)!;
    expect(p.summary.trigger_count).toBe(3);
    expect(p.summary.highest_severity).toBe("hoog"); // één hoog tilt het geheel
    expect(p.summary.campaign_hints).toEqual(["financieel", "gericht_weer"]); // gededupliceerd
    expect(p.summary.requires_manual_approval).toBe(true); // één true volstaat
    expect(p.triggers).toHaveLength(3); // volledige events reizen mee
  });
});

describe("dispatchTriggers (dry-run)", () => {
  it("verstuurt niets en logt bij nul triggers", async () => {
    const spy = fakeFetch({ ok: true, status: 200 });
    const r = await dispatchTriggers(mkOutput([]), { url: "https://hook.test/x", sentAtISO: NOW, fetchImpl: spy as unknown as typeof fetch });
    expect(r.status).toBe("no_triggers");
    expect(spy).not.toHaveBeenCalled();
  });

  it("doet dry-run (geen POST) als de URL leeg is", async () => {
    const spy = fakeFetch({ ok: true, status: 200 });
    const logs: string[] = [];
    const r = await dispatchTriggers(mkOutput([mkTrigger()]), {
      url: "",
      sentAtISO: NOW,
      fetchImpl: spy as unknown as typeof fetch,
      logger: (m) => logs.push(m),
    });
    expect(r.status).toBe("dry_run");
    expect(r.url_configured).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(logs.some((l) => l.includes("DRY-RUN"))).toBe(true);
    expect(logs.some((l) => l.includes(WEBHOOK_SCHEMA))).toBe(true); // payload in de log
  });

  it("behandelt ongezette URL (undefined) als dry-run", async () => {
    const spy = fakeFetch({ ok: true, status: 200 });
    const r = await dispatchTriggers(mkOutput([mkTrigger()]), { sentAtISO: NOW, fetchImpl: spy as unknown as typeof fetch });
    expect(r.status).toBe("dry_run");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("dispatchTriggers (POST)", () => {
  it("POST't de payload als JSON naar de URL", async () => {
    const spy = fakeFetch({ ok: true, status: 202 });
    const r = await dispatchTriggers(mkOutput([mkTrigger({ campaign_hint: "financieel" })]), {
      url: "https://hook.test/abc",
      sentAtISO: NOW,
      fetchImpl: spy as unknown as typeof fetch,
    });
    expect(r.status).toBe("sent");
    expect(r.http_status).toBe(202);
    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://hook.test/abc");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(init?.body as string);
    expect(body.schema).toBe(WEBHOOK_SCHEMA);
    expect(body.summary.campaign_hints).toEqual(["financieel"]);
  });

  it("stuurt een Authorization-header mee als er een token is", async () => {
    const spy = fakeFetch({ ok: true, status: 200 });
    await dispatchTriggers(mkOutput([mkTrigger()]), {
      url: "https://hook.test/abc",
      token: "s3cr3t",
      sentAtISO: NOW,
      fetchImpl: spy as unknown as typeof fetch,
    });
    const init = spy.mock.calls[0][1];
    expect((init?.headers as Record<string, string>)["authorization"]).toBe("Bearer s3cr3t");
  });

  it("geen Authorization-header zonder token", async () => {
    const spy = fakeFetch({ ok: true, status: 200 });
    await dispatchTriggers(mkOutput([mkTrigger()]), { url: "https://hook.test/abc", sentAtISO: NOW, fetchImpl: spy as unknown as typeof fetch });
    const init = spy.mock.calls[0][1];
    expect((init?.headers as Record<string, string>)["authorization"]).toBeUndefined();
  });
});

describe("dispatchTriggers (fout-tolerantie — breekt nooit de build)", () => {
  it("een 5xx geeft status 'failed', gooit niet", async () => {
    const spy = fakeFetch({ ok: false, status: 500 });
    const r = await dispatchTriggers(mkOutput([mkTrigger()]), { url: "https://hook.test/x", sentAtISO: NOW, fetchImpl: spy as unknown as typeof fetch });
    expect(r.status).toBe("failed");
    expect(r.http_status).toBe(500);
  });

  it("een gegooide fetch geeft status 'failed', gooit niet", async () => {
    const spy = vi.fn(async () => {
      throw new Error("boom");
    });
    const r = await dispatchTriggers(mkOutput([mkTrigger()]), { url: "https://hook.test/x", sentAtISO: NOW, fetchImpl: spy as unknown as typeof fetch });
    expect(r.status).toBe("failed");
    expect(r.error).toContain("boom");
  });
});
