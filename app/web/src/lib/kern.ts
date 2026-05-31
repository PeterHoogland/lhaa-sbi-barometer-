/**
 * SBI v0.4 — de 10 kern-indicatoren (de "kern", in het cijfer en in triggers).
 * Bron: SBI_v04_programmeerrichtlijn §1.
 *
 * "Weer (hitte/koude/storm)" telt conceptueel als één kern, maar bestaat in
 * de code uit twee aparte indicatoren (hitte + koude). Beide blijven kern.
 */
export const KERN_INDICATOR_CODES: string[] = [
  "I-D5-001", // negatief nieuws (toon) — ⚡ direct
  "I-D2-001", // verkeer & ongevallen — ⚡ direct
  "I-D5-003", // oorlog / grote gebeurtenis — ⚡ direct
  "I-D5-002", // stress-zoekgedrag (Wikipedia) — ⚡ direct
  "I-D1-002", // hitte — 🔆 snel  (deel van "weer"-cluster)
  "I-D1-003", // koude — 🔆 snel  (deel van "weer"-cluster)
  "I-D3-002", // energieprijs — 🔆 snel
  "I-D2-004", // brandstofprijs — 🐢 traag
  "I-D3-001", // inflatie — 🐢 traag
];
// Op codeniveau zijn dat 9; conceptueel 10 kern-indicatoren ("weer" = één).
// De twee secundaire kern-signalen uit v0.4 (I-D3-003S ontslag-radar en
// I-D5-006S sociaal sentiment) leven nog in `secondary_signals[]` tot de
// engine-herbouw in fase 2.

export const KERN_COUNT_CONCEPTUEEL = 10;

export function isKern(code: string): boolean {
  return KERN_INDICATOR_CODES.includes(code);
}

/**
 * Wetenschappelijke bronnen die de SBI als geheel onderbouwen
 * (uit het v0.4-document, los van de per-indicator-referenties).
 */
export const SBI_FOUNDATIONS: Array<{ label: string; url?: string }> = [
  {
    label:
      "McEwen, B. — Allostatic load: cumulatieve fysiologische last als stressmaat. Basis van de SBI.",
  },
  {
    label:
      "Marin et al. (2012), PLoS ONE — negatief nieuws verhoogt de fysiologische stressreactiviteit.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3468453/",
  },
  {
    label:
      "Mayo Clinic Press (2024) — herhaalde nieuws-blootstelling en cortisol.",
    url: "https://mcpress.mayoclinic.org/mental-health/how-the-news-rewires-your-brain/",
  },
  {
    label:
      "UEA / Understanding Society (2022) — energie- en brandstofarmoede tasten welzijn aan.",
    url: "https://www.understandingsociety.ac.uk/news/2022/02/04/high-fuel-prices-affect-mental-and-physical-health/",
  },
  {
    label:
      "Nature Energy (2023) — de energieprijscrisis en gevolgen voor huishoudens.",
    url: "https://www.nature.com/articles/s41560-023-01209-8",
  },
  {
    label:
      "BMC Public Health (2024) — subjectieve financiële onzekerheid als sterke stressdeterminant.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11668040/",
  },
  {
    label: "Marmot — sociale gezondheidsdeterminanten (basis indicator-selectie).",
  },
  {
    label: "Hobfoll — Conservation of Resources (basis voor reikwijdte-weging).",
  },
  {
    label:
      "Young, L. & Soroka, S. (2012), Political Communication — Lexicoder Sentiment Dictionary, methodologische basis voor nieuwstoon-meting.",
    url: "https://doi.org/10.1080/10584609.2012.671234",
  },
  {
    label:
      "Soroka, Fournier & Nir (2019), PNAS — negativity bias in psychofysiologische reactie op nieuws.",
    url: "https://doi.org/10.1073/pnas.1908369116",
  },
  {
    label: "Leetaru, K. (2013) — GDELT Global Knowledge Graph (data-bron nieuwstoon).",
    url: "https://www.gdeltproject.org/",
  },
  {
    label:
      "Generous et al. (2014), PLoS Comp. Biol. — Wikipedia-pageviews als digital-epidemiologie-proxy.",
    url: "https://doi.org/10.1371/journal.pcbi.1003892",
  },
  {
    label:
      "Lazer et al. (2014), Science — parable of Google Flu (waarschuwing bij zoekdata).",
    url: "https://doi.org/10.1126/science.1248506",
  },
];
