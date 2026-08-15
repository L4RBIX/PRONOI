import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/pronoi/calc";
import { KZT } from "@/lib/pronoi/decisions";
import type { DecisionView } from "@/server/pronoi/decisions";

const RISK_STYLES: Record<RiskLevel, { badge: string; label: string }> = {
  critical: { badge: "bg-red-100 text-red-700", label: "Act today" },
  medium: { badge: "bg-amber-100 text-amber-700", label: "Order soon" },
  healthy: { badge: "bg-emerald-100 text-emerald-700", label: "Healthy" },
};

export function DecisionCard({ decision }: { decision: DecisionView }) {
  const style = RISK_STYLES[decision.riskLevel];
  const recommendedSupplier = decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId);

  return (
    <Link
      href={`/dashboard/decisions/${decision.product.id}`}
      className="block rounded-3xl border border-black/5 bg-[#F5F4F1] p-6 transition-colors hover:bg-black/[0.04]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">{decision.product.category}</p>
          <h3 className="font-heading text-2xl font-medium">{decision.product.name}</h3>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", style.badge)}>{style.label}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-6">
        <div>
          <p className="font-heading text-2xl font-light">{Math.round(decision.stockoutRisk * 100)}%</p>
          <p className="text-xs text-gray-500">stockout risk</p>
        </div>
        <div>
          <p className="font-heading text-2xl font-light">{KZT(decision.revenueAtRisk)}</p>
          <p className="text-xs text-gray-500">revenue at risk</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-700">
        {decision.riskLevel === "healthy"
          ? `Well stocked — projected to last ${decision.daysUntilStockout.toFixed(0)} more days. No action needed.`
          : `Order ${decision.recommendedQty} ${decision.product.unit} from ${recommendedSupplier?.supplier.name ?? "a supplier"}.`}
      </p>
    </Link>
  );
}
