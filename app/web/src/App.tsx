import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
// CallToAction bewust niet meer gerenderd (Peter 2026-06-12) — zie <main> hieronder.
import { CollapseBar } from "./components/CollapseBar";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { DemoBanner } from "./components/DemoBanner";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { HeroBanner } from "./components/HeroBanner";
import { LHALogo } from "./components/LHALogo";
import { ButtonPanels } from "./components/ButtonPanels";
import { IndicatorList } from "./components/IndicatorList";
import { FOOTER_NOTES } from "./copy";

export function App() {
  const [data, setData] = useState<DailyOutput | null>(null);
  // Volledige output incl. v0.4-testlaag — ALLEEN voor de expliciet als "expert/test"
  // gelabelde panelen. De publieke weergave gebruikt uitsluitend `data` (v0.2).
  const [expertData, setExpertData] = useState<DailyOutput | null>(null);
  const [sparkline, setSparkline] = useState<SparklinePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isPreview = typeof window !== "undefined" && window.location.pathname.startsWith("/preview");

  useEffect(() => {
    if (isPreview) return;
    const load = async () => {
      try {
        // Cache-busten verplicht (methodologie). latest.json en sparkline-30d.json
        // zijn APARTE bestanden; zonder cache-bust kan de CDN/browser het ene vers
        // serveren en het andere uit een oudere cache -> het hoofdcijfer (kop) en de
        // grafiek lopen dan uiteen (bv. 90 boven, 85 in de grafiek). Eén gedeelde
        // bust-token + no-store garandeert dat beide uit dezelfde verse run komen.
        const bust = `?t=${Date.now()}`;
        const noStore: RequestInit = { cache: "no-store" };
        const [latest, spark] = await Promise.all([
          fetch(`/data/latest.json${bust}`, noStore).then((r) => {
            if (!r.ok) throw new Error("latest.json niet gevonden");
            return r.json() as Promise<DailyOutput>;
          }),
          fetch(`/data/sparkline-30d.json${bust}`, noStore).then((r) => {
            if (!r.ok) throw new Error("sparkline-30d.json niet gevonden");
            return r.json() as Promise<SparklinePoint[]>;
          }),
        ]);
        setData(latest);
        setSparkline(spark);
        // Expert/test-kanaal (v0.4) — optioneel; faalt stil als het er niet is,
        // dan tonen de expert-panelen enkel de v0.2-velden.
        try {
          const r = await fetch(`/data/latest-expert.json${bust}`, noStore);
          if (r.ok) setExpertData((await r.json()) as DailyOutput);
        } catch {
          /* geen expert-data beschikbaar */
        }
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
    return <div className="loading">De Nationale Stress Index laadt…</div>;
  }

  const stamp = new Date(data.timestamp);
  const lastRunTime = stamp.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });

  return (
    <div className={`app tier-${data.tier.current}`}>
      <HeroBanner />

      <DemoBanner dataQuality={data.data_quality} />

      {data.brand_safety.flag !== "normal" && (
        <BrandSafetyBanner brandSafety={data.brand_safety} />
      )}

      <main>
        <ConditionLevelDisplay data={data} lastRunTime={lastRunTime} />

        {/* CTA-banner ("Adem in. Adem uit.") op instructie van Peter (2026-06-12)
            van de hoofdsite gehaald. Component + copy blijven bestaan voor de
            campagne-heractivering; de abonnee-kanalen (embed/banner.js,
            PreviewPage) zijn hier bewust NIET door geraakt.
            Heractiveren = deze regel terugzetten:
            <CallToAction tier={data.tier.current} brandSafety={data.brand_safety.flag} /> */}

        {/* Alle uitklapbalken in ÉÉN bp-section (Peter 18/6) zodat de tussenafstand
            overal gelijk is. "Wat speelt vandaag het meest mee?" is op verzoek van
            Peter (18/6) verwijderd. */}
        <section className="bp-section" aria-label="Verdieping en verantwoording">
          {/* Eerste blok onder het cijfer (Peter 18/6): de volledige indicatorlijst
              achter "Bekijk hoe we dit berekenen" (was "De omstandigheden die we volgen");
              bare-modus laat de dubbele kop weg. */}
          <CollapseBar
            label="Bekijk hoe we dit berekenen"
            sub="De omstandigheden die we volgen, per categorie"
          >
            <IndicatorList bare breakdown={data.indicator_breakdown} />
          </CollapseBar>

          <ButtonPanels data={expertData ?? data} sparkline={sparkline} />
        </section>
      </main>

      <footer className="footer">
        {/* Over Les Hautes-Alpes (Peter 17/6): afzender + uitnodiging. */}
        <div className="lha-about">
          <h2>De Nationale Stress Index is een initiatief van June20, in samenwerking met het toeristisch agentschap van Les Hautes-Alpes.</h2>
          <p>
            De Hautes-Alpes verenigen de charme van de Zuid-Franse Alpen met een ongeëvenaard gevoel van
            ruimte en vrijheid. Deze nog relatief onontdekte regio verrast met een indrukwekkend landschap
            van bergen, bossen, meren en meer dan 1.800 kilometer aan langeafstandswandelpaden. Wie op zoek
            is naar rust, vindt er een ontspannen en authentieke sfeer om volop van te genieten.
          </p>
          <p>
            Ontdek wat Les Hautes-Alpes allemaal te bieden heeft op{" "}
            <a href="https://www.leshautesalpes.be" target="_blank" rel="noopener noreferrer">
              www.leshautesalpes.be
            </a>
            .
          </p>
          <div className="lha-about-logos">
            <span
              className="footer-indexmark"
              style={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--lha-snow)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "4px",
                padding: "8px 14px",
              }}
            >
              De Nationale Stress Index
            </span>
            <LHALogo size={52} />
          </div>
        </div>
        <div className="footer-inner footer-center">
          <div className="footer-credits">
            <span>Een initiatief van June20, in samenwerking met Les Hautes Alpes · {FOOTER_NOTES.tagline}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
