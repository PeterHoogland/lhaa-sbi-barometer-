/**
 * Plain-Dutch beschrijvingen per indicator + klikbare bronnen.
 *
 * Per indicator:
 *  - plain        : korte naam
 *  - why          : waarom dit in de index staat (15-jarig niveau)
 *  - reads        : wat we feitelijk uitlezen
 *  - evidenceNote : wat het bewijs wél en niet draagt (B8) — eerlijk over niveau
 *                   (individueel vs bevolking) en beperkingen; overschrijdt de
 *                   bronnen in `references` niet
 *  - unit         : eenheid van de waarde
 *  - dataSource   : naam + URL van de officiële databron
 *  - references   : 1-2 wetenschappelijke onderbouwingen met DOI/URL
 *
 * Alle velden zijn user-facing copy: geen em-dash (huisregel), geen claim die de
 * bron niet draagt. test/evidence.test.ts pint dit.
 */

import type { IndicatorCode } from "../types.js";

export interface PlainReference {
  label: string;
  url: string;
}

export interface PlainDataSource {
  name: string;
  url: string;
}

export interface PlainLanguageMeta {
  plain: string;
  why: string;
  reads: string;
  /** Eerlijke duiding van de bewijskracht achter deze indicator (B8). */
  evidenceNote: string;
  unit: string;
  dataSource: PlainDataSource;
  references: PlainReference[];
}

export const PLAIN: Record<IndicatorCode, PlainLanguageMeta> = {
  "I-D1-001": {
    plain: "Daglicht",
    why: "De hoeveelheid zonlicht heeft invloed op hoe mensen zich voelen.",
    reads: "Hoeveel uur het vandaag licht is.",
    evidenceNote: "Winterdepressie en het effect van lichttherapie zijn in herhaald onderzoek aangetoond. Dat bewijs gaat over individuele stemming; wij rekenen het daglicht zelf uit, een vast seizoenspatroon en geen meting van hoe mensen zich vandaag voelen.",
    unit: "uur",
    dataSource: { name: "NOAA Solar Calculator (astronomisch)", url: "https://gml.noaa.gov/grad/solcalc/" },
    references: [
      { label: "Rosenthal et al. (1984): SAD originele beschrijving", url: "https://doi.org/10.1001/archpsyc.1984.01790120076010" },
      { label: "Golden et al. (2005): lichttherapie meta-analyse", url: "https://doi.org/10.1176/appi.ajp.162.4.656" },
    ],
  },
  "I-D1-002": {
    plain: "Hitte",
    why: "Hitte bemoeilijkt de nachtrust en treft vooral kwetsbare bevolkingsgroepen.",
    reads: "Hoeveel graden warmer dan 30°C het vandaag is.",
    evidenceNote: "Hittegolven gaan in bevolkingsonderzoek samen met meer sterfte en meer psychiatrische opnames. Dat bewijs is het sterkst voor aanhoudende hitte; het effect van een enkele warme dag is kleiner. Daarom weegt de index een echte hittegolf zwaarder dan een losse warme dag: rond 30 graden (een tropische dag) telt licht mee, vanaf ongeveer 33 graden fors, en een aanhoudende hittegolf het zwaarst.",
    unit: "°C boven 30",
    dataSource: { name: "KMI synop (open-meteo als fallback)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2010): Lancet, hitte en gezondheid", url: "https://doi.org/10.1016/S0140-6736(09)61711-6" },
      { label: "Thompson et al. (2018): hitte en mentale gezondheid", url: "https://doi.org/10.1016/j.scitotenv.2018.01.121" },
    ],
  },
  "I-D1-003": {
    plain: "Koude",
    why: "Naast de impact op gezondheid en gemoedsrust kan kou ons ook financieel belasten.",
    reads: "Hoeveel graden kouder dan -5°C het vannacht was.",
    evidenceNote: "Strenge kou is gekoppeld aan meer gezondheidsklachten en hogere stookkosten. Het bewijs voor het effect op stemming en spanning is minder direct dan bij hitte; daarom een lager bewijsniveau. Net als bij hitte weegt de index een echte koudegolf zwaarder dan een losse koude nacht.",
    unit: "°C onder -5",
    dataSource: { name: "KMI synop (open-meteo als fallback)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2017): koude en mortaliteit", url: "https://doi.org/10.1136/jech-2016-208439" },
    ],
  },
  "I-D1-004": {
    plain: "Luchtkwaliteit",
    why: "Vuile lucht (fijnstof, ozon) hangt samen met meer somberheid en prikkelbaarheid.",
    reads: "Hoe schoon de lucht is vergeleken met wat de WHO gezond noemt.",
    evidenceNote: "Grote studies vinden een consistent verband tussen luchtvervuiling en meer depressie- en angstklachten op bevolkingsniveau. Oorzaak en gevolg zijn daarbij moeilijk volledig te scheiden.",
    unit: "× WHO-grens",
    dataSource: { name: "IRCELINE (Belgisch luchtmeetnet, Brussel)", url: "https://www.irceline.be/" },
    references: [
      { label: "Braithwaite et al. (2019): luchtvervuiling en mentale gezondheid", url: "https://doi.org/10.1289/EHP4595" },
      { label: "Newbury et al. (2019): JAMA Psychiatry", url: "https://doi.org/10.1001/jamapsychiatry.2019.0056" },
    ],
  },
  "I-D2-001": {
    plain: "File's op de baan",
    why: "Hoeveel files meten we vandaag? Urenlang stilstaan in het verkeer is een bekende stressor.",
    reads: "De verandering van de officiële filezwaarte (jaargemiddelde van het Verkeerscentrum) t.o.v. een jaar eerder. Een jaarcijfer, geen dagmeting.",
    evidenceNote: "Onderzoek bij pendelaars koppelt lang filerijden aan hogere bloeddruk en meer ervaren spanning. Dat is op individueel niveau gemeten, niet als landelijk dagcijfer, en wij gebruiken hier bovendien een jaarcijfer.",
    unit: "% t.o.v. vorig jaar",
    dataSource: { name: "Vlaams Verkeerscentrum", url: "https://www.verkeerscentrum.be" },
    references: [
      { label: "Novaco, Stokols & Milanesi (1990): pendel en stress", url: "https://doi.org/10.1007/BF00931303" },
      { label: "Chatterjee et al. (2020): Transport Reviews", url: "https://doi.org/10.1080/01441647.2019.1649317" },
    ],
  },
  "I-D2-004": {
    plain: "Brandstofprijs",
    why: "Wanneer tanken duurder wordt, voelen veel gezinnen dat in hun budget.",
    reads: "De officiële maximumprijs van Euro95.",
    evidenceNote: "Financiële druk op het gezinsbudget is een goed onderbouwde bron van zorgen. Het directe effect van de pompprijs zelf op hoe mensen zich voelen is niet apart aangetoond.",
    unit: "€/liter",
    dataSource: { name: "be.STAT + ECB ICP (brandstofprijs-index)", url: "https://bestat.statbel.fgov.be" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D3-001": {
    plain: "Inflatie (stijgende prijzen)",
    why: "Prijsstijgingen maken het moeilijker om rond te komen en zorgen voor druk.",
    reads: "Hoeveel duurder de gemiddelde boodschap is dan een jaar geleden.",
    evidenceNote: "Het verband tussen geldzorgen en lager welzijn is breed en herhaald aangetoond. Inflatie raakt vrijwel iedereen tegelijk; hoe zwaar dat weegt verschilt wel per gezin.",
    unit: "% per jaar",
    dataSource: { name: "STATBEL CPI (via ECB SDW)", url: "https://statbel.fgov.be/nl/themas/consumptieprijzen/consumptieprijsindex" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
      { label: "Kahneman & Tversky (1979): Prospect Theory", url: "https://doi.org/10.2307/1914185" },
    ],
  },
  "I-D3-002": {
    plain: "Energieprijzen",
    why: "Verwarming en elektriciteit zijn vaste, moeilijk te vermijden kosten die voor stress kunnen zorgen.",
    reads: "De wekelijkse spotprijs voor gas en elektriciteit.",
    evidenceNote: "Een van de best onderbouwde verbanden in deze index: wie zijn energierekening moeilijk kan betalen, rapporteert in groot Europees onderzoek meetbaar lager welzijn en meer depressieve klachten.",
    unit: "€/MWh",
    dataSource: { name: "ENTSO-E Transparency", url: "https://transparency.entsoe.eu" },
    references: [
      { label: "Thomson, Snell & Bouzarovski (2017): energiearmoede Europa", url: "https://doi.org/10.3390/ijerph14060584" },
      { label: "Liddell & Morris (2010): fuel poverty en gezondheid", url: "https://doi.org/10.1016/j.enpol.2010.02.037" },
    ],
  },
  "I-D3-003": {
    plain: "Ontslagen aangekondigd",
    why: "Als ergens een collectief ontslag wordt aangekondigd, voelt iedereen op die werkplek dat, ook wie niet ontslagen wordt.",
    reads: "Er is geen open feed van aangekondigde collectieve ontslagen; we gebruiken de maandelijkse stijging van de Belgische werkloosheidsgraad (ECB LFSI) als proxy voor ontslagdruk.",
    evidenceNote: "Dat ontslagrondes ook achterblijvers raken is goed onderbouwd. Maar er bestaat geen open feed van aangekondigde ontslagen; onze werkloosheids-proxy meet iets anders dan de naam zegt. Daarom telt deze indicator niet mee in het cijfer en draait hij alleen diagnostisch mee.",
    unit: "log(werknemers)",
    dataSource: { name: "ECB LFSI, werkloosheidsrate-delta (proxy)", url: "https://data.ecb.europa.eu/" },
    references: [
      { label: "Brand (2015): Annual Review of Sociology", url: "https://doi.org/10.1146/annurev-soc-071913-043237" },
      { label: "De Witte et al. (2016): job insecurity review", url: "https://doi.org/10.1111/ap.12176" },
    ],
  },
  "I-D3-005": {
    plain: "Werkloosheid",
    why: "Hogere werkloosheid betekent meer mensen in moeilijkheden, economische druk en stress in het land.",
    reads: "Het percentage werkzoekenden in de beroepsbevolking.",
    evidenceNote: "Werkloosheid behoort tot de sterkst onderbouwde oorzaken van gezondheids- en welzijnsverlies, ook op bevolkingsniveau. Het cijfer beweegt traag en zegt iets over achtergronddruk, niet over vandaag.",
    unit: "%",
    dataSource: { name: "Eurostat, BE werkloosheidsgraad", url: "https://ec.europa.eu/eurostat/databrowser/view/une_rt_m" },
    references: [
      { label: "WHO Commission on Social Determinants (2008): Marmot", url: "https://www.who.int/publications/i/item/WHO-IER-CSDH-08.1" },
    ],
  },
  "I-D3-006": {
    plain: "Hypotheekrente",
    why: "Een hogere rente maakt een huis kopen of afbetalen duurder.",
    reads: "De gemiddelde rente voor nieuwe woonleningen.",
    evidenceNote: "Zware woonlasten geven aantoonbaar financiële stress. De rentestand werkt indirect: hij raakt vooral wie nu leent of moet herfinancieren, niet wie al een vaste lening heeft.",
    unit: "%",
    dataSource: { name: "ECB MIR, BE hypotheekrente", url: "https://data.ecb.europa.eu/" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D3-007": {
    plain: "Consumentenvertrouwen",
    why: "Somber financieel en economisch sentiment remt de economie, laag vertrouwen verhoogt de druk.",
    reads: "Het maandelijkse consumentenvertrouwen-saldo: hoe optimistisch of pessimistisch gezinnen zijn over hun toekomst.",
    evidenceNote: "Dit is een maandelijkse enquête waarin Belgische gezinnen zelf zeggen hoe somber of optimistisch ze zijn. Dat is een directe vraag aan mensen, maar over hun verwachtingen, niet over stressklachten.",
    unit: "saldo",
    dataSource: { name: "Eurostat, EC consumentenvertrouwen BE", url: "https://ec.europa.eu/eurostat/databrowser/view/ei_bsco_m" },
    references: [
      { label: "Europese Commissie, Business and Consumer Surveys", url: "https://economy-finance.ec.europa.eu/economic-forecast-and-surveys/business-and-consumer-surveys_en" },
    ],
  },
  "I-D4-001": {
    plain: "Werk-deadlines",
    why: "Piekende werkeisen, belastingaangifte, kwartaaleinde, jaareinde.",
    reads: "Hoeveel grote deadlines er deze week samenvallen.",
    evidenceNote: "Dat piekende werkeisen belastend zijn, is goed onderbouwd in werkdrukonderzoek. Wanneer die pieken precies vallen, leiden we af uit de kalender; dat deel is een aanname, geen meting.",
    unit: "score 0–3",
    dataSource: { name: "FOD Financiën (fiscale kalender)", url: "https://financien.belgium.be/nl/particulieren/belastingaangifte" },
    references: [
      { label: "Bakker & Demerouti (2007): JD-R model", url: "https://doi.org/10.1108/02683940710733115" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D4-002": {
    plain: "Schoolvakanties",
    why: "Zonder opvang in de vakantie komt er extra organisatie bij ouders kijken.",
    reads: "Of we in een schoolvakantie zitten, hoe meer dagen nog te gaan hoe zwaarder.",
    evidenceNote: "De combinatie van werk en kinderopvang is een gedocumenteerde belasting voor ouders. Dat een specifieke vakantieweek zwaarder is, leiden we af uit de kalender; dat deel is een aanname, geen meting.",
    unit: "score 0–2",
    dataSource: { name: "Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Bianchi et al. (2012): werk- en gezinsbelasting", url: "https://doi.org/10.1093/sf/sos120" },
    ],
  },
  "I-D5-001": {
    plain: "Hoe negatief is het nieuws?",
    why: "Negatief nieuws hangt samen met een somberdere stemming bij de bevolking. (Omdat mediatoon slechts een indirecte maat voor druk is, krijgt deze indicator een lager bewijsniveau.)",
    reads: "We meten de gemiddelde toon van het Belgische nieuws via GDELT, een wetenschappelijk project dat wereldwijd nieuwsberichten leest en de toon ervan scoort. Het grote voordeel: GDELT heeft een echte historie van twee jaar, zodat we vandaag eerlijk kunnen vergelijken met hoe negatief het nieuws gewoonlijk is. Daarnaast lezen we elk uur de titels en intro's van dertien Belgische RSS-bronnen met het Pattern.nl-valentielexicon (Universiteit Antwerpen, 3.000+ woorden, peer-reviewed) en wegen we die naar het leeftijdsprofiel van elk publiek. Bijna-duplicaten worden er eerst uitgefilterd (Jaccard ≥ 0,8), zodat één gebeurtenis niet tienvoudig telt. Per cyclus bewaren we de meest negatieve headlines, zodat elk hoog cijfer terug te leiden is naar concrete koppen.",
    evidenceNote: "Mensen reageren aantoonbaar sterker op negatief nieuws dan op positief nieuws. Maar het beste experiment vond geen direct effect van nieuws op stresshormonen, alleen een verhoogde gevoeligheid voor een latere stressor bij een kleine groep. Mediatoon is dus een indirecte aanwijzing; vandaar het lage bewijsniveau.",
    unit: "toon-score",
    dataSource: { name: "GDELT DOC 2.0 nieuwstoon BE + RSS-controle van 13 BE-bronnen", url: "https://www.gdeltproject.org/" },
    references: [
      { label: "Leetaru (2013): GDELT Global Knowledge Graph", url: "https://www.gdeltproject.org/" },
      { label: "Young & Soroka (2012): Affective News, Lexicoder-methode", url: "https://doi.org/10.1080/10584609.2012.671234" },
      { label: "Soroka, Fournier & Nir (2019): PNAS, negativity bias", url: "https://doi.org/10.1073/pnas.1908369116" },
      { label: "Marin et al. (2012): PLoS ONE, nieuws en stressreactiviteit (het experiment uit de bewijskracht-duiding)", url: "https://doi.org/10.1371/journal.pone.0047189" },
    ],
  },
  "I-D5-002": {
    plain: "Hoeveel mensen lezen over stress?",
    why: "Hoe vaak zoeken mensen informatie op over stress, burn-out of slaapproblemen?",
    reads: "We tellen elke dag hoe vaak zes Nederlandstalige Wikipedia-artikels over stress-thema's worden bekeken: Stress, Burn-out, Depressie, Angststoornis, Overspannenheid en Slapeloosheid. We delen dat door het totale Wikipedia-verkeer van die dag, zodat alleen de relatieve aandacht voor stress telt en niet de algemene groei of krimp van Wikipedia. Daarna nemen we het gemiddelde over zeven dagen, zodat het weekendeffect wegvalt. We gebruiken Wikipedia in plaats van Google Trends omdat Google zoekdata blokkeert voor servers, terwijl Wikipedia open, betrouwbaar en reproduceerbaar is.",
    evidenceNote: "Lees- en zoekgedrag kan meebewegen met wat er leeft, maar het stijgt ook door een nieuwsbericht of een documentaire. De wetenschap waarschuwt expliciet dat zulke aandachtscijfers geen betrouwbare gezondheidsmeting zijn (zie de Google Flu-waarschuwing bij de bronnen); vandaar het lage bewijsniveau.",
    unit: "per miljoen weergaven",
    dataSource: { name: "Wikimedia Pageviews API (nl.wikipedia)", url: "https://wikimedia.org/api/rest_v1/" },
    references: [
      { label: "Generous et al. (2014): ziektemonitoring via Wikipedia", url: "https://doi.org/10.1371/journal.pcbi.1003892" },
      { label: "McIver & Brownstein (2014): Wikipedia voor griepmonitoring", url: "https://doi.org/10.1371/journal.pcbi.1003581" },
      { label: "Lazer et al. (2014): Science, parable of Google Flu (waarschuwing)", url: "https://doi.org/10.1126/science.1248506" },
    ],
  },
  "I-D5-003": {
    plain: "Grote negatieve gebeurtenis",
    why: "Denk aan rampen, terreur, of nationale rouw of andere nieuwsberichten die een heel land tegelijk raken.",
    reads: "Of er recent zo'n gebeurtenis was, met afnemend effect over 7 dagen.",
    evidenceNote: "Acute stressreacties in de bevolking na rampen en aanslagen zijn goed gedocumenteerd, ook bij mensen die het alleen via media volgden. De ernst-score per gebeurtenis is menselijke codering en blijft een inschatting.",
    unit: "magnitude 0–15",
    dataSource: { name: "Nieuwsmonitoring + menselijke codering", url: "https://www.vrt.be/vrtnws/" },
    references: [
      { label: "Holman, Garfin & Silver (2014): PNAS, Boston Marathon", url: "https://doi.org/10.1073/pnas.1316265110" },
      { label: "Silver et al. (2013): media en collectief trauma", url: "https://doi.org/10.1177/0956797612460406" },
    ],
  },
  "I-D6-001": {
    plain: "Tot de volgende vakantie",
    why: "Weten dat er rust aankomt, helpt mensen om vol te houden.",
    reads: "Hoeveel dagen tot de eerstvolgende feestdag of schoolvakantie.",
    evidenceNote: "Dat uitzicht op herstel mensen helpt volhouden, is onderbouwd in herstelonderzoek bij werknemers. Dit signaal is pure kalenderinformatie en telt daarom niet mee in het cijfer.",
    unit: "dagen",
    dataSource: { name: "Federale feestdagen + Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Fritz & Sonnentag (2005): herstel, gezondheid, werkprestatie", url: "https://doi.org/10.1037/1076-8998.10.3.187" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D6-002": {
    plain: "Welke dag van de week",
    why: "Dinsdag-woensdag-donderdag voelen voor veel mensen het zwaarst, zaterdag-zondag het lichtst.",
    reads: "De dag van de week, vertaald naar een gemiddelde belasting.",
    evidenceNote: "Stemmingsverschillen tussen weekdagen zijn in grote datasets aangetoond. De weekdag zelf is kalenderinformatie, geen meting; dit signaal telt niet mee in het cijfer.",
    unit: "0–1",
    dataSource: { name: "Kalender (deterministisch)", url: "https://nl.wikipedia.org/wiki/Week_(tijdsaanduiding)" },
    references: [
      { label: "Stone, Schneider & Harter (2012): weekdag stemmingspatroon", url: "https://doi.org/10.1080/17439760.2012.691980" },
    ],
  },
  "I-D6-003": {
    plain: "Zomertijd/wintertijd",
    why: "Als de klok verzet wordt, raakt het ritme van je lichaam even in de war.",
    reads: "Hoe lang geleden de klok werd verzet (effect dooft uit na 7 dagen).",
    evidenceNote: "Rond het verzetten van de klok zien studies kortdurend meer slaapproblemen en zelfs meer hartinfarcten. Het moment is kalenderinformatie; dit signaal telt niet mee in het cijfer.",
    unit: "0–1",
    dataSource: { name: "Wettelijke DST-data EU", url: "https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32000L0084" },
    references: [
      { label: "Manfredini et al. (2018): DST en hartinfarcten", url: "https://doi.org/10.3390/jcm8030404" },
      { label: "Roenneberg et al. (2019): waarom DST afschaffen", url: "https://doi.org/10.1177/0748730419854197" },
    ],
  },
  "I-D6-005": {
    plain: "Examens",
    why: "Examens raken studenten én hun gezinnen tegelijk.",
    reads: "Of er één of meerdere examenperiodes lopen (hoger onderwijs + secundair).",
    evidenceNote: "Examenstress bij studenten is goed gedocumenteerd. Wanneer examenperiodes vallen is kalenderinformatie, geen meting; dit signaal telt niet mee in het cijfer.",
    unit: "0–3",
    dataSource: { name: "Academische kalender", url: "https://onderwijs.vlaanderen.be" },
    references: [
      { label: "Pascoe, Hetrick & Parker (2020): stress bij studenten", url: "https://doi.org/10.1080/02673843.2019.1596823" },
    ],
  },
  "I-D1-009": {
    plain: "Te hoog waterpeil",
    why: "Hoogwater vormt een risico voor huizen en bezittingen. Die dreiging alleen al kan voor onrust zorgen.",
    reads: "We tellen het debiet (hoeveel water er door de rivieren stroomt) op in Vlaanderen én Wallonië, waaronder de Vesdre en Ourthe die in 2021 overstroomden. Hoe voller de rivieren, hoe groter de overstromingsdruk.",
    evidenceNote: "Bij mensen die een overstroming meemaakten zijn angst- en stressklachten goed gedocumenteerd. Wij meten de dreiging (hoeveel water door de rivieren stroomt), niet een ramp zelf; dat is een stap verwijderd van het bewijs.",
    unit: "m³/s (som)",
    dataSource: { name: "VMM Waterinfo.be + SPW hydrometrie.wallonie.be", url: "https://www.waterinfo.be/" },
    references: [
      { label: "Fernandez et al. (2019): overstromingen en mentale gezondheid", url: "https://doi.org/10.1016/j.ijdrr.2019.101270" },
      { label: "WHO: factsheet overstromingen", url: "https://www.who.int/news-room/fact-sheets/detail/floods" },
    ],
  },
  "I-D1-010": {
    plain: "Pollen",
    why: "Hooikoorts zorgt bij veel mensen voor slaapproblemen en concentratieverlies.",
    reads: "We tellen voor Brussel hoeveel pollenkorrels van vijf plantensoorten in de lucht zweven: els, berk, gras, bijvoet en ambrosia. Meer korrels betekent meer niezen, jeuk en vermoeidheid.",
    evidenceNote: "Hooikoorts verstoort aantoonbaar slaap, concentratie en humeur, maar vooral bij de 20 tot 30 procent van de mensen met een allergie. Het cijfer komt bovendien uit een Europees rekenmodel, niet uit een Belgische telling.",
    unit: "pollenkorrels/m³",
    dataSource: { name: "Copernicus CAMS (Europees model, geen Belgische pollenmeting)", url: "https://atmosphere.copernicus.eu/" },
    references: [
      { label: "Damialis et al. (2019): pollen en welbevinden", url: "https://doi.org/10.1111/all.13758" },
      { label: "Copernicus: luchtkwaliteit en allergie", url: "https://atmosphere.copernicus.eu/" },
    ],
  },
  "I-D2-009": {
    plain: "Treinvertraging",
    why: "Onaangekondigde vertragingen maken reizen onzeker en stressvol voor pendelaars.",
    reads: "Het aandeel treinen dat met 6 minuten of meer vertraging aankomt, gemeten op de officiële Infrabel-meetpunten (Brussel en eindbestemmingen), over de meetdag tot 20 uur.",
    evidenceNote: "Onbetrouwbaar pendelen hangt in onderzoek samen met lager welzijn en meer ervaren spanning bij reizigers. Dat bewijs is bij individuele pendelaars verzameld; de vertaling naar een dagcijfer voor het hele land is onze aanname.",
    unit: "% vertraagde treinen",
    dataSource: { name: "Infrabel Open Data (stiptheid)", url: "https://opendata.infrabel.be/explore/dataset/stiptheid-van-vandaag-per-uur/" },
    references: [
      { label: "Chatterjee et al. (2017): pendelen en welzijn", url: "https://doi.org/10.1016/j.trf.2017.08.002" },
      { label: "APA: controleverlies als stressbron", url: "https://www.apa.org/topics/stress" },
    ],
  },
  "I-D3-009": {
    plain: "Mogelijke energieschaarste",
    why: "Een overvol stroomnet kan leiden tot piekprijzen of zelfs stroomuitval. Dit zorgt voor collectieve stress en onzekerheid.",
    reads: "Elia, de netbeheerder, voorspelt elke dag hoeveel stroom België zal verbruiken. Wij delen het echte verbruik door die voorspelling. 1,0 betekent precies zoals verwacht, hoger betekent een drukker net.",
    evidenceNote: "Het bewijs loopt via energie-onzekerheid: onzekerheid over de voorziening en prijspieken drukken het welzijn. Een direct gemeten stressreactie op netdrukte bestaat niet; dit is een afgeleide aanwijzing.",
    unit: "ratio gemeten/voorspeld",
    dataSource: { name: "Elia Open Data", url: "https://opendata.elia.be/" },
    references: [
      { label: "Thomson, Snell & Bouzarovski (2019): energie-onzekerheid en welzijn", url: "https://doi.org/10.1016/j.erss.2019.101216" },
      { label: "IEA: zekerheid van elektriciteitsvoorziening", url: "https://www.iea.org/reports/security-of-electricity-supply" },
    ],
  },
};

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem";

export function zToState(z: number): IndicatorState {
  if (z >= 2) return "extreem";
  if (z >= 1) return "verhoogd";
  if (z >= -1) return "normaal";
  return "rustig";
}

export const STATE_LABELS: Record<IndicatorState, string> = {
  rustig: "lager dan gewoonlijk",
  normaal: "gemiddeld",
  verhoogd: "hoger dan gewoonlijk",
  extreem: "uitzonderlijk hoog",
};
