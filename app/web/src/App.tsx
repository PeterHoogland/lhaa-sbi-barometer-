import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
import { Sparkline } from "./components/Sparkline";
import { CallToAction } from "./components/CallToAction";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { PlainExplainer } from "./components/PlainExplainer";
import { TopInfluences } from "./components/TopInfluences";
import { KernIndicators } from "./components/KernIndicators";
import { HeroBanner } from "./components/HeroBanner";
import { LHALogo } from "./components/LHALogo";
import { ButtonPanels } from "./components/ButtonPanels";
import { FOOTER_NOTES } from "./copy";

export function App() {
  const [data, setData] = useState<DailyOutput | null>(null);
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
  const today = stamp.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const lastRunTime = stamp.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });

  return (
    <div className={`app tier-${data.tier.current}`}>
      <HeroBanner weekIso={data.week_iso} today={today} lastRunTime={lastRunTime} />

      {data.brand_safety.flag !== "normal" && (
        <BrandSafetyBanner brandSafety={data.brand_safety} />
      )}

      <main>
        <ConditionLevelDisplay data={data} />

        <PlainExplainer data={data} />

        <CallToAction tier={data.tier.current} brandSafety={data.brand_safety.flag} />

        <TopInfluences breakdown={data.indicator_breakdown} />

        {data.v04 && <KernIndicators v04={data.v04} />}

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

        <ButtonPanels data={data} />
      </main>

      <footer className="footer">
        <div className="footer-inner footer-center">
          <div className="footer-mark">
            <LHALogo size={52} />
            <div className="footer-mark-text">{FOOTER_NOTES.tagline}</div>
          </div>
          <div className="footer-row muted small">{FOOTER_NOTES.ondersteunend}</div>
          <div className="footer-row muted small">
            Methodologie open. Code: open source. Pre-registratie via OSF.
          </div>
        </div>
      </footer>
    </div>
  );
}
