import type { SecondarySignal } from "../types";
import { formatObservationDate } from "../lib/format-date";

/**
 * Secundaire signalen — sensitiviteit, NIET in het composiet.
 * Expliciet gelabeld als experimenteel en niet-representatief.
 * Bron: doc 02 §10 secundaire set.
 */
export function SecondarySignals({ signals }: { signals: SecondarySignal[] }) {
  if (!signals || signals.length === 0) return null;

  return (
    <section className="panel secondary-panel">
      <div className="secondary-badge">SECUNDAIR · NIET IN HET CIJFER</div>
      <h2>Onderstroom-peiling</h2>
      <p className="panel-lead">
        Dit zijn <strong>experimentele signalen</strong> die we apart meten maar
        die <strong>bewust niet meetellen</strong> in het cijfer (0-100) of
        in de banner-activatie. Sociale media zijn geen doorsnede van de bevolking,
        dus ze horen methodologisch niet in de officiële meting (doc 02 §8).
        We tonen ze hier alleen ter vergelijking.
      </p>

      <div className="secondary-list">
        {signals.map((s) => (
          <div key={s.code} className="secondary-item">
            <div className="secondary-item-head">
              <span className="secondary-name">{s.name}</span>
              <span className="secondary-value">{s.value.toFixed(2)}</span>
            </div>
            <div className="secondary-meta">
              <span className="secondary-code">{s.code}</span>
              <span>Gemeten: {formatObservationDate(s.observation_date)}</span>
              {s.simulated && <span className="secondary-mock">demo-data</span>}
            </div>
            <div className="secondary-source">{s.source}</div>
          </div>
        ))}
      </div>

      <p className="secondary-disclaimer">
        Waarom apart? Deze signalen zijn vers en nuttig, maar missen een lange
        eigen meetlat of een representatieve doorsnede van de bevolking. De
        Reddit-peiling steunt op een publiek dat jonger, stedelijker en hoger
        opgeleid is dan de gemiddelde Belg. De ontslag-radar telt nieuwsartikels
        en kan uitschieten wanneer er veel duiding rond één gebeurtenis is.
        Daarom: zichtbaar voor wie nieuwsgierig is, maar bewust buiten het
        officiële cijfer gehouden. Lees per signaal de bronregel hieronder.
      </p>
    </section>
  );
}
