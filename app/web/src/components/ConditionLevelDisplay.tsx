import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext } from "../lib/explainer";
import { scoreBand, BAND_LABEL } from "../copy";

/**
 * Kicker-woord. Volgt de PERCENTIEL-band via de gedeelde scoreBand/BAND_LABEL
 * (geen eigen drempel-duplicaat meer): RUSTIG < 50 ≤ NORMAAL < 70 ≤ VERHOOGD
 * < 90 ≤ UITZONDERLIJK. De mediaan (50) is het scharnier — RUSTIG (rustiger
 * dan gewoonlijk) kantelt daar naar NORMAAL (een gewone-tot-drukkere dag).
 * Relatieve woorden, want het cijfer is een percentiel (anomalie t.o.v.
 * normaal), geen absolute meting. Brand-safety (CN 5) overschrijft met pauze.
 *
 * Band-bewust (Peter 14/6, IPCC-kalibratieprincipe): kruist de 90%-band een
 * niveaugrens, dan toont de kicker het bereik ("RUSTIG TOT VERHOOGD") i.p.v.
 * één woord dat het eigen interval tegenspreekt. Binnen één niveau blijft het
 * één woord. Het cijfer blijft ALTIJD één getal op 100; alleen het woord wordt
 * soms een bereik. Nooit "ONZEKER": onzekerheid is geen niveau.
 *
 * De banner/campagne-logica blijft onveranderd op de pre-geregistreerde
 * tier-regel (dagregel ≥P70), los van dit weergave-woord: de weergave reageert
 * bij de mediaan, de campagne pas in de bovenste staart.
 */
function kickerWord(
  cn: ConditionLevel,
  score: number,
  lo: number | null,
  hi: number | null,
): string {
  if (cn === 5) return "EVEN OP PAUZE";
  if (lo !== null && hi !== null) {
    const wLo = BAND_LABEL[scoreBand(lo)];
    const wHi = BAND_LABEL[scoreBand(hi)];
    if (wLo !== wHi) return `${wLo} TOT ${wHi}`;
    return wLo;
  }
  return BAND_LABEL[scoreBand(score)];
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

  // B3-onzekerheid: altijd één getal; de 90%-band staat in de meter en als
  // sobere bandbreedte-regel eronder (Peter 13/6, derde aanscherping).
  // In live-modus stuurt de v0.4-kern het getal én levert hij zijn EIGEN
  // bootstrap-CI (kern-gewichten) — band en getal staan dan op dezelfde maat.
  // Geen black-out meer (besluit Peter 13/6 na adversariële review): er is geen
  // toestand waarin een score zonder onzekerheidsweergave publiek gaat.
  const v04Live = data.v04?.mode === "live";
  const unc = v04Live ? data.v04?.uncertainty : data.uncertainty;
  const lo = unc ? Math.round(unc.ci_90_lower) : null;
  const hi = unc ? Math.round(unc.ci_90_upper) : null;
  // thin_reference/no_scored_indicators: het interval dekt die onzekerheid
  // juist NIET — claim dan geen "90% zekerheid" (zie bootstrap.ts flag_reason).
  const intervalCoversFlag = unc?.flag_reason === "ci_width";

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-INDEX OP DIT MOMENT</div>
      <div className="cn-main">
        {/* Productkeuze Peter (13/6): ALTIJD één getal op 100 — ook bij hoge
            onzekerheid. De eerlijkheid blijft via de band in de meter en de
            bandbreedte-regel eronder. */}
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
          {(() => {
            const kicker = kickerWord(cn, score, lo, hi);
            const isRange = kicker.includes(" TOT ");
            return (
              <div className={`cn-kicker${isRange ? " cn-kicker-range" : ""}`}>{kicker}</div>
            );
          })()}
        </div>
      </div>
      <div className="cn-secondary">
        <span>
          Vandaag hoger dan op {score}% van de dagen rond deze tijd van het jaar,
          gemeten over de laatste twee jaar.
        </span>
        {/* Peter 14/6: de zichtbare bandbreedte-regel is verwijderd; de
            onzekerheid blijft visueel als 90%-band in de meter. Voor
            schermlezers (de meter is aria-hidden) houden we de band hier als
            sr-only-tekst, zodat een score nooit zónder onzekerheid wordt
            uitgeleverd. Bij thin_reference blijft de "90% zeker"-claim eerlijk
            achterwege. */}
        {unc && lo !== null && hi !== null && (
          <span className="sr-only">
            {intervalCoversFlag
              ? `90% zeker: tussen ${lo} en ${hi}.`
              : `Indicatief bereik: tussen ${lo} en ${hi}.`}
          </span>
        )}
        <span className="cn-stamp">
          De Nationale Stress Barometer werd gecontroleerd en bijgestuurd · laatst om {lastRunTime}
        </span>
      </div>
    </section>
  );
}
