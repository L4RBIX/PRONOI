"use client";

import { useMemo, useState } from "react";
import { Orb } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/Orb";
import { GradientPalette } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/shaders";
import { assessStockoutRisk, computeRevenueAtRisk, recommendReorderQuantity, scoreSuppliers } from "@/lib/pronoi/calc";
import { getDecision, KZT } from "@/lib/pronoi/decisions";

const milk = getDecision("milk")!;

interface SliderControl {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

function Slider({ control, value, onChange }: { control: SliderControl; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-gray-600">{control.label}</span>
        <span className="font-medium text-black">{control.format(value)}</span>
      </div>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-black"
      />
    </label>
  );
}

export function CreateAgentSection() {
  const [currentStock, setCurrentStock] = useState(milk.product.currentStock);
  const [avgDailyDemand, setAvgDailyDemand] = useState(milk.product.avgDailyDemand);
  const [leadTimeDays, setLeadTimeDays] = useState(milk.product.leadTimeDays);
  const [demandStdDev, setDemandStdDev] = useState(milk.product.demandStdDev);
  const [reliability, setReliability] = useState(milk.product.suppliers[0].onTimeRate);

  const result = useMemo(() => {
    const inputs = { currentStock, avgDailyDemand, demandStdDev, leadTimeDays };
    const risk = assessStockoutRisk(inputs);
    const reorder = recommendReorderQuantity(inputs);
    const revenueAtRisk = computeRevenueAtRisk(risk.expectedShortageUnits, milk.product.unitRevenueAtRisk);
    const suppliers = milk.product.suppliers.map((s, i) => (i === 0 ? { ...s, onTimeRate: reliability } : s));
    const revenueAtRiskPerDay = milk.product.unitRevenueAtRisk * avgDailyDemand;
    const scores = scoreSuppliers(suppliers, reorder.recommendedQuantity || avgDailyDemand * leadTimeDays, revenueAtRiskPerDay);
    return { risk, reorder, revenueAtRisk, scores, recommended: scores[0] };
  }, [currentStock, avgDailyDemand, leadTimeDays, demandStdDev, reliability]);

  const controls: { control: SliderControl; value: number; onChange: (v: number) => void }[] = [
    {
      control: { key: "stock", label: "Current stock", min: 0, max: 100, step: 1, format: (v) => `${v} L` },
      value: currentStock,
      onChange: setCurrentStock,
    },
    {
      control: { key: "demand", label: "Average daily demand", min: 5, max: 40, step: 1, format: (v) => `${v} L` },
      value: avgDailyDemand,
      onChange: setAvgDailyDemand,
    },
    {
      control: { key: "lead", label: "Lead time", min: 0.5, max: 7, step: 0.1, format: (v) => `${v.toFixed(1)} days` },
      value: leadTimeDays,
      onChange: setLeadTimeDays,
    },
    {
      control: { key: "vol", label: "Demand volatility", min: 0.5, max: 12, step: 0.5, format: (v) => `${v.toFixed(1)} L/day` },
      value: demandStdDev,
      onChange: setDemandStdDev,
    },
    {
      control: { key: "rel", label: "Supplier reliability", min: 0.5, max: 1, step: 0.01, format: (v) => `${Math.round(v * 100)}%` },
      value: reliability,
      onChange: setReliability,
    },
  ];

  const riskPct = Math.round(result.risk.stockoutProbability * 100);

  return (
    <section id="decision-lab" className="grid md:grid-cols-2 gap-6 py-16 scroll-mt-24">
      <div className="bg-cream rounded-3xl p-10 flex flex-col items-center text-center">
        <h2 className="font-heading font-extralight text-2xl">PRONOI Decision Lab</h2>
        <p className="text-gray-600 text-sm mt-1">Change the scenario and watch the purchasing decision update live.</p>

        <div className="relative aspect-[457/184] w-full max-w-[28.625rem] my-8">
          <Orb state="LISTENING" palette={GradientPalette.RED} seed={7} className="absolute inset-y-[6.5%] left-0 h-auto" />
          <Orb state="SPEAKING" palette={GradientPalette.YELLOW} seed={1} className="absolute inset-y-0 left-[30%] z-10 h-auto" />
          <Orb state="THINKING" palette={GradientPalette.GREEN} seed={4} className="absolute inset-y-[6.5%] right-0 h-auto" />
        </div>

        <div className="flex w-full max-w-md flex-col gap-4 text-left">
          {controls.map(({ control, value, onChange }) => (
            <Slider key={control.key} control={control} value={value} onChange={onChange} />
          ))}
        </div>

        <div className="mt-6 w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 text-left">
          <p className="font-heading text-xl font-medium">
            {riskPct}% stockout risk{riskPct >= 50 ? " — act today" : ""}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Recommended: <span className="font-medium text-black">Order {result.reorder.recommendedQuantity} L from {result.recommended.supplier.name} today.</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Impact: <span className="font-medium text-black">{KZT(result.revenueAtRisk)} revenue protected.</span>
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Every number above is computed live from the sliders — nothing here is hardcoded.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-cream rounded-3xl p-6">
          <h3 className="font-heading text-xl">Stockout probability</h3>
          <p className="text-gray-900 text-3xl font-heading font-extralight mt-2">{riskPct}%</p>
          <p className="text-gray-600 text-sm mt-1">Chance of running out before the next delivery arrives.</p>
        </div>
        <div className="bg-cream rounded-3xl p-6">
          <h3 className="font-heading text-xl">Recommended order</h3>
          <p className="text-gray-900 text-3xl font-heading font-extralight mt-2">{result.reorder.recommendedQuantity} L</p>
          <p className="text-gray-600 text-sm mt-1">from {result.recommended.supplier.name}, chosen by expected total cost.</p>
        </div>
        <div className="bg-cream rounded-3xl p-6">
          <h3 className="font-heading text-xl">Expected total cost</h3>
          <p className="text-gray-900 text-3xl font-heading font-extralight mt-2">{KZT(result.recommended.totalExpectedCost)}</p>
          <p className="text-gray-600 text-sm mt-1">Purchase price plus the priced-in cost of delivery risk.</p>
        </div>
      </div>
    </section>
  );
}
