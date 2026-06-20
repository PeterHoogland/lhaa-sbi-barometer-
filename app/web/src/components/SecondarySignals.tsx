import type { SecondarySignal } from "../types";
import { formatObservationDate } from "../lib/format-date";

/**
 * Secundaire signalen — we meten ze wel, maar ze tellen NIET mee in het cijfer.
 * Doel van dit paneel (Peter 2026-06-20): super duidelijk maken WAT er niet
 * meetelt en WAAROM, in taal die iedereen begrijpt. Per signaal staat de reden
 * in één regel.
 *
 * Uit dit paneel gefilterd:
 *  - I-D2-001-rt (DATEX-dagverkeer): voedt sinds 0.4.0 de hybride dagkop (telt dus WEL mee).
 *  - I-D5-trends (Google Trends): verwarrend + schaal-artefact (meestal 0, één dag knalt
 *    naar de kap), niet representatief — bewust niet getoond (Peter 2026-06-20).
 *  - simulated/demo-signalen: geen echte meting.
 */
const HIDDEN = new Set<string>(["I-D2-001-rt", "I-D5-trends"]);

// Eén korte, heldere reden per signaal waarom het niet meetelt.
const REASON: Record<string, string> = {
  "I-D5-006S": "Gaat over wie op Reddit post (jonger, stedelijker), niet over heel België.",
  "I-D5-mastodon": "Klein, niche publiek; niet representatief voor België.",
  "I-D2-009S": "De treinstiptheid telt al mee via een betere bron (Infrabel).",
  "I-D3-003S": "Telt nieuwsartikels; kan uitschieten als één zaak veel in het nieuws komt.",
  "I-D5-emotie": "Gaat over het nieuws, dat al meetelt via een betere bron (GDELT).",
  "I-D5-001-rss": "Meet hetzelfde nieuws dat al meetelt via een betere bron (GDELT); dit is een controle.",
  "I-D2-stib": "Bestaat pas sinds juni 2026: te kort om te weten wat normaal is.",
  "I-D2-delijn": "Bestaat pas sinds juni 2026: te kort om te weten wat normaal is.",
};
function reasonFor(code: string): string {
  return REASON[code] ?? "Heeft nog geen eerlijke, lang genoeg gemeten meetlat.";
}

export function SecondarySignals({ signals }: { signals: SecondarySignal[] }) {
  const shown = (signals ?? []).filter((s) => !HIDDEN.has(s.code) && !s.simulated);
  if (shown.length === 0) return null;

  return (
    <section className="panel secondary-panel">
      <div className="secondary-badge">TELT NIET MEE IN HET CIJFER</div>
      <h2>Signalen die we wel meten, maar niet meetellen</h2>
      <p className="panel-lead">
        Deze signalen tellen <strong>niet mee</strong> in het cijfer bovenaan. We meten ze wel,
        en laten ze hier zien voor wie nieuwsgierig is. Bij elk staat in één regel waarom het
        niet meetelt. De korte regel: een signaal telt pas mee als het lang genoeg eerlijk
        gemeten kan worden, niet iets dubbel meet dat al meetelt, en over heel België gaat.
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
            <div className="secondary-reason">
              <strong>Telt niet mee:</strong> {reasonFor(s.code)}
            </div>
            <div className="secondary-source muted small">{s.source}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
