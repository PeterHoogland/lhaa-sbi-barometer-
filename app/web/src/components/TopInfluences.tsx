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
    </section>
  );
}
