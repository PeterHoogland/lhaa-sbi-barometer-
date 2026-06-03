import { useState } from "react";
import type { IndicatorBreakdown, DomainCode } from "../types";
import { DOMAIN_LABELS } from "../copy";
import { isKern } from "../lib/kern";
import { stateColor, stateLabelFor, stateIcon } from "./indicator-utils";
import { formatObservationDate, observationGranularity } from "../lib/format-date";

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
  const prov = provenance(ind);
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
        <span className="ind-name">
          {ind.plain_name}
          {prov && (
            <span className={`ind-prov ${prov.cls}`} title="Herkomst van de data">
              ● {prov.label}
            </span>
          )}
        </span>
        <span className="ind-state" style={{ color }}>{stateLabelFor(ind.state, ind.inverseCoded)}</span>
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
                <div className="ind-meta-label">Gemeten waarde</div>
                <div className="ind-meta-value">
                  <strong>{formatValue(ind.raw_value, ind.unit)}</strong> {ind.unit}
                </div>
              </div>
            )}
            <div className="ind-meta-cell">
              <div className="ind-meta-label">
                {observationGranularity(ind.observation_date) === "maand"
                  ? "Maandcijfer van"
                  : "Cijfer van"}
              </div>
              <div className="ind-meta-value">
                {formatObservationDate(ind.observation_date)}
              </div>
            </div>
            <div className="ind-meta-cell">
              <div className="ind-meta-label">Raakt naar schatting</div>
              <div className="ind-meta-value">
                <strong>{Math.round(ind.demographic_reach * 100)}%</strong> van de bevolking
              </div>
            </div>
          </div>

          <p className="ind-reach-rationale">{ind.reach_rationale}</p>

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

/** Eerlijke herkomst per indicator (review §1.3): echt / vertraagd (jaar-/maandcijfer) / demo. */
function provenance(ind: IndicatorBreakdown): { label: string; cls: string } | null {
  if (ind.state === "ontbreekt") return null; // de status toont al "ontbreekt"
  if (ind.simulated) return { label: "demo", cls: "prov-demo" };
  const obs = ind.observation_date;
  if (observationGranularity(obs) === "maand" || /^\d{4}$/.test(obs)) {
    return { label: "vertraagd", cls: "prov-lag" };
  }
  // Cache-terugval (A8): echte waarde maar de verse fetch mislukte vandaag. Eerlijk
  // als "verouderd" tonen i.p.v. als verse dagmeting.
  if (ind.imputed) return { label: "verouderd", cls: "prov-lag" };
  return { label: "echt", cls: "prov-real" };
}

/** Honest samenvatting onder de lijst — moet kloppen met de som van de per-rij-labels. */
function provenanceSummary(breakdown: IndicatorBreakdown[]): string {
  const demo = breakdown.filter((b) => b.simulated).length;
  const lag = breakdown.filter(
    (b) =>
      !b.simulated &&
      b.state !== "ontbreekt" &&
      (observationGranularity(b.observation_date) === "maand" || /^\d{4}$/.test(b.observation_date)),
  ).length;
  const cache = breakdown.filter(
    (b) =>
      !b.simulated &&
      b.state !== "ontbreekt" &&
      b.imputed &&
      !(observationGranularity(b.observation_date) === "maand" || /^\d{4}$/.test(b.observation_date)),
  ).length;
  if (demo === 0 && lag === 0 && cache === 0) return "Elke meting draait op een echte, actuele bron.";
  const bits: string[] = [];
  if (demo > 0) bits.push(`${demo} op demo-data (gemarkeerd "demo")`);
  if (lag > 0) bits.push(`${lag} jaar-/maandcijfers (gemarkeerd "vertraagd")`);
  if (cache > 0) bits.push(`${cache} op een recente cache-waarde (gemarkeerd "verouderd")`);
  return `Per meting staat de herkomst erbij: ${bits.join(", ")}; de rest op echte dagbronnen.`;
}

export function IndicatorList({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  // Grade-D-indicatoren (review §3: media-toon, zoek-/leesaandacht, ontslagen-proxy)
  // tellen niet mee in het cijfer en worden hier niet getoond. We laten ze
  // ongelabeld weg; ze blijven wel in de data (en in de trigger-/bronpanelen).
  const visible = breakdown.filter((b) => b.grade !== "D");
  const kernShown = visible.filter((b) => isKern(b.code)).length;
  const byDomain = (["D1", "D2", "D3", "D4", "D5", "D6"] as DomainCode[]).map((d) => ({
    domain: d,
    indicators: visible.filter((b) => b.domain === d),
  }));

  return (
    <section className="indicator-list">
      <header className="indicator-list-header">
        <h2>Wat we allemaal bekijken</h2>
        <p className="panel-lead">
          In het cijfer tellen {visible.length} indicatoren mee, verdeeld over 6 levensdomeinen; {kernShown} daarvan
          vormen de kern-meting. Daarnaast lopen 2 secundaire/diagnostische signalen mee die niet in het cijfer
          meetellen. Klik er één open om te zien wat we precies meten, waar de data vandaan komt en welke
          wetenschappelijke onderbouwing erachter zit.
        </p>
      </header>

      {byDomain.map(({ domain, indicators }) => (
        <div key={domain} className="domain-group">
          <div className={`domain-group-header dh-${domain}`}>
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
          <span style={{ color: "var(--c-green)" }}>○ lager dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-ink-mute)" }}>● gemiddeld</span>
          {" · "}
          <span style={{ color: "var(--c-amber)" }}>▲ hoger dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-red)" }}>▲▲ uitzonderlijk hoog</span>
        </p>
        <p className="muted small">
          Met "gemiddeld" bedoelen we: vergeleken met dezelfde periode in de afgelopen twee jaar.{" "}
          {provenanceSummary(visible)}
        </p>
      </footer>
    </section>
  );
}
