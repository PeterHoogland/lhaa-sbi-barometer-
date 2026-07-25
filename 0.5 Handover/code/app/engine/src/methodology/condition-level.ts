/**
 * Conditie-Niveau (CN) — publieke 5-bands-schaal voor banner-activatie.
 *
 * Geen nieuwe pre-geregistreerde drempel — dit is een DERIVED publieke
 * vertaling van de bestaande tier + percentile + brand-safety logica
 * (doc 00 §8, doc 06 §3, doc 06 §7). Niet vrij wijzigbaar zonder doc 08.
 *
 * Regels:
 *   CN 5  brand-safety flag = elevated | block          (banner OFF, override)
 *   CN 4  tier = red       (P≥90 sustained 3d)          (banner aan, verhoogd)
 *   CN 3  tier = amber     (P 70-89 sustained 3d)       (banner aan, standaard)
 *   CN 2  tier = green & 50 ≤ P < 70                    (banner uit)
 *   CN 1  tier = green & P < 50                          (banner uit)
 *
 * Belangrijk: CN 5 staat hiërarchisch BOVEN CN 4 — het is geen "hogere stress"
 * maar een banner-override-modus bij gevoelige actualiteit.
 */

import type { Tier, BrandSafety } from "../types.js";

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

export interface ConditionState {
  level: ConditionLevel;
  name: string;
  bannerActive: boolean;
  copyKey: "rust" | "normaal" | "venster_opent" | "conditie_piek" | "brand_safety";
}

export const CONDITION_NAMES: Record<ConditionLevel, string> = {
  1: "Rust",
  2: "Normaal",
  3: "Venster opent",
  4: "Conditie-piek",
  5: "Brand-safety actief",
};

export function computeConditionLevel(
  tier: Tier,
  percentile: number,
  brandSafety: BrandSafety,
): ConditionState {
  // CN 5 override — onafhankelijk van tier
  if (brandSafety === "elevated" || brandSafety === "block") {
    return { level: 5, name: CONDITION_NAMES[5], bannerActive: false, copyKey: "brand_safety" };
  }

  if (tier === "red") {
    return { level: 4, name: CONDITION_NAMES[4], bannerActive: true, copyKey: "conditie_piek" };
  }

  if (tier === "amber") {
    return { level: 3, name: CONDITION_NAMES[3], bannerActive: true, copyKey: "venster_opent" };
  }

  // green
  if (percentile >= 50) {
    return { level: 2, name: CONDITION_NAMES[2], bannerActive: false, copyKey: "normaal" };
  }
  return { level: 1, name: CONDITION_NAMES[1], bannerActive: false, copyKey: "rust" };
}
