import { useState } from "react";
import type { IndicatorBreakdown, DomainCode } from "../types";
import { DOMAIN_LABELS } from "../copy";
import { stateColor, stateLabel, stateIcon } from "./indicator-utils";

const DOMAIN_SUBTITLES: Record<DomainCode, string> = {
  D1: "Hoe de buitenwereld vandaag aanvoelt",
  D2: "Hoe makkelijk of zwaar verplaatsen vandaag is",
  D3: "De druk van geld en prijzen op het gezin",
  D4: "Wat werk en gezin van ons vragen deze week",
  D5: "Wat er in het nieuws en in het land gebeurt",
  D6: "Waar we in de week en het jaar zitten",
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
        <span className="ind-state" style={{ color }}>{stateLabel(ind.state)}</span>
        <span className="ind-toggle">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="ind-detail">
          <p className="ind-why">{ind.why}</p>

          <div className="ind-meta-grid">
            <div className="ind-meta-cell">
              <div className="ind-meta-label">Wat we uitlezen</div>
              <div className="ind-meta-value">{ind.reads}</div>
            </div>
            {ind.raw_value !== null && (
              <div className="ind-meta-cell">
                <div className="ind-meta-label">Vandaag</div>
                <div className="ind-meta-value">
                  <strong>{formatValue(ind.raw_value, ind.unit)}</strong> {ind.unit}
                </div>
              </div>
            )}
          </div>

          <div className="ind-sources">
            <div className="ind-source-block">
              <div className="ind-source-label">Databron</div>
              <a className="ind-source-link" href={ind.data_source.url} target="_blank" rel="noopener noreferrer">
                {ind.data_source.name} ↗
              </a>
              {ind.simulated && <span className="ind-mock-tag">demo-data</span>}
            </div>

            {ind.references.length > 0 && (
              <div className="ind-source-block">
                <div className="ind-source-label">Wetenschappelijke onderbouwing</div>
                <ul className="ind-refs">
                  {ind.references.map((ref, i) => (
                    <li key={i}>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer">
                        {ref.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(v: number, unit: string): string {
  if (unit.includes("%") || unit.includes("€/liter")) return v.toFixed(2);
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function IndicatorList({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const byDomain = (["D1", "D2", "D3", "D4", "D5", "D6"] as DomainCode[]).map((d) => ({
    domain: d,
    indicators: breakdown.filter((b) => b.domain === d),
  }));

  return (
    <section className="indicator-list">
      <header className="indicator-list-header">
        <h2>Wat we allemaal bekijken</h2>
        <p className="panel-lead">
          We tellen 20 dingen mee. Klik er één open om te zien wat we precies meten,
          waar de data vandaan komt en welke wetenschappelijke onderbouwing erachter zit.
        </p>
      </header>

      {byDomain.map(({ domain, indicators }) => (
        <div key={domain} className="domain-group">
          <div className="domain-group-header">
            <div className="domain-group-code">{domain}</div>
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
          <strong>Hoe lees je dit?</strong>{" "}
          <span style={{ color: "var(--c-green)" }}>○ rustiger</span>
          {" · "}
          <span style={{ color: "var(--c-ink-mute)" }}>● gewoon</span>
          {" · "}
          <span style={{ color: "var(--c-amber)" }}>▲ drukker</span>
          {" · "}
          <span style={{ color: "var(--c-red)" }}>▲▲ uitzonderlijk druk</span>
        </p>
        <p className="muted small">
          Met "gewoon" bedoelen we: vergeleken met dezelfde periode in de afgelopen twee jaar.
          Een aantal metingen draait nog op test-data, die zijn gemarkeerd met <em>demo-data</em>.
          Echte data komt er stap voor stap bij.
        </p>
      </footer>
    </section>
  );
}
