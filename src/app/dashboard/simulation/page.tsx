import { SimulationView } from "@/components/pronoi/SimulationView";
import { prisma } from "@/server/db";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { runWeeklyComparison } from "@/server/pronoi/simulations";

export const dynamic = "force-dynamic";

export default async function SimulationPage() {
  const business = await getCurrentDemoBusiness();
  const products = await prisma.product.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } });
  const initialProductId = "milk";
  const initialComparison = await runWeeklyComparison(business.id, initialProductId);

  return (
    <SimulationView
      products={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
      initialProductId={initialProductId}
      initialComparison={initialComparison}
    />
  );
}
