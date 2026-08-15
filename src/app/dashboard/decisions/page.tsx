import { DecisionCard } from "@/components/pronoi/DecisionCard";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { getAllCurrentDecisions } from "@/server/pronoi/decisions";

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const business = await getCurrentDemoBusiness();
  const decisions = await getAllCurrentDecisions(business.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-light">Decisions</h1>
        <p className="mt-2 max-w-xl text-gray-600">
          Every product PRONOI is watching, ranked by stockout risk — highest first.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {decisions.map((d) => (
          <DecisionCard key={d.product.id} decision={d} />
        ))}
      </div>
    </div>
  );
}
