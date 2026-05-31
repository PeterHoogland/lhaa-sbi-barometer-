import { useState } from "react";
import type { DailyOutput } from "../types";
import { IndicatorList } from "./IndicatorList";
import { IndicatorZView } from "./IndicatorZView";
import { SecondarySignals } from "./SecondarySignals";
import { Methodology } from "./Methodology";
import { AllSources } from "./AllSources";
import { ScienceReferences } from "./ScienceReferences";
import { TierIndicator } from "./TierIndicator";
import { PercentileDisplay } from "./PercentileDisplay";
import { DomainContributions } from "./DomainContributions";
import { MEDIA_DIAGNOSTIC } from "./Sections";

/**
 * De vijf in-page klap-knoppen onderaan de barometer.
 * Elk paneel klapt onafhankelijk open onder zijn knop.
 */
export function ButtonPanels({ data }: { data: DailyOutput }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const panels: Array<{
    key: string;
    label: string;
    sub: string;
    render: () => React.ReactNode;
  }> = [
    {
      key: "expert",
      label: "Expert view",
      sub: "Alle indicatoren, hun Z-thermometer en het secundaire signalencircuit",
      render: () => (
        <>
          <IndicatorList breakdown={data.indicator_breakdown} />
          <IndicatorZView breakdown={data.indicator_breakdown} />
          <SecondarySignals signals={data.secondary_signals} />
        </>
      ),
    },
    {
      key: "wat",
      label: "Wat dit is, en wat dit niet is",
      sub: "De grenzen van de meting, in heldere taal",
      render: () => <Methodology />,
    },
    {
      key: "bronnen",
      label: "De databronnen die we gebruiken",
      sub: "Alle externe bronnen waar de cijfers vandaan komen, aanklikbaar",
      render: () => <AllSources breakdown={data.indicator_breakdown} />,
    },
    {
      key: "wetenschap",
      label: "Wetenschappelijke bronnen",
      sub: "De peer-reviewed onderbouwing waarop de SBI gebouwd is",
      render: () => <ScienceReferences breakdown={data.indicator_breakdown} />,
    },
    {
      key: "technisch",
      label: "Technische details",
      sub: "Voor wetenschappers, journalisten en de adversariële reviewer",
      render: () => (
        <div className="technical-stack">
          <TierIndicator tier={data.tier.current} daysInTier={data.tier.days_in_tier} />
          <PercentileDisplay
            shortP={data.percentile.short_24m}
            fixedP={data.percentile.fixed_2010_2019}
            composite={data.composite.equal}
            evidenceComposite={data.composite.evidence_graded}
            demographicComposite={data.composite.demographic}
          />
          <DomainContributions contributions={data.top_contributing_domains} />
          <MEDIA_DIAGNOSTIC diagnostic={data.media_cluster_diagnostic} />
        </div>
      ),
    },
  ];

  return (
    <section className="bp-section" aria-label="Verdieping en verantwoording">
      {panels.map((p) => {
        const isOpen = open.has(p.key);
        return (
          <div key={p.key} className={`bp-row ${isOpen ? "open" : ""}`}>
            <button
              className="bp-button"
              onClick={() => toggle(p.key)}
              aria-expanded={isOpen}
            >
              <span className="bp-text">
                <span className="bp-label">{p.label}</span>
                <span className="bp-sub">{p.sub}</span>
              </span>
              <span className="bp-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className="bp-panel">{p.render()}</div>}
          </div>
        );
      })}
    </section>
  );
}
