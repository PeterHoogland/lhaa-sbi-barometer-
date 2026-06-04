import type { Tier, BrandSafety } from "../types";
import { LES_HAUTES_ALPES_CTA } from "../copy";
import { LHALogo } from "./LHALogo";

interface Props {
  tier: Tier;
  brandSafety: BrandSafety;
}

/**
 * Les Hautes Alpes call-to-action.
 * Verschijnt alleen wanneer tier ≥ amber EN brand_safety = normal.
 * Copy strict per doc 09 §5 (geen klinische taal, geen individuele attributie).
 */
export function CallToAction({ tier, brandSafety }: Props) {
  if (brandSafety !== "normal") return null;
  if (tier === "green") return null;
  const cta = LES_HAUTES_ALPES_CTA[tier];
  if (!cta) return null;

  return (
    <section className="cta">
      <div className="cta-inner">
        <div className="cta-mark">
          <span className="lha-mark-mini" style={{ color: "#0a3d6b" }}>
            <LHALogo size={28} />
          </span>
          <span>LES HAUTES ALPES · Natuurlijk in het hart van de Alpen</span>
        </div>
        <h2 className="cta-headline">{cta.headline}</h2>
        <p className="cta-body">{cta.body}</p>
        <a className="cta-action" href="https://plus.hautes-alpes.net/" target="_blank" rel="noopener noreferrer">
          {cta.action} →
        </a>
      </div>
    </section>
  );
}
