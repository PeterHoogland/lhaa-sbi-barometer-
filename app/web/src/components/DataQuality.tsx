import type { DailyOutput } from "../types";

export function DataQuality({ dataQuality }: { dataQuality: DailyOutput["data_quality"] }) {
  const hasSimulated = dataQuality.indicators_simulated.length > 0;
  const hasMissing = dataQuality.indicators_missing.length > 0;

  return (
    <section className="panel data-quality">
      <h2>Welke metingen zijn echt en welke nog niet</h2>

      <p className="panel-lead">
        We zijn eerlijk over wat al echt-tijd is, en wat nog op test-data draait.
      </p>

      <div className="dq-grid">
        <div className={`dq-row ${hasSimulated ? "warn" : "ok"}`}>
          <span className="dq-label">Nog op test-data</span>
          <span className="dq-value">{dataQuality.indicators_simulated.length} van 20</span>
          {hasSimulated && (
            <details className="dq-detail">
              <summary>Welke?</summary>
              <code>{dataQuality.indicators_simulated.join(", ")}</code>
            </details>
          )}
        </div>

        <div className="dq-row ok">
          <span className="dq-label">Echt-tijd live</span>
          <span className="dq-value">{20 - dataQuality.indicators_simulated.length} van 20</span>
        </div>

        <div className={`dq-row ${hasMissing ? "warn" : "ok"}`}>
          <span className="dq-label">Ontbrekend</span>
          <span className="dq-value">{dataQuality.indicators_missing.length}</span>
        </div>

        <div className="dq-row ok">
          <span className="dq-label">Versie van de meting</span>
          <span className="dq-value">v{dataQuality.methodology_version}</span>
        </div>
      </div>

      {hasSimulated && (
        <p className="dq-disclaimer">
          Tijdens deze test-fase gebruiken we voor sommige indicatoren nog gesimuleerde data,
          omdat de echte bronnen nog moeten worden aangesloten. Het cijfer van vandaag is dus
          niet bedoeld als 100% accurate stand van het land. We verbeteren dit stap voor stap.
        </p>
      )}
    </section>
  );
}
