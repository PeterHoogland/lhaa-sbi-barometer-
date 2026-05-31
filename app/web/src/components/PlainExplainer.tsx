import type { DailyOutput } from "../types";
import { buildContext, buildHeadline, buildBody } from "../lib/explainer";

/**
 * Context-bewust uitleg-blok.
 * Headline + body worden dynamisch gebouwd uit:
 *  - condition_level (1-5)
 *  - percentile (24m baseline)
 *  - aantal indicatoren in elke zone (lager/gemiddeld/hoger/extreem)
 *  - top-bijdragende indicatoren
 *  - brand-safety-vlag
 *
 * Taalregister: neutraal informerend, 15-jarig niveau.
 */
export function PlainExplainer({ data }: { data: DailyOutput }) {
  const ctx = buildContext(data);
  const headline = buildHeadline(ctx);
  const body = buildBody(ctx);

  return (
    <section className="plain-explainer">
      <h2>{headline}</h2>
      <p dangerouslySetInnerHTML={{ __html: formatMarkdownBold(body) }} />
    </section>
  );
}

/** Simpele **bold** rendering — buildBody returns markdown-light met **name**. */
function formatMarkdownBold(text: string): string {
  // Escape HTML eerst
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
