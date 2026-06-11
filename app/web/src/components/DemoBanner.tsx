import type { DailyOutput } from "../types";
import { DEMO_BANNER } from "../copy";

/**
 * Demo-banner (A7): zodra ≥30% van het gewogen cijfer uit demo-/testdata komt,
 * labelt de engine de dagscore "demo" (data_quality.score_label) en toont deze
 * banner prominent boven het cijfer. Bij "echt" of een ouder record zonder het
 * veld rendert er niets — geen demo-copy bij 0%.
 */
export function DemoBanner({ dataQuality }: { dataQuality: DailyOutput["data_quality"] }) {
  if ((dataQuality.score_label ?? "echt") !== "demo") return null;
  const pct = Math.round((dataQuality.demo_fraction ?? 0) * 100);

  return (
    <div className="brand-safety demo-banner" role="status">
      <div className="bs-label">{DEMO_BANNER.label}</div>
      <p className="bs-message">{DEMO_BANNER.message}</p>
      <p className="bs-reason">
        Ongeveer {pct}% van het gewogen cijfer komt vandaag uit demo-data.
      </p>
    </div>
  );
}
