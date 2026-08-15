import { getAllDecisions, KZT } from "@/lib/pronoi/decisions";

export function StatsBar() {
  const decisions = getAllDecisions();
  const totalRevenueAtRisk = decisions.reduce((sum, d) => sum + d.revenueAtRisk, 0);
  const needsAction = decisions.filter((d) => d.riskLevel !== "healthy").length;

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 border-t border-gray-200 px-6 py-12 md:flex-row md:items-center">
      <div className="flex gap-12">
        <div>
          <div className="font-[family-name:var(--font-heading)] text-4xl font-extralight text-black">
            {decisions.length}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            products monitored
            <br />
            for Mokka Coffee
          </p>
        </div>
        <div>
          <div className="font-[family-name:var(--font-heading)] text-4xl font-extralight text-black">
            {needsAction}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            decisions need
            <br />
            action today
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <p className="text-base italic text-gray-800 md:not-italic">
          &ldquo;{KZT(totalRevenueAtRisk)} in revenue is at risk across today&rsquo;s inventory — PRONOI surfaces it
          before the shelf goes empty, not after.&rdquo;
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700">
            MC
          </div>
          <div>
            <div className="text-sm font-medium text-black">Live from Mokka Coffee&rsquo;s demo data</div>
            <div className="text-xs text-gray-500">Recomputed on every page load, not hardcoded</div>
          </div>
        </div>
      </div>
    </section>
  );
}
