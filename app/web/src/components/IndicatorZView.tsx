import { useState } from "react";
import type { IndicatorBreakdown } from "../types";
import { DOMAIN_LABELS } from "../copy";

/**
 * Z-thermometer per indicator.
 * Toont voor elke indicator real-time hoe ver hij staat van Z = +1
 * (de drempel waarboven hij actief bijdraagt aan banner-activatie).
 *
 * Bar-schaal: -3 tot +3.
 * Zones: groen (Z < -1), grijs (-1 ≤ Z < 1), oranje (1 ≤ Z < 2), rood (Z ≥ 2).
 * Drempel-markers op Z = +1 (banner-bijdrage) en Z = +2 (zware bijdrage).
 */

const Z_MIN = -3;
const Z_MAX = 3;

function zToPercent(z: number): number {
  // Clamp en map naar 0-100% van bar-breedte
  const clamped = Math.max(Z_MIN, Math.min(Z_MAX, z));
  return ((clamped - Z_MIN) / (Z_MAX - Z_MIN)) * 100;
}

function zoneColor(z: number): string {
  if (z >= 2) return "var(--st-alert)";
  if (z >= 1) return "var(--lha-sun)";
  if (z >= -1) return "var(--lha-mist)";
  return "var(--st-rust)";
}

function distanceLabel(z: number | null): string {
  if (z === null) return "geen data";
  if (z >= 2) return "in extreem-zone";
  if (z >= 1) return "draagt actief bij";
  if (z >= 0) {
    const d = 1 - z;
    return `${d.toFixed(1)} Z onder drempel`;
  }
  const d = 1 - z;
  return `${d.toFixed(1)} Z onder drempel`;
}

function ZThermometer({ ind }: { ind: IndicatorBreakdown }) {
  if (ind.z_short === null) {
    return (
      <div className="zth zth-missing">
        <div className="zth-header">
          <span className="zth-code">{ind.code}</span>
          <span className="zth-name">{ind.plain_name}</span>
          <span className="zth-z-missing">geen data</span>
        </div>
      </div>
    );
  }

  const pct = zToPercent(ind.z_short);
  const color = zoneColor(ind.z_short);
  const dist = distanceLabel(ind.z_short);

  return (
    <div className="zth">
      <div className="zth-header">
        <span className="zth-code">{ind.code}</span>
        <span className="zth-name">{ind.plain_name}</span>
        <span className="zth-value">
          {ind.raw_value !== null ? `${ind.raw_value}` : ""}{" "}
          <span className="zth-unit">{ind.unit}</span>
        </span>
      </div>
      <div className="zth-bar-wrap">
        {/* Zones achtergrond */}
        <div className="zth-zone zth-zone-cold" style={{ left: 0, width: `${zToPercent(-1)}%` }} />
        <div className="zth-zone zth-zone-normal" style={{ left: `${zToPercent(-1)}%`, width: `${zToPercent(1) - zToPercent(-1)}%` }} />
        <div className="zth-zone zth-zone-warn" style={{ left: `${zToPercent(1)}%`, width: `${zToPercent(2) - zToPercent(1)}%` }} />
        <div className="zth-zone zth-zone-alert" style={{ left: `${zToPercent(2)}%`, width: `${100 - zToPercent(2)}%` }} />

        {/* Drempel-markers */}
        <div className="zth-marker zth-marker-threshold" style={{ left: `${zToPercent(1)}%` }} title="Z = +1 — banner-bijdrage" />
        <div className="zth-marker zth-marker-extreme" style={{ left: `${zToPercent(2)}%` }} title="Z = +2 — zware bijdrage" />

        {/* Huidige positie */}
        <div className="zth-dot" style={{ left: `${pct}%`, background: color }} />

        {/* As-labels */}
        <div className="zth-axis">
          <span style={{ left: `${zToPercent(-2)}%` }}>−2</span>
          <span style={{ left: `${zToPercent(-1)}%` }}>−1</span>
          <span style={{ left: "50%" }}>0</span>
          <span style={{ left: `${zToPercent(1)}%` }}>+1</span>
          <span style={{ left: `${zToPercent(2)}%` }}>+2</span>
        </div>
      </div>
      <div className="zth-footer">
        <span className="zth-z" style={{ color }}>Z = {ind.z_short >= 0 ? "+" : ""}{ind.z_short.toFixed(2)}</span>
        <span className="zth-dist">{dist}</span>
      </div>
    </div>
  );
}

export function IndicatorZView({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"contribution" | "domain">("contribution");

  // Sort indicators
  const sorted = [...breakdown];
  if (sortMode === "contribution") {
    sorted.sort((a, b) => {
      const za = a.z_short ?? -99;
      const zb = b.z_short ?? -99;
      return zb - za; // hoogste Z eerst (sterkste bijdrage)
    });
  } else {
    sorted.sort((a, b) => a.code.localeCompare(b.code));
  }

  // Count contributors
  const activeContributors = breakdown.filter((b) => (b.z_short ?? 0) >= 1).length;
  const heavyContributors = breakdown.filter((b) => (b.z_short ?? 0) >= 2).length;

  return (
    <section className="panel zview-panel">
      <button
        className="zview-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="zview-toggle-icon">{open ? "−" : "+"}</span>
        <span className="zview-toggle-text">
          <strong>Expert-view: bijdrage per indicator</strong>
        </span>
        <span className="zview-toggle-icon zview-toggle-icon-right" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="zview-body">
          <p className="zview-lead">
            Hoe ver staat elk onderdeel van de drempel waarboven het meedraagt aan
            banner-activatie? Z = 0 is "gemiddeld voor dit seizoen", Z ≥ +1 is "hoger
            dan gewoonlijk en draagt bij", Z ≥ +2 is "uitzonderlijk hoog".
          </p>

          <div className="zview-sort">
            <span>Sortering:</span>
            <button
              className={sortMode === "contribution" ? "active" : ""}
              onClick={() => setSortMode("contribution")}
            >
              naar grootste bijdrage
            </button>
            <button
              className={sortMode === "domain" ? "active" : ""}
              onClick={() => setSortMode("domain")}
            >
              naar categorie
            </button>
          </div>

          <div className="zview-legend">
            <span><i className="lg-cold" /> lager dan gewoonlijk (Z &lt; −1)</span>
            <span><i className="lg-normal" /> gemiddeld (−1 tot +1)</span>
            <span><i className="lg-warn" /> hoger dan gewoonlijk (Z ≥ +1)</span>
            <span><i className="lg-alert" /> uitzonderlijk hoog (Z ≥ +2)</span>
          </div>

          <div className="zview-list">
            {sorted.map((ind) => (
              <ZThermometer key={ind.code} ind={ind} />
            ))}
          </div>

          <p className="zview-footer-note">
            Banner-activatie vereist dat het <strong>gewogen composiet</strong> 3 dagen
            op rij in de top-30% (P ≥ 70) van de laatste 24 maanden zit, plus brand-safety
            normaal. Geen enkele indicator triggert op zichzelf, maar elke balk hierboven
            laat zien welke vandaag bijdragen.
          </p>
        </div>
      )}
    </section>
  );
}
