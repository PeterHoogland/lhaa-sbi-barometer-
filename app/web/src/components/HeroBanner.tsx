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
        {/* Hero-intro (Peter 18/6). De BINDENDE claim-mitigatie ("geen meting van
            individuele stress") staat onder het cijfer in ConditionLevelDisplay en
            blijft daar staan (B7-discipline, 09_Brand-Message-Style-Guide). */}
        <div className="intro-subtitle">
          Hoe stressvol is het leven van de Belg op dit moment? De Nationale Stress Index meet
          het via diverse parameters. De index analyseert continu verschillende realtime
          indicatoren die een directe impact hebben op ons dagelijkse stressniveau. Dankzij een
          live, altijd up-to-date cijfer, zie je meteen wanneer het hoog tijd is om even te
          ontspannen.
        </div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
        {/* C3: meetgebied expliciet; de afzender staat in de footer. */}
        <div className="intro-geo">Meetgebied: België</div>
      </div>
    </header>
  );
}
