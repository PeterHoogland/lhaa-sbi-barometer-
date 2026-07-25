/**
 * Belgische kalender — feestdagen, schoolvakanties, examenperiodes, fiscale deadlines.
 * Bron: doc 03_Laag-4 §2.4 + §2.6.
 *
 * Bevroren data 2024-2030. Bij update buiten dit venster: log een ontbrekende-data-vlag.
 */

/** Federale feestdagen — ISO YYYY-MM-DD. */
export const FEDERAL_HOLIDAYS: string[] = [
  // 2024
  "2024-01-01", "2024-04-01", "2024-05-01", "2024-05-09", "2024-05-20",
  "2024-07-21", "2024-08-15", "2024-11-01", "2024-11-11", "2024-12-25",
  // 2025
  "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-29", "2025-06-09",
  "2025-07-21", "2025-08-15", "2025-11-01", "2025-11-11", "2025-12-25",
  // 2026
  "2026-01-01", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25",
  "2026-07-21", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-25",
  // 2027
  "2027-01-01", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-17",
  "2027-07-21", "2027-08-15", "2027-11-01", "2027-11-11", "2027-12-25",
  // 2028
  "2028-01-01", "2028-04-17", "2028-05-01", "2028-05-25", "2028-06-05",
  "2028-07-21", "2028-08-15", "2028-11-01", "2028-11-11", "2028-12-25",
];

/** Schoolvakanties Vlaanderen, ranges [start, end] inclusief. */
export const VL_SCHOOL_HOLIDAYS: Array<{ start: string; end: string; name: string }> = [
  { start: "2024-10-28", end: "2024-11-03", name: "Herfstvakantie" },
  { start: "2024-12-23", end: "2025-01-05", name: "Kerstvakantie" },
  { start: "2025-02-24", end: "2025-03-02", name: "Krokusvakantie" },
  { start: "2025-04-07", end: "2025-04-20", name: "Paasvakantie" },
  { start: "2025-07-01", end: "2025-08-31", name: "Zomervakantie" },
  { start: "2025-10-27", end: "2025-11-02", name: "Herfstvakantie" },
  { start: "2025-12-22", end: "2026-01-04", name: "Kerstvakantie" },
  { start: "2026-02-16", end: "2026-02-22", name: "Krokusvakantie" },
  { start: "2026-04-06", end: "2026-04-19", name: "Paasvakantie" },
  { start: "2026-07-01", end: "2026-08-31", name: "Zomervakantie" },
  { start: "2026-10-26", end: "2026-11-01", name: "Herfstvakantie" },
  { start: "2026-12-21", end: "2027-01-03", name: "Kerstvakantie" },
  { start: "2027-02-15", end: "2027-02-21", name: "Krokusvakantie" },
  { start: "2027-03-29", end: "2027-04-11", name: "Paasvakantie" },
  { start: "2027-07-01", end: "2027-08-31", name: "Zomervakantie" },
];

/** Examenperiodes hoger onderwijs + CSE secundair. Doc 03 §2.6. */
export const EXAM_PERIODS: Array<{ start: string; end: string; level: "ho1" | "ho2" | "cse" }> = [
  { start: "2025-01-05", end: "2025-01-30", level: "ho1" },
  { start: "2025-05-19", end: "2025-06-14", level: "ho2" },
  { start: "2025-06-01", end: "2025-06-30", level: "cse" },
  { start: "2026-01-05", end: "2026-01-30", level: "ho1" },
  { start: "2026-05-19", end: "2026-06-14", level: "ho2" },
  { start: "2026-06-01", end: "2026-06-30", level: "cse" },
  { start: "2027-01-05", end: "2027-01-30", level: "ho1" },
  { start: "2027-05-19", end: "2027-06-14", level: "ho2" },
  { start: "2027-06-01", end: "2027-06-30", level: "cse" },
];

/** Belastingaangifte-weken (FOD Financiën — papieren + Tax-on-web aangifte). */
export const TAX_DEADLINE_WEEKS: Array<{ start: string; end: string }> = [
  // Aangifte typisch eind juni (papier) en mid-juli (digitaal)
  { start: "2025-06-23", end: "2025-07-15" },
  { start: "2026-06-22", end: "2026-07-15" },
  { start: "2027-06-21", end: "2027-07-15" },
];

/** DST-overgangen — laatste zondag maart + laatste zondag oktober. */
export const DST_TRANSITIONS: string[] = [
  "2024-03-31", "2024-10-27",
  "2025-03-30", "2025-10-26",
  "2026-03-29", "2026-10-25",
  "2027-03-28", "2027-10-31",
  "2028-03-26", "2028-10-29",
];
