import { CompactDecisionRow, HealthyDecisionChip } from "@/components/pronoi/CompactDecisionRow";
import { HeroDecisionCard } from "@/components/pronoi/HeroDecisionCard";
import { ScrollReveal } from "@/components/sites/handhold-io-1ee60dfc/shared/ScrollReveal";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { getAllCurrentDecisions } from "@/server/pronoi/decisions";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const business = await getCurrentDemoBusiness();
  const decisions = await getAllCurrentDecisions(business.id);
  const hero = decisions[0];
  const heroNeedsAttention = hero.riskLevel !== "healthy";
  const comingNext = decisions.slice(1).filter((d) => d.riskLevel !== "healthy");
  const healthy = decisions.filter((d) => d.riskLevel === "healthy" && d.product.id !== hero.product.id);
  const attentionCount = decisions.filter((d) => d.riskLevel !== "healthy").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-gray-500">
          {business.name} · {business.city}
        </p>
        <h1 className="font-heading mt-1 text-4xl font-light">Good morning.</h1>
        <p className="mt-2 max-w-xl text-gray-600">
          {attentionCount > 0
            ? `${attentionCount} decision${attentionCount > 1 ? "s need" : " needs"} your attention today.`
            : "Nothing urgent today — PRONOI is still watching."}
        </p>
      </div>

      {heroNeedsAttention ? (
        <ScrollReveal distance={12} duration={0.4}>
          <HeroDecisionCard decision={hero} />
        </ScrollReveal>
      ) : (
        <div className="rounded-3xl border border-black/5 bg-[#F5F4F1] p-8 text-center sm:p-10">
          <p className="font-heading text-2xl font-light">Everything is well stocked.</p>
          <p className="mt-1.5 text-sm text-gray-600">
            {hero.product.name} has the tightest runway today, at {Math.round(hero.daysUntilStockout)} days of cover — no action needed.
          </p>
        </div>
      )}

      {comingNext.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-500">Coming next</h2>
          <div className="rounded-2xl border border-black/5">
            {comingNext.map((d, i) => (
              <div key={d.product.id} className={i > 0 ? "border-t border-black/5" : undefined}>
                <CompactDecisionRow decision={d} />
              </div>
            ))}
          </div>
        </div>
      )}

      {healthy.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-500">Everything else looks healthy</h2>
          <div className="flex flex-wrap gap-2">
            {healthy.map((d) => (
              <HealthyDecisionChip key={d.product.id} decision={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
