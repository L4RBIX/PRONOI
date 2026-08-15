import { PoolingView } from "@/components/pronoi/PoolingView";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { getPoolingOpportunities } from "@/server/pronoi/pooling";

export const dynamic = "force-dynamic";

export default async function PoolingPage() {
  const business = await getCurrentDemoBusiness();
  const opportunities = await getPoolingOpportunities(business.id);

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-heading text-4xl font-light">Demand Pooling</h1>
        <p className="font-heading mt-3 max-w-lg text-3xl font-light text-balance">
          Buy like a chain. Even when you&rsquo;re independent.
        </p>
        <p className="mt-3 max-w-lg text-gray-600">
          PRONOI detects when nearby businesses need the same product and combines their purchasing power.
        </p>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
          No pooling opportunities open right now.
        </div>
      ) : (
        opportunities.map((opp) => <PoolingView key={opp.id} opportunity={opp} />)
      )}

      <p className="text-xs text-gray-500">
        Pooled pricing is tiered by combined volume: 5% off at 50+ units, 9% off at 100+, 14% off at 200+ — computed
        from the combined quantity above, not a flat discount.
      </p>
    </div>
  );
}
