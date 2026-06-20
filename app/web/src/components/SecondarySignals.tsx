import type { SecondarySignal } from "../types";

/** "Signalen naast het cijfer"-paneel VERWIJDERD (Peter 2026-06-20): de niet-meetellende
 *  signalen (dubbel/kapot/niet-representatief) zorgden voor verwarring. OV telt nu mee in de kop.
 *  Niet-meetellende signalen blijven gedocumenteerd in het methodologie-pakket. Terugzetten = git revert. */
export function SecondarySignals(_props: { signals: SecondarySignal[] }): null {
  return null;
}
