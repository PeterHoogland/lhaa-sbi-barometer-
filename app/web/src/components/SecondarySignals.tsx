import type { SecondarySignal } from "../types";
import { formatObservationDate } from "../lib/format-date";

/**
 * Secundaire signalen — sensitiviteit, NIET in het composiet/cijfer.
 * Expliciet experimenteel en niet-representatief. Bron: doc 02, secundaire set.
 *
 * Uit dit paneel gefilterd (correctie 2026-06-20):
 *  - I-D2-001-rt (DATEX-dagverkeer): voedt sinds 0.4.0 de hybride dagkop
 *    (daily_pressure, §4.1.14) als dagsignaal en hoort dus NIET meer bij
 *    "niet in het cijfer".
 *  - simulated/demo-signalen (bv. vluchten zonder bereikbare bron): geen echte
 *    meting, dus niet tonen alsof het een signaal is.
 */
const IN_HEADLINE = new Set<string>(["I-D2-001-rt"]);

export function SecondarySignals({ signals }: { signals: SecondarySignal[] }) {
  const shown = (signals ?? []).filter((s) => !IN_HEADLINE.has(s.code) && !s.simulated);
  if (shown.length === 0) return null;

  return (
    <section className="panel secondary-panel">
      <div className="secondary-badge">SECUNDAIR · NIET IN HET CIJFER</div>
      <h2>Signalen naast het cijfer</h2>
      <p className="panel-lead">
        Dit zijn <strong>experimentele signalen</strong> die we apart meten maar
        die <strong>bewust niet meetellen</strong> in het cijfer (0-100) of in de
        banner-activatie. Ze komen uit verschillende lagen: de sociale onderstroom
        (Reddit, Mastodon), het zoekgedrag (Google Trends), nieuws-afgeleiden
        (ontslag-radar, emotionele lading, een RSS-controle naast GDELT) en
        real-time openbaar vervoer (STIB, De Lijn, treinverstoringen). Ze missen
        ofwel een lange eigen meetlat, ofwel een representatieve doorsnede van de
        bevolking, dus ze horen nog niet in de officiële meting. We tonen ze hier
        ter vergelijking, voor wie nieuwsgierig is.
      </p>

      <div className="secondary-list">
        {shown.map((s) => (
          <div key={s.code} className="secondary-item">
            <div className="secondary-item-head">
              <span className="secondary-name">{s.name}</span>
              <span className="secondary-value">{s.value.toFixed(2)}</span>
            </div>
            <div className="secondary-meta">
              <span className="secondary-code">{s.code}</span>
              <span>Gemeten: {formatObservationDate(s.observation_date)}</span>
            </div>
            <div className="secondary-source">{s.source}</div>
          </div>
        ))}
      </div>

      <p className="secondary-disclaimer">
        Waarom apart? Twee voorbeelden maken het concreet. De Reddit- en
        Mastodon-peilingen steunen op een publiek dat jonger, stedelijker en hoger
        opgeleid is dan de gemiddelde Belg, en zijn dus niet representatief. De
        ontslag-radar telt nieuwsartikels en kan uitschieten wanneer er veel
        duiding rond één gebeurtenis is. Zulke signalen zijn vers en nuttig om mee
        te kijken, maar nog niet betrouwbaar genoeg voor het officiële cijfer. Lees
        per signaal de bronregel.
      </p>
    </section>
  );
}
