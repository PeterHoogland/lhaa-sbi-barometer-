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
        {/* Publieksnaam (Peter GO 12/6): De Nationale Stress Index. De eerlijke
            subtitel hieronder is de PERMANENTE claim-mitigatie bij deze naam
            (beslismemo B7, optie B-discipline): nooit verwijderen of afzwakken
            zonder nieuwe naamkeuze-beslissing. De methodologische motornaam
            blijft SBI (footer + docs). */}
        <div className="intro-eyebrow">De Nationale Stress Index</div>
        <div className="intro-subtitle">
          Deze index meet hoe ongewoon zwaar de omstandigheden vandaag zijn voor heel
          België, niet of mensen zich gestrest voelen.
        </div>
        {/* C3: afzender en meetgebied expliciet gescheiden — de alpenbranding
            hierboven mag niet suggereren dat we de Hautes-Alpes meten. */}
        <div className="intro-geo">
          Meetgebied: België · een initiatief van Les Hautes-Alpes (Frankrijk)
        </div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
      </div>
    </header>
  );
}
