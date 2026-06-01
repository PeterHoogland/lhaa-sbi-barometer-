import { useState } from "react";
import type { DailyOutput, SparklinePoint } from "../types";
import { Sparkline } from "./Sparkline";
import { KernIndicators } from "./KernIndicators";
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
import { V04Technical } from "./V04Technical";

/**
 * De vijf in-page klap-knoppen onderaan de barometer.
 * Elk paneel klapt onafhankelijk open onder zijn knop.
 */
export function ButtonPanels({ data, sparkline }: { data: DailyOutput; sparkline: SparklinePoint[] }) {
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
      key: "wat",
      label: "Wat dit is, en wat dit niet is",
      sub: "De grenzen van de meting, in heldere taal",
      render: () => <Methodology />,
    },
    ...(data.v04
      ? [
          {
            key: "kern",
            label: "De kern van de meting (v0.4 — testfase)",
            sub: "De kern-indicatoren + achtergrond druk · testlaag, telt nog niet mee in het publieke cijfer",
            render: () => <KernIndicators v04={data.v04!} />,
          },
        ]
      : []),
    {
      key: "verloop",
      label: "Hoe was het de laatste 60 dagen?",
      sub: "Het dag-per-dag-verloop van de teller, met de drempels",
      render: () => (
        <section className="sparkline-panel">
          <p className="panel-lead">
            Elke stip is één dag. Hoe hoger op de grafiek, hoe meer signalen tegelijk hoog staan.
            De gekleurde banden tonen de drempels: <strong>gemiddeld</strong>,
            <strong> hoger dan gewoonlijk</strong> (vanaf 70%),
            <strong> uitzonderlijk hoog</strong> (vanaf 90%).
          </p>
          <Sparkline points={sparkline} />
        </section>
      ),
    },
    {
      key: "technisch",
      label: "Inzichten voor wetenschappers, journalisten en adversariële reviewer",
      sub: "De volledige meet- en trigger-laag, percentielen en diagnostiek",
      render: () => (
        <div className="technical-stack">
          {data.v04 && <V04Technical v04={data.v04} />}
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
    {
      key: "expert",
      label: "Extra Expert view",
      sub: "Alle metingen op een rij: hoe hoog of laag ze vandaag staan, plus de signalen die we apart in de gaten houden.",
      render: () => (
        <>
          <IndicatorList breakdown={data.indicator_breakdown} />
          <IndicatorZView breakdown={data.indicator_breakdown} />
          <SecondarySignals signals={data.secondary_signals} />
        </>
      ),
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
