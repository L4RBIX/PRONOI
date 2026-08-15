"use client";

import { Fragment, useState } from "react";
import type { SupplierIndexRow } from "@/server/pronoi/suppliers";
import { cn } from "@/lib/utils";

function reliabilityLabel(onTimeRate: number): string {
  if (onTimeRate >= 0.95) return "Excellent";
  if (onTimeRate >= 0.85) return "Good";
  return "Fair";
}

export function SuppliersTable({ suppliers }: { suppliers: SupplierIndexRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs text-gray-400">
          <tr>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">Products</th>
            <th className="px-4 py-3 font-medium">Avg. price</th>
            <th className="px-4 py-3 font-medium">On-time rate</th>
            <th className="px-4 py-3 font-medium">Orders</th>
            <th className="px-4 py-3 font-medium">Reliability</th>
            <th className="px-4 py-3 font-medium">PRONOI status</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => {
            const isExpanded = expanded === supplier.id;
            return (
              <Fragment key={supplier.id}>
                <tr
                  onClick={() => setExpanded(isExpanded ? null : supplier.id)}
                  className="cursor-pointer border-t border-black/5 transition-colors hover:bg-black/[0.025]"
                >
                  <td className="px-4 py-3 font-medium text-black">{supplier.name}</td>
                  <td className="px-4 py-3 text-gray-600">{supplier.products.length}</td>
                  <td className="px-4 py-3 text-gray-600">
                    ₸{Math.round(supplier.products.reduce((s, p) => s + p.pricePerUnit, 0) / supplier.products.length)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{Math.round(supplier.avgOnTimeRate * 100)}%</td>
                  <td className="px-4 py-3 text-gray-600">{supplier.orderCount}</td>
                  <td className="px-4 py-3 text-gray-600">{reliabilityLabel(supplier.avgOnTimeRate)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium", supplier.recommendedCount > 0 ? "text-emerald-700" : "text-gray-400")}>
                      {supplier.recommendedCount > 0 ? `Preferred for ${supplier.recommendedCount}` : "Not preferred"}
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-t border-black/5 bg-[#F5F4F1]/60">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                        {supplier.products.map((p) => (
                          <div key={p.productId} className="flex items-center gap-2">
                            <span className={cn("font-medium", p.recommended ? "text-black" : "text-gray-500")}>{p.productName}</span>
                            <span className="text-gray-400">
                              ₸{p.pricePerUnit}/{p.unit} · {Math.round(p.onTimeRate * 100)}%
                            </span>
                            {p.recommended && <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">Recommended</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
