/**
 * Context-bewuste tekstgenerator voor de barometer.
 * Bouwt headline + body uit DailyOutput.
 *
 * Taalregister: neutraal informerend, 15-jarig begripbaar.
 * Geen marketing-toon, geen "u/jij" attributies, geen klinische taal (doc 09).
 */
import type { DailyOutput, IndicatorBreakdown } from "../types";

export interface ExplainerContext {
  cn: number;
  percentile: number;
  daysInTier: number;
  elevatedCount: number;
  extremeCount: number;
  lowerCount: number;
  totalAvailable: number;
  topContributors: IndicatorBreakdown[];
  brandSafety: string;
  brandSafetyReason: string | null;
}

export function buildContext(data: DailyOutput): ExplainerContext {
  const breakdown = data.indicator_breakdown;
  const available = breakdown.filter((b) => b.state !== "ontbreekt");
  const elevated = available.filter((b) => b.state === "verhoogd" || b.state === "extreem");
  const extreme = available.filter((b) => b.state === "extreem");
  const lower = available.filter((b) => b.state === "rustig");
  const topContributors = [...available]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  return {
    cn: data.condition_level.value,
    percentile: data.percentile.short_24m,
    daysInTier: data.tier.days_in_tier,
    elevatedCount: elevated.length,
    extremeCount: extreme.length,
    lowerCount: lower.length,
    totalAvailable: available.length,
    topContributors,
    brandSafety: data.brand_safety.flag,
    brandSafetyReason: data.brand_safety.reason,
  };
}

/** Hoofdtitel boven het uitleg-blok. */
export function buildHeadline(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    return "Even op pauze.";
  }
  if (ctx.cn === 1) {
    if (ctx.percentile === 0) return "Stress-signalen staan vandaag historisch laag.";
    if (ctx.percentile < 20) return "Stress-signalen staan vandaag laag.";
    return "Vandaag is een gewone dag.";
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) return "Vandaag is een gewone dag.";
    if (ctx.elevatedCount === 1) return "Vandaag staat één signaal hoger dan gewoonlijk.";
    return `Vandaag staan ${ctx.elevatedCount} signalen iets boven gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `Al ${ctx.daysInTier} dagen op rij meerdere signalen hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 4) {
    return `Al ${ctx.daysInTier} dagen op rij in de top-10% van de laatste twee jaar.`;
  }
  return "Iets gevoeligs is gaande.";
}

/** Beschrijvende alinea onder de hoofdtitel. */
export function buildBody(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    const reason = ctx.brandSafetyReason ?? "gevoelige actuele gebeurtenis";
    return `Brand-safety-vlag actief vanwege ${reason}. De meting blijft lopen, maar commerciële boodschappen staan op pauze. Vandaag wegen ${ctx.elevatedCount} signalen hoger dan gewoonlijk mee.`;
  }

  if (ctx.cn === 1) {
    if (ctx.percentile === 0) {
      return `Geen van de ${ctx.totalAvailable} indicatoren staat hoger dan gewoonlijk. Sinds twee jaar zijn er geen kalmere dagen geregistreerd.`;
    }
    if (ctx.percentile < 30) {
      return `${ctx.lowerCount} signalen onder gemiddeld, geen enkele hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
    }
    return `Geen van de ${ctx.totalAvailable} indicatoren staat hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }

  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Niets bijzonders te melden. ${ctx.totalAvailable} signalen blijven binnen de gemiddelde zone.`;
    }
    const lead = describeTop(ctx.topContributors, 1);
    return `${lead} Voor banner-activatie zouden meerdere signalen tegelijk hoger moeten staan, drie dagen op rij.`;
  }

  if (ctx.cn === 3) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${lead} Sinds ${ctx.daysInTier} dagen op rij is dat zo. Banner-activatie loopt: statistisch een geschikt moment voor extra herstel.`;
  }

  if (ctx.cn === 4) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${ctx.extremeCount} signaal${ctx.extremeCount === 1 ? "" : "en"} ${ctx.extremeCount === 1 ? "staat" : "staan"} in de hoogste zone. ${lead} Banner-activatie verhoogd.`;
  }

  return "";
}

function describeTop(top: IndicatorBreakdown[], count: number): string {
  if (top.length === 0) return "";
  const names = top.slice(0, count).map((t) => `**${t.plain_name.toLowerCase()}**`);
  if (names.length === 1) return `Vooral ${names[0]} weegt vandaag mee.`;
  if (names.length === 2) return `Vooral ${names[0]} en ${names[1]} wegen vandaag mee.`;
  return `Vooral ${names[0]}, ${names[1]} en ${names[2]} wegen vandaag mee.`;
}

/** Korte context-zin voor onder het CN-cijfer (cn-secondary). */
export function buildPercentileLine(ctx: ExplainerContext): string {
  if (ctx.percentile === 0) {
    return "Lager dan elke andere dag van de afgelopen twee jaar.";
  }
  if (ctx.percentile === 100) {
    return "Hoger dan elke andere dag van de afgelopen twee jaar.";
  }
  if (ctx.percentile < 50) {
    return `Lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }
  return `Hoger dan op ${ctx.percentile}% van de afgelopen twee jaar.`;
}

/** Korte status-zin per CN, voor de cn-description in het CN-blok. */
export function buildCnDescription(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    const reason = ctx.brandSafetyReason ?? "actuele gevoelige situatie";
    return `Brand-safety-vlag actief (${reason}). Commerciële uitnodigingen opgeschort, meting blijft lopen.`;
  }
  if (ctx.cn === 1) {
    if (ctx.percentile === 0) {
      return `Alle ${ctx.totalAvailable} signalen onder of binnen gemiddeld. Historisch lage dag.`;
    }
    return `Geen van de ${ctx.totalAvailable} indicatoren hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Alle ${ctx.totalAvailable} signalen binnen gemiddeld.`;
    }
    return `${ctx.elevatedCount} signaal${ctx.elevatedCount === 1 ? "" : "en"} hoger dan gewoonlijk, ${ctx.totalAvailable - ctx.elevatedCount} binnen gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `${ctx.elevatedCount} van de ${ctx.totalAvailable} signalen hoger dan gewoonlijk, ${ctx.daysInTier} dagen op rij. Banner-activatie loopt.`;
  }
  if (ctx.cn === 4) {
    return `${ctx.elevatedCount} signalen hoger dan gewoonlijk, ${ctx.extremeCount} in de hoogste zone. Banner-activatie verhoogd.`;
  }
  return "";
}
