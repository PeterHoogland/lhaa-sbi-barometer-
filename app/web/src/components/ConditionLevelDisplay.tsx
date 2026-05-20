import type { ConditionLevel, DailyOutput } from "../types";

const LEVEL_DESC: Record<ConditionLevel, string> = {
  1: "Geen verhoogde druk op de hele bevolking vandaag.",
  2: "Een doodgewone dag, niets ongewoons aan de hand.",
  3: "Veel dingen lopen tegelijk een ongunstige kant op, al drie dagen of meer.",
  4: "Zwaarste 10% van de laatste twee jaar, al meerdere dagen op rij.",
  5: "Iets gevoeligs is gaande (ramp, rouw). Reclame staat op pauze, de meting loopt door.",
};

const LEVEL_KICKER: Record<ConditionLevel, string> = {
  1: "RUSTIG",
  2: "GEWOON",
  3: "VEEL TEGELIJK",
  4: "UITZONDERLIJK DRUK",
  5: "EVEN OP PAUZE",
};

export function ConditionLevelDisplay({
  level,
  daysInTier,
  percentile,
}: {
  level: DailyOutput["condition_level"];
  daysInTier: number;
  percentile: number;
}) {
  const cn = level.value;
  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-CIJFER VAN VANDAAG</div>
      <div className="cn-main">
        <div className="cn-number" aria-label={`niveau ${cn} van 5`}>
          {cn}
        </div>
        <div className="cn-scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`cn-dot ${n <= cn ? "active" : ""} ${n === cn ? "current" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="cn-side">
          <div className="cn-kicker">{LEVEL_KICKER[cn]}</div>
          <div className="cn-meta">
            {cn >= 3 && cn <= 4 ? `Dag ${daysInTier} op rij` : "—"}
          </div>
        </div>
      </div>
      <p className="cn-description">{LEVEL_DESC[cn]}</p>
      <div className="cn-secondary">
        <span>
          Drukker dan op <strong>{percentile}%</strong> van de dagen van de laatste twee jaar.
        </span>
        <span className="cn-banner-status">
          Reclame-banner: <strong>{level.banner_active ? "aan" : "uit"}</strong>
        </span>
      </div>
    </section>
  );
}
