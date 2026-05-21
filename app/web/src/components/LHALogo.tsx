/**
 * Officieel Hautes-Alpes logo — witte wordmark, bedoeld voor een
 * donkere achtergrond (groene header / footer).
 * Bestand: app/web/public/hautes-alpes-logo.png
 */
export function LHALogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/hautes-alpes-logo.png"
      alt="Hautes-Alpes"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: "auto" }}
    />
  );
}
