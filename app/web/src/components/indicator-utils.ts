import type { EvidenceGrade, IndicatorState } from "../types";

/**
 * Bewijskracht-labels (B8). De grade beschrijft de sterkte van het onderzoek
 * achter een indicator, niet zijn gewicht in het hoofdcijfer: het publieke
 * cijfer gebruikt gelijke domeingewichten; alleen het parallelle bewijs-gewogen
 * controleschema weegt op grade. D telt nergens mee en staat niet in de lijst.
 */
export const GRADE_LABELS: Record<EvidenceGrade, string> = {
  A: "sterk onderzoek",
  B: "consistent onderzoek",
  C: "indirect bewijs",
  D: "diagnostisch",
};

export const GRADE_EXPLAINER: Record<EvidenceGrade, string> = {
  A: "Sterk: herhaald onderzoek dat dit verband direct ondersteunt.",
  B: "Goed: consistent onderzoek, vooral via welzijn en gezondheid.",
  C: "Beperkt: indirect bewijs; de bron meet niet rechtstreeks stress of druk.",
  D: "Diagnostisch: meet iets anders dan druk en telt niet mee in het cijfer.",
};

export function stateLabel(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "lager dan gewoonlijk";
    case "normaal": return "gemiddeld";
    case "verhoogd": return "hoger dan gewoonlijk";
    case "extreem": return "uitzonderlijk hoog";
    case "ontbreekt": return "geen uitschieter";
  }
}

/**
 * Inverse-coded indicatoren (consumentenvertrouwen, daglicht): hoge stress = LAGE
 * onderliggende waarde. Het badge moet de richting van de METING tonen, niet van de
 * stress — anders leest "Consumentenvertrouwen: uitzonderlijk hoog" terwijl het
 * vertrouwen juist laag is. De kleur blijft op stress (rood = stressvol).
 */
export function stateLabelFor(s: IndicatorState, inverseCoded?: boolean): string {
  if (!inverseCoded) return stateLabel(s);
  switch (s) {
    case "rustig": return "hoger dan gewoonlijk";
    case "normaal": return "gemiddeld";
    case "verhoogd": return "lager dan gewoonlijk";
    case "extreem": return "uitzonderlijk laag";
    case "ontbreekt": return "geen uitschieter";
  }
}

export function stateColor(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "var(--c-green)";
    case "normaal": return "var(--c-ink-mute)";
    case "verhoogd": return "var(--c-amber)";
    case "extreem": return "var(--c-red)";
    case "ontbreekt": return "var(--c-ink-mute)";
  }
}

export function stateIcon(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "○";
    case "normaal": return "●";
    case "verhoogd": return "▲";
    case "extreem": return "▲▲";
    case "ontbreekt": return "·";
  }
}
