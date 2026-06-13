import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
// CallToAction bewust niet meer gerenderd (Peter 2026-06-12) — zie <main> hieronder.
import { CollapseBar } from "./components/CollapseBar";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { DemoBanner } from "./components/DemoBanner";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { TopInfluences } from "./components/TopInfluences";
import { ContextSignals } from "./components/ContextSignals";
import { HeroBanner } from "./components/HeroBanner";
import { LHALogo } from "./components/LHALogo";
import { ButtonPanels } from "./components/ButtonPanels";
import { enrichKern } from "./lib/explainer";
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
        // Expert/test-kanaal (v0.4) — optioneel; faalt stil als het er niet is,
        // dan tonen de expert-panelen enkel de v0.2-velden.
        try {
          const r = await fetch("/data/latest-expert.json");
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
    return <div className="loading">Barometer laadt…</div>;
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

        {/* Peter 13/6: deze twee blokken staan niet langer open op de pagina
            maar achter uitklikbalken, in dezelfde stijl als de balken eronder. */}
        <section className="bp-section" aria-label="Vandaag uitgelicht">
          <CollapseBar
            label="Wat speelt vandaag het meest mee?"
            sub="De drie indicatoren met vandaag de meeste invloed op het cijfer"
          >
            <TopInfluences
              bare
              breakdown={
                // Gate op mode (A3), niet op aanwezigheid: een test-modus-v04 mag de
                // publieke top-3 nooit voeden, ook niet als een publisher vergeet te strippen.
                data.v04?.mode === "live"
                  ? data.v04.kern_breakdown.map((k) => enrichKern(k, data.indicator_breakdown))
                  : data.indicator_breakdown
              }
            />
          </CollapseBar>
          <CollapseBar
            label="Context - Niet in het cijfer"
            sub="De vier kalendersignalen: duiding naast het cijfer, ze tellen niet mee"
          >
            <ContextSignals bare signals={data.context_signals ?? []} />
          </CollapseBar>
        </section>

        <ButtonPanels data={expertData ?? data} sparkline={sparkline} />
      </main>

      <footer className="footer">
        <div className="footer-inner footer-center">
          {/* Afzender + bouwer in de onderste balk (Peter 13/6): het LHA-logo
              verhuisde hierheen uit de header — afzender, geen meetgebied. */}
          <div className="footer-mark">
            <LHALogo size={52} />
            <div className="footer-mark-text">{FOOTER_NOTES.tagline}</div>
          </div>
          {/* Peter 13/6: alleen de afzender, geen bouwer-credit. */}
          <div className="footer-credits">
            <span>Een initiatief van Les Hautes Alpes</span>
          </div>
          {/* A5: eerlijke, nuchtere testmodus-melding. Gate op mode (A3): de regel
              verdwijnt pas wanneer de campagne-koppeling écht live staat. */}
          {data.v04?.mode !== "live" && (
            <p style={{ fontSize: "0.78rem", opacity: 0.55, marginTop: "0.9rem" }}>
              Campagne-koppeling staat in testmodus. Er vuurt niets automatisch.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
