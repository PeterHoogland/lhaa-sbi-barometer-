/**
 * Publieke copy in alpine register.
 * Voor lezers vanaf ~15 jaar. Geen jargon. Geen "u bent gestrest".
 * CTA mag voller Les Hautes Alpes-stem ademen, meet-secties blijven sober.
 */

export const TIER_HEADLINE = {
  green: "Vandaag is een gewone dag.",
  amber: "Vandaag komt er veel tegelijk op ons af.",
  red: "Vandaag is uitzonderlijk druk.",
} as const;

export const TIER_SUBLINE = {
  green: "Geen verhoogde druk op de hele bevolking.",
  amber: "Verschillende stress-factoren staan samen aan, al drie dagen of langer.",
  red: "We zitten in de zwaarste 10% van de laatste twee jaar.",
} as const;

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

export const BRAND_SAFETY_OVERRIDE = {
  elevated: "Er speelt iets gevoeligs vandaag. We zetten de commerciële boodschap even op pauze. De meting loopt door.",
  block: "Commerciële boodschappen zijn opgeschort. De teller blijft de huidige toestand registreren.",
} as const;

export const DOMAIN_LABELS = {
  D1: "Weer & lucht",
  D2: "Verkeer & verplaatsingen",
  D3: "Economie",
  D4: "Werk & gezin",
  D5: "Nieuws & gebeurtenissen",
  D6: "Kalender",
} as const;

export const METHODOLOGY_DISCLAIMER = [
  "Dit is een teller voor het hele land, niet voor jou persoonlijk. We kijken naar 20 dingen die de hele bevolking onder druk kunnen zetten en tellen hoe ongewoon ze vandaag zijn.",
  "We meten dus geen mensen, we meten omstandigheden. We zijn geen dokter. We voorspellen niet wat morgen gaat gebeuren. Het is geen wetenschappelijke studie, het is gemaakt met onderzoek dat anderen al gedaan hebben.",
] as const;

export const FOOTER_NOTES = {
  implementationStage: "Werkt nu nog in test-modus.",
  methodologyRef: "Methodologie: SBI v0.2, 20 indicatoren in 6 categorieën.",
  ondersteunend: "Gebaseerd op onderzoek van McEwen (allostatic load), Marmot (sociale gezondheids-determinanten) en Hobfoll (conservation of resources).",
  tagline: "Natuurlijk in het hart van de Alpen.",
} as const;
