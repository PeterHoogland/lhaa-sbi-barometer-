import { useState } from "react";
import type { IndicatorBreakdown } from "../types";
import { stateColor, stateLabelFor } from "./indicator-utils";
import { IndicatorDetail } from "./IndicatorDetail";

/** Eén top-3-kaart, klikbaar open zoals de indicatoren in de volledige lijst. */
function TopItem({ ind, rank }: { ind: IndicatorBreakdown; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`top-item ind-state-${ind.state}`}>
      <button className="top-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="top-rank">{rank}</div>
        <div className="top-body">
          <div className="top-name">{ind.plain_name}</div>
          <div className="top-state" style={{ color: stateColor(ind.state) }}>
            {stateLabelFor(ind.state, ind.inverseCoded)}
          </div>
          <div className="top-why">{ind.why}</div>
        </div>
        <div className="top-aside">
          <div className="top-direction">
            {ind.contribution > 0 ? "↑ duwt omhoog" : "↓ duwt omlaag"}
          </div>
          <span className="top-toggle">{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && <IndicatorDetail ind={ind} hideWhy />}
    </li>
  );
}

/**
 * "Wat weegt vandaag het zwaarst" — top 3 indicatoren naar absolute bijdrage.
 * 15-jarig taalniveau. Elke kaart klikt open met hetzelfde detailvenster als de
 * volledige indicatorlijst.
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
          <TopItem key={ind.code} ind={ind} rank={i + 1} />
        ))}
      </ol>

      <details className="top-how">
        <summary>Hoe kiezen we deze drie?</summary>
        <div className="top-how-body">
          <p>
            De selectie gebeurt automatisch. Elke indicator krijgt een score: hoe sterk de waarde van
            vandaag afwijkt van wat normaal is voor deze periode van het jaar. Hoe groter de afwijking,
            hoe zwaarder die meeweegt.
          </p>
          <p>
            We sorteren op de grootte van de afwijking, niet op de richting. Een uitzonderlijk lage waarde
            weegt even zwaar als een hoge. Daarom staat er "↑ duwt omhoog" of "↓ duwt omlaag". De drie
            grootste staan bovenaan.
          </p>
          <p className="muted">
            Metingen zonder gegevens van vandaag tellen niet mee, net als bronnen die alleen per maand of
            jaar veranderen. Die wegen wel mee in het cijfer, maar niet in dit overzicht.
          </p>
        </div>
      </details>
    </section>
  );
}
