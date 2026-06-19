import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext } from "../lib/explainer";
import { scoreBand, BAND_LABEL } from "../copy";

/**
 * Kicker-woord voor het HOOFDCIJFER. Sinds amendement §4.1.10 (Peter 17/6) is het
 * hoofdcijfer de ABSOLUTE economische druk "vs normale tijden" (2010-2019), op
 * een 0-100-schaal waar 50 het normale decennium is. De bandwoorden blijven
 * RUSTIG < 50 ≤ NORMAAL < 70 ≤ VERHOOGD < 90 ≤ UITZONDERLIJK, nu absoluut gelezen:
 * onder 50 = lichter dan normaal, boven 70 = duidelijk verhoogd. Brand-safety
 * (CN 5) overschrijft met pauze.
 */
function kickerWord(cn: ConditionLevel, score: number): string {
  if (cn === 5) return "EVEN OP PAUZE";
  return BAND_LABEL[scoreBand(score)];
}

/** Absolute "vs normale tijden"-score -> CN-niveau (50 = normaal decennium). */
function absoluteCn(score: number): ConditionLevel {
  if (score >= 90) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  return 1;
}

export function ConditionLevelDisplay({
  data,
  lastRunTime,
}: {
  data: DailyOutput;
  lastRunTime: string;
}) {
  const ctx = buildContext(data);

  // HOOFDCIJFER = de BREDE absolute meting "vs normale tijden" (amendement §4.1.11:
  // economie + energie + weer). Terugval op de economie-only meting (§4.1.10) en
  // dan het relatieve seizoenspercentiel, mocht de brede meting niet berekend zijn.
  const measure =
    data.broad_pressure?.status === "computed" && data.broad_pressure.score !== null
      ? data.broad_pressure
      : data.economic_pressure;
  const useAbs = !!measure && measure.status === "computed" && measure.score !== null;
  const score = useAbs ? (measure!.score as number) : Math.round(ctx.percentile);
  const cn = (ctx.cn === 5 ? 5 : absoluteCn(score)) as ConditionLevel;

  // Volledige update-datum + tijd (Brussel) onder het cijfer (Peter 17/6).
  const stamp = new Date(data.timestamp);
  const dateStr = stamp.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">Stress Index op dit moment in België</div>
      <div className="cn-main">
        {/* Productkeuze Peter (13/6): ALTIJD één getal op 100. */}
        <div className="cn-score" aria-label={`${score} op 100`}>
          <span className="cn-score-num">{score}</span>
          <span className="cn-score-max">/100</span>
        </div>
        <div className="cn-meter" aria-hidden="true">
          <div className="cn-meter-track">
            <span className="cn-meter-zone cn-meter-green" />
            <span className="cn-meter-zone cn-meter-normal" />
            <span className="cn-meter-zone cn-meter-amber" />
            <span className="cn-meter-zone cn-meter-red" />
            <span className="cn-meter-dot" style={{ left: `${Math.max(0, Math.min(score, 100))}%` }} />
          </div>
          <div className="cn-meter-axis"><span>0</span><span>50 = normaal</span><span>100</span></div>
        </div>
        <div className="cn-side">
          <div className="cn-kicker">{kickerWord(cn, score)}</div>
        </div>
      </div>
      <div className="cn-secondary">
        <span className="cn-update">
          Laatste update van De Nationale Stress Index: {dateStr}, {lastRunTime}
        </span>
        <span className="cn-stamp">
          Dit cijfer vergelijkt de omstandigheden vandaag, kosten van levensonderhoud, energie, weer en
          nieuws, met normale tijden (2010-2019). 50 is het normale niveau van dat decennium; vandaag ligt
          de druk duidelijk hoger, vooral door inflatie en energie. Het is geen meting van individuele stress.
        </span>
      </div>
    </section>
  );
}
