import Link from "next/link";
import { KZT } from "@/lib/pronoi/decisions";
import { ORDER_STATUS_LABELS } from "@/lib/pronoi/orderStatus";
import { getBusinessDetail } from "@/server/admin/businesses";

export const dynamic = "force-dynamic";

export default async function AdminBusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business, decisions, orders, pools, rules } = await getBusinessDetail(id);

  const riskyCount = decisions.filter((d) => d.riskLevel !== "healthy").length;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link href="/admin/businesses" className="text-sm text-gray-500 hover:text-black">
          ← Businesses
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{business.businessType ?? "Unclassified"}</p>
            <h1 className="font-heading text-4xl font-light">{business.name}</h1>
            <p className="mt-1 text-gray-600">{business.city}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Products", value: String(decisions.length) },
          { label: "At-risk products", value: String(riskyCount) },
          { label: "Active orders", value: String(orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length) },
          { label: "Pooling participation", value: String(pools.filter((p) => p.joined).length) },
        ].map((tile) => (
          <div key={tile.label} className="rounded-2xl bg-[#F5F4F1] p-4">
            <p className="font-heading text-2xl font-light">{tile.value}</p>
            <p className="mt-1 text-xs text-gray-500">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
        <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Inventory summary</h2>
        <div className="mt-4 space-y-2">
          {decisions.map((d) => (
            <div key={d.id} className="flex items-center justify-between border-t border-black/5 py-2 text-sm first:border-t-0 first:pt-0">
              <span className="font-medium text-black">{d.product.name}</span>
              <span className="text-gray-500">
                {d.product.currentStock} {d.product.unit} on hand · {Math.round(d.stockoutRisk * 100)}% risk · {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
        <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No purchase orders yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {orders.slice(0, 8).map((o) => (
              <div key={o.id} className="flex items-center justify-between border-t border-black/5 py-2 text-sm first:border-t-0 first:pt-0">
                <span className="font-medium text-black">{o.poNumber}</span>
                <span className="text-gray-500">
                  {o.items[0]?.quantity} {o.items[0]?.product.unit} {o.items[0]?.product.name} · {ORDER_STATUS_LABELS[o.status]} · {KZT(o.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
        <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Assigned rule set</h2>
        {rules.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No active rules match this business&rsquo;s type.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-t border-black/5 py-2 text-sm first:border-t-0 first:pt-0">
                <span className="font-medium text-black">{r.name}</span>
                <span className="text-gray-500">
                  {r.category} · risk &gt; {Math.round(r.stockoutRiskThreshold * 100)}% · service level {Math.round(r.targetServiceLevel * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
