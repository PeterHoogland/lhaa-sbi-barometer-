import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext } from "../lib/explainer";

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
  const score = Math.round(ctx.percentile); // 0-100 percentiel = de score op 100

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-INDEX OP DIT MOMENT</div>
      <div className="cn-main">
        <div className="cn-score" aria-label={`${score} op 100`}>
          <span className="cn-score-num">{score}</span>
          <span className="cn-score-max">/100</span>
        </div>
        <div className="cn-meter" aria-hidden="true">
          <div className="cn-meter-track">
            <span className="cn-meter-zone cn-meter-green" />
            <span className="cn-meter-zone cn-meter-amber" />
            <span className="cn-meter-zone cn-meter-red" />
            <span className="cn-meter-dot" style={{ left: `${score}%` }} />
          </div>
          <div className="cn-meter-axis"><span>0</span><span>50</span><span>100</span></div>
        </div>
        <div className="cn-side">
          <div className="cn-kicker">{LEVEL_KICKER[cn]}</div>
        </div>
      </div>
      <div className="cn-secondary">
        <span>Hoger dan op {score}% van de vergelijkbare dagen (zelfde tijd van het jaar) in de afgelopen jaren.</span>
        <span className="cn-stamp">
          De Stressor-Blootstellings-index werd gecontroleerd en bijgestuurd · laatst om {lastRunTime}
        </span>
      </div>
    </section>
  );
}
