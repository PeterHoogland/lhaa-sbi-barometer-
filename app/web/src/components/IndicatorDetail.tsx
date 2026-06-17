import type { IndicatorBreakdown } from "../types";
import { formatObservationDate, observationGranularity } from "../lib/format-date";
import { GRADE_EXPLAINER, GRADE_LABELS } from "./indicator-utils";

/**
 * Het open-klik detailvenster van één indicator: wat we uitlezen, de gemeten
 * waarde, de datum, het geschatte bereik, de databron en de wetenschappelijke
 * onderbouwing. Gedeeld tussen de volledige indicatorlijst (IndicatorList) en de
 * top-3 "Wat speelt vandaag het meest mee?" (TopInfluences), zodat beide exact
 * hetzelfde venster tonen.
 */
export function IndicatorDetail({ ind, hideWhy = false }: { ind: IndicatorBreakdown; hideWhy?: boolean }) {
  return (
    <div className="ind-detail">
      {!hideWhy && <p className="ind-why">{ind.why}</p>}

      <div className="ind-meta-grid">
        <div className="ind-meta-cell">
          <div className="ind-meta-label">Wat we uitlezen</div>
          <div className="ind-meta-value">{ind.reads}</div>
        </div>
        {ind.raw_value !== null && (
          <div className="ind-meta-cell">
            <div className="ind-meta-label">Gemeten waarde</div>
            <div className="ind-meta-value">
              <strong>{formatValue(ind.raw_value, ind.unit)}</strong> {ind.unit}
            </div>
          </div>
        )}
        <div className="ind-meta-cell">
          <div className="ind-meta-label">
            {observationGranularity(ind.observation_date) === "maand"
              ? "Maandcijfer van"
              : "Cijfer van"}
          </div>
          <div className="ind-meta-value">
            {formatObservationDate(ind.observation_date)}
          </div>
        </div>
        <div className="ind-meta-cell">
          <div className="ind-meta-label">Raakt naar schatting</div>
          <div className="ind-meta-value">
            <strong>{Math.round(ind.demographic_reach * 100)}%</strong> van de bevolking
          </div>
        </div>
      </div>

      {ind.grade && (
        <div className="ind-evidence">
          <div className="ind-meta-label">Bewijskracht</div>
          <div className="ind-evidence-head">
            <span className={`grade-badge grade-${ind.grade}`}>{ind.grade}</span>
            <span className="ind-evidence-label">{GRADE_LABELS[ind.grade]}</span>
            <span className="ind-evidence-explainer">{GRADE_EXPLAINER[ind.grade]}</span>
          </div>
          {ind.evidence_note && <p className="ind-evidence-note">{ind.evidence_note}</p>}
        </div>
      )}

      <div className="ind-sources">
        <div className="ind-source-block">
          <div className="ind-source-label">Databron</div>
          <a className="ind-source-link" href={ind.data_source.url} target="_blank" rel="noopener noreferrer">
            {ind.data_source.name} ↗
          </a>
          {ind.simulated && <span className="ind-mock-tag">demo-data</span>}
        </div>

        {ind.references.length > 0 && (
          <div className="ind-source-block">
            <div className="ind-source-label">Wetenschappelijke onderbouwing</div>
            <ul className="ind-refs">
              {ind.references.map((ref, i) => (
                <li key={i}>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer">
                    {ref.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function formatValue(v: number, unit: string): string {
  if (unit.includes("%") || unit.includes("€/liter")) return v.toFixed(2);
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
