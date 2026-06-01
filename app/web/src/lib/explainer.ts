/**
 * Context-bewuste tekstgenerator voor de barometer.
 * Bouwt headline + body uit DailyOutput.
 *
 * "Kern wordt de kop" (2026-06): de publieke kop draait nu op de v0.4-KERN.
 * De CN (1-5) komt DIRECT uit het kern-percentiel (instant) — geen sustained-
 * na-ijling, dus de kop kan niet "verhoogd" tonen op een historisch kalme dag.
 * De v0.2-24-indicatoren-meting blijft als fallback wanneer er geen v04-blok is.
 *
 * Taalregister: neutraal informerend, 15-jarig begripbaar. Geen "u/jij", geen
 * klinische taal (doc 09).
 */
import type { DailyOutput, IndicatorBreakdown, IndicatorState, KernBreakdown } from "../types";

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

/** v0.4-kop: CN 1-5 direct uit het kern-percentiel (instant, geen na-ijling). */
function v04ConditionLevel(percentile: number, brandSafety: string): number {
  if (brandSafety !== "normal") return 5;
  if (percentile >= 90) return 4; // rood — uitzonderlijk
  if (percentile >= 60) return 3; // oranje — verhoogd
  if (percentile >= 40) return 2; // gemiddeld
  return 1; // laag
}

function kernStateToV02(s: KernBreakdown["state"]): IndicatorState {
  if (s === "rood") return "extreem";
  if (s === "verhoogd") return "verhoogd";
  if (s === "ontbreekt") return "ontbreekt";
  return "normaal";
}

/**
 * Verrijk een kern-indicator met de v0.2-velden (why/reads/references) via code-match,
 * zodat de bestaande UI-componenten (TopInfluences) er ongewijzigd mee werken.
 */
export function enrichKern(k: KernBreakdown, v02: IndicatorBreakdown[]): IndicatorBreakdown {
  const base = v02.find((b) => b.code === k.code);
  return {
    code: k.code,
    domain: k.domain,
    plain_name: k.plain_name,
    why: base?.why ?? "",
    reads: base?.reads ?? "",
    unit: base?.unit ?? "",
    raw_value: k.raw_value,
    z_short: k.z_lang,
    contribution: k.contribution_meting,
    state: kernStateToV02(k.state),
    source: base?.source ?? k.data_source.name,
    simulated: k.simulated,
    data_source: k.data_source,
    references: base?.references ?? [],
    observation_date: k.observation_date,
    demographic_reach: base?.demographic_reach ?? 0,
    reach_rationale: base?.reach_rationale ?? "",
  };
}

export function buildContext(data: DailyOutput): ExplainerContext {
  if (data.v04) return buildContextV04(data, data.v04);
  return buildContextV02(data);
}

/** Kern als hoofd-meting (de publieke kop). */
function buildContextV04(data: DailyOutput, v04: NonNullable<DailyOutput["v04"]>): ExplainerContext {
  const kern = v04.kern_breakdown;
  const available = kern.filter((k) => k.state !== "ontbreekt");
  const elevated = available.filter((k) => k.state === "verhoogd" || k.state === "rood");
  const extreme = available.filter((k) => k.state === "rood");
  const lower = available.filter((k) => (k.percentile_lang ?? 50) < 40);
  const topContributors = [...available]
    .sort((a, b) => Math.abs(b.contribution_meting) - Math.abs(a.contribution_meting))
    .slice(0, 3)
    .map((k) => enrichKern(k, data.indicator_breakdown));
  return {
    cn: v04ConditionLevel(v04.percentile.lang, data.brand_safety.flag),
    percentile: v04.percentile.lang,
    daysInTier: v04.tier.days_in_tier,
    elevatedCount: elevated.length,
    extremeCount: extreme.length,
    lowerCount: lower.length,
    totalAvailable: available.length,
    topContributors,
    brandSafety: data.brand_safety.flag,
    brandSafetyReason: data.brand_safety.reason,
  };
}

/** Fallback: de oorspronkelijke v0.2-24-indicatoren-meting. */
function buildContextV02(data: DailyOutput): ExplainerContext {
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
    return "Meerdere kern-signalen staan hoger dan gewoonlijk.";
  }
  if (ctx.cn === 4) {
    return "De kern-meting staat in de top van de laatste twee jaar.";
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
      return `Geen van de ${ctx.totalAvailable} kern-signalen staat hoger dan gewoonlijk. Sinds twee jaar zijn er geen kalmere dagen geregistreerd.`;
    }
    if (ctx.percentile < 30) {
      return `${ctx.lowerCount} signalen onder gemiddeld, geen enkele hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
    }
    return `Geen van de ${ctx.totalAvailable} kern-signalen staat hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }

  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Niets bijzonders te melden. De ${ctx.totalAvailable} kern-signalen blijven binnen de gemiddelde zone.`;
    }
    const lead = describeTop(ctx.topContributors, 1);
    return `${lead} Voor banner-activatie zouden meerdere signalen tegelijk hoger moeten staan.`;
  }

  if (ctx.cn === 3) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${ctx.elevatedCount} van de ${ctx.totalAvailable} kern-signalen staan hoger dan gewoonlijk. ${lead} Statistisch een geschikt moment voor extra herstel.`;
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
      return `Alle ${ctx.totalAvailable} kern-signalen onder of binnen gemiddeld. Historisch lage dag.`;
    }
    return `Geen van de ${ctx.totalAvailable} kern-signalen hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Alle ${ctx.totalAvailable} kern-signalen binnen gemiddeld.`;
    }
    return `${ctx.elevatedCount} signaal${ctx.elevatedCount === 1 ? "" : "en"} hoger dan gewoonlijk, ${ctx.totalAvailable - ctx.elevatedCount} binnen gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `${ctx.elevatedCount} van de ${ctx.totalAvailable} kern-signalen hoger dan gewoonlijk. Banner-activatie loopt.`;
  }
  if (ctx.cn === 4) {
    return `${ctx.elevatedCount} signalen hoger dan gewoonlijk, ${ctx.extremeCount} in de hoogste zone. Banner-activatie verhoogd.`;
  }
  return "";
}
