import { InventoryTable } from "@/components/pronoi/InventoryTable";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { getInventory } from "@/server/pronoi/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const business = await getCurrentDemoBusiness();
  const decisions = await getInventory(business.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-light">Inventory</h1>
        <p className="mt-2 max-w-xl text-gray-600">Every product, ranked by stockout risk — not alphabetically.</p>
      </div>

      <InventoryTable decisions={decisions} />
    </div>
  );
}
