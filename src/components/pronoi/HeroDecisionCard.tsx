"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { KZT } from "@/lib/pronoi/decisions";
import { approveDecisionAction } from "@/server/pronoi/actions";
import type { DecisionView } from "@/server/pronoi/decisions";
import { cn } from "@/lib/utils";

const BADGE_BY_RISK: Record<DecisionView["riskLevel"], { label: string; className: string }> = {
  critical: { label: "Act today", className: "bg-red-500/15 text-red-400" },
  medium: { label: "Order soon", className: "bg-amber-500/15 text-amber-400" },
  healthy: { label: "Healthy", className: "bg-emerald-500/15 text-emerald-400" },
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-2xl font-light text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-white/50">{label}</p>
    </div>
  );
}

export function HeroDecisionCard({ decision }: { decision: DecisionView }) {
  const [status, setStatus] = useState(decision.status);
  const [poNumber, setPoNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const badge = BADGE_BY_RISK[decision.riskLevel];
  const recommendedSupplier = decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveDecisionAction(decision.id);
      if (!result.ok || !result.data) {
        setError(result.error?.message ?? "Couldn't approve this purchase. Please try again.");
        return;
      }
      setStatus("APPROVED");
      setPoNumber(result.data.purchaseOrder.poNumber);
    });
  }

  return (
    <div className="rounded-3xl bg-black p-7 text-white sm:p-9">
      <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase", badge.className)}>
        {badge.label}
      </span>

      <h2 className="font-heading mt-4 max-w-xl text-3xl font-light text-balance sm:text-4xl">
        {decision.product.name} may run out in {decision.daysUntilStockout.toFixed(1)} days.
      </h2>

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 sm:gap-8">
        <Stat value={`${Math.round(decision.stockoutRisk * 100)}%`} label="stockout risk" />
        <Stat value={KZT(decision.revenueAtRisk)} label="revenue at risk" />
        <Stat value={`${decision.product.currentStock} ${decision.product.unit}`} label="currently available" />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <p className="text-xs tracking-wide text-white/40 uppercase">Recommendation</p>
        <p className="font-heading mt-1.5 text-xl font-light">
          Order {decision.recommendedQty} {decision.product.unit} from {recommendedSupplier?.supplier.name ?? "a supplier"} today.
        </p>

        {status === "PENDING" && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? "Approving…" : "Approve purchase"}
            </button>
            <Link
              href={`/dashboard/decisions/${decision.product.id}`}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              See reasoning
            </Link>
            <Link
              href="/dashboard/simulation"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Simulate
            </Link>
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
        )}

        {status === "APPROVED" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm"
          >
            <span>✓ Purchase approved{poNumber ? ` — ${poNumber}` : ""}</span>
            <Link href="/dashboard/orders" className="underline underline-offset-2 hover:text-white/80">
              Track in Orders
            </Link>
          </motion.div>
        )}

        {status === "REJECTED" && (
          <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70">
            Dismissed. PRONOI will keep watching {decision.product.name}.
          </div>
        )}
      </div>
    </div>
  );
}
