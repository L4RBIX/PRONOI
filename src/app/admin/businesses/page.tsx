import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getBusinessesOverview } from "@/server/admin/businesses";

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage() {
  const businesses = await getBusinessesOverview();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Businesses" description="Every tenant PRONOI serves — an inspection view, not a CRM." />

      <div className="overflow-x-auto rounded-2xl border border-black/5">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Open decisions</th>
              <th className="px-4 py-3 font-medium">Active orders</th>
              <th className="px-4 py-3 font-medium">Pooling</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id} className="cursor-pointer border-t border-black/5 transition-colors hover:bg-black/[0.025]">
                <td className="px-4 py-3 font-medium text-black">
                  <Link href={`/admin/businesses/${b.id}`} className="hover:underline">
                    {b.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{b.businessType ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{b.city}</td>
                <td className="px-4 py-3 text-gray-600">{b.productCount}</td>
                <td className="px-4 py-3 text-gray-600">{b.openDecisions}</td>
                <td className="px-4 py-3 text-gray-600">{b.activeOrders}</td>
                <td className="px-4 py-3 text-gray-600">{b.poolingParticipation}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
