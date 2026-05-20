/**
 * Custom logo-mark voor de Les Hautes Alpes barometer.
 * Geïnspireerd op hun visuele identiteit (vierkant cartouche, berg, zon)
 * zonder hun officiële logo te kopiëren — eigen creatie, brand-veilig.
 */
export function LHALogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Les Hautes Alpes mark"
    >
      <rect width="64" height="64" rx="6" fill="currentColor" />
      <circle cx="32" cy="22" r="5.5" fill="#f5b454" />
      <path d="M6 56 L22 26 L32 42 L42 22 L58 56 Z" fill="#ffffff" />
      <path
        d="M22 26 L32 42 L42 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

/** Bredere variant met merknaam ernaast. */
export function LHALogoLarge() {
  return (
    <div className="lha-logo-large">
      <LHALogo size={56} />
      <div className="lha-logo-text">
        <div className="lha-logo-name">LES HAUTES ALPES</div>
        <div className="lha-logo-tagline">Natuurlijk in het hart van de Alpen</div>
      </div>
    </div>
  );
}
