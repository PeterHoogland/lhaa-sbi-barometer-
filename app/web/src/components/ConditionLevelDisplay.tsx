import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext } from "../lib/explainer";

/**
 * Kicker-woord. Volgt de PERCENTIEL-band (zoals de meter-zones 0-50-70-90-100),
 * niet het conditie-niveau. Reden: het cijfer leest gevoelsmatig vreemd als 71
 * "gemiddeld" heet terwijl de meter-stip al in de verhoogde (amber) zone staat.
 * De banner/campagne-logica blijft onveranderd op de pre-geregistreerde tier-regel
 * (sustained ≥P70), dus een verhoogde DAGwaarde geeft hier wel het juiste woord
 * maar nog geen vals alarm. Brand-safety (CN 5) overschrijft met een pauze-woord.
 */
function kickerWord(cn: ConditionLevel, score: number): string {
  if (cn === 5) return "EVEN OP PAUZE";
  if (score >= 90) return "HOOG";
  if (score >= 70) return "VERHOOGD";
  if (score >= 50) return "GEMIDDELD";
  return "LAAG";
}

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

  // B3: respecteer de bootstrap-onzekerheid. Bij "high" tonen we géén scherp
  // getal maar het 90%-bereik; bij "medium" het getal mét bandbreedte eronder.
  // Zodra v0.4 live de score levert (buildContext schakelt dan naar
  // v04.percentile.lang) hoort de v0.2-CI niet meer bij het getoonde getal:
  // band en bereik dan onderdrukken tot er een v0.4-CI bestaat (maatdiscipline).
  const v04Live = data.v04?.mode === "live";
  const unc = v04Live ? undefined : data.uncertainty;
  const lo = unc ? Math.round(unc.ci_90_lower) : null;
  const hi = unc ? Math.round(unc.ci_90_upper) : null;
  const highUncertainty = unc?.uncertainty_flag === "high";
  // thin_reference/no_scored_indicators: het interval dekt die onzekerheid
  // juist NIET — claim dan geen "90% zekerheid" (zie bootstrap.ts flag_reason).
  const intervalCoversFlag = unc?.flag_reason === "ci_width";

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-INDEX OP DIT MOMENT</div>
      <div className="cn-main">
        {/* Productkeuze Peter (13/6): ALTIJD één getal op 100 — ook bij hoge
            onzekerheid. De eerlijkheid blijft via de band in de meter, de
            ONZEKER-kicker en de bandbreedte-tekst eronder. */}
        <div className="cn-score" aria-label={`${score} op 100`}>
          <span className="cn-score-num">{score}</span>
          <span className="cn-score-max">/100</span>
        </div>
        <div className="cn-meter" aria-hidden="true">
          <div className="cn-meter-track">
            <span className="cn-meter-zone cn-meter-green" />
            <span className="cn-meter-zone cn-meter-amber" />
            <span className="cn-meter-zone cn-meter-red" />
            {unc && lo !== null && hi !== null && (
              <span
                className="cn-meter-band"
                style={{ left: `${Math.min(lo, 99)}%`, width: `${Math.max(hi - lo, 1)}%` }}
                title={`90%-bereik: ${lo} tot ${hi}`}
              />
            )}
            <span className="cn-meter-dot" style={{ left: `${score}%` }} />
          </div>
          <div className="cn-meter-axis"><span>0</span><span>50</span><span>100</span></div>
        </div>
        <div className="cn-side">
          {/* CN 5 (brand-safety) behoudt zijn pauze-woord — die override staat
              hiërarchisch boven de onzekerheidsmelding (zie kickerWord). */}
          <div className="cn-kicker">
            {cn !== 5 && highUncertainty ? "ONZEKER" : kickerWord(cn, score)}
          </div>
        </div>
      </div>
      <div className="cn-secondary">
        <span>Vandaag hoger dan op {score}% van de dagen rond deze tijd van het jaar.</span>
        {highUncertainty && lo !== null && hi !== null ? (
          intervalCoversFlag ? (
            <span className="cn-uncertainty-warning">
              De meting is vandaag onzeker: met 90% zekerheid ligt het cijfer tussen {lo} en {hi}
              (de band in de meter).
            </span>
          ) : (
            <span className="cn-uncertainty-warning">
              Er zijn nog te weinig vergelijkbare dagen om dit cijfer scherp te plaatsen;
              de band in de meter ({lo} tot {hi}) is indicatief.
            </span>
          )
        ) : (
          unc && lo !== null && hi !== null && (
            <span className="cn-uncertainty-band">
              Bandbreedte (90% zeker): {lo} tot {hi}.
            </span>
          )
        )}
        <span className="cn-stamp">
          De Nationale Stress Barometer werd gecontroleerd en bijgestuurd · laatst om {lastRunTime}
        </span>
      </div>
    </section>
  );
}
