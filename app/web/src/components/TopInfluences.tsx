import type { IndicatorBreakdown } from "../types";
import { stateColor, stateLabel } from "./indicator-utils";

/**
 * "Wat weegt vandaag het zwaarst" — top 3 indicatoren naar absolute bijdrage.
 * 15-jarig taalniveau.
 */
export function TopInfluences({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  // Trage/structurele grondlast-indicatoren horen niet in de "vandaag"-lijst:
  // ze bewegen op jaar-/maandschaal, maar lezen met een live-klinkend label
  // alsof er nú iets verandert. Energie (I-D3-002, dagprijs) blijft wél staan.
  const SLOW = new Set(["I-D2-001", "I-D2-004", "I-D3-001"]); // verkeer (jaar), brandstof (maand), inflatie (maand)
  const top = [...breakdown]
    .filter((b) => b.state !== "ontbreekt" && !SLOW.has(b.code))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="panel top-influences">
      <h2>Wat speelt vandaag het meest mee?</h2>
      <p className="panel-lead">
        Van de kern-indicatoren die we bekijken, zijn dit de drie die vandaag
        de meeste invloed hebben op het cijfer.
      </p>
      <ol className="top-list">
        {top.map((ind, i) => (
          <li key={ind.code} className="top-item">
            <div className="top-rank">{i + 1}</div>
            <div className="top-body">
              <div className="top-name">{ind.plain_name}</div>
              <div className="top-state" style={{ color: stateColor(ind.state) }}>
                {stateLabel(ind.state)}
              </div>
              <div className="top-why">{ind.why}</div>
            </div>
            <div className="top-direction">
              {ind.contribution > 0 ? "↑ duwt omhoog" : "↓ duwt omlaag"}
            </div>
          </li>
        ))}
      </ol>

      <details className="top-how">
        <summary>Hoe kiezen we deze drie?</summary>
        <div className="top-how-body">
          <p>
            Geen mens kiest ze — de cijfers doen dat. Elke indicator krijgt vandaag een score:
            hoe ver staat 'ie van wat <strong>normaal</strong> is voor dit moment in het jaar?
            Een zomerdag vergelijken we met zomerdagen. Hoe groter dat verschil, hoe zwaarder 'ie meeweegt.
          </p>
          <p>
            We sorteren op de <strong>grootte</strong> van die afwijking, niet de richting. Iets dat
            vandaag uitzonderlijk laag staat, speelt net zo hard mee als iets dat hoog staat — daarom
            staat er telkens "↑ duwt omhoog" of "↓ duwt omlaag". De drie grootste komen bovenaan.
          </p>
          <p className="muted small">
            Twee dingen laten we weg: metingen die vandaag geen data hebben, en bronnen die alleen op
            maand- of jaarschaal bewegen (die tellen wél mee in het cijfer zelf, maar horen niet thuis
            in een lijstje over wat er <em>vandaag</em> speelt).
          </p>
        </div>
      </details>
    </section>
  );
}
