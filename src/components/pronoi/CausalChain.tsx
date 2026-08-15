"use client";

import { useState } from "react";
import { KZT } from "@/lib/pronoi/decisions";
import type { DecisionView } from "@/server/pronoi/decisions";

function ChainStep({ value, label, isLast }: { value: string; label: string; isLast?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-lg font-medium text-black">{value}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      {!isLast && <div className="my-1 pl-[2px] text-gray-300">↓</div>}
    </div>
  );
}

export function CausalChain({ decision }: { decision: DecisionView }) {
  const [showCalculation, setShowCalculation] = useState(false);
  const unit = decision.product.unit;

  const steps = [
    { value: `${decision.product.currentStock} ${unit}`, label: "currently in stock" },
    { value: `${decision.expectedDemandLeadTime.toFixed(1)} ${unit}`, label: "expected demand during supplier lead time" },
    { value: `±${decision.demandStdLeadTime.toFixed(1)} ${unit}`, label: "demand variability" },
    { value: `${(decision.stockoutRisk * 100).toFixed(1)}%`, label: "probability of stockout" },
    { value: KZT(decision.revenueAtRisk), label: "revenue exposed" },
  ];

  return (
    <div>
      <div>
        {steps.map((step, i) => (
          <ChainStep key={step.label} value={step.value} label={step.label} isLast={i === steps.length - 1} />
        ))}
      </div>

      <div className="mt-5 border-t border-black/5 pt-5">
        <p className="text-xs tracking-wide text-gray-400 uppercase">Therefore</p>
        <p className="font-heading mt-1 text-xl font-medium">
          {decision.recommendedQty} {unit} should be ordered today.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowCalculation((v) => !v)}
        className="mt-5 text-sm font-medium text-gray-500 underline underline-offset-2 hover:text-black"
      >
        {showCalculation ? "Hide calculation" : "Show calculation"}
      </button>

      {showCalculation && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl bg-[#F5F4F1] p-5 text-sm sm:grid-cols-3">
          <CalcRow label="Expected demand" value={`${decision.expectedDemandLeadTime.toFixed(1)} ${unit}`} />
          <CalcRow label="Demand std. deviation" value={`${decision.demandStdLeadTime.toFixed(1)} ${unit}`} />
          <CalcRow label="Safety stock" value={`${decision.safetyStock.toFixed(1)} ${unit}`} />
          <CalcRow label="z-score" value={decision.zScore.toFixed(2)} />
          <CalcRow label="Service level" value={`${Math.round(decision.product.serviceLevel * 100)}%`} />
          <CalcRow label="P(stockout) = Φ(−z)" value={`${(decision.stockoutRisk * 100).toFixed(1)}%`} />
        </div>
      )}
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-heading text-base font-medium">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}
