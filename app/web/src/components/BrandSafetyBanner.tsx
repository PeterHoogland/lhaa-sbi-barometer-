import type { DailyOutput } from "../types";
import { BRAND_SAFETY_OVERRIDE } from "../copy";

export function BrandSafetyBanner({ brandSafety }: { brandSafety: DailyOutput["brand_safety"] }) {
  if (brandSafety.flag === "normal") return null;
  const msg =
    brandSafety.flag === "elevated"
      ? BRAND_SAFETY_OVERRIDE.elevated
      : BRAND_SAFETY_OVERRIDE.block;

  return (
    <div className={`brand-safety brand-safety-${brandSafety.flag}`} role="status">
      <div className="bs-label">BRAND-SAFETY-VLAG · {brandSafety.flag.toUpperCase()}</div>
      <p className="bs-message">{msg}</p>
      {brandSafety.reason && <p className="bs-reason">Reden: {brandSafety.reason}</p>}
    </div>
  );
}
