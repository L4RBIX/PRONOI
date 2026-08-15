import type { WeekSimulation } from "@/lib/pronoi/simulate";

const WIDTH = 600;
const HEIGHT = 180;
const PAD_X = 16;
const PAD_TOP = 34;
const PAD_BOTTOM = 24;

export function InventoryTrajectoryChart({ sim, variant }: { sim: WeekSimulation; variant: "baseline" | "pronoi" }) {
  const maxStock = Math.max(...sim.days.map((d) => Math.max(d.stockStart, d.stockEnd)), 1);
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const plotW = WIDTH - PAD_X * 2;
  const n = sim.days.length;
  const xFor = (i: number) => PAD_X + (i / (n - 1)) * plotW;
  const yFor = (v: number) => PAD_TOP + plotH - (v / maxStock) * plotH;

  const points = sim.days.map((d, i) => ({ x: xFor(i), y: yFor(d.stockEnd), day: d }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const floorY = (PAD_TOP + plotH).toFixed(1);
  const areaPath = `${linePath} L ${points[n - 1].x.toFixed(1)} ${floorY} L ${points[0].x.toFixed(1)} ${floorY} Z`;

  const stroke = variant === "pronoi" ? "#000000" : "#9ca3af";
  const fill = variant === "pronoi" ? "rgba(0,0,0,0.06)" : "rgba(156,163,175,0.14)";

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={`${sim.strategy.label} inventory trajectory`}>
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        const stockout = p.day.shortfallUnits > 0;
        const arrived = p.day.orderArrivedToday;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={stockout ? 3.5 : 2.5} fill={stockout ? "#dc2626" : stroke} />
            {stockout && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" className="fill-red-600 text-[8.5px] font-medium tracking-wide uppercase">
                Stockout
              </text>
            )}
            {arrived && !stockout && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" className="fill-emerald-700 text-[8.5px] font-medium tracking-wide uppercase">
                Order arrives
              </text>
            )}
            <text x={p.x} y={HEIGHT - 6} textAnchor="middle" className="fill-gray-400 text-[9px]">
              D{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
