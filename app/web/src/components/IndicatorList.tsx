import { useState } from "react";
import type { IndicatorBreakdown, DomainCode } from "../types";
import { DOMAIN_LABELS, DOMAIN_NUMBER } from "../copy";
import { stateColor, stateLabelFor, stateIcon } from "./indicator-utils";
import { IndicatorDetail } from "./IndicatorDetail";

const DOMAIN_SUBTITLES: Record<DomainCode, string> = {
  D1: "De impact van temperatuur, pollen en de lucht die we inademen.",
  D2: "Verkeers- en mobiliteitsgerelateerde stressfactoren.",
  D3: "Financiële en economische druk als drijfveren van stress.",
  D4: "Uitdagingen rond professionele deadlines, de zorg voor kinderen en de rust thuis.",
  D5: "Wat er gebeurt in de actualiteit en hoe we daarop reageren.",
  D6: "Waar we in de week en het jaar zitten.",
};

function IndicatorRow({ ind }: { ind: IndicatorBreakdown }) {
  const [open, setOpen] = useState(false);
  const color = stateColor(ind.state);
  return (
    <div className={`ind-row ind-state-${ind.state}`}>
      <button
        className="ind-row-summary"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="ind-icon" style={{ color }} aria-hidden="true">
          {stateIcon(ind.state)}
        </span>
        <span className="ind-name">{ind.plain_name}</span>
        <span className="ind-state" style={{ color }}>{stateLabelFor(ind.state, ind.inverseCoded)}</span>
        <span className="ind-toggle">{open ? "−" : "+"}</span>
      </button>
      {open && <IndicatorDetail ind={ind} />}
    </div>
  );
}

export function IndicatorList({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  // Grade-D-indicatoren (review §3) tellen niet mee in het cijfer en staan niet
  // in deze publieke lijst.
  const visible = breakdown.filter((b) => b.grade !== "D");
  // A6: D6 (kalendercontext) zit niet in de breakdown — lege domeinen niet renderen.
  const byDomain = (["D1", "D2", "D3", "D4", "D5", "D6"] as DomainCode[])
    .map((d) => ({
      domain: d,
      indicators: visible.filter((b) => b.domain === d),
    }))
    .filter((g) => g.indicators.length > 0);

  return (
    <section className="indicator-list">
      <header className="indicator-list-header">
        <h2>De omstandigheden die we volgen</h2>
        <p className="panel-lead">
          Het hoofdcijfer bovenaan meet de economische druk vergeleken met normale tijden. Daarnaast volgen we
          dagelijks {visible.length} bredere omstandigheden, verdeeld over {byDomain.length} categorieën, zodat je
          het volledige beeld ziet, ook waar het juist rustig is. Klik op een indicator naar keuze om te zien wat
          we precies meten, waar onze data vandaan komt en welke wetenschappelijke onderbouwing erachter zit.
        </p>
      </header>

      {byDomain.map(({ domain, indicators }) => (
        <div key={domain} className="domain-group">
          <div className={`domain-group-header dh-${domain}`}>
            <div className="domain-group-code">{DOMAIN_NUMBER[domain]}</div>
            <div className="domain-group-name">{DOMAIN_LABELS[domain]}</div>
            <div className="domain-group-sub">{DOMAIN_SUBTITLES[domain]}</div>
          </div>
          <div className="ind-rows">
            {indicators.map((ind) => (
              <IndicatorRow key={ind.code} ind={ind} />
            ))}
          </div>
        </div>
      ))}

      <footer className="indicator-list-footer">
        <p>
          <strong>Wat betekenen de icoontjes?</strong>{" "}
          <span style={{ color: "var(--c-green)" }}>○ lager dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-ink-mute)" }}>● gemiddeld</span>
          {" · "}
          <span style={{ color: "var(--c-amber)" }}>▲ hoger dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-red)" }}>▲▲ uitzonderlijk hoog</span>
        </p>
        <p className="muted small">
          Als we spreken over een "gemiddelde", vergelijken we de situatie van vandaag met dezelfde periode in de
          afgelopen twee jaar. Omdat data uit verschillende kanalen komt, zie je per meting hoe actueel de bron is.
          De meeste indicatoren draaien op live dagbronnen.
        </p>
        <p className="muted small">
          Elke indicator krijgt ook een wetenschappelijke score (Grade). Dit label (A = ijzersterk onderzoek,
          B = consistent onderzoek, C = indirect bewijs) toont puur de bewijskracht aan, niet het gewicht van de
          indicator. Voor het uiteindelijke stresscijfer wegen de 5 hoofdcategorieën namelijk allemaal even zwaar,
          en binnen die categorieën telt elke indicator voor een gelijk deel mee.
        </p>
      </footer>
    </section>
  );
}
