/**
 * Bevroren registry van de 25 gescoorde indicatoren.
 * Bron: doc 02_Laag-3 §10 + doc 04_Laag-5 §3.2 (STL beslisregel)
 *       + doc 04_Laag-5 §5 (inverse-codering)
 */

import type { IndicatorMeta, IndicatorCode, DomainCode } from "../types.js";

export const INDICATORS: Record<IndicatorCode, IndicatorMeta> = {
  "I-D1-001": {
    code: "I-D1-001",
    name: "Daglichturen",
    domain: "D1",
    grade: "A",
    inverseCoded: true,
    applyStl: false,
    source: "Astronomisch (NOAA Solar Calculator-algoritme)",
    deterministic: true,
  },
  "I-D1-002": {
    code: "I-D1-002",
    name: "Hitte",
    domain: "D1",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "KMI/RMI Open Data",
    deterministic: false,
  },
  "I-D1-003": {
    code: "I-D1-003",
    name: "Kou",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: true,
    source: "KMI/RMI Open Data",
    deterministic: false,
  },
  "I-D1-004": {
    code: "I-D1-004",
    name: "Luchtkwaliteit",
    domain: "D1",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "IRCELINE (Belgisch luchtmeetnet, Brussel)",
    deterministic: false,
  },
  "I-D1-009": {
    code: "I-D1-009",
    name: "Wateroverlast",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "VMM Waterinfo.be + SPW Wallonië (dag-debiet, KiWIS)",
    deterministic: false,
  },
  "I-D1-010": {
    code: "I-D1-010",
    name: "Pollen",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    // Geen Belgische pollen-API beschikbaar (Sciensano AirAllergy = enkel een Drupal-
    // grafiek + PDF's, niet machine-leesbaar). Eerlijk gelabeld als Europees model.
    source: "Copernicus CAMS (Europees model — geen Belgische pollenmeting beschikbaar)",
    deterministic: false,
  },
  "I-D2-001": {
    code: "I-D2-001",
    name: "Filezwaarte",
    domain: "D2",
    grade: "A",
    inverseCoded: false,
    // Pad A v2 (YoY): we scoren de jaar-op-jaar % verandering van de officiële
    // filezwaarte, niet het niveau (een stijgende reeks maakt het niveau permanent
    // "extreem"). Geen sub-jaar-seizoen → geen STL.
    applyStl: false,
    source: "Vlaams Verkeerscentrum (Jaarrapport — filezwaarte, jaar-op-jaar % verandering)",
    deterministic: false,
  },
  "I-D2-004": {
    code: "I-D2-004",
    name: "Brandstofprijzen",
    domain: "D2",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "be.STAT + ECB ICP (brandstofprijs-index)",
    deterministic: false,
  },
  "I-D2-009": {
    code: "I-D2-009",
    name: "Treinverstoringen",
    domain: "D2",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "iRail API (NMBS/Infrabel)",
    deterministic: false,
  },
  "I-D3-001": {
    code: "I-D3-001",
    name: "Consumptieprijsindex",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "STATBEL CPI via ECB SDW",
    deterministic: false,
  },
  "I-D3-002": {
    code: "I-D3-002",
    name: "Energieprijzen",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: true,
    source: "ENTSO-E Transparency / Belpex",
    deterministic: false,
  },
  "I-D3-003": {
    code: "I-D3-003",
    name: "Aangekondigde collectieve ontslagen",
    domain: "D3",
    grade: "D", // werkloosheidsgraad-proxy ≠ aangekondigde ontslagen, geen echte feed (review §3) → uit het cijfer
    inverseCoded: false,
    applyStl: true,
    source: "ECB LFSI werkloosheidsrate-delta (proxy voor ontslagdruk)",
    deterministic: false,
  },
  "I-D3-005": {
    code: "I-D3-005",
    name: "Werkloosheidscijfer",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "Eurostat (BE werkloosheidsgraad)",
    deterministic: false,
  },
  "I-D3-006": {
    code: "I-D3-006",
    name: "Hypotheekrente",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "ECB MIR (BE hypotheekrente)",
    deterministic: false,
  },
  "I-D3-007": {
    code: "I-D3-007",
    name: "Consumentenvertrouwen",
    domain: "D3",
    grade: "B",
    // Hoog vertrouwen = LAGE stress → inverse-coded (een saldo onder het normale,
    // dus meer pessimisme, levert positieve stress). Amendement 2026-06 (Peter GO):
    // voorlopend enquête-sentiment, niet in de nieuws-laag → geen dubbeltelling.
    inverseCoded: true,
    // Bron is al seizoens-gecorrigeerd (s_adj=SA) → geen STL.
    applyStl: false,
    source: "Eurostat — EC consumentenvertrouwen BE (ei_bsco_m, BS-CSMCI)",
    deterministic: false,
  },
  "I-D3-009": {
    code: "I-D3-009",
    name: "Stroomnet-druk",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Elia Open Data",
    deterministic: false,
  },
  "I-D4-001": {
    code: "I-D4-001",
    name: "Kalendarische deadlinepieken",
    domain: "D4",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender FOD Financiën",
    deterministic: true,
  },
  "I-D4-002": {
    code: "I-D4-002",
    name: "Schoolvakantie-zonder-opvang",
    domain: "D4",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Vlaamse onderwijskalender",
    deterministic: true,
  },
  "I-D5-001": {
    code: "I-D5-001",
    name: "Nieuwsnegativiteits-index",
    domain: "D5",
    grade: "C", // BEWUSTE KEUZE Peter 2026-06-02: review §3.2 zette media-toon op D (mediatoon ≠ stress,
                // uit het cijfer). Peter overrulet dit expliciet en neemt het tóch mee in het cijfer → C
                // (gereduceerd gewicht in het evidence-schema). Blijft ook trigger. Zie build-status-memory.
    inverseCoded: false,
    // Geen STL: nieuwsnegativiteit is gebeurtenis-gedreven, niet sterk
    // seizoensgebonden. De echte GDELT 24m-baseline (data/history/I-D5-001.json)
    // dient rechtstreeks als MAD-Z-meetlat. De naïeve voorgaande-jaren-STL
    // produceert bovendien niet-vergelijkbare residuen tussen jaren.
    applyStl: false,
    source: "GDELT Project v2",
    deterministic: false,
  },
  "I-D5-002": {
    code: "I-D5-002",
    name: "Wikipedia-aandacht stress-thema's",
    domain: "D5",
    grade: "C", // BEWUSTE KEUZE Peter 2026-06-02: review §3.2 zette wikipedia-aandacht op D. Peter overrulet
                // dit en neemt het tóch mee in het cijfer → C (gereduceerd gewicht). Blijft ook trigger.
    inverseCoded: false,
    // Geen STL: het 7d-gemiddelde verwijdert al het weekdag-effect en de
    // baseline is een recent venster (~11 maanden, drift-gevoelige bron).
    applyStl: false,
    source: "Wikipedia-pageviews (Wikimedia REST API)",
    deterministic: false,
  },
  "I-D5-003": {
    code: "I-D5-003",
    name: "Negatieve collectieve gebeurtenissen",
    domain: "D5",
    grade: "A",
    inverseCoded: false,
    applyStl: false,
    source: "Nieuwsmonitoring + menselijke codering",
    deterministic: false,
  },
  "I-D6-001": {
    code: "I-D6-001",
    name: "Dagen tot volgende vakantie",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-002": {
    code: "I-D6-002",
    name: "Weekdag-cyclus",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-003": {
    code: "I-D6-003",
    name: "Klok-verzetten",
    domain: "D6",
    grade: "A",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-005": {
    code: "I-D6-005",
    name: "Examenperiode",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Academische kalender",
    deterministic: true,
  },
};

export const INDICATOR_CODES = Object.keys(INDICATORS) as IndicatorCode[];

export const DOMAIN_NAMES: Record<DomainCode, string> = {
  D1: "Omgeving & klimaat",
  D2: "Mobiliteit & ruimte",
  D3: "Economische conditie",
  D4: "Werk & belasting",
  D5: "Media & collectieve gebeurtenissen",
  D6: "Kalender & ritme",
};

export function indicatorsByDomain(domain: DomainCode): IndicatorMeta[] {
  return INDICATOR_CODES.map((c) => INDICATORS[c]).filter((m) => m.domain === domain);
}

export function allDomains(): DomainCode[] {
  return ["D1", "D2", "D3", "D4", "D5", "D6"];
}
