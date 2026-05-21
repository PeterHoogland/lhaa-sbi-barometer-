import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
import { TierIndicator } from "./components/TierIndicator";
import { PercentileDisplay } from "./components/PercentileDisplay";
import { DomainContributions } from "./components/DomainContributions";
import { Sparkline } from "./components/Sparkline";
import { CallToAction } from "./components/CallToAction";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { Methodology } from "./components/Methodology";
import { DataQuality } from "./components/DataQuality";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { PlainExplainer } from "./components/PlainExplainer";
import { TopInfluences } from "./components/TopInfluences";
import { IndicatorList } from "./components/IndicatorList";
import { HeroBanner } from "./components/HeroBanner";
import { LHALogo } from "./components/LHALogo";
import { AllSources } from "./components/AllSources";
import { IndicatorZView } from "./components/IndicatorZView";
import { SecondarySignals } from "./components/SecondarySignals";
import { MEDIA_DIAGNOSTIC } from "./components/Sections";
import { FOOTER_NOTES } from "./copy";

export function App() {
  const [data, setData] = useState<DailyOutput | null>(null);
  const [sparkline, setSparkline] = useState<SparklinePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  const isPreview = typeof window !== "undefined" && window.location.pathname.startsWith("/preview");

  useEffect(() => {
    if (isPreview) return;
    const load = async () => {
      try {
        const [latest, spark] = await Promise.all([
          fetch("/data/latest.json").then((r) => {
            if (!r.ok) throw new Error("latest.json niet gevonden");
            return r.json() as Promise<DailyOutput>;
          }),
          fetch("/data/sparkline-30d.json").then((r) => {
            if (!r.ok) throw new Error("sparkline-30d.json niet gevonden");
            return r.json() as Promise<SparklinePoint[]>;
          }),
        ]);
        setData(latest);
        setSparkline(spark);
      } catch (e) {
        setError(e instanceof Error ? e.message : "onbekende fout");
      }
    };
    void load();
  }, [isPreview]);

  if (isPreview) {
    return <PreviewPage />;
  }

  if (error) {
    return (
      <div className="error-state">
        <h1>Data niet beschikbaar</h1>
        <p>{error}</p>
        <p className="muted">
          Draai eerst <code>npm run generate-fixture</code> in <code>app/engine</code>.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Barometer laadt…</div>;
  }

  const today = new Date(data.timestamp).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`app tier-${data.tier.current}`}>
      <HeroBanner weekIso={data.week_iso} today={today} />

      {data.brand_safety.flag !== "normal" && (
        <BrandSafetyBanner brandSafety={data.brand_safety} />
      )}

      <main>
        <ConditionLevelDisplay data={data} />

        <PlainExplainer data={data} />

        <CallToAction tier={data.tier.current} brandSafety={data.brand_safety.flag} />

        <TopInfluences breakdown={data.indicator_breakdown} />

        <IndicatorList breakdown={data.indicator_breakdown} />

        <IndicatorZView breakdown={data.indicator_breakdown} />

        <section className="panel sparkline-panel">
          <h2>Hoe was het de laatste 60 dagen?</h2>
          <p className="panel-lead">
            Elke stip is één dag. Hoe hoger op de grafiek, hoe meer signalen tegelijk hoog staan.
            De gekleurde banden tonen de drempels: <strong>gemiddeld</strong>,
            <strong> hoger dan gewoonlijk</strong> (vanaf 70%),
            <strong> uitzonderlijk hoog</strong> (vanaf 90%).
          </p>
          <Sparkline points={sparkline} />
        </section>

        <SecondarySignals signals={data.secondary_signals} />

        <Methodology />

        <AllSources breakdown={data.indicator_breakdown} />

        <DataQuality dataQuality={data.data_quality} />

        <section className="technical-toggle">
          <button
            className="technical-toggle-btn"
            onClick={() => setShowTechnical(!showTechnical)}
            aria-expanded={showTechnical}
          >
            {showTechnical ? "− Verberg technische details" : "+ Toon technische details"}
          </button>
          <p className="muted small technical-toggle-hint">
            Voor wetenschappers, journalisten en de adversariële reviewer.
          </p>
        </section>

        {showTechnical && (
          <>
            <section className="hero">
              <TierIndicator tier={data.tier.current} daysInTier={data.tier.days_in_tier} />
              <PercentileDisplay
                shortP={data.percentile.short_24m}
                fixedP={data.percentile.fixed_2010_2019}
                composite={data.composite.equal}
                evidenceComposite={data.composite.evidence_graded}
              />
            </section>
            <section className="panel">
              <h2>Domein-bijdragen</h2>
              <p className="panel-lead">
                Onder equal-weights (Schema 1), pre-geregistreerd primair schema.
              </p>
              <DomainContributions contributions={data.top_contributing_domains} />
            </section>
            <MEDIA_DIAGNOSTIC diagnostic={data.media_cluster_diagnostic} />
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-mark">
            <span className="lha-mark-mini" style={{ color: "#fcfeff" }}>
              <LHALogo size={42} />
            </span>
            <div>
              <div style={{ fontFamily: "var(--f-sans)", fontWeight: 600, letterSpacing: "0.18em", marginBottom: 4 }}>
                LES HAUTES ALPES
              </div>
              <div className="footer-mark-text">{FOOTER_NOTES.tagline}</div>
            </div>
          </div>
          <div className="footer-row">
            <strong>SBI v{data.data_quality.methodology_version}</strong>
            <span className="muted">·</span>
            <span>{FOOTER_NOTES.implementationStage}</span>
          </div>
          <div className="footer-row muted">{FOOTER_NOTES.methodologyRef}</div>
          <div className="footer-row muted small">{FOOTER_NOTES.ondersteunend}</div>
          <div className="footer-row muted small">
            Methodologie open. Code: open source. Pre-registratie via OSF.
          </div>
        </div>
      </footer>
    </div>
  );
}
