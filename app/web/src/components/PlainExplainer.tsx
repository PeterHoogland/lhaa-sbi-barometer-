import type { DailyOutput } from "../types";

/**
 * Korte uitleg, 15-jarig niveau.
 * Eén alinea, geen jargon. Geen "u bent gestrest".
 */

const EXPLAINER_BY_CN: Record<number, { headline: string; body: string }> = {
  1: {
    headline: "Vandaag rustig.",
    body: "Niets bijzonders aan de hand. Weer, economie, nieuws en kalender zitten allemaal in een rustige toestand.",
  },
  2: {
    headline: "Vandaag gewoon.",
    body: "Een doodgewone dag. Niet ongewoon druk, niet ongewoon rustig, gewoon zoals de meeste dagen van de laatste twee jaar.",
  },
  3: {
    headline: "Vandaag komt er veel tegelijk op ons af.",
    body: "Verschillende dingen lopen tegelijk een ongunstige kant op, bijvoorbeeld slecht weer + duurder leven + zwaar nieuws. Dat duurt al minstens drie dagen.",
  },
  4: {
    headline: "Vandaag is écht ongewoon druk.",
    body: "We zitten in de zwaarste 10% van de laatste twee jaar, en dat al meerdere dagen op rij. Dit gebeurt zelden.",
  },
  5: {
    headline: "Even op pauze.",
    body: "Er speelt iets gevoeligs, bijvoorbeeld een ramp of nationale rouw. We zetten de reclame-boodschap stop. De meting loopt door, maar we verkopen geen vakantie als er net iets ergs gebeurd is.",
  },
};

export function PlainExplainer({ data }: { data: DailyOutput }) {
  const cn = data.condition_level.value;
  const e = EXPLAINER_BY_CN[cn];
  return (
    <section className="plain-explainer">
      <h2>{e.headline}</h2>
      <p>{e.body}</p>
      <p className="plain-explainer-context">
        Hieronder zie je precies <strong>welke 20 dingen we vandaag bekijken</strong>,
        en hoe ze er nu voor staan vergeleken met gewoonlijk.
      </p>
    </section>
  );
}
