import { METHODOLOGY_DISCLAIMER } from "../copy";

export function Methodology() {
  return (
    <section className="panel methodology">
      <h2>Wat dit is, en wat dit niet is</h2>
      {METHODOLOGY_DISCLAIMER.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      <ul className="methodology-do-dont">
        <li><strong>Wat we doen:</strong> we kijken naar 20 dingen die met stress te maken hebben, en tellen hoe ongewoon ze vandaag zijn, over heel België.</li>
        <li><strong>Wat we NIET doen:</strong> we kijken niet of jij persoonlijk stress hebt. We zijn geen dokter. We voorspellen niets.</li>
        <li><strong>Hoe vergelijken we?</strong> Met de afgelopen 24 maanden voor dezelfde tijd van het jaar. Een zomerdag wordt vergeleken met zomerdagen, geen winterdagen.</li>
      </ul>

      <details>
        <summary>Voor wie wil weten hoe het cijfer tot stand komt</summary>
        <ol className="methodology-steps">
          <li>We tellen 20 indicatoren, verdeeld over 6 categorieën (weer, verkeer, economie, werk/gezin, nieuws, kalender).</li>
          <li>Voor elke indicator vergelijken we de waarde van vandaag met wat normaal is voor dit moment in het jaar.</li>
          <li>We corrigeren voor seizoens-effecten waar dat zinvol is (bv. files in juli zijn anders dan files in november).</li>
          <li>We tellen alles op, met gewichten die rekening houden met hoeveel wetenschappelijk onderzoek de link met stress ondersteunt.</li>
          <li>Pas als het cijfer minstens drie dagen op rij boven een drempel zit, gaat het "venster" open. Eén slechte dag verandert het cijfer niet meteen.</li>
          <li>Alle keuzes (drempels, gewichten, formules) staan vooraf vast en zijn publiek, niemand kan ze achteraf bijsturen om een gewenste uitkomst te maken.</li>
        </ol>
      </details>
    </section>
  );
}
