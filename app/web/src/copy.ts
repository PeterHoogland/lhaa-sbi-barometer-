/**
 * Publieke copy in alpine register.
 * Voor lezers vanaf ~15 jaar. Geen jargon. Geen "u bent gestrest".
 * CTA mag voller Les Hautes Alpes-stem ademen, meet-secties blijven sober.
 */

export const TIER_HEADLINE = {
  green: "Vandaag is een gewone dag.",
  amber: "Vandaag komt er veel tegelijk op ons af.",
  red: "Vandaag staan veel signalen uitzonderlijk hoog.",
} as const;

export const TIER_SUBLINE = {
  green: "Geen verhoogde druk op de hele bevolking.",
  amber: "Verschillende stress-factoren staan vandaag samen aan.",
  red: "We zitten in de zwaarste 10% van de laatste twee jaar.",
} as const;

// Band-gebaseerde kop (volgt de dag-score, zoals de kicker en de meter-zones),
// zodat de status-tekst klopt met het getal bovenaan. Sinds het amendement van
// 2026-06-12 volgt de tier zelf óók de dagband (geen 3-dagen-geheugen meer),
// dus banden, kicker en banner zijn elke dag onderling consistent.
export type ScoreBand = "laag" | "gemiddeld" | "verhoogd" | "hoog";
export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return "hoog";
  if (score >= 70) return "verhoogd";
  if (score >= 50) return "gemiddeld";
  return "laag";
}
// Peter 14/6: relatieve (anomalie-)woordenschat, één register overal.
// Het cijfer is een percentiel ("hoe ongewoon is vandaag t.o.v. normaal"),
// dus relatieve woorden (verhoogd = hoger dan normaal) zijn correcter dan
// absolute (hoog). De mediaan (50) is het scharnier: onder = rustiger dan
// gewoonlijk, erboven = een gewone-tot-drukkere dag. "RUSTIG/NORMAAL" sluiten
// aan op de CN-namen (Rust/Normaal), "UITZONDERLIJK" op het indicator-woord.
// De interne bandsleutels (laag/gemiddeld/verhoogd/hoog) blijven ongewijzigd.
export const BAND_LABEL: Record<ScoreBand, string> = {
  laag: "RUSTIG",
  gemiddeld: "NORMAAL",
  verhoogd: "VERHOOGD",
  hoog: "UITZONDERLIJK",
};
export const BAND_HEADLINE: Record<ScoreBand, string> = {
  laag: "Vandaag is een rustige dag.",
  gemiddeld: "Vandaag is een gewone dag.",
  verhoogd: "Vandaag is het drukker dan gewoonlijk.",
  hoog: "Vandaag staan veel signalen uitzonderlijk hoog.",
};
export const BAND_SUBLINE: Record<ScoreBand, string> = {
  laag: "Lagere druk dan gewoonlijk voor deze tijd van het jaar.",
  gemiddeld: "Geen verhoogde druk op de hele bevolking.",
  verhoogd: "Meerdere stress-factoren staan verhoogd voor deze tijd van het jaar.",
  hoog: "We zitten in de zwaarste 10% van de vergelijkbare dagen.",
};
export const BAND_COLOR: Record<ScoreBand, "green" | "amber" | "red"> = {
  laag: "green",
  gemiddeld: "green",
  verhoogd: "amber",
  hoog: "red",
};

export const LES_HAUTES_ALPES_CTA = {
  green: null,
  amber: {
    headline: "Adem in. Adem uit.",
    body: "Wanneer de hele bevolking onder druk staat, weegt een paar dagen tussen de pieken extra zwaar. De Hautes-Alpes liggen op vier uur rijden. Lucht boven 1800 meter is anders.",
    action: "Ontdek de bestemmingen",
  },
  red: {
    headline: "Even uit de drukte stappen.",
    body: "Statistisch gezien is dit een goed moment om te kiezen voor stilte, hoogte en heldere lucht. Niet pas als het te laat is. Preventief, terwijl het kan.",
    action: "Ontdek de bestemmingen",
  },
} as const;

export const DEMO_BANNER = {
  label: "DEMO · TESTDATA, NIET VOOR BESLUITVORMING",
  message:
    "Een te groot deel van de meting draait vandaag nog op demo-data. Het cijfer hieronder is een testweergave, geen betrouwbare stand van het land.",
} as const;

export const BRAND_SAFETY_OVERRIDE = {
  elevated: "Er speelt iets gevoeligs vandaag. We zetten de commerciële boodschap even op pauze. De meting loopt door.",
  block: "Commerciële boodschappen zijn opgeschort. De teller blijft de huidige toestand registreren.",
} as const;

export const DOMAIN_LABELS = {
  D1: "Weer en lucht",
  D2: "Verkeer en verplaatsing",
  D3: "Economie",
  D4: "Werk en gezin",
  D5: "Nieuws en gebeurtenissen",
  D6: "Kalender",
} as const;

// Volgnummer per categorie (1-5) voor de publieke koppen "1. Weer en lucht" ...
// i.p.v. de interne domeincodes D1-D5 (Peter 17/6: geen "D" voor het cijfer).
export const DOMAIN_NUMBER: Record<string, number> = {
  D1: 1, D2: 2, D3: 3, D4: 4, D5: 5, D6: 6,
};

export const METHODOLOGY_DISCLAIMER = [
  "Dit is een teller voor heel België, niet voor jou persoonlijk.",
  "We meten dus geen mensen, we meten omstandigheden. We voorspellen niet wat morgen gaat gebeuren.",
] as const;

export const FOOTER_NOTES = {
  implementationStage: "Dagelijks automatisch bijgewerkt.",
  methodologyRef: "Methodologie: SBI, 21 gemeten indicatoren in 5 categorieën, plus kalendercontext.",
  ondersteunend: "Geïnspireerd door onderzoek van McEwen (allostatic load: een individueel concept, hier niet gemeten en niet de validatie van deze index), Marmot (sociale gezondheidsdeterminanten) en Hobfoll (conservation of resources).",
  tagline: "Natuurlijk in het hart van de Alpen.",
} as const;
