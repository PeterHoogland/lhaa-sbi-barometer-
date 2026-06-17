import type { ConditionLevel } from "../types";

/**
 * /preview — toont alle 5 CN-banners naast elkaar.
 * Gebruik door klanten / abonnees om hun banner-integratie te valideren.
 */

interface BannerSpec {
  level: ConditionLevel;
  name: string;
  bannerActive: boolean;
  headline: string;
  body: string;
  action: string | null;
  notes: string;
}

const BANNERS: BannerSpec[] = [
  {
    level: 1,
    name: "Rust",
    bannerActive: false,
    headline: "",
    body: "Geen banner-activatie. Omstandigheden binnen rustband.",
    action: null,
    notes: "Banner-script rendert niets. Geen kosten, geen visuele ruis.",
  },
  {
    level: 2,
    name: "Normaal",
    bannerActive: false,
    headline: "",
    body: "Geen banner-activatie. Omstandigheden binnen normale band.",
    action: null,
    notes: "Banner-script rendert niets.",
  },
  {
    level: 3,
    name: "Venster opent",
    bannerActive: true,
    headline: "Verhoogd-blootstellings-venster open.",
    body: "Wanneer de condities verhoogd zijn, weegt rust extra zwaar.",
    action: "Tijd voor rust →",
    notes: "Standaard banner-set. Geactiveerd bij dagpercentiel 70-89.",
  },
  {
    level: 4,
    name: "Conditie-piek",
    bannerActive: true,
    headline: "Blootstellings-conditie op piekniveau.",
    body: "Statistisch gezien is dit een goed moment voor herstel, preventief, terwijl het kan.",
    action: "Bekijk de bestemmingen →",
    notes: "Verhoogde banner-set. Geactiveerd bij dagpercentiel 90 of hoger.",
  },
  {
    level: 5,
    name: "Brand-safety actief",
    bannerActive: false,
    headline: "",
    body: "De SBI registreert de impact van de actuele gebeurtenis op blootstellings-condities. Commerciële communicatie is opgeschort.",
    action: null,
    notes: "Override-modus. Geen commerciële banner. Wel kan de meting publiek getoond worden.",
  },
];

function BannerPreview({ spec }: { spec: BannerSpec }) {
  return (
    <div className={`preview-card cn-level-${spec.level}`}>
      <div className="preview-card-header">
        <div className="preview-cn">
          CN {spec.level}
          <span className="preview-cn-name">{spec.name}</span>
        </div>
        <div className={`preview-status ${spec.bannerActive ? "on" : "off"}`}>
          banner: {spec.bannerActive ? "aan" : "uit"}
        </div>
      </div>

      <div className="preview-banner-wrap">
        {spec.bannerActive ? (
          <div className={`banner-render banner-render-${spec.level}`}>
            <div className="banner-render-mark">LES HAUTES ALPES</div>
            <div className="banner-render-headline">{spec.headline}</div>
            <div className="banner-render-body">{spec.body}</div>
            {spec.action && <div className="banner-render-action">{spec.action}</div>}
          </div>
        ) : (
          <div className="banner-render banner-render-off">
            <div className="banner-render-body">{spec.body}</div>
          </div>
        )}
      </div>

      <div className="preview-notes">{spec.notes}</div>
    </div>
  );
}

export function PreviewPage() {
  return (
    <div className="preview-page">
      <header className="preview-header">
        <div className="brand-name">SBI · INDEX</div>
        <h1>Banner-preview, alle 5 conditie-niveaus</h1>
        <p className="muted">
          Voor abonnees: zo ziet de banner eruit op elk van de 5 conditie-niveaus.
          De banner-snippet wisselt automatisch tussen deze states op basis van de
          live SBI-meting. Copy is bevroren volgens doc 09.
        </p>
      </header>

      <div className="preview-grid">
        {BANNERS.map((spec) => (
          <BannerPreview key={spec.level} spec={spec} />
        ))}
      </div>

      <section className="panel">
        <h2>Embedden op uw site</h2>
        <p className="panel-lead">Plak dit ergens binnen je &lt;body&gt; tag:</p>
        <pre className="code-block">{`<div id="sbi-banner"></div>
<script src="https://barometer.sbi/embed/banner.js" defer></script>
<script>
  window.addEventListener('load', () => SBI.mount({
    target: '#sbi-banner',
    apiUrl: '/data/latest.json',   // production: https://barometer.sbi/api/v1/signal
    brand: 'Les Hautes Alpes',
    ctaUrl: 'https://plus.hautes-alpes.net/'
  }));
</script>`}</pre>
        <p className="muted small">
          De banner werkt voor alle 5 niveaus. Bij CN 1, 2 en 5 toont hij niets, dat is
          gewenst gedrag. Brand-safety-override is automatisch.
        </p>
      </section>

      <p className="preview-back">
        <a href="/">← terug naar live index</a>
      </p>
    </div>
  );
}
