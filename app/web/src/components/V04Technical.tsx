import type { V04Output } from "../types";

/**
 * Technische v0.4-weergave voor het 'Technische details'-paneel: de volledige
 * dubbele-baseline-tabel per kern-indicator plus de trigger-status. Bedoeld voor
 * wetenschappers, journalisten en de adversariële reviewer — niet voor de
 * gemiddelde bezoeker (die ziet de rustige kern-sectie bovenaan).
 */

function fmt(v: number | null): string {
  return v === null ? "—" : v.toFixed(2);
}

export function V04Technical({ v04 }: { v04: V04Output }) {
  return (
    <section className="v04-tech">
      <header className="v04-tech-head">
        <h3>Meet- en trigger-laag</h3>
        <span className={`v04-mode mode-${v04.mode}`}>
          {v04.mode === "live" ? "campagnes: automatisch" : "campagnes: handmatig"}
        </span>
      </header>
      <p className="muted small">
        Dit is een tweede, scherpere meting die meeloopt naast het hoofdcijfer en de
        campagne-signalen aanstuurt. De campagne-triggers vereisen handmatige goedkeuring,
        er vuurt niets automatisch.
      </p>

      <div className="v04-stat-row">
        <div className="v04-stat"><span className="v04-stat-k">composite_meting</span><span className="v04-stat-v mono">{v04.composite.meting.toFixed(2)}</span></div>
        <div className="v04-stat"><span className="v04-stat-k">achtergrond</span><span className="v04-stat-v mono">{v04.composite.achtergrond.toFixed(2)}</span></div>
        <div className="v04-stat"><span className="v04-stat-k">load_factor</span><span className="v04-stat-v mono">{v04.composite.load_factor.toFixed(2)}</span></div>
        <div className="v04-stat"><span className="v04-stat-k">percentiel lang / kort</span><span className="v04-stat-v mono">{v04.percentile.lang} / {v04.percentile.kort}</span></div>
      </div>

      <div className="v04-table-wrap">
        <table className="v04-table">
          <thead>
            <tr>
              <th>indicator</th><th>klasse</th><th>z_kort</th><th>z_lang</th>
              <th>Δ1d</th><th>pct_lang</th><th>baseline</th><th>w_meting</th>
            </tr>
          </thead>
          <tbody>
            {v04.kern_breakdown.map((k) => (
              <tr key={k.code} className={k.state === "ontbreekt" ? "v04-row-muted" : ""}>
                <td>{k.plain_name}{k.simulated && <span className="v04-sim"> demo</span>}</td>
                <td className="mono">{k.class}</td>
                <td className="mono">{fmt(k.z_kort)}</td>
                <td className="mono">{fmt(k.z_lang)}</td>
                <td className="mono">{fmt(k.delta_1d)}</td>
                <td className="mono">{k.percentile_lang ?? "—"}</td>
                <td className="mono">{k.baseline_lang_jaren}j</td>
                <td className="mono">{k.w_meting.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
}
