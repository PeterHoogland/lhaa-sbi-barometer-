import type { IndicatorState } from "../types";

export function stateLabel(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "rustiger dan gewoonlijk";
    case "normaal": return "gewoon";
    case "verhoogd": return "drukker dan gewoonlijk";
    case "extreem": return "uitzonderlijk druk";
    case "ontbreekt": return "geen data";
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
    case "ontbreekt": return "—";
  }
}
