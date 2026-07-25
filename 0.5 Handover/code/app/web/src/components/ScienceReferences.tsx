import type { IndicatorBreakdown } from "../types";
import { SBI_FOUNDATIONS } from "../lib/kern";

/**
 * Aggregaat van alle wetenschappelijke bronnen waarop de SBI is gebouwd:
 * - De foundationele bronnen voor de index als geheel (kern.ts).
 * - De per-indicator referenties uit `indicator_breakdown[].references`,
 *   gededupliceerd op URL.
 */
export function ScienceReferences({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  // dedup per indicator-ref op URL (of label als URL ontbreekt)
  const seen = new Set<string>();
  const perIndicator: Array<{ label: string; url: string; indicators: string[] }> = [];
  for (const b of breakdown) {
    for (const ref of b.references || []) {
      const key = ref.url || ref.label;
      const existing = perIndicator.find((r) => (r.url || r.label) === key);
      if (existing) {
        if (!existing.indicators.includes(b.plain_name)) existing.indicators.push(b.plain_name);
        continue;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      perIndicator.push({ label: ref.label, url: ref.url, indicators: [b.plain_name] });
    }
  }

  return (
    <div className="science-refs">
      <h3>Fundament van de index</h3>
      <ul className="ref-list">
        {SBI_FOUNDATIONS.map((r, i) => (
          <li key={i}>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.label} ↗
              </a>
            ) : (
              <span>{r.label}</span>
            )}
          </li>
        ))}
      </ul>

      <h3>Per indicator</h3>
      <p className="muted small">
        Onder elke indicator zit een eigen peer-reviewed onderbouwing. Hier
        staan ze gebundeld; achter elke bron zie je welke indicator(en) erop steunen.
      </p>
      <ul className="ref-list">
        {perIndicator.map((r, i) => (
          <li key={i}>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.label} ↗
              </a>
            ) : (
              <span>{r.label}</span>
            )}
            <span className="ref-tags">
              {r.indicators.map((name, j) => (
                <span key={j} className="ref-tag">{name}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>

      <p className="muted small ref-note">
        Volledige methodologische verantwoording: pre-registratie en de zes lagen
        (indicator-selectie → drempel) staan in de open-source repository van het project.
      </p>
    </div>
  );
}
