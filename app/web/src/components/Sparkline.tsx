import type { SparklinePoint } from "../types";

const W = 720;
const H = 200;
const PAD = { top: 20, right: 12, bottom: 28, left: 36 };

/**
 * Per dag het PUBLIEKE HOOFDCIJFER (hybride dagkop, §4.1.14). Records van vóór
 * 0.4.0 missen daily_pressure; dan valt de grafiek terug op het oude percentiel
 * (alleen relevant in het korte overgangsvenster vóór de eerste 0.4.0-CI-run).
 */
function val(p: SparklinePoint): number {
  return p.daily_pressure ?? p.percentile;
}
function band(v: number): "red" | "amber" | "green" {
  return v >= 90 ? "red" : v >= 70 ? "amber" : "green";
}

export function Sparkline({ points }: { points: SparklinePoint[] }) {
  if (points.length < 2) return <div className="muted">Onvoldoende data voor sparkline.</div>;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / 100) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(val(p)).toFixed(1)}`)
    .join(" ");

  // Drempel-lijnen (absolute schaal: verhoogd vanaf 70, uitzonderlijk vanaf 90)
  const y70 = y(70);
  const y90 = y(90);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" role="img" aria-label="60-daags verloop van het hoofdcijfer">
      {/* Achtergrond-banden */}
      <rect x={PAD.left} y={y90} width={innerW} height={Math.max(0, PAD.top + innerH - y90)} className="band-red" />
      <rect x={PAD.left} y={y70} width={innerW} height={y90 - y70} className="band-amber" />
      <rect x={PAD.left} y={PAD.top} width={innerW} height={y70 - PAD.top} className="band-green" />

      {/* Drempels */}
      <line x1={PAD.left} y1={y70} x2={W - PAD.right} y2={y70} className="threshold-line" />
      <line x1={PAD.left} y1={y90} x2={W - PAD.right} y2={y90} className="threshold-line" />
      <text x={W - PAD.right - 4} y={y70 - 4} className="threshold-label" textAnchor="end">verhoogd</text>
      <text x={W - PAD.right - 4} y={y90 - 4} className="threshold-label" textAnchor="end">uitzonderlijk</text>

      {/* Y-as labels */}
      <text x={PAD.left - 8} y={PAD.top + 4} className="axis-label" textAnchor="end">100</text>
      <text x={PAD.left - 8} y={PAD.top + innerH + 4} className="axis-label" textAnchor="end">0</text>

      {/* Lijn */}
      <path d={path} className="spark-path" fill="none" />

      {/* Punten */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(val(p))}
          r={i === points.length - 1 ? 4 : 1.5}
          className={`spark-dot dot-${band(val(p))}`}
        >
          <title>{`${p.date}: ${Math.round(val(p))}/100`}</title>
        </circle>
      ))}

      {/* X-as eerste/laatste */}
      <text x={PAD.left} y={H - 8} className="axis-label" textAnchor="start">{points[0].date}</text>
      <text x={W - PAD.right} y={H - 8} className="axis-label" textAnchor="end">{points[points.length - 1].date}</text>
    </svg>
  );
}
