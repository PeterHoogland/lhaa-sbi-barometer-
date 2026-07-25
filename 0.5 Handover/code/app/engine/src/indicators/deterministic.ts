/**
 * Tier-A indicatoren: deterministisch, direct uitvoerbaar zonder externe data.
 * Bron: doc 03_Laag-4 §2.1, §2.4, §2.6.
 *
 * Geïmplementeerd:
 *  • I-D1-001 Daglichturen (NOAA Solar Calculator — Brussel 50.85°N, 4.35°E)
 *  • I-D4-001 Kalendarische deadlinepieken
 *  • I-D4-002 Schoolvakantie-zonder-opvang (weighted)
 *  • I-D6-001 Dagen tot volgende vakantie
 *  • I-D6-002 Weekdag-cyclus (cyclisch belastings-signaal ma-vr-cluster)
 *  • I-D6-003 Klok-verzetten (exp decay 7d)
 *  • I-D6-005 Examenperiode
 */

import {
  FEDERAL_HOLIDAYS,
  VL_SCHOOL_HOLIDAYS,
  EXAM_PERIODS,
  TAX_DEADLINE_WEEKS,
  DST_TRANSITIONS,
} from "../data/calendar-be.js";

// Brussel als geografische referentie — doc 03 §1.2
const BRUSSELS_LAT = 50.85;

/**
 * I-D1-001 — Daglichturen.
 * Doc 03 §2.1: uren tussen astronomische zonsopgang en zonsondergang op datum d.
 * Implementatie volgt NOAA Solar Position Algorithm (vereenvoudigd voor één breedtegraad).
 */
export function daylightHours(date: Date, latitude = BRUSSELS_LAT): number {
  const dayOfYear = computeDayOfYear(date);

  // Solar declination (Spencer 1971-formule, geldig binnen ±0.4°)
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const declRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = (latitude * Math.PI) / 180;
  const cosH = -Math.tan(latRad) * Math.tan(declRad);

  if (cosH > 1) return 0;   // poolnacht
  if (cosH < -1) return 24; // poolzomer

  const hourAngle = Math.acos(cosH);
  const daylight = (24 * hourAngle) / Math.PI;
  return Math.round(daylight * 10000) / 10000;
}

/**
 * I-D4-001 — Kalendarische deadlinepieken.
 * Doc 03 §2.4: +1 in belastingaangifte-week, +1 in kwartaaleinde-week, +2 in jaareinde-week.
 */
export function deadlinePeak(date: Date): number {
  const iso = toIsoDate(date);
  let score = 0;

  if (TAX_DEADLINE_WEEKS.some((w) => iso >= w.start && iso <= w.end)) score += 1;

  // Kwartaaleinde-week (laatste 7 dagen van mrt/jun/sep/dec)
  const m = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), m, 0)).getUTCDate();
  const isQuarterEnd = [3, 6, 9, 12].includes(m) && day > lastDay - 7;
  if (isQuarterEnd) score += 1;

  // Jaareinde-week
  if (m === 12 && day >= 25) score += 2;

  return Math.min(score, 3);
}

/**
 * I-D4-002 — Schoolvakantie-zonder-opvang, weighted.
 * Doc 03 §2.4: SH × (1 + duration_remaining/total_duration), 0 op zondag.
 */
export function schoolVacationWeighted(date: Date): number {
  if (date.getUTCDay() === 0) return 0;
  const iso = toIsoDate(date);
  const period = VL_SCHOOL_HOLIDAYS.find((p) => iso >= p.start && iso <= p.end);
  if (!period) return 0;

  const start = new Date(period.start + "T00:00:00Z").getTime();
  const end = new Date(period.end + "T00:00:00Z").getTime();
  const now = new Date(iso + "T00:00:00Z").getTime();
  const totalDays = (end - start) / 86400000 + 1;
  const remaining = (end - now) / 86400000 + 1;
  return 1 * (1 + remaining / totalDays);
}

/**
 * I-D6-001 — Dagen tot volgende vakantie (officiële feestdag of schoolvakantie).
 * Doc 03 §2.6.
 */
export function daysUntilNextVacation(date: Date): number {
  const iso = toIsoDate(date);
  const candidates: number[] = [];

  for (const h of FEDERAL_HOLIDAYS) {
    if (h >= iso) candidates.push(daysBetween(iso, h));
  }
  for (const v of VL_SCHOOL_HOLIDAYS) {
    if (v.start >= iso) candidates.push(daysBetween(iso, v.start));
  }
  if (candidates.length === 0) return 365;
  return Math.min(...candidates);
}

/**
 * I-D6-002 — Weekdag-cyclus.
 * Doc 03 §2.6: 6 dummies, zondag = referentie. We collapsen tot één continue
 * waarde 0-1 voor compositie: hoogste belasting di-do (klassiek Helliwell-patroon).
 */
export function weekdayLoad(date: Date): number {
  const dow = date.getUTCDay(); // 0=zo, 1=ma, ..., 6=za
  const pattern: Record<number, number> = {
    0: 0.0, // zondag — referentie
    1: 0.6, // maandag — opwarming
    2: 0.9, // dinsdag
    3: 1.0, // woensdag — piek
    4: 0.9, // donderdag
    5: 0.4, // vrijdag — afkoeling
    6: 0.1, // zaterdag
  };
  return pattern[dow];
}

/**
 * I-D6-003 — Klok-verzetten effect.
 * Doc 03 §2.6: exp(-(d - d_DST)/3) voor 0 ≤ (d - d_DST) ≤ 7.
 */
export function dstEffect(date: Date): number {
  const iso = toIsoDate(date);
  for (const transition of DST_TRANSITIONS) {
    if (transition <= iso) {
      const days = daysBetween(transition, iso);
      if (days >= 0 && days <= 7) return Math.exp(-days / 3);
    }
  }
  return 0;
}

/**
 * I-D6-005 — Examenperiode.
 * Doc 03 §2.6: binair voor 1e/2e examenperiode HO + CSE secundair.
 * Output: aantal overlappende periodes (0-3) — som geeft sterker signaal in
 * juni wanneer HO2 + CSE overlappen.
 */
export function examPeriod(date: Date): number {
  const iso = toIsoDate(date);
  return EXAM_PERIODS.filter((p) => iso >= p.start && iso <= p.end).length;
}

// --- helpers ---

function computeDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86400000) + 1;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00Z").getTime();
  const b = new Date(isoB + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

/** Bundel alle deterministische indicatoren voor één datum. */
export function computeAllDeterministic(date: Date): Record<string, number> {
  return {
    "I-D1-001": daylightHours(date),
    "I-D4-001": deadlinePeak(date),
    "I-D4-002": schoolVacationWeighted(date),
    "I-D6-001": daysUntilNextVacation(date),
    "I-D6-002": weekdayLoad(date),
    "I-D6-003": dstEffect(date),
    "I-D6-005": examPeriod(date),
  };
}
