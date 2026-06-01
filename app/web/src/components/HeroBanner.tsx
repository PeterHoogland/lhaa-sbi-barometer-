import { LHALogo } from "./LHALogo";

interface Props {
  weekIso: string;
  today: string;
  lastRunTime: string; // bv. "14:00"
}

/**
 * Site-header: een licht geblurde alpenfoto over de volle breedte, met het
 * Hautes-Alpes-logo groot en gecentreerd bovenaan, een dunne scheidingslijn
 * eronder (zoals op plus.hautes-alpes.net), en daaronder het titelblok.
 *
 * v0.4: spreekt expliciet over 10 kern-indicatoren en uurlijkse bijstelling.
 */
export function HeroBanner({ weekIso, today, lastRunTime }: Props) {
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
      <div className="hero-top">
        <a
          className="site-logo"
          href="https://plus.hautes-alpes.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hautes-Alpes"
        >
          <LHALogo size={56} />
        </a>
        <div className="hero-tagline">Natuurlijk in het hart van de Alpen.</div>
      </div>
      <div className="hero-rule" aria-hidden="true" />
      <div className="hero-content">
        <div className="intro-eyebrow">Stressor-Blootstellings-Index</div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
        <p className="intro-lead">
          Een dagelijkse meting van de kern-indicatoren die op de hele bevolking
          inwerken. Niet voor jou persoonlijk. Voor het hele land.
        </p>
        <div className="intro-meta">
          Barometer · {weekIso} · {today}
        </div>
        <div className="intro-note">
          De Stressindex wordt elke dag gecontroleerd en bijgestuurd · laatst om {lastRunTime}
        </div>
      </div>
    </header>
  );
}
