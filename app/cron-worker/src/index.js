/**
 * Cloudflare Cron-Worker — betrouwbare uurlijkse trigger voor de SBI-barometer.
 *
 * GitHub's eigen `schedule`-cron is best-effort en slaat onder belasting vaak uren
 * over (waardoor het publieke cijfer niet ververst). Deze Worker draait op
 * Cloudflare's eigen, exacte cron en trapt elk uur de GitHub-workflow `daily.yml`
 * af via de officiële `workflow_dispatch`-API. De tijd-guard ín daily.yml zorgt dat
 * er enkel tussen 06-21u BE écht data gefetcht + gedeployed wordt; buiten dat
 * venster is de run een snelle no-op. Daardoor mag deze Worker ruim 04-20u UTC
 * vuren (dekt 06-21u BE in zowel zomer- als wintertijd).
 *
 * Secret: GITHUB_DISPATCH_TOKEN = een GitHub fine-grained PAT met enkel
 * "Actions: Read and write" op PeterHoogland/lhaa-sbi-barometer-.
 * Zetten met:  wrangler secret put GITHUB_DISPATCH_TOKEN   (in deze map).
 */
const REPO = "PeterHoogland/lhaa-sbi-barometer-";
const WORKFLOW = "daily.yml";
const REF = "main";

async function dispatch(env) {
  if (!env.GITHUB_DISPATCH_TOKEN) {
    return { ok: false, status: 0, body: "GITHUB_DISPATCH_TOKEN secret ontbreekt" };
  }
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "lhaa-sbi-cron-worker",
    },
    body: JSON.stringify({ ref: REF }),
  });
  // 204 No Content = succes bij workflow_dispatch.
  const body = resp.ok ? "" : await resp.text();
  return { ok: resp.ok, status: resp.status, body };
}

export default {
  // Cloudflare roept dit aan op de cron-tijden uit wrangler.jsonc.
  async scheduled(event, env, ctx) {
    const r = await dispatch(env);
    console.log(`[cron ${event.cron}] workflow_dispatch ${WORKFLOW} -> HTTP ${r.status}${r.ok ? " (ok)" : " FOUT: " + r.body}`);
  },

  // Handmatige test/health: GET met de juiste ?key= (== het token) trapt één run af.
  // Zonder geldige key: alleen een statusregel, geen trigger (geen publieke knop).
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/trigger" && env.GITHUB_DISPATCH_TOKEN &&
        url.searchParams.get("key") === env.GITHUB_DISPATCH_TOKEN) {
      const r = await dispatch(env);
      return new Response(`dispatch -> HTTP ${r.status}${r.ok ? " (ok)" : " " + r.body}`, { status: r.ok ? 200 : 502 });
    }
    return new Response(
      "lhaa-sbi cron-worker: leeft. Trigger automatisch via cron; secret " +
      (env.GITHUB_DISPATCH_TOKEN ? "gezet" : "NIET gezet") + ".",
      { status: 200 },
    );
  },
};
