import { MetricTile } from "@/components/admin/AdminUi";
import { KZT } from "@/lib/pronoi/decisions";
import { ORDER_STATUS_LABELS } from "@/lib/pronoi/orderStatus";
import { getPlatformAnalytics, getPlatformOverview } from "@/server/admin/analytics";

export const dynamic = "force-dynamic";

function Bar({ label, value, max, formatValue }: { label: string; value: number; max: number; formatValue: (v: number) => string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-black">{formatValue(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-black" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const [overview, analytics] = await Promise.all([getPlatformOverview(), getPlatformAnalytics()]);

  const maxBusinessType = Math.max(1, ...analytics.businessesByType.map((b) => b.count));
  const maxCategory = Math.max(1, ...analytics.categoriesByUsage.map((c) => c.productCount));
  const maxStatus = Math.max(1, ...analytics.purchaseOrdersByStatus.map((s) => s.count));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-4xl font-light">Analytics</h1>
        <p className="mt-2 max-w-xl text-gray-600">Platform scale and impact, computed from real structured demo data.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label="Active businesses" value={String(overview.activeBusinesses)} />
        <MetricTile label="Purchase orders created" value={String(overview.purchaseOrdersCreated)} />
        <MetricTile label="Avg. supplier on-time rate" value={`${analytics.avgSupplierOnTimeRatePercent}%`} />
        <MetricTile label="Avg. order lead time" value={`${analytics.avgOrderLeadTimeDays} days`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricTile
          label="Simulated stockout losses avoided"
          value={KZT(analytics.simulatedStockoutLossesAvoided)}
          sublabel="Demo simulation — from recorded weekly comparison runs, not real historical outcomes"
        />
        <MetricTile
          label="Pooled purchase savings"
          value={KZT(analytics.pooledPurchaseSavings)}
          sublabel="Demo simulation — from current open pooling opportunities"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/5 p-6">
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Businesses by type</h2>
          <div className="mt-4 space-y-3">
            {analytics.businessesByType.length === 0 ? (
              <p className="text-sm text-gray-500">No businesses yet.</p>
            ) : (
              analytics.businessesByType.map((b) => <Bar key={b.type} label={b.type} value={b.count} max={maxBusinessType} formatValue={(v) => String(v)} />)
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 p-6">
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Most monitored categories</h2>
          <div className="mt-4 space-y-3">
            {analytics.categoriesByUsage.map((c) => (
              <Bar key={c.category} label={c.category} value={c.productCount} max={maxCategory} formatValue={(v) => String(v)} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 p-6">
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Orders by status</h2>
          <div className="mt-4 space-y-3">
            {analytics.purchaseOrdersByStatus.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              analytics.purchaseOrdersByStatus.map((s) => (
                <Bar
                  key={s.status}
                  label={ORDER_STATUS_LABELS[s.status as keyof typeof ORDER_STATUS_LABELS] ?? s.status}
                  value={s.count}
                  max={maxStatus}
                  formatValue={(v) => String(v)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
