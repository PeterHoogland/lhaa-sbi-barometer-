import { LHALogo } from "./LHALogo";

/**
 * Site-header: een licht geblurde alpenfoto over de volle breedte, met het
 * Hautes-Alpes-logo gecentreerd bovenaan en het titelblok eroverheen.
 * In de sfeer van plus.hautes-alpes.net — rustig, fotografie-gedragen.
 */
export function HeroBanner({ weekIso, today }: { weekIso: string; today: string }) {
  return (
    <header className="site-header">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-tint" aria-hidden="true" />
      <a
        className="site-back"
        href="https://plus.hautes-alpes.net/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Naar hautes-alpes.net ↗
      </a>
      <div className="hero-content">
        <a
          className="site-logo"
          href="https://plus.hautes-alpes.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hautes-Alpes"
        >
          <LHALogo size={80} />
        </a>
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
