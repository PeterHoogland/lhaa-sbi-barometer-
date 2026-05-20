import type { DomainContribution } from "../types";
import { DOMAIN_LABELS } from "../copy";

export function DomainContributions({ contributions }: { contributions: DomainContribution[] }) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 0.01);

  return (
    <div className="domain-contributions">
      {contributions.map((c, idx) => {
        const widthPct = (Math.abs(c.contribution) / maxAbs) * 100;
        const positive = c.contribution >= 0;
        return (
          <div className="domain-row" key={c.domain}>
            <div className="domain-rank">{idx + 1}</div>
            <div className="domain-info">
              <div className="domain-code">{c.domain}</div>
              <div className="domain-name">{DOMAIN_LABELS[c.domain]}</div>
            </div>
            <div className="domain-bar-wrap">
              <div
                className={`domain-bar ${positive ? "positive" : "negative"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <div className="domain-value">
              {positive ? "+" : ""}
              {c.contribution.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
