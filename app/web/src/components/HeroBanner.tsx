import { LHALogo } from "./LHALogo";

/**
 * Site-header in de look-and-feel van plus.hautes-alpes.net:
 * een slanke donkergroene balk met het Hautes-Alpes-logo, gevolgd door
 * een rustig titelblok op wit. Minimalistisch, geen fotografie.
 */
export function HeroBanner({ weekIso, today }: { weekIso: string; today: string }) {
  return (
    <header className="site-header">
      <div className="site-bar">
        <a
          className="site-logo"
          href="https://plus.hautes-alpes.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hautes-Alpes"
        >
          <LHALogo size={46} />
        </a>
        <a
          className="site-back"
          href="https://plus.hautes-alpes.net/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Naar hautes-alpes.net ↗
        </a>
      </div>
      <div className="site-intro">
        <div className="intro-eyebrow">Stressor-Blootstellings-Index</div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
        <p className="intro-lead">
          Een dagelijkse meting van 24 omstandigheden die op de hele bevolking
          inwerken. Niet voor jou persoonlijk. Voor het hele land.
        </p>
        <div className="intro-meta">
          Barometer · {weekIso} · {today}
        </div>
      </div>
    </header>
  );
}
