/**
 * Datum-formattering voor publicatiedatums per indicator.
 * Een observation_date is ofwel YYYY-MM-DD (dagelijkse bron)
 * of YYYY-MM (maandelijkse bron, bv. ECB).
 */

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function formatObservationDate(obs: string): string {
  if (!obs) return "onbekend";

  // YYYY-MM-DD → "21 mei 2026"
  const dayMatch = obs.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const [, y, m, d] = dayMatch;
    const maand = MAANDEN[parseInt(m, 10) - 1] ?? m;
    return `${parseInt(d, 10)} ${maand} ${y}`;
  }

  // YYYY-MM → "april 2026"
  const monthMatch = obs.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const [, y, m] = monthMatch;
    const maand = MAANDEN[parseInt(m, 10) - 1] ?? m;
    return `${maand} ${y}`;
  }

  return obs;
}

/** Geeft 'dagcijfer' of 'maandcijfer' afhankelijk van de granulariteit. */
export function observationGranularity(obs: string): "dag" | "maand" | "onbekend" {
  if (/^\d{4}-\d{2}-\d{2}$/.test(obs)) return "dag";
  if (/^\d{4}-\d{2}$/.test(obs)) return "maand";
  return "onbekend";
}
