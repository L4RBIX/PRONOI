import { KZT } from "@/lib/pronoi/decisions";
import type { DecisionView } from "@/server/pronoi/decisions";
import { cn } from "@/lib/utils";

export function SupplierComparisonPanel({ decision, emphasize }: { decision: DecisionView; emphasize?: boolean }) {
  if (decision.supplierScores.length === 0) {
    return <p className="text-sm text-gray-500">No suppliers quote this product yet.</p>;
  }

  const recommended = decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId) ?? decision.supplierScores[0];
  const cheapest = [...decision.supplierScores].sort((a, b) => a.supplier.pricePerUnit - b.supplier.pricePerUnit)[0];
  const worstToBest = [...decision.supplierScores].sort((a, b) => b.totalExpectedCost - a.totalExpectedCost);
  const showInsight = cheapest.supplier.id !== recommended.supplier.id;
  const priceSavings = recommended.purchaseCost - cheapest.purchaseCost;
  const extraRisk = cheapest.totalExpectedCost - recommended.totalExpectedCost;

  return (
    <div>
      <div className="space-y-3">
        {worstToBest.map((s) => {
          const isRecommended = s.supplier.id === recommended.supplier.id;
          const isCheapest = s.supplier.id === cheapest.supplier.id;
          return (
            <div
              key={s.supplier.id}
              className={cn(
                "rounded-2xl border p-5 transition-all duration-700",
                isRecommended ? "border-black bg-black text-white" : "border-black/10 bg-white",
                emphasize && isRecommended && "ring-4 ring-emerald-400/50",
                emphasize && isCheapest && !isRecommended && "ring-4 ring-amber-400/50"
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  {(isRecommended || isCheapest) && (
                    <p className={cn("text-xs font-medium tracking-wide uppercase", isRecommended ? "text-white/50" : "text-gray-400")}>
                      {isRecommended ? "Recommended" : "Cheapest"}
                    </p>
                  )}
                  <p className="font-heading text-xl font-medium">{s.supplier.name}</p>
                </div>
                <p className={cn("text-sm", isRecommended ? "text-white/70" : "text-gray-500")}>
                  ₸{s.supplier.pricePerUnit}/{decision.product.unit} · {Math.round(s.supplier.onTimeRate * 100)}% on-time
                </p>
              </div>

              <div
                className={cn(
                  "mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-sm",
                  isRecommended ? "border-white/10" : "border-black/5"
                )}
              >
                <div>
                  <p className={cn("font-heading font-medium", isRecommended ? "text-white" : "text-black")}>
                    {KZT(s.purchaseCost)}
                  </p>
                  <p className={cn("text-xs", isRecommended ? "text-white/50" : "text-gray-500")}>Purchase</p>
                </div>
                <div>
                  <p className={cn("font-heading font-medium", isRecommended ? "text-white" : "text-black")}>
                    {KZT(s.expectedDelayCost)}
                  </p>
                  <p className={cn("text-xs", isRecommended ? "text-white/50" : "text-gray-500")}>Expected delay cost</p>
                </div>
                <div>
                  <p className={cn("font-heading text-lg font-medium", isRecommended ? "text-white" : "text-black")}>
                    {KZT(s.totalExpectedCost)}
                  </p>
                  <p className={cn("text-xs", isRecommended ? "text-white/50" : "text-gray-500")}>Total expected cost</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showInsight && (
        <p className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          {cheapest.supplier.name} saves {KZT(priceSavings)} on purchase price, but creates {KZT(extraRisk)} more expected risk.
        </p>
      )}
    </div>
  );
}
