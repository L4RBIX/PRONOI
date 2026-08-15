"use client";

import { useRouter } from "next/navigation";
import type { RiskLevel } from "@/lib/pronoi/calc";
import { KZT } from "@/lib/pronoi/decisions";
import type { DecisionView } from "@/server/pronoi/decisions";
import { cn } from "@/lib/utils";

const STATUS: Record<RiskLevel, { label: string; dot: string; text: string }> = {
  critical: { label: "Act today", dot: "bg-red-500", text: "text-red-700" },
  medium: { label: "Order soon", dot: "bg-amber-500", text: "text-amber-700" },
  healthy: { label: "Healthy", dot: "bg-emerald-500", text: "text-emerald-700" },
};

export function InventoryTable({ decisions }: { decisions: DecisionView[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="text-left text-xs text-gray-400">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Daily demand</th>
            <th className="px-4 py-3 font-medium">Runway</th>
            <th className="px-4 py-3 font-medium">Stockout risk</th>
            <th className="px-4 py-3 font-medium">Revenue at risk</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => {
            const status = STATUS[d.riskLevel];
            return (
              <tr
                key={d.product.id}
                onClick={() => router.push(`/dashboard/decisions/${d.product.id}`)}
                className="cursor-pointer border-t border-black/5 transition-colors hover:bg-black/[0.025]"
              >
                <td className="px-4 py-3 font-medium text-black">{d.product.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {d.product.currentStock} {d.product.unit}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {d.product.avgDailyDemand} {d.product.unit}/day
                </td>
                <td className="px-4 py-3 text-gray-600">{d.daysUntilStockout.toFixed(1)} days</td>
                <td className="px-4 py-3 tabular-nums text-gray-600">{Math.round(d.stockoutRisk * 100)}%</td>
                <td className="px-4 py-3 text-gray-600">{KZT(d.revenueAtRisk)}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", status.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
