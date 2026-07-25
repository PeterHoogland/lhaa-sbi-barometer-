/**
 * Berg-silhouet divider — gebruikt als visuele scheiding tussen secties.
 * Lichte en donkere variant.
 */

export function MountainDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={`mountain-divider ${inverted ? "inverted" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path
          d="M0,80 L0,55 L120,30 L200,50 L300,15 L380,35 L460,20 L540,40 L640,8 L740,32 L820,18 L920,45 L1020,25 L1100,42 L1200,30 L1200,80 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/** Kleine berg-icoon voor inline gebruik. */
export function MountainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 21 L9 10 L13 16 L16 12 L21 21 Z" />
      <circle cx="17" cy="6" r="2.5" />
    </svg>
  );
}
