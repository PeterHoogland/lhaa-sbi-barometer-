/**
 * Publicatie-helper (A3): één plek waar bepaald wordt wat publiek mag.
 *
 * De v0.4-laag draait in test-modus mee in elke DailyOutput (runtime geeft het
 * blok altijd terug — dat is gewenst voor latest-expert.json en de tests), maar
 * mag NIET in het publieke latest.json belanden zolang mode ≠ "live": anders
 * kunnen frontend-paden die op de aanwezigheid van `v04` gaten (TopInfluences,
 * kern-paneel) een testlaag als publiek beeld tonen. Beide CLI-schrijvers
 * (generate-fixture én compute-daily) gebruiken deze helper.
 */

import type { DailyOutput } from "./types.js";

/** Strip de v0.4-testlaag uit de publieke output zolang mode ≠ "live". Puur. */
export function toPublicOutput(output: DailyOutput): DailyOutput {
  if (output.v04?.mode === "live") return output;
  const publicOutput = { ...output };
  delete publicOutput.v04;
  return publicOutput;
}
