interface Props {
  shortP: number;
  fixedP: number | null;
  composite: number;
  evidenceComposite: number;
  demographicComposite?: number;
}

export function PercentileDisplay({ shortP, fixedP, composite, evidenceComposite, demographicComposite }: Props) {
  return (
    <div className="percentile-display">
      <div className="percentile-main">
        <div className="percentile-label">PERCENTIEL · 24m</div>
        <div className="percentile-value">P {shortP}</div>
        <div className="percentile-context">
          Vergeleken met gewone dagen rond deze tijd van het jaar, over de afgelopen 2 jaar.
        </div>
      </div>

      <div className="percentile-meta">
        <div className="meta-row">
          <span className="meta-key">Composiet (equal weights)</span>
          <span className="meta-value">{composite.toFixed(2)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-key">Composiet (evidence-graded)</span>
          <span className="meta-value">{evidenceComposite.toFixed(2)}</span>
        </div>
        {demographicComposite !== undefined && (
          <div className="meta-row">
            <span className="meta-key">Composiet (demografische weging)</span>
            <span className="meta-value">{demographicComposite.toFixed(2)}</span>
          </div>
        )}
        {fixedP !== null && (
          <div className="meta-row">
            <span className="meta-key">Percentiel · 2010-2019 baseline</span>
            <span className="meta-value">P {fixedP}</span>
          </div>
        )}
      </div>

      <div className="percentile-disclaimer">
        Geen klassieke σ-Z. MAD-gebaseerd. Doc 04 §2.5.
      </div>
    </div>
  );
}
