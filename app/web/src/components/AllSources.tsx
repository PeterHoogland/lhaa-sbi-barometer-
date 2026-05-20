import type { IndicatorBreakdown } from "../types";

/**
 * Centrale "Alle bronnen"-sectie.
 * Uniqueert databronnen en wetenschappelijke referenties uit de breakdown.
 */
export function AllSources({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const dataSources = new Map<string, string>();
  const references = new Map<string, string>();

  for (const ind of breakdown) {
    if (ind.data_source?.url) {
      dataSources.set(ind.data_source.name, ind.data_source.url);
    }
    for (const ref of ind.references ?? []) {
      references.set(ref.label, ref.url);
    }
  }

  return (
    <section className="panel all-sources">
      <h2>Alle bronnen</h2>
      <p className="panel-lead">
        Wie de cijfers wil natrekken, vindt hier alle data-leveranciers en
        wetenschappelijke artikels die meegewogen hebben.
      </p>

      <div className="sources-grid">
        <div className="sources-column">
          <h3>Databronnen</h3>
          <ul className="sources-list">
            {[...dataSources.entries()].map(([name, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="sources-column">
          <h3>Wetenschappelijke artikels</h3>
          <ul className="sources-list">
            {[...references.entries()].map(([label, url]) => (
              <li key={label}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="muted small all-sources-note">
        De volledige methodologie (lagen 1 tot 8) is open en publiek beschikbaar.
        Alle keuzes — drempels, gewichten, formules — staan vooraf vast en kunnen
        niet achteraf bijgestuurd worden.
      </p>
    </section>
  );
}
