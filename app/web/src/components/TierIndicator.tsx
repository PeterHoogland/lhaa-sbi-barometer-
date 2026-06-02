import { BAND_HEADLINE, BAND_SUBLINE, BAND_LABEL, BAND_COLOR, scoreBand } from "../copy";

/**
 * Status-kaart. Volgt de DAG-score (zelfde band-logica als de kicker en de
 * meter-zones: 50/70/90), zodat de kop klopt met het getal bovenaan. Hing vroeger
 * aan de sustained-tier (3 dagen), waardoor 71 nog "gewone dag" las terwijl het
 * cijfer "VERHOOGD" toonde. De campagne-/banner-activatie blijft elders op de
 * sustained-tier-regel (dit is enkel de leesbare status).
 */
export function TierIndicator({ score }: { score: number }) {
  const band = scoreBand(score);
  const color = BAND_COLOR[band];
  return (
    <div className={`tier-indicator tier-${color}`}>
      <div className="tier-light">
        <div className={`tier-dot tier-dot-${color}`} aria-label={`niveau ${band}`} />
      </div>
      <div className="tier-text">
        <div className="tier-label">BAND {BAND_LABEL[band]}</div>
        <h1 className="tier-headline">{BAND_HEADLINE[band]}</h1>
        <p className="tier-subline">{BAND_SUBLINE[band]}</p>
      </div>
    </div>
  );
}
