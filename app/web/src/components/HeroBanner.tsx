/**
 * Site-header (June20-branding, Peter 13/6): de merknaam bovenaan — het
 * Les Hautes-Alpes-logo, de tagline en de site-link zijn naar de onderste
 * balk verhuisd (afzender, geen meetgebied). Daaronder de eerlijke
 * openingszin, de grote vraag en het meetgebied.
 */
export function HeroBanner() {
  return (
    <header className="site-header">
      <div className="hero-top">
        <div className="hero-brand">De Nationale Stress Index</div>
      </div>
      <div className="hero-rule" aria-hidden="true" />
      <div className="hero-content">
        {/* Eerlijke openingszin (formulering Peter 13/6, herzien zelfde dag) —
            de permanente claim-mitigatie bij de Stress-naam (B7-discipline):
            we meten omstandigheden die op mensen KUNNEN inwerken, geen gemeten
            gevoelens. Niet verwijderen of afzwakken zonder nieuwe
            naamkeuze-beslissing; zie 09_Brand-Message-Style-Guide. */}
        <div className="intro-subtitle">
          Deze index meet elke dag en elk uur hoe omstandigheden in heel België
          op mensen kunnen inwerken.
        </div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
        {/* C3: meetgebied expliciet; de afzender staat in de footer. */}
        <div className="intro-geo">Meetgebied: België</div>
      </div>
    </header>
  );
}
