import { useState, type ReactNode } from "react";

/**
 * Losse uitklikbalk in exact dezelfde stijl als de ButtonPanels-rijen
 * (Peter 13/6): de blokken "Wat speelt vandaag het meest mee?" en
 * "Context - Niet in het cijfer" staan niet langer open op de pagina maar
 * achter zo'n balk, net als alles lager op de site. Hergebruikt de
 * bp-*-klassen zodat look en gedrag gegarandeerd identiek zijn.
 */
export function CollapseBar({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bp-row ${open ? "open" : ""}`}>
      <button className="bp-button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="bp-text">
          <span className="bp-label">{label}</span>
          {sub && <span className="bp-sub">{sub}</span>}
        </span>
        <span className="bp-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="bp-panel">{children}</div>}
    </div>
  );
}
