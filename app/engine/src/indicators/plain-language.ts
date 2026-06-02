/**
 * Plain-Dutch beschrijvingen per indicator + klikbare bronnen.
 *
 * Per indicator:
 *  - plain      : korte naam
 *  - why        : waarom dit in de index staat (15-jarig niveau)
 *  - reads      : wat we feitelijk uitlezen
 *  - unit       : eenheid van de waarde
 *  - dataSource : naam + URL van de officiële databron
 *  - references : 1-2 wetenschappelijke onderbouwingen met DOI/URL
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
  unit: string;
  dataSource: PlainDataSource;
  references: PlainReference[];
}

export const PLAIN: Record<IndicatorCode, PlainLanguageMeta> = {
  "I-D1-001": {
    plain: "Daglicht",
    why: "Als de zon vaker schijnt, voelen mensen zich gemiddeld beter.",
    reads: "Hoeveel uur het vandaag licht is.",
    unit: "uur",
    dataSource: { name: "NOAA Solar Calculator (astronomisch)", url: "https://gml.noaa.gov/grad/solcalc/" },
    references: [
      { label: "Rosenthal et al. (1984): SAD originele beschrijving", url: "https://doi.org/10.1001/archpsyc.1984.01790120076010" },
      { label: "Golden et al. (2005): lichttherapie meta-analyse", url: "https://doi.org/10.1176/appi.ajp.162.4.656" },
    ],
  },
  "I-D1-002": {
    plain: "Hitte",
    why: "Hitte maakt slapen moeilijker en zorgt voor extra spanning in het lichaam.",
    reads: "Hoeveel graden warmer dan 30°C het vandaag is.",
    unit: "°C boven 30",
    dataSource: { name: "KMI (via open-meteo)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2010): Lancet, hitte en gezondheid", url: "https://doi.org/10.1016/S0140-6736(09)61711-6" },
      { label: "Thompson et al. (2018): hitte en mentale gezondheid", url: "https://doi.org/10.1016/j.scitotenv.2018.01.121" },
    ],
  },
  "I-D1-003": {
    plain: "Koude",
    why: "Extreme kou belast de gezondheid én de portefeuille (verwarming).",
    reads: "Hoeveel graden kouder dan -5°C het vannacht was.",
    unit: "°C onder -5",
    dataSource: { name: "KMI (via open-meteo)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2017): koude en mortaliteit", url: "https://doi.org/10.1136/jech-2016-208439" },
    ],
  },
  "I-D1-004": {
    plain: "Luchtkwaliteit",
    why: "Vuile lucht (fijnstof, ozon) hangt samen met meer somberheid en prikkelbaarheid.",
    reads: "Hoe schoon de lucht is vergeleken met wat de WHO gezond noemt.",
    unit: "× WHO-grens",
    dataSource: { name: "open-meteo Air Quality (CAMS-model)", url: "https://open-meteo.com/en/docs/air-quality-api" },
    references: [
      { label: "Braithwaite et al. (2019): luchtvervuiling en mentale gezondheid", url: "https://doi.org/10.1289/EHP4595" },
      { label: "Newbury et al. (2019): JAMA Psychiatry", url: "https://doi.org/10.1001/jamapsychiatry.2019.0056" },
    ],
  },
  "I-D2-001": {
    plain: "Verkeersdrukte",
    why: "Lang in de file staan verhoogt stresshormonen; een snelle stijging betekent toenemende druk.",
    reads: "De verandering van de officiële filezwaarte (jaargemiddelde van het Verkeerscentrum) t.o.v. een jaar eerder. Een jaarcijfer, geen dagmeting.",
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
    unit: "€/liter",
    dataSource: { name: "be.STAT + ECB ICP (brandstofprijs-index)", url: "https://bestat.statbel.fgov.be" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D3-001": {
    plain: "Inflatie (prijzen stijgen)",
    why: "Als alles duurder wordt, valt geld korter, dat geeft druk.",
    reads: "Hoeveel duurder de gemiddelde boodschap is dan een jaar geleden.",
    unit: "% per jaar",
    dataSource: { name: "STATBEL CPI (via ECB SDW)", url: "https://statbel.fgov.be/nl/themas/consumptieprijzen/consumptieprijsindex" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
      { label: "Kahneman & Tversky (1979): Prospect Theory", url: "https://doi.org/10.2307/1914185" },
    ],
  },
  "I-D3-002": {
    plain: "Energieprijs",
    why: "Verwarming en elektriciteit zijn een grote uitgave die je moeilijk kan vermijden.",
    reads: "De wekelijkse spotprijs voor gas en elektriciteit.",
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
    unit: "log(werknemers)",
    dataSource: { name: "ECB LFSI — werkloosheidsrate-delta (proxy)", url: "https://data.ecb.europa.eu/" },
    references: [
      { label: "Brand (2015): Annual Review of Sociology", url: "https://doi.org/10.1146/annurev-soc-071913-043237" },
      { label: "De Witte et al. (2016): job insecurity review", url: "https://doi.org/10.1111/ap.12176" },
    ],
  },
  "I-D3-005": {
    plain: "Werkloosheid",
    why: "Hogere werkloosheid betekent dat meer mensen het moeilijk hebben, economische druk op het land.",
    reads: "Het percentage werkzoekenden in de beroepsbevolking.",
    unit: "%",
    dataSource: { name: "Eurostat — BE werkloosheidsgraad", url: "https://ec.europa.eu/eurostat/databrowser/view/une_rt_m" },
    references: [
      { label: "WHO Commission on Social Determinants (2008): Marmot", url: "https://www.who.int/publications/i/item/WHO-IER-CSDH-08.1" },
    ],
  },
  "I-D3-006": {
    plain: "Hypotheekrente",
    why: "Een hogere rente maakt een huis kopen of afbetalen duurder.",
    reads: "De gemiddelde rente voor nieuwe woonleningen.",
    unit: "%",
    dataSource: { name: "ECB MIR — BE hypotheekrente", url: "https://data.ecb.europa.eu/" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D4-001": {
    plain: "Werk-deadlines",
    why: "Bepaalde weken pieken samen, belastingaangifte, kwartaaleinde, jaareinde.",
    reads: "Hoeveel grote deadlines er deze week samenvallen.",
    unit: "score 0–3",
    dataSource: { name: "FOD Financiën (fiscale kalender)", url: "https://financien.belgium.be/nl/particulieren/belastingaangifte" },
    references: [
      { label: "Bakker & Demerouti (2007): JD-R model", url: "https://doi.org/10.1108/02683940710733115" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D4-002": {
    plain: "Schoolvakantie",
    why: "Vakantie zonder opvang vraagt extra puzzelwerk van ouders.",
    reads: "Of we in een schoolvakantie zitten, hoe meer dagen nog te gaan hoe zwaarder.",
    unit: "score 0–2",
    dataSource: { name: "Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Bianchi et al. (2012): werk- en gezinsbelasting", url: "https://doi.org/10.1093/sf/sos120" },
    ],
  },
  "I-D5-001": {
    plain: "Hoe negatief is het nieuws?",
    why: "Veel negatief nieuws beïnvloedt hoe een hele bevolking zich voelt.",
    reads: "We meten de gemiddelde toon van het Belgische nieuws via GDELT, een wetenschappelijk project dat wereldwijd nieuwsberichten leest en de toon ervan scoort. Het grote voordeel: GDELT heeft een echte historie van twee jaar, zodat we vandaag eerlijk kunnen vergelijken met hoe negatief het nieuws gewoonlijk is. Daarnaast lezen we elk uur de titels en intro's van dertien Belgische RSS-bronnen met het Pattern.nl-valentielexicon (Universiteit Antwerpen, 3.000+ woorden, peer-reviewed) en wegen we die naar het leeftijdsprofiel van elk publiek. Bijna-duplicaten worden er eerst uitgefilterd (Jaccard ≥ 0,8), zodat één gebeurtenis niet tienvoudig telt. Per cyclus bewaren we de meest negatieve headlines, zodat elk hoog cijfer terug te leiden is naar concrete koppen.",
    unit: "toon-score",
    dataSource: { name: "GDELT DOC 2.0 nieuwstoon BE + RSS-controle van 13 BE-bronnen", url: "https://www.gdeltproject.org/" },
    references: [
      { label: "Leetaru (2013): GDELT Global Knowledge Graph", url: "https://www.gdeltproject.org/" },
      { label: "Young & Soroka (2012): Affective News, Lexicoder-methode", url: "https://doi.org/10.1080/10584609.2012.671234" },
      { label: "Soroka, Fournier & Nir (2019): PNAS, negativity bias", url: "https://doi.org/10.1073/pnas.1908369116" },
    ],
  },
  "I-D5-002": {
    plain: "Hoeveel mensen lezen over stress?",
    why: "Hoe vaak mensen informatie opzoeken over stress, burn-out of slaapproblemen, vertelt iets over wat er leeft. (Niet perfect, maar wel een bruikbare aanwijzing.)",
    reads: "We tellen elke dag hoe vaak zes Nederlandstalige Wikipedia-artikels over stress-thema's worden bekeken: Stress, Burn-out, Depressie, Angststoornis, Overspannenheid en Slapeloosheid. We delen dat door het totale Wikipedia-verkeer van die dag, zodat alleen de relatieve aandacht voor stress telt en niet de algemene groei of krimp van Wikipedia. Daarna nemen we het gemiddelde over zeven dagen, zodat het weekendeffect wegvalt. We gebruiken Wikipedia in plaats van Google Trends omdat Google zoekdata blokkeert voor servers, terwijl Wikipedia open, betrouwbaar en reproduceerbaar is.",
    unit: "per miljoen weergaven",
    dataSource: { name: "Wikimedia Pageviews API (nl.wikipedia)", url: "https://wikimedia.org/api/rest_v1/" },
    references: [
      { label: "Generous et al. (2014): ziektemonitoring via Wikipedia", url: "https://doi.org/10.1371/journal.pcbi.1003892" },
      { label: "McIver & Brownstein (2014): Wikipedia voor griepmonitoring", url: "https://doi.org/10.1371/journal.pcbi.1003581" },
      { label: "Lazer et al. (2014): Science, parable of Google Flu (waarschuwing)", url: "https://doi.org/10.1126/science.1248506" },
    ],
  },
  "I-D5-003": {
    plain: "Grote gebeurtenis",
    why: "Rampen, terreur, of nationale rouw raken een heel land tegelijk.",
    reads: "Of er recent zo'n gebeurtenis was, met afnemend effect over 7 dagen.",
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
    unit: "0–3",
    dataSource: { name: "Academische kalender", url: "https://onderwijs.vlaanderen.be" },
    references: [
      { label: "Pascoe, Hetrick & Parker (2020): stress bij studenten", url: "https://doi.org/10.1080/02673843.2019.1596823" },
    ],
  },
  "I-D1-009": {
    plain: "Staat het water gevaarlijk hoog?",
    why: "Hoogwater bedreigt huizen en bezit; de dreiging zelf, ook zonder ramp, veroorzaakt al angst en waakzaamheid.",
    reads: "We kijken naar de waterstanden van meetpunten van de Vlaamse Milieumaatschappij. Staan de hoogste punten ver boven de doorsnee, dan staat het water netbreed hoog.",
    unit: "hoogwater-index",
    dataSource: { name: "Waterinfo.be (VMM / HIC)", url: "https://www.waterinfo.be/" },
    references: [
      { label: "Fernandez et al. (2019): overstromingen en mentale gezondheid", url: "https://doi.org/10.1016/j.ijdrr.2019.101270" },
      { label: "WHO: factsheet overstromingen", url: "https://www.who.int/news-room/fact-sheets/detail/floods" },
    ],
  },
  "I-D1-010": {
    plain: "Hoeveel pollen zit er in de lucht?",
    why: "Hooikoorts verstoort slaap, concentratie en humeur bij heel veel mensen, een seizoensgebonden maar brede stressor.",
    reads: "We tellen voor Brussel hoeveel pollenkorrels van vijf plantensoorten in de lucht zweven: els, berk, gras, bijvoet en ambrosia. Meer korrels betekent meer niezen, jeuk en vermoeidheid.",
    unit: "pollenkorrels/m³",
    dataSource: { name: "open-meteo Air Quality (CAMS)", url: "https://open-meteo.com/" },
    references: [
      { label: "Damialis et al. (2019): pollen en welbevinden", url: "https://doi.org/10.1111/all.13758" },
      { label: "Copernicus: luchtkwaliteit en allergie", url: "https://atmosphere.copernicus.eu/" },
    ],
  },
  "I-D2-009": {
    plain: "Hoeveel treinen rijden er in de soep?",
    why: "Onaangekondigde spoorvertragingen ontnemen pendelaars de controle over hun tijd en aankomst, een directe dagelijkse stressor.",
    reads: "We tellen via de iRail-dienst hoeveel ongeplande storingen er nu op het Belgische spoornet zijn. Geplande werken tellen niet mee, want die ken je op voorhand.",
    unit: "aantal verstoringen",
    dataSource: { name: "iRail API (NMBS/Infrabel)", url: "https://api.irail.be/" },
    references: [
      { label: "Chatterjee et al. (2017): pendelen en welzijn", url: "https://doi.org/10.1016/j.trf.2017.08.002" },
      { label: "APA: controleverlies als stressbron", url: "https://www.apa.org/topics/stress" },
    ],
  },
  "I-D3-009": {
    plain: "Trekt België meer stroom dan verwacht?",
    why: "Een stroomnet dat boven de prognose draait is krapper; krapte voedt prijspieken en, zeldzaam, afschakelrisico, een sluimerende collectieve stressor.",
    reads: "Elia, de netbeheerder, voorspelt elke dag hoeveel stroom België zal verbruiken. Wij delen het echte verbruik door die voorspelling. 1,0 betekent precies zoals verwacht, hoger betekent een drukker net.",
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
