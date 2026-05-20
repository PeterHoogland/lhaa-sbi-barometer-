import { LHALogoLarge } from "./LHALogo";

/**
 * Full-bleed hero met Alpen-fotografie.
 * De foto komt van Unsplash (gratis commercial use), wordt overlay'ed met
 * een donkere gradient zodat de typografie leesbaar blijft.
 */
export function HeroBanner({ weekIso, today }: { weekIso: string; today: string }) {
  return (
    <header className="hero-banner">
      <div className="hero-photo" aria-hidden="true" />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-top">
          <LHALogoLarge />
          <div className="hero-meta">
            <div className="hero-meta-line">BAROMETER · {weekIso}</div>
            <div className="hero-meta-date">{today}</div>
          </div>
        </div>
        <div className="hero-eyebrow">Stressor-Blootstellings-Index</div>
        <h1 className="hero-title">
          Hoe staat het er vandaag voor?
        </h1>
        <p className="hero-lead">
          Een dagelijkse meting van 20 omstandigheden die op de hele bevolking
          inwerken. Niet voor jou persoonlijk. Voor het hele land.
        </p>
      </div>
    </header>
  );
}
