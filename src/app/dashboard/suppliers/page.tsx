import { SuppliersTable } from "@/components/pronoi/SuppliersTable";
import { KZT } from "@/lib/pronoi/decisions";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { findPriceVsCostExample, getSuppliersIndex } from "@/server/pronoi/suppliers";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const business = await getCurrentDemoBusiness();
  const [suppliers, priceVsCost] = await Promise.all([
    getSuppliersIndex(business.id),
    findPriceVsCostExample(business.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-light">Suppliers</h1>
        <p className="mt-2 max-w-xl text-gray-600">PRONOI ranks suppliers by expected total cost — not price alone.</p>
      </div>

      {priceVsCost && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          Lowest price ≠ lowest cost. {priceVsCost.cheapest.supplier.name} is cheapest per {priceVsCost.product.unit} for{" "}
          {priceVsCost.product.name.toLowerCase()}, but its expected total cost ({KZT(priceVsCost.cheapest.totalExpectedCost)}) runs
          higher than {priceVsCost.recommended.supplier.name}&rsquo;s ({KZT(priceVsCost.recommended.totalExpectedCost)}) once delivery
          risk is priced in.
        </p>
      )}

      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
