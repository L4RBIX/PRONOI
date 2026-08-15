"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { CausalChain } from "@/components/pronoi/CausalChain";
import { SupplierComparisonPanel } from "@/components/pronoi/SupplierComparisonPanel";
import { assessStockoutRisk } from "@/lib/pronoi/calc";
import { KZT } from "@/lib/pronoi/decisions";
import { approveDecisionAction, rejectDecisionAction } from "@/server/pronoi/actions";
import type { DecisionView } from "@/server/pronoi/decisions";
import { cn } from "@/lib/utils";

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  critical: { label: "Act today", className: "bg-red-100 text-red-700" },
  medium: { label: "Order soon", className: "bg-amber-100 text-amber-700" },
  healthy: { label: "Healthy — no action needed", className: "bg-emerald-100 text-emerald-700" },
};

export function DecisionDetailView({
  decision: initialDecision,
  autoFocusSuppliers,
}: {
  decision: DecisionView;
  autoFocusSuppliers?: boolean;
}) {
  const [decision] = useState(initialDecision);
  const [status, setStatus] = useState(initialDecision.status);
  const [poNumber, setPoNumber] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationSource, setExplanationSource] = useState<"deepseek" | "fallback" | null>(null);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simStock, setSimStock] = useState(decision.product.currentStock);
  const [emphasizeSuppliers, setEmphasizeSuppliers] = useState(false);
  const supplierSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFocusSuppliers) return;
    const scrollTimeout = setTimeout(() => {
      supplierSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setEmphasizeSuppliers(true);
    }, 350);
    const clearTimeout_ = setTimeout(() => setEmphasizeSuppliers(false), 3200);
    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(clearTimeout_);
    };
  }, [autoFocusSuppliers]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/deepseek/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: decision.product.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setExplanation(data.explanation);
        setExplanationSource(data.source);
      })
      .catch(() => {
        if (!cancelled) setExplanation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [decision.product.id]);

  const badge = RISK_BADGE[decision.riskLevel];
  const simRisk = assessStockoutRisk({
    currentStock: simStock,
    avgDailyDemand: decision.product.avgDailyDemand,
    demandStdDev: decision.product.demandStdDev,
    leadTimeDays: decision.product.leadTimeDays,
  });
  const recommendedSupplier = decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId);

  function handleApprove() {
    setActionError(null);
    startTransition(async () => {
      const result = await approveDecisionAction(decision.id);
      if (!result.ok || !result.data) {
        setActionError(result.error?.message ?? "Couldn't approve this purchase. Please try again.");
        return;
      }
      setStatus("APPROVED");
      setPoNumber(result.data.purchaseOrder.poNumber);
    });
  }

  function handleReject() {
    setActionError(null);
    startTransition(async () => {
      const result = await rejectDecisionAction(decision.id);
      if (!result.ok) {
        setActionError(result.error?.message ?? "Couldn't reject this decision. Please try again.");
        return;
      }
      setStatus("REJECTED");
    });
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <Link href="/dashboard/decisions" className="text-sm text-gray-500 hover:text-black">
          ← Decisions
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{decision.product.category}</p>
            <h1 className="font-heading text-4xl font-light">{decision.product.name}</h1>
          </div>
          <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", badge.className)}>{badge.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Stockout risk", value: `${Math.round(decision.stockoutRisk * 100)}%` },
          { label: "Current stock", value: `${decision.product.currentStock} ${decision.product.unit}` },
          { label: "Estimated runway", value: `${decision.daysUntilStockout.toFixed(1)} days` },
          { label: "Revenue at risk", value: KZT(decision.revenueAtRisk) },
        ].map((tile) => (
          <div key={tile.label} className="rounded-2xl bg-[#F5F4F1] p-4">
            <p className="font-heading text-2xl font-light">{tile.value}</p>
            <p className="mt-1 text-xs text-gray-500">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
        <p className="font-heading text-2xl font-medium text-balance">
          {decision.riskLevel === "healthy"
            ? `No action needed — ${decision.product.name} is well stocked.`
            : `Order ${decision.recommendedQty} ${decision.product.unit} from ${recommendedSupplier?.supplier.name ?? "a supplier"} today.`}
        </p>

        {status === "PENDING" && decision.riskLevel !== "healthy" && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleApprove}
              type="button"
              disabled={isPending}
              className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? "Working…" : "Approve purchase"}
            </button>
            <button
              onClick={() => setSimulateOpen((v) => !v)}
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Simulate
            </button>
            <button
              onClick={handleReject}
              type="button"
              disabled={isPending}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-60"
            >
              Reject
            </button>
            {actionError && <span className="text-sm text-red-600">{actionError}</span>}
          </div>
        )}

        {status === "APPROVED" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            ✓ Purchase approved{poNumber ? ` — ${poNumber}` : ""}.{" "}
            <Link href="/dashboard/orders" className="underline underline-offset-2">
              Track in Orders
            </Link>
          </motion.div>
        )}

        {status === "REJECTED" && (
          <div className="mt-6 rounded-2xl bg-gray-100 p-4 text-sm text-gray-600">
            Recommendation dismissed. PRONOI will keep watching {decision.product.name}.
          </div>
        )}

        {simulateOpen && (
          <div className="mt-6 rounded-2xl border border-black/5 bg-[#F5F4F1] p-5">
            <label className="block text-sm">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-gray-600">What if current stock were...</span>
                <span className="font-medium">
                  {simStock} {decision.product.unit}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(1, Math.round(decision.product.avgDailyDemand * decision.product.leadTimeDays * 3))}
                value={simStock}
                onChange={(e) => setSimStock(Number(e.target.value))}
                className="w-full accent-black"
              />
            </label>
            <p className="mt-3 text-sm text-gray-700">
              Stockout risk would be <span className="font-medium">{Math.round(simRisk.stockoutProbability * 100)}%</span>.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
        <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Why PRONOI recommends this</h2>
        <div className="mt-4">
          <CausalChain decision={decision} />
        </div>
        {explanation && (
          <p className="mt-6 border-t border-black/5 pt-5 text-sm text-gray-500 italic">
            &ldquo;{explanation}&rdquo;
            {explanationSource === "fallback" && (
              <span className="ml-2 text-xs text-gray-400 not-italic">(built-in explanation — DeepSeek unavailable)</span>
            )}
          </p>
        )}
      </div>

      <div ref={supplierSectionRef} className="scroll-mt-8">
        <h2 className="font-heading mb-4 text-xl font-light">Supplier comparison</h2>
        <SupplierComparisonPanel decision={decision} emphasize={emphasizeSuppliers} />
      </div>
    </div>
  );
}
