import type { V04Output, TriggerEvent } from "../types";

/**
 * Technische v0.4-weergave voor het 'Technische details'-paneel: de volledige
 * dubbele-baseline-tabel per kern-indicator plus de trigger-status. Bedoeld voor
 * wetenschappers, journalisten en de adversariële reviewer — niet voor de
 * gemiddelde bezoeker (die ziet de rustige kern-sectie bovenaan).
 */

function fmt(v: number | null): string {
  return v === null ? "—" : v.toFixed(2);
}

function TriggerRow({ t }: { t: TriggerEvent }) {
  return (
    <li className={`v04-trigger sev-${t.severity}`}>
      <span className="v04-trig-type mono">{t.type}</span>
      <span className="v04-trig-code">{t.plain_name ?? t.code ?? "composiet"}</span>
      <span className="v04-trig-sev">{t.severity}</span>
      {t.require_manual_approval && <span className="v04-trig-hold">handmatige goedkeuring</span>}
    </li>
  );
}

export function V04Technical({ v04 }: { v04: V04Output }) {
  return (
    <section className="v04-tech">
      <header className="v04-tech-head">
        <h3>SBI v0.4 — meet- en trigger-laag</h3>
        <span className={`v04-mode mode-${v04.mode}`}>modus: {v04.mode}</span>
      </header>
      <p className="muted small">
        Draait additief naast de v0.2-meting. composite_meting = Σ(w_meting × z_lang) over de
        kern; de trage bronnen laden de trigger-drempel via de load_factor. Triggers staan in
        test-modus en vereisen handmatige goedkeuring — er vuurt niets automatisch.
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

      <div className="v04-triggers">
        <h4>Trigger-status: {v04.triggers.length === 0 ? "rustig" : `${v04.triggers.length} actief`}</h4>
        {v04.triggers.length === 0 ? (
          <p className="muted small">Geen actieve triggers vandaag.</p>
        ) : (
          <ul className="v04-trigger-list">
            {v04.triggers.map((t, i) => <TriggerRow key={i} t={t} />)}
          </ul>
        )}
      </div>
    </section>
  );
}
