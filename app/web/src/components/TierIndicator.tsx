import type { Tier } from "../types";
import { TIER_HEADLINE, TIER_SUBLINE } from "../copy";

export function TierIndicator({ tier, daysInTier }: { tier: Tier; daysInTier: number }) {
  return (
    <div className={`tier-indicator tier-${tier}`}>
      <div className="tier-light">
        <div className={`tier-dot tier-dot-${tier}`} aria-label={`tier ${tier}`} />
      </div>
      <div className="tier-text">
        <div className="tier-label">
          {tier === "green" && "GROEN · BAND NORMAAL"}
          {tier === "amber" && "ORANJE · VENSTER OPEN"}
          {tier === "red" && "ROOD · CONDITIE-PIEK"}
        </div>
        <h1 className="tier-headline">{TIER_HEADLINE[tier]}</h1>
        <p className="tier-subline">{TIER_SUBLINE[tier]}</p>
        {tier !== "green" && (
          <div className="tier-meta">Dag {daysInTier} in deze tier.</div>
        )}
      </div>
    </div>
  );
}
