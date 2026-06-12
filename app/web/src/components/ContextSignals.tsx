import type { ContextSignal } from "../types";
import { formatObservationDate } from "../lib/format-date";
import { GRADE_LABELS } from "./indicator-utils";

/**
 * Kalendercontext (A6) — D6-signalen als context, NIET in het cijfer.
 * Deze signalen worden afgeleid uit de kalender (vakanties, examens,
 * klok-verzetten), niet gemeten. Daarom tonen we ze zonder z-score,
 * zonder state en zonder bijdrage: "het is examenperiode" is duiding,
 * geen gemeten stress.
 */
export function ContextSignals({ signals, bare = false }: { signals: ContextSignal[]; bare?: boolean }) {
  if (!signals || signals.length === 0) return null;

  return (
    // `bare` (Peter 13/6): binnen de uitklikbalk "Context - Niet in het cijfer"
    // levert de balk de titel — badge en h2 zijn daar dubbelop en blijven weg.
    <section className={bare ? "context-panel" : "panel secondary-panel context-panel"}>
      {!bare && <div className="secondary-badge">CONTEXT · NIET IN HET CIJFER</div>}
      {!bare && <h2>De kalender als context</h2>}
      <p className="panel-lead">
        Deze ritmes lees je af aan de kalender, we meten ze niet. Examens,
        vakanties en het klok-verzetten kleuren hoe een dag aanvoelt, maar een
        kalender is een ontwerp-aanname en geen meting. Daarom tellen deze vier
        signalen <strong>bewust niet mee</strong> in het cijfer of in de
        banner-activatie. We tonen ze als duiding bij wat we wél meten.
      </p>

      <div className="secondary-list">
        {signals.map((s) => (
          <div key={s.code} className="secondary-item">
            <div className="secondary-item-head">
              <span className="secondary-name">{s.plain_name}</span>
              <span className="secondary-value">
                {s.raw_value} {s.unit}
              </span>
            </div>
            <div className="secondary-meta">
              <span className="secondary-code">{s.code}</span>
              <span>Stand op: {formatObservationDate(s.observation_date)}</span>
            </div>
            <div className="secondary-source">{s.reads}</div>
            {s.grade && (
              <div className="secondary-source">
                <span className={`ind-grade grade-${s.grade}`} title={`Bewijskracht ${s.grade}: ${GRADE_LABELS[s.grade]}`}>
                  bewijs {s.grade}
                </span>
                {s.evidence_note && <span className="ctx-evidence-note"> {s.evidence_note}</span>}
              </div>
            )}
            <div className="secondary-source">
              Bron:{" "}
              <a href={s.data_source.url} target="_blank" rel="noreferrer">
                {s.data_source.name}
              </a>
              {s.references.map((r) => (
                <span key={r.url}>
                  {" · "}
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.label}
                  </a>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="secondary-disclaimer">
        Waarom apart? Een kalendervariabele "weet" zijn waarde al bij het
        ontwerp: dat er in juni examens zijn, is geen meting van vandaag. Zou
        ze meetellen, dan bevestigt het cijfer zijn eigen aanname. Sinds het
        A6-amendement (juni 2026) staan deze kalendersignalen daarom hier, als
        context naast de gemeten indicatoren.
      </p>
    </section>
  );
}
