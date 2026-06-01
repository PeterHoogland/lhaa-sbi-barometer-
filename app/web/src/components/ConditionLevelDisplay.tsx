import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext, buildPercentileLine } from "../lib/explainer";

const LEVEL_KICKER: Record<ConditionLevel, string> = {
  1: "LAAG",
  2: "GEMIDDELD",
  3: "VEEL TEGELIJK",
  4: "UITZONDERLIJK HOOG",
  5: "EVEN OP PAUZE",
};

export function ConditionLevelDisplay({
  data,
  lastRunTime,
}: {
  data: DailyOutput;
  lastRunTime: string;
}) {
  const ctx = buildContext(data);
  const cn = ctx.cn as ConditionLevel;
  const percentileLine = buildPercentileLine(ctx);

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-CIJFER OP DIT MOMENT</div>
      <div className="cn-main">
        <div className="cn-number" aria-label={`niveau ${cn} van 5`}>
          {cn}
        </div>
        <div className="cn-scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`cn-dot cn-dot-pos-${n} ${n <= cn ? "active" : ""} ${n === cn ? "current" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="cn-side">
          <div className="cn-kicker">{LEVEL_KICKER[cn]}</div>
        </div>
      </div>
      <div className="cn-secondary">
        <span>{percentileLine}</span>
        <span className="cn-stamp">
          De Stressor-Blootstellings-index werd gecontroleerd en bijgestuurd · laatst om {lastRunTime}
        </span>
      </div>
    </section>
  );
}
