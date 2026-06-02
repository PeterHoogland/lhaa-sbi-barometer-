import type { V04Output, KernState } from "../types";

/**
 * Zichtbare hoofdstroom-weergave van de SBI v0.4-meting: de kern-meting + de
 * achtergronddruk + de kern-indicatoren als rustige statusbolletjes. Plain taal,
 * geen ruwe z-scores (die staan in het technische paneel).
 */

function kernColor(s: KernState): string {
  switch (s) {
    case "verhoogd": return "var(--c-amber)";
    case "rood": return "var(--c-red)";
    default: return "var(--c-ink-mute)";
  }
}
function kernIcon(s: KernState): string {
  switch (s) {
    case "verhoogd": return "▲";
    case "rood": return "▲▲";
    case "ontbreekt": return "·";
    default: return "●";
  }
}
function kernLabel(s: KernState): string {
  switch (s) {
    case "verhoogd": return "hoger dan gewoonlijk";
    case "rood": return "uitzonderlijk hoog";
    case "ontbreekt": return "nog te weinig historie";
    default: return "gemiddeld";
  }
}

function metingPhrase(pct: number): string {
  if (pct >= 90) return "uitzonderlijk hoog";
  if (pct >= 70) return "hoger dan gewoonlijk";
  if (pct >= 40) return "rond het gemiddelde";
  return "lager dan gemiddeld";
}

function achtergrond(loadFactor: number): { label: string; color: string } {
  if (loadFactor < 0.85) return { label: "hoog", color: "var(--c-red)" };
  if (loadFactor < 0.95) return { label: "merkbaar", color: "var(--c-amber)" };
  return { label: "laag", color: "var(--c-green)" };
}

export function KernIndicators({ v04 }: { v04: V04Output }) {
  const meting = metingPhrase(v04.percentile.lang);
  const achter = achtergrond(v04.composite.load_factor);
  const actief = v04.kern_breakdown.filter((k) => k.state !== "ontbreekt");
  const wachten = v04.kern_breakdown.filter((k) => k.state === "ontbreekt");

  return (
    <section className="panel kern-panel">
      <header className="kern-head">
        <h2>De kern van de meting</h2>
        <span className="kern-badge">kern</span>
      </header>
      <p className="panel-lead">
        Dit is de scherpere meting. We wegen een kern van negen signalen (weer tonen we als
        hitte én koude) tegen twee tijdvensters tegelijk: een kort venster dat plotse pieken
        snel oppikt, en een lang venster dat rustig en betrouwbaar het niveau bewaakt. Zo zie
        je sneller én stabieler wat er speelt.
      </p>

      <div className="kern-readout">
        <div className="kern-readout-cell">
          <div className="kern-readout-label">De kern-meting vandaag</div>
          <div className="kern-readout-value">{meting}</div>
          <div className="kern-readout-sub">
            hoger dan op {Math.round(v04.percentile.lang)}% van de vergelijkbare dagen in de voorbije twee jaar
          </div>
        </div>
        <div className="kern-readout-cell">
          <div className="kern-readout-label">Achtergronddruk</div>
          <div className="kern-readout-value" style={{ color: achter.color }}>{achter.label}</div>
          <div className="kern-readout-sub">
            hoe zwaar de trage bronnen (energie, brandstof, inflatie) nu op de drempel drukken
          </div>
        </div>
      </div>

      <div className="kern-grid">
        {actief.map((k) => (
          <div key={k.code} className={`kern-chip kern-${k.state}`}>
            <span className="kern-chip-dot" style={{ color: kernColor(k.state) }} aria-hidden="true">
              {kernIcon(k.state)}
            </span>
            <span className="kern-chip-name">{k.plain_name}</span>
            <span className="kern-chip-state" style={{ color: kernColor(k.state) }}>
              {kernLabel(k.state)}
            </span>
            <span className="kern-chip-base muted small">
              vergeleken met dezelfde tijd van het jaar
            </span>
          </div>
        ))}
      </div>

      {wachten.length > 0 && (
        <p className="muted small kern-wachten">
          Nog niet meegerekend — te weinig eigen historie, dit bouwt dag na dag vanzelf op:{" "}
          {wachten.map((k) => k.plain_name).join(", ")}.
        </p>
      )}
    </section>
  );
}
