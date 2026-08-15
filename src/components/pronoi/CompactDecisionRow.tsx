import Link from "next/link";
import type { DecisionView } from "@/server/pronoi/decisions";
import { cn } from "@/lib/utils";

/** Short timing label driven by real runway, not a hardcoded phrase per product. */
export function orderTimingLabel(decision: DecisionView): string {
  const days = decision.daysUntilStockout;
  if (decision.riskLevel === "critical" || days <= 1) return "Act today";
  if (days <= 3) return "Order soon";
  if (days <= 10) return `Order in ~${Math.round(days)} days`;
  return "Monitor";
}

export function CompactDecisionRow({ decision }: { decision: DecisionView }) {
  return (
    <Link
      href={`/dashboard/decisions/${decision.product.id}`}
      className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-black/[0.03]"
    >
      <span className="font-medium text-black">{decision.product.name}</span>
      <span className="flex items-center gap-3 text-gray-500">
        <span
          className={cn(
            "tabular-nums",
            decision.riskLevel === "critical" && "text-red-600",
            decision.riskLevel === "medium" && "text-amber-600"
          )}
        >
          {Math.round(decision.stockoutRisk * 100)}% risk
        </span>
        <span className="hidden text-gray-300 sm:inline">·</span>
        <span className="hidden sm:inline">{orderTimingLabel(decision)}</span>
      </span>
    </Link>
  );
}

export function HealthyDecisionChip({ decision }: { decision: DecisionView }) {
  return (
    <Link
      href={`/dashboard/decisions/${decision.product.id}`}
      className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-black/[0.03] hover:text-black"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {decision.product.name}
      <span className="text-gray-400">· {Math.round(decision.daysUntilStockout)}d cover</span>
    </Link>
  );
}
