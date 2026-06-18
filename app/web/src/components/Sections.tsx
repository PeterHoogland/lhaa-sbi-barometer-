import type { DailyOutput } from "../types";

export function MEDIA_DIAGNOSTIC({ diagnostic }: { diagnostic: DailyOutput["media_cluster_diagnostic"] }) {
  return (
    <section className="panel media-diagnostic">
      <h2>Mediacyclus-diagnostiek</h2>
      <p className="panel-lead">
        Het composiet zonder D5 (media & collectieve gebeurtenissen), naast de 7-daagse
        cross-correlatie tussen nieuwsnegativiteit en collectieve gebeurtenissen.
        Bron: doc 03 §4.4.
      </p>
      <div className="md-grid">
        <div className="md-cell">
          <div className="md-label">Composiet zonder D5</div>
          <div className="md-value">{diagnostic.composite_without_d5.toFixed(2)}</div>
        </div>
        <div className="md-cell">
          <div className="md-label">Cross-correlatie 7d (D5-001 ↔ D5-003)</div>
          <div className={`md-value ${Math.abs(diagnostic.d5_cross_correlation_7d) > 0.7 ? "warn" : ""}`}>
            {diagnostic.d5_cross_correlation_7d.toFixed(2)}
          </div>
          {Math.abs(diagnostic.d5_cross_correlation_7d) > 0.7 && (
            <div className="md-warn">D5-gewicht automatisch gehalveerd deze week (auto-decorrelatie).</div>
          )}
        </div>
        <div className="md-cell">
          <div className="md-label">Media-bijdrage (percentielpunten)</div>
          <div className="md-value">{diagnostic.media_contribution_percentile_points}</div>
        </div>
      </div>
    </section>
  );
}

// FOOTER-component verwijderd (18/6): dood sinds App.tsx zijn eigen <footer> rendert
// (Peter 17/6). De LHA-afzenderfooter leeft in App.tsx; deze export werd nergens nog
// geïmporteerd.
