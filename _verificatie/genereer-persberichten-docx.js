const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  LevelFormat, BorderStyle,
} = require("docx");

// ---------- helpers ----------
const BLUE = "2E5C8A";
const GREY = "555555";

// body paragraph from an array of runs (string => normal run, {b}/{i} => styled)
function P(runs, opts = {}) {
  const children = (Array.isArray(runs) ? runs : [runs]).map((r) =>
    typeof r === "string"
      ? new TextRun({ text: r })
      : new TextRun({ text: r.t, bold: !!r.b, italics: !!r.i, color: r.color })
  );
  return new Paragraph({
    children,
    spacing: { after: opts.after ?? 160, line: 276, ...(opts.before ? { before: opts.before } : {}) },
    alignment: opts.align,
    ...(opts.border ? { border: opts.border } : {}),
  });
}
const TOPRULE = { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } };
const BOTRULE = { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } };

function H1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function H2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

const styles = {
  default: { document: { run: { font: "Arial", size: 21, color: "1A1A1A" } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 40, bold: true, font: "Arial", color: "111111" },
      paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, font: "Arial", color: BLUE },
      paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1 } },
  ],
};

const numbering = {
  config: [
    { reference: "risks",
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
  ],
};

const pageProps = {
  page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
};

// =================================================================
// VERSIE 1 — MAINSTREAM
// =================================================================
const mainstream = [
  P([{ t: "PERSBERICHT", b: true }], { after: 40 }),
  P([{ t: "Onder embargo tot [datum / uur] · Vrij voor publicatie", color: GREY }], { after: 240, border: BOTRULE }),

  H1("De Nationale Stress Index"),
  P([{ t: "Deze index meet elke dag opnieuw hoe zwaar de omstandigheden in heel België op mensen kunnen wegen, vergeleken met normale tijden.", i: true, color: GREY }], { after: 280 }),

  P("België meet zijn inflatie en zijn koopkracht al meer dan honderd jaar, en zijn files sinds ruim een decennium. Vanaf vandaag meet het ook iets wat tot nu toe onzichtbaar bleef: hoeveel erkende stressfactoren er op een bepaald moment samen aanwezig zijn in de leefomgeving."),
  P("Dat is wat De Nationale Stress Index doet. Hij meet niet hoeveel stress Belgen voelen, daar is hij niet voor gemaakt. Hij meet hoeveel omstandigheden die stress kunnen uitlokken er op een dag aanwezig zijn, en vergelijkt dat met wat normaal is. Geen peiling naar gevoel, maar een signaalindex van blootstelling."),
  P("We weten elke maand hoeveel duurder onze winkelkar wordt. We weten hoeveel vertrouwen consumenten hebben in de economie. We weten zelfs hoeveel minuten we verliezen in de file. Wat we tot nu toe niet samenbrachten, is hoeveel van die druk er op één moment tegelijk op het land weegt. Dat is precies wat deze index in één cijfer vat, en elke dag opnieuw."),

  H2("Wat de eerste meting toont: de economische druk staat hoog, de dag zelf is rustig"),
  P("Het hoofdcijfer combineert twee dingen. Eerst een vaste ondergrond van structurele druk op gezinnen: de kosten van het levensonderhoud (inflatie, brandstof, koopkrachtvertrouwen, hypotheekrente en werkloosheid) en, even zwaar meegewogen, de energieprijzen. Daar bovenop komen de omstandigheden van de dag zelf: het weer, de toon van het nieuws, het verkeer en het openbaar vervoer. Het cijfer meet dat alles tegen wat normaal was in de periode 2010-2019, waarbij 50 een normaal niveau is. Omdat die dagelijkse omstandigheden meetellen, beweegt het cijfer ook van dag tot dag."),
  P([
    "Vlak voor de zomer staat dat cijfer in de zone ", { t: "VERHOOGD", b: true }, " ([score] op 100). Het opvallende is ",
    { t: "waar", i: true }, " de druk zit. Op de dag van deze meting springt geen enkele dagfactor eruit: het weer is rustig, het verkeer en het openbaar vervoer draaien normaal, het nieuws is niet uitzonderlijk negatief. Wat het cijfer hoog houdt, zit in de structurele economie: vooral de aanhoudende prijsdruk, de energie- en brandstofprijzen en een zwak consumentenvertrouwen. De werkloosheid staat op dit moment juist gunstig en duwt het cijfer net omlaag.",
  ]),
  P("Het is dus geen breed crisisbeeld. Het is één duidelijke, structurele verhoging, de economische, op een dag die er verder rustig bij ligt. Op een dag met zwaar weer of zwaar nieuws zou het cijfer hoger uitkomen; vandaag is het de economische onderstroom die het beeld bepaalt."),

  H2("Waarom dit moment telt: een seizoen dat weinig ruimte voor herstel laat"),
  P("Die economische druk staat niet op een willekeurig moment hoog. Hij valt samen met een periode die om andere redenen veeleisend is, en daar wordt het beeld interessanter. Twee dingen spelen mee die de index bewust niet meet, maar die wel verklaren waarom een verhoogde druk net nu zwaarder weegt."),
  P([{ t: "De eindspurt vóór het verlof. ", b: true }, "Voor veel werknemers zijn de weken voor de vakantie veeleisend: projecten afronden, dossiers overdragen, deadlines halen voordat de mailbox dichtgaat. De index meet geen ervaren werkdruk, daar bestaat geen betrouwbare publieke dagdata voor. Wat hij wél signaleert, is de periode op de kalender: de weken met deadlines en overdrachten vlak voor een grote verlofgolf. In de literatuur wordt deze pre-vakantieperiode in verband gebracht met tijdelijk lager welbevinden."]),
  P([{ t: "Minder ruimte om te herstellen. ", b: true }, "De zomer is voor veel gezinnen ook een periode van extra uitgaven: reizen, kampen, festivals. En wanneer de druk toeneemt, komt rust vaak als eerste in het gedrang. Dit is precies de zijde die de index níét meet: hij kijkt naar de blootstelling aan stressoren, niet naar of mensen voldoende kunnen recupereren. Maar net die herstelzijde maakt het verhaal relevant. Onderzoek naar stress laat zien dat het niet de losse piek is die telt, maar de opeenstapeling van druk zónder voldoende herstel. En dat verklaart mee waarom geldzorgen zo zwaar wegen: stress ontstaat wanneer je middelen, zoals geld of tijd, onder druk staan of niet meer worden aangevuld."]),

  H2("Geen losse pieken, maar een samenloop"),
  P("De kern van deze eerste meting is niet dat één stressor uitzonderlijk hoog scoort. Het is de samenloop: een economische druk die de index rechtstreeks meet en die hoog staat, in een seizoen dat traditioneel weinig ruimte voor herstel laat."),
  P("De index legt tussen die twee geen oorzakelijk verband, hij stelt alleen vast dat ze tegelijk aanwezig zijn. Maar net daarom suggereert deze eerste meting geen uitzonderlijke crisis. Ze toont iets nuchterders: dat veel Belgen zich in een periode bevinden waarin meerdere bronnen van druk samenvallen, en dat is precies wanneer herstel het meeste waard wordt."),

  H2("Van meten naar herstel: waarom de tegenpool telt"),
  P("Hier raakt de index aan iets wat zelden in cijfers wordt gevat: herstel is geen sluitstuk, het is een onderdeel van het stresssysteem zelf, en de index meet net die kant niet. Hij meet de druk die binnenkomt, niet de rust die zou moeten volgen. Dat is geen gebrek, maar een bewuste keuze. En het maakt de vraag des te scherper: als de blootstelling aan stressoren stijgt, stijgt ook het belang van omgevingen die het tegenovergestelde bieden: ruimte, trage tijd, natuur, afstand van de dagelijkse druk."),
  P("Dat verklaart mee waarom dit eerste meetmoment net voor de zomer valt. De echte vraag volgt later: wat gebeurt er met die druk wanneer de vakantie begint? Daalt de blootstelling effectief, of neemt de spanning gewoon een andere gedaante aan?"),
  P("Een van de partners van De Nationale Stress Index, het toeristisch agentschap van Les Hautes-Alpes, volgt die vraag van nabij. De regio profileert zich rond natuur, hoogte en herstel, en heeft een direct belang bij de vraag hoe je omgeving en je herstel samenhangen."),

  H2("Over De Nationale Stress Index"),
  P("De Nationale Stress Index is een signaalindex die meet hoeveel stressfactoren die de wetenschappelijke literatuur erkent, aanwezig zijn in de Belgische leefomgeving. De index meet blootstelling aan stressoren, de omstandigheden dus, niet de subjectief ervaren stress van individuen, en doet geen klinische of individuele uitspraken. De meting steunt op wetenschappelijk onderzoek en kan op elk moment opnieuw worden gedaan; ze is geen peer-reviewed instrument. Opeenvolgende metingen maken het mogelijk verschuivingen in de tijd te volgen, bijvoorbeeld rond vakantieperiodes, verkiezingen of economische gebeurtenissen."),
  P("De kaders waarop de index steunt, komen uit de gedrags- en gezondheidswetenschap: de allostatic-load-theorie (McEwen), het Social Determinants of Health-kader (Marmot/WHO) en de Conservation of Resources-theorie (Hobfoll). De index claimt niet te meten wat die kaders meten; hij gebruikt ze om te verantwoorden welke condities zinvol zijn om te volgen. De weging zelf is bewust eenvoudig en controleerbaar: elke factor wordt vergeleken met zijn eigen normale niveau en even zwaar meegeteld, zonder verborgen model. De volledige methodologie en de databronnen worden bij de lancering publiek gemaakt."),
  P([{ t: "De Nationale Stress Index is een initiatief van June20, ontwikkeld in samenwerking met het toeristisch agentschap van Les Hautes-Alpes." }]),

  P([{ t: "Perscontact", b: true }], { before: 240, after: 40, border: TOPRULE }),
  P([{ t: "[Naam] · [functie] · [telefoon] · [e-mail]", color: GREY }], { after: 40 }),
  P([{ t: "June20 · [adres] · [website]", color: GREY }], { after: 120 }),
  P([{ t: "Beeldmateriaal, grafieken en de volledige methodologische nota zijn op aanvraag beschikbaar.", i: true, color: GREY }]),
];

// =================================================================
// VERSIE 2 — VAKPERS / CASE
// =================================================================
const vakpers = [
  P([{ t: "VAKPERS / CASE", b: true }], { after: 40 }),
  P([{ t: "Voor MM, Pub en professionele media · Achtergrond bij De Nationale Stress Index", color: GREY }], { after: 240, border: BOTRULE }),

  H1("Hoe je van een maatschappelijk signaal een merkstrategie bouwt die wetenschappelijk standhoudt"),
  P([{ t: "De Nationale Stress Index is geen campagne met een wetenschappelijk sausje. Het is een poging om een toeristische bestemming te verankeren in een culturele spanning die het land al voelt, maar nog niet kon benoemen. Een case over de bouw, de keuzes en de risico's.", i: true, color: GREY }], { after: 280 }),

  P("Een toeristische regio die zijn naam wil vestigen bij een Belgisch publiek heeft twee opties. De eerste is de klassieke route: koop bereik, toon bergen, hoop op herinnering. De tweede is moeilijker, trager en oneindig veel defensiever: word het antwoord op een vraag die het land zichzelf al stelt."),
  P("De Nationale Stress Index kiest die tweede route. En dat maakt het project relevant voor wie merken bouwt, niet alleen voor wie over stress schrijft."),
  P("Een merk wordt niet gekozen omdat het luider roept, maar omdat het op het juiste moment in het hoofd opduikt. De vraag is dus niet hoe vaak je gezien wordt, maar bij welke situatie."),

  H2("Het strategische probleem onder de campagne"),
  P("Les Hautes-Alpes verkoopt geen product dat mensen dagelijks nodig hebben. Het verkoopt een tegenpool: ruimte, hoogte, trage tijd, herstel. Het probleem met een tegenpool is dat ze pas waarde krijgt op het moment dat de spanning voelbaar is. Niemand denkt aan een berg op een rustige dinsdag. Mensen denken eraan wanneer de druk knelt."),
  P("De strategische opdracht was dus niet bekendheid opbouwen, maar een situatie claimen. In de taal van mentale beschikbaarheid: een bestemming koppelen aan het exacte moment waarop ze relevant wordt. Dat moment is niet de zomer, maar de spanning die aan de zomer voorafgaat."),

  H2("Het instapmoment dat niemand bezet"),
  P("De periode vlak voor de vakantie is in marketingtermen merkwaardig leeg. Reismerken communiceren over bestemmingen, niet over de toestand waarin mensen verkeren wanneer ze die bestemming overwegen. Net daar zit een onbezet instapmoment: het ogenblik waarop economische druk en de eindspurt vóór het verlof samenvallen, en mensen, vaak onbewust, naar een uitweg zoeken."),
  P("De Nationale Stress Index neemt dat moment in. We doen dat niet door het te claimen in reclametaal, maar door het zichtbaar te maken in data. Wie het gesprek over collectieve druk opent, staat vooraan in het hoofd wanneer de behoefte aan herstel oppopt."),

  H2("Waarom een index als basis van een contextuele campagne"),
  P("De keuze voor een signaalindex als start van een contextuele campagne is geen creatieve gril, maar een strategische beslissing met drie functies."),
  P([{ t: "Functie 1: geloofwaardigheid die je niet kunt kopen. ", b: true }, "Een advertentie die zegt dat het land gespannen is, is een mening. Een index die meet hoeveel erkende stressfactoren aanwezig zijn, is een vaststelling. Dat verschil is journalistiek bruikbaar, en dat is precies waarom het stuk de redactie van een krant haalt en een advertentie niet. De wetenschappelijke onderbouwing is geen decor, ze is het distributiemechanisme."]),
  P([{ t: "Functie 2: een vertelstructuur die blijft terugkomen. ", b: true }, "Een campagne piekt en sterft; een index leeft verder. Omdat het cijfer dagelijks meebeweegt, is elke verschuiving een nieuw nieuwsmoment: na de vakantie, tijdens een verkiezingsjaar, bij een economische schok of een hittegolf. De bestemming koppelt zich zo niet aan één piek, maar aan een terugkerend ritme van relevantie. Dat is het verschil tussen aandacht huren en aanwezigheid opbouwen."]),
  P([{ t: "Functie 3: de brug naar het merk zit in de wetenschap zelf. ", b: true }, "De overgang van maatschappelijk signaal naar bestemming verloopt niet via een verkoopargument, maar via een wetenschappelijk kader: de literatuur (allostatic load, McEwen) beschrijft herstel als noodzakelijke voorwaarde om de opeenstapeling van druk te beperken. Daarmee wordt Les Hautes-Alpes geen bestemming die zich opdringt, maar het logische antwoord op een mechanisme dat de wetenschap zelf beschrijft. Het merk hoeft zichzelf niet te verkopen; de redenering doet dat."]),
  P("De sterkste positionering is er een waarbij het merk de conclusie wordt van een redenering die de lezer zelf maakt, niet de boodschap die hem wordt opgedrongen."),

  H2("Waar onderzoek, strategie en technologie samenkomen"),
  P("Wat de index onderscheidt van een klassieke peiling of een redactioneel onderzoek, is de manier waarop verschillende disciplines elkaar versterken. Geen van de drie volstaat alleen."),
  P([{ t: "Het wetenschappelijke fundament levert de legitimiteit. ", b: true }, "De index vertrekt niet van een onderbuikgevoel over wat stress veroorzaakt, maar van erkende kaders uit de gedrags- en gezondheidswetenschap: allostatic load (McEwen), Social Determinants of Health (Marmot/WHO) en Conservation of Resources (Hobfoll). Die kaders bepalen welke condities meetellen en waarom. Belangrijk: de index claimt niet te meten wat die kaders meten en is geen peer-reviewed instrument. Hij staat op de schouders van wetenschap die hij niet zelf bedrijft, en zegt dat ook."]),
  P([{ t: "Automatisering levert de schaal. ", b: true }, "Geautomatiseerde dataverwerking maakt het mogelijk om grote hoeveelheden openbaar beschikbare indicatoren continu op te halen, te vergelijken met hun eigen normale niveau en samen te brengen tot één maat. De weging zelf is geen black box: elke indicator telt even zwaar mee via een transparante, robuuste statistiek, niet via een ondoorzichtig model. Taaltechnologie (AI) wordt gericht ingezet op één onderdeel, namelijk het inschatten van de toon van de nieuwsstroom. Wat vroeger een momentopname per kwartaal was, wordt zo een levend instrument dat verschuivingen in de tijd volgt. De technologie is geen verkoopargument; ze is de voorwaarde om van een eenmalige meting een terugkerend ritme te maken."]),
  P([{ t: "De strategie levert de richting. ", b: true }, "De keuze om net dit instapmoment te bezetten, om de bestemming via de wetenschap te laten opduiken in plaats van via alleen een campagne, en om het hele project langs twee perssporen te sturen: dat zijn strategische beslissingen, creatief uitgewerkt zonder de index te ondermijnen. Ze bepalen of de som van onderzoek en technologie ook daadwerkelijk een merk verankert."]),
  P("De optelsom is het punt. Onderzoek zonder technologie blijft een paper. Technologie zonder strategie blijft een dashboard. Strategie zonder onderbouwing blijft een campagne. De index werkt omdat de drie elkaar dragen, en omdat de naden tussen de drie bewust zichtbaar blijven in plaats van weggewerkt."),

  H2("De risico's, en hoe ze afgedekt zijn"),
  P("Een project dat wetenschap, strategie en commercie samenbrengt, draagt een ingebouwd risico: het moment waarop het publiek of de pers de commerciële afzender ruikt, kantelt geloofwaardigheid in argwaan. Dat risico is niet weggemoffeld, maar structureel afgedekt."),
  new Paragraph({ numbering: { reference: "risks", level: 0 }, spacing: { after: 120, line: 276 },
    children: [new TextRun({ text: "Scheiding van afzender en bevinding. ", bold: true }), new TextRun("De stressfactoren blijven neutraal en condition-gericht. De bestemming verschijnt pas nadat de redenering is afgelopen, nooit in de meting zelf.")] }),
  new Paragraph({ numbering: { reference: "risks", level: 0 }, spacing: { after: 120, line: 276 },
    children: [new TextRun({ text: "Radicale transparantie. ", bold: true }), new TextRun("De afzender en de partner worden expliciet benoemd in elk persbericht. Een verstopte adverteerder is een schandaal in wording; een benoemde samenwerking is gewoon een samenwerking, en dat verschil bepaalt of een redactie zich gebruikt voelt of niet.")] }),
  new Paragraph({ numbering: { reference: "risks", level: 0 }, spacing: { after: 120, line: 276 },
    children: [new TextRun({ text: "Taaldiscipline. ", bold: true }), new TextRun("De index meet blootstelling aan stressoren, niet individueel ervaren stress. Geen causale claims, dus ook geen alarmtaal, en geen claim van een peer-reviewed of “gevalideerd” instrument. Het label signaalindex is verplicht, juist omdat het de aanval op overdrijving bij voorbaat ontwapent.")] }),
  new Paragraph({ numbering: { reference: "risks", level: 0 }, spacing: { after: 160, line: 276 },
    children: [new TextRun({ text: "Twee sporen, één index. ", bold: true }), new TextRun("Mainstreampers krijgt de feitelijke meting met een minimale vermelding van de partner. Vak- en lifestylepers krijgt de bredere herstelhoek. Dezelfde data, twee framings, telkens afgestemd op wat de redactie waardevol vindt.")] }),

  H2("Wat dit project illustreert voor merkenbouwers"),
  P("De kern is niet dat stress een interessant onderwerp is. De kern is dat distinctieve positionering ontstaat op het kruispunt van wat een publiek voelt en wat een categorie nog niet heeft benoemd. De meeste reismerken praten over de bestemming. Dit project praat over de toestand waarin mensen naar een bestemming verlangen, en bezet daarmee een instapmoment dat leeg lag."),
  P("Dat is overdraagbaar naar elke categorie. Een merk dat een onbezette situatie claimt en die met geloofwaardig bewijs onderbouwt, hoeft niet de luidste te zijn. Het hoeft alleen het eerste te zijn dat opduikt wanneer de behoefte ontstaat."),

  H2("Over het project"),
  P("De Nationale Stress Index is een signaalindex die meet hoeveel stressfactoren die de wetenschappelijke literatuur erkent, aanwezig zijn in de Belgische leefomgeving. De index meet blootstelling, niet individueel ervaren stress, en is literatuur-onderbouwd, geen peer-reviewed instrument. Het is een samenkomen van gevestigde wetenschappelijke kaders, strategische analyse en technologie, waarbij de indicatoren via een transparante, gelijke weging worden samengebracht en taaltechnologie gericht wordt ingezet om de toon van het nieuws in te schatten. Het project is een initiatief van June20, een strategisch communicatie- en innovatiebureau, ontwikkeld in samenwerking met het toeristisch agentschap van Les Hautes-Alpes. De volledige databronnen, de wetenschappelijke kaders en de methodologische basis worden bij de lancering publiek gemaakt op [website]."),
  P("De kaders omvatten onder meer de allostatic-load-theorie (McEwen), het Social Determinants of Health-kader (Marmot/WHO) en de Conservation of Resources-theorie (Hobfoll)."),

  P([{ t: "Contact voor vakpers", b: true }], { before: 240, after: 40, border: TOPRULE }),
  P([{ t: "[Naam] · [functie] · [telefoon] · [e-mail]", color: GREY }], { after: 40 }),
  P([{ t: "June20 · [adres] · [website]", color: GREY }], { after: 120 }),
  P([{ t: "Interviews over de strategische en wetenschappelijke opzet zijn mogelijk op aanvraag.", i: true, color: GREY }]),
];

function build(children) {
  return new Document({ styles, numbering, sections: [{ properties: pageProps, children }] });
}

(async () => {
  const out1 = "Persbericht-Nationale-Stress-Index-MAINSTREAM.docx";
  const out2 = "Persbericht-Nationale-Stress-Index-VAKPERS.docx";
  fs.writeFileSync(out1, await Packer.toBuffer(build(mainstream)));
  fs.writeFileSync(out2, await Packer.toBuffer(build(vakpers)));
  console.log("Geschreven:", out1, "+", out2);
})();
