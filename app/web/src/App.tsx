import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
import { CallToAction } from "./components/CallToAction";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { TopInfluences } from "./components/TopInfluences";
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

      {data.brand_safety.flag !== "normal" && (
        <BrandSafetyBanner brandSafety={data.brand_safety} />
      )}

      <main>
        <ConditionLevelDisplay data={data} lastRunTime={lastRunTime} />

        <CallToAction tier={data.tier.current} brandSafety={data.brand_safety.flag} />

        <TopInfluences
          breakdown={
            data.v04
              ? data.v04.kern_breakdown.map((k) => enrichKern(k, data.indicator_breakdown))
              : data.indicator_breakdown
          }
        />

        <ButtonPanels data={expertData ?? data} sparkline={sparkline} />
      </main>

      <footer className="footer">
        <div className="footer-inner footer-center">
          <div className="footer-mark">
            <LHALogo size={52} />
            <div className="footer-mark-text">{FOOTER_NOTES.tagline}</div>
          </div>
          {/* A5: eerlijke, nuchtere testmodus-melding. Data-gedreven: `v04` zit alleen
              in de publieke output bij mode=live, dus deze regel verdwijnt vanzelf
              zodra de campagne-koppeling live gaat. */}
          {!data.v04 && (
            <p style={{ fontSize: "0.78rem", opacity: 0.55, marginTop: "0.9rem" }}>
              Campagne-koppeling staat in testmodus. Er vuurt niets automatisch.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
