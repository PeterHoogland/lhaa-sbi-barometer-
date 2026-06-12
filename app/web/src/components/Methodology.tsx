import { METHODOLOGY_DISCLAIMER } from "../copy";

export function Methodology() {
  return (
    <section className="panel methodology">
      <h2>Wat dit is, en wat dit niet is</h2>
      {METHODOLOGY_DISCLAIMER.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      <ul className="methodology-do-dont">
        <li><strong>Wat we doen:</strong> we kijken naar 5 thema's en 21 gemeten elementen die met druk en belasting te maken hebben, en tellen hoe ongewoon ze vandaag zijn. De vier kalendersignalen van het domein Kalender en ritme (afstand tot vakantie, weekdag, klok-verzetten, examens) tonen we apart als context; die tellen niet mee in het cijfer. Drie andere indicatoren die uit de kalender afgeleid worden (daglicht, werk-deadlines, schoolvakantieperiode) tellen voorlopig wel mee; die keuze staat gedocumenteerd in de methodologie en wordt in de volgende fase herzien.</li>
        <li><strong>Wat we NIET doen:</strong> we kijken niet of jij persoonlijk stress hebt. We zijn geen dokter. We voorspellen niets.</li>
        <li><strong>Hoe vergelijken we?</strong> Met de afgelopen 24 maanden voor dezelfde tijd van het jaar. Een zomerdag wordt vergeleken met zomerdagen, geen winterdagen.</li>
      </ul>

      <details>
        <summary>Voor wie wil weten hoe het cijfer tot stand komt</summary>
        <ol className="methodology-steps">
          <li>We tellen 21 gemeten indicatoren, verdeeld over 5 categorieën (weer, verkeer, economie, werk/gezin, nieuws). De vier kalendersignalen van het domein Kalender en ritme staan sinds juni 2026 buiten het cijfer: een kalender is een ontwerp-aanname, geen meting. Drie andere kalender-afgeleide indicatoren (daglicht, werk-deadlines, schoolvakantieperiode) tellen voorlopig wel mee; dat is een gedocumenteerde keuze.</li>
          <li>Voor elke indicator vergelijken we de waarde van vandaag met wat normaal is voor dit moment in het jaar. Die vergelijking is nu nog "voorlopig": ze rust op maximaal twee jaar historie. Zodra een indicator drie jaar seizoenshistorie heeft, schakelt hij over op een vooraf vastgelegde, nauwkeurigere vergelijking (empirische verdelingsfunctie, dezelfde methode als de ECB-stressindex CISS). Per indicator zie je in de data welke methode vandaag geldt.</li>
          <li>We corrigeren voor seizoens-effecten waar dat zinvol is (bv. files in juli zijn anders dan files in november).</li>
          <li>We tellen alles op: de vijf categorieën tellen elk even zwaar mee in het cijfer. Daarnaast berekenen we een controleversie waarin sterker onderbouwde indicatoren zwaarder wegen; wijkt die sterk af van het hoofdcijfer, dan is dat voor ons een waarschuwingssignaal. Hoe sterk het onderzoek achter elke indicator is, zie je per indicator bij "Bewijskracht".</li>
          <li>Het "venster" opent zodra de dag zelf boven de drempel zit: hoger dan 70% van de dagen rond deze tijd van het jaar, gemeten over de laatste twee jaar. Zakt de dag eronder, dan sluit het venster ook weer dezelfde dag.</li>
          <li>Alle keuzes (drempels, gewichten, formules) staan vooraf vast en zijn publiek, niemand kan ze achteraf bijsturen om een gewenste uitkomst te maken.</li>
        </ol>
      </details>

      <details>
        <summary>Wat we (nog) niet dekken</summary>
        <ul className="methodology-gaps">
          <li>De index leunt nu zwaarder op Vlaamse bronnen. Een volwaardig Franstalig/Waals equivalent (files, water, hulplijnen) ontbreekt deels, dus de dekking is niet overal gelijk.</li>
          <li>Pollen komt via een model (CAMS), niet via meetstations. Geluid heeft buiten Brussel geen dagresolutie.</li>
          <li>De groothandelsprijs van energie in realtime en wateroverlast in Wallonië zijn nog niet volledig gedekt.</li>
          <li>Er is nog geen externe validatie tegen klinische uitkomstmaten (Tele-Onthaal, Sciensano, RIZIV). Dat vereist datadelingsprotocollen. Het meetkader ervoor staat klaar.</li>
        </ul>
      </details>
    </section>
  );
}
