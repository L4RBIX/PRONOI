import Link from "next/link";
import { MetricTile } from "@/components/admin/AdminUi";
import { prisma } from "@/server/db";
import { getPlatformActivity, getPlatformOverview } from "@/server/admin/analytics";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [overview, activity, categoryCount, ruleCount, businessTypeCount, regionCount] = await Promise.all([
    getPlatformOverview(),
    getPlatformActivity(10),
    prisma.productCategory.count(),
    prisma.autoOrderRule.count(),
    prisma.businessType.count(),
    prisma.region.count(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-4xl font-light">PRONOI Admin</h1>
        <p className="mt-2 max-w-xl text-gray-600">Platform-wide configuration and scale, across every business PRONOI serves.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Active businesses" value={String(overview.activeBusinesses)} />
        <MetricTile label="Products monitored" value={String(overview.productsMonitored)} />
        <MetricTile label="Active suppliers" value={String(overview.activeSuppliers)} />
        <MetricTile label="Purchase orders created" value={String(overview.purchaseOrdersCreated)} />
        <MetricTile label="Avg. stockout risk" value={`${overview.avgStockoutRiskPercent}%`} />
        <MetricTile label="Avg. pooling savings" value={`${overview.avgPoolingSavingsPercent}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Platform activity</h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 border-t border-black/5 pt-3 text-sm first:border-t-0 first:pt-0">
                  <span className="text-gray-800">{item.text}</span>
                  <span className="shrink-0 text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
          <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Platform configuration</h2>
          <div className="mt-4 space-y-1">
            <ConfigRow href="/admin/categories" label="Product categories" count={categoryCount} />
            <ConfigRow href="/admin/rules" label="Auto-order rules" count={ruleCount} />
            <ConfigRow href="/admin/business-types" label="Business profiles" count={businessTypeCount} />
            <ConfigRow href="/admin/regions" label="Regions" count={regionCount} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-black/5">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-400">{count}</span>
    </Link>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
