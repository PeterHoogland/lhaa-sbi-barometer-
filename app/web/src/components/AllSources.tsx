import type { IndicatorBreakdown } from "../types";

/**
 * Centrale "Alle bronnen"-sectie.
 * Uniqueert databronnen en wetenschappelijke referenties uit de breakdown.
 */
export function AllSources({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const dataSources = new Map<string, string>();

  for (const ind of breakdown) {
    if (ind.data_source?.url) {
      dataSources.set(ind.data_source.name, ind.data_source.url);
    }
  }

  return (
    <section className="panel all-sources">
      <h2>Alle bronnen</h2>
      <p className="panel-lead">
        Wie de cijfers wil natrekken, vindt hier alle data-leveranciers die
        meegewogen hebben. De wetenschappelijke artikels staan in het aparte
        paneel "Wetenschappelijke bronnen".
      </p>

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

      <p className="muted small all-sources-note">
        De volledige methodologie (lagen 1 tot 8) is open en publiek beschikbaar.
        Alle keuzes, drempels, gewichten en formules staan vooraf vast in de
        methodologie. Wijzigen kan alleen via een gedocumenteerd amendement met
        logboek-vermelding, niet achteraf om een cijfer bij te sturen; automatische
        tests laten de bouw falen bij een stille wijziging.
      </p>
    </section>
  );
}
