import { LHALogo } from "./LHALogo";

/**
 * Site-header: een licht geblurde alpenfoto over de volle breedte, met het
 * Hautes-Alpes-logo groot en gecentreerd bovenaan, een dunne scheidingslijn
 * eronder (zoals op plus.hautes-alpes.net), en daaronder het titelblok.
 *
 * v0.4: spreekt expliciet over 10 kern-indicatoren en uurlijkse bijstelling.
 */
export function HeroBanner() {
  return (
    <header className="site-header">
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
          <LHALogo size={60} />
        </a>
        <div className="hero-tagline">Natuurlijk in het hart van de Alpen.</div>
      </div>
      <div className="hero-rule" aria-hidden="true" />
      <div className="hero-content">
        <div className="intro-eyebrow">Stressor-Blootstellings-Index</div>
        <div className="intro-subtitle">
          Deze index meet hoe ongewoon zwaar de omstandigheden vandaag zijn voor heel
          België, niet of mensen zich gestrest voelen.
        </div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
      </div>
    </header>
  );
}
