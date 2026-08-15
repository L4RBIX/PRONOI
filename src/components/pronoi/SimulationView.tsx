"use client";

import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { InventoryTrajectoryChart } from "@/components/pronoi/InventoryTrajectoryChart";
import { KZT } from "@/lib/pronoi/decisions";
import { runStressTestAction, runWeeklyComparisonAction } from "@/server/pronoi/actions";
import type { StressTestResult, WeeklyComparisonResult } from "@/server/pronoi/simulations";
import { cn } from "@/lib/utils";

const DEMAND_OPTIONS = [
  { label: "Normal", multiplier: 1 },
  { label: "+20%", multiplier: 1.2 },
  { label: "+40%", multiplier: 1.4 },
];

const SUPPLIER_OPTIONS = [
  { label: "On time", extraLeadTimeDays: 0, cancelled: false },
  { label: "+1 day", extraLeadTimeDays: 1, cancelled: false },
  { label: "+2 days", extraLeadTimeDays: 2, cancelled: false },
  { label: "Cancel delivery", extraLeadTimeDays: 0, cancelled: true },
];

const DEFAULT_STRESS = { demandMultiplier: 1, extraLeadTimeDays: 0, cancelled: false };

function ControlGroup<T extends { label: string }>({
  label,
  options,
  isActive,
  onSelect,
  disabled,
}: {
  label: string;
  options: T[];
  isActive: (option: T) => boolean;
  onSelect: (option: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
              isActive(option) ? "border-black bg-black text-white" : "border-black/10 text-gray-600 hover:bg-black/5"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface ProductOption {
  id: string;
  name: string;
  unit: string;
}

export function SimulationView({
  products,
  initialProductId,
  initialComparison,
}: {
  products: ProductOption[];
  initialProductId: string;
  initialComparison: WeeklyComparisonResult;
}) {
  const [productId, setProductId] = useState(initialProductId);
  const product = products.find((p) => p.id === productId) ?? products[0];
  const [comparison, setComparison] = useState(initialComparison);
  const [comparisonPending, startComparisonTransition] = useTransition();

  const [stress, setStress] = useState(DEFAULT_STRESS);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [stressPending, startStressTransition] = useTransition();
  const [recoveryApproved, setRecoveryApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDefaultStress = stress.demandMultiplier === 1 && stress.extraLeadTimeDays === 0 && !stress.cancelled;

  function handleProductChange(nextId: string) {
    setProductId(nextId);
    startComparisonTransition(async () => {
      const result = await runWeeklyComparisonAction(nextId);
      if (result.ok && result.data) setComparison(result.data);
    });
  }

  function applyStress(next: typeof stress) {
    setStress(next);
    setError(null);
    setRecoveryApproved(false);
    startStressTransition(async () => {
      const result = await runStressTestAction({ productId: "milk", ...next });
      if (!result.ok || !result.data) {
        setError(result.error?.message ?? "Couldn't run that scenario.");
        return;
      }
      setStressResult(result.data);
    });
  }

  function handleReset() {
    setStress(DEFAULT_STRESS);
    setStressResult(null);
    setRecoveryApproved(false);
    setError(null);
  }

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="font-heading text-4xl font-light">Simulation</h1>
        <p className="font-heading mt-3 max-w-lg text-3xl font-light text-balance">See the decision before you make it.</p>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-medium">Without PRONOI vs. with PRONOI</h2>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            disabled={comparisonPending}
            className="rounded-full border border-black/10 px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-black/5 p-6">
            <p className="text-sm text-gray-500">{comparison.baseline.strategy.label}</p>
            <div className="mt-4">
              <InventoryTrajectoryChart sim={comparison.baseline} variant="baseline" />
            </div>
            <div className="mt-2 flex items-baseline gap-6 border-t border-black/5 pt-4">
              <div>
                <p className="font-heading text-2xl font-light">{comparison.baseline.stockoutDays}</p>
                <p className="text-xs text-gray-500">stockout days</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-light">{KZT(comparison.baseline.totalRevenueLost)}</p>
                <p className="text-xs text-gray-500">revenue lost</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black bg-black p-6 text-white">
            <p className="text-sm text-white/50">With PRONOI</p>
            <div className="mt-4">
              <InventoryTrajectoryChart sim={comparison.pronoi} variant="pronoi" />
            </div>
            <div className="mt-2 flex items-baseline gap-6 border-t border-white/10 pt-4">
              <div>
                <p className="font-heading text-2xl font-light">{comparison.pronoi.stockoutDays}</p>
                <p className="text-xs text-white/50">stockout days</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-light">{KZT(comparison.pronoi.totalRevenueLost)}</p>
                <p className="text-xs text-white/50">revenue lost</p>
              </div>
            </div>
          </div>
        </div>

        {comparison.baseline.totalRevenueLost > comparison.pronoi.totalRevenueLost && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
            PRONOI prevented {comparison.baseline.stockoutDays - comparison.pronoi.stockoutDays} stockout day
            {comparison.baseline.stockoutDays - comparison.pronoi.stockoutDays !== 1 ? "s" : ""} and{" "}
            {KZT(comparison.baseline.totalRevenueLost - comparison.pronoi.totalRevenueLost)} in lost revenue, using the same{" "}
            {product.name.toLowerCase()} demand for both.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-medium">Stress test this plan</h2>
            <p className="mt-1 text-sm text-gray-600">
              Change demand and supplier reliability for Milk and watch PRONOI recompute the plan live.
            </p>
          </div>
          {!isDefaultStress && (
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-black/5"
            >
              Reset scenario
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <ControlGroup
            label="Demand"
            options={DEMAND_OPTIONS}
            disabled={stressPending}
            isActive={(o) => o.multiplier === stress.demandMultiplier}
            onSelect={(o) => applyStress({ ...stress, demandMultiplier: o.multiplier })}
          />
          <ControlGroup
            label="Supplier"
            options={SUPPLIER_OPTIONS}
            disabled={stressPending}
            isActive={(o) => o.cancelled === stress.cancelled && o.extraLeadTimeDays === stress.extraLeadTimeDays}
            onSelect={(o) => applyStress({ ...stress, extraLeadTimeDays: o.extraLeadTimeDays, cancelled: o.cancelled })}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {!isDefaultStress && stressResult && (
          <motion.div
            key={`${stress.demandMultiplier}-${stress.extraLeadTimeDays}-${stress.cancelled}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mt-8 space-y-6 border-t border-black/5 pt-6"
          >
            {stress.cancelled && (
              <div>
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  Supplier disruption detected
                </span>
                <p className="mt-2 text-sm text-gray-600">Primary supplier unavailable — without intervention:</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#F5F4F1] p-4">
                <p className="font-heading text-2xl font-light">{Math.round(stressResult.stockoutProbability * 100)}%</p>
                <p className="mt-1 text-xs text-gray-500">stockout risk</p>
              </div>
              <div className="rounded-2xl bg-[#F5F4F1] p-4">
                <p className="font-heading text-2xl font-light">{stressResult.daysUntilStockout.toFixed(1)} days</p>
                <p className="mt-1 text-xs text-gray-500">until stockout</p>
              </div>
              <div className="rounded-2xl bg-[#F5F4F1] p-4">
                <p className="font-heading text-2xl font-light">{KZT(stressResult.revenueAtRisk)}</p>
                <p className="mt-1 text-xs text-gray-500">revenue at risk</p>
              </div>
            </div>

            {stressResult.recoveryPlan && (
              <div>
                <h3 className="text-sm font-medium text-black">PRONOI recovery plan</h3>
                <div className="mt-3 space-y-2">
                  {stressResult.recoveryPlan.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-3 rounded-xl border border-black/5 px-4 py-3 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-medium text-white">
                        {i + 1}
                      </span>
                      <span className="flex-1">{step.label}</span>
                      <span className="text-gray-500">
                        {step.quantity} {product.unit} · {step.costLabel === "savings" ? `${KZT(step.cost)} savings` : `+${KZT(step.cost)}`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  This plan recovers{" "}
                  <span className="font-medium">{Math.round(stressResult.recoveryPlan.recoveredFractionOfGap * 100)}%</span> of the gap,
                  protecting {KZT(stressResult.recoveryPlan.revenueProtected)} in revenue.
                </p>
                <div className="mt-4">
                  {recoveryApproved ? (
                    <span className="text-sm font-medium text-emerald-700">✓ Recovery plan approved</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRecoveryApproved(true)}
                      className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85 active:scale-[0.98]"
                    >
                      Approve recovery plan
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
