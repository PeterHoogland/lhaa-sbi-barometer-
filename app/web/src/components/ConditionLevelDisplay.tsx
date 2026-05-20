import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext, buildCnDescription, buildPercentileLine } from "../lib/explainer";

const LEVEL_KICKER: Record<ConditionLevel, string> = {
  1: "LAAG",
  2: "GEMIDDELD",
  3: "VEEL TEGELIJK",
  4: "UITZONDERLIJK HOOG",
  5: "EVEN OP PAUZE",
};

export function ConditionLevelDisplay({
  data,
}: {
  data: DailyOutput;
}) {
  const cn = data.condition_level.value;
  const ctx = buildContext(data);
  const cnDescription = buildCnDescription(ctx);
  const percentileLine = buildPercentileLine(ctx);

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
            {cn >= 3 && cn <= 4 ? `Dag ${data.tier.days_in_tier} op rij` : "—"}
          </div>
        </div>
      </div>
      <p className="cn-description">{cnDescription}</p>
      <div className="cn-secondary">
        <span>{percentileLine}</span>
      </div>
    </section>
  );
}
