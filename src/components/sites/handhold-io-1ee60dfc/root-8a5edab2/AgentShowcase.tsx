"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/sites/handhold-io-1ee60dfc/shared/ScrollReveal";
import { GradientBackground } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/GradientBackground";
import { GradientPalette } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/shaders";
import { computeMilkDisruptionScenario, getDecision, KZT } from "@/lib/pronoi/decisions";

const milk = getDecision("milk")!;
const disruption = computeMilkDisruptionScenario();

interface Feature {
  title: string;
  description: string;
}

interface ShowcaseBlock {
  badge: string;
  heading: string;
  palette: GradientPalette;
  seed: number;
  imagePosition: "left" | "right";
  features: Feature[];
  overlay: ReactNode;
}

function StatLine({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "critical" | "positive" }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={cn(
          "font-heading text-lg font-medium",
          tone === "critical" && "text-red-600",
          tone === "positive" && "text-emerald-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function OverlayCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-[min(85%,20rem)] rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-md">{children}</div>
  );
}

const BLOCKS: ShowcaseBlock[] = [
  {
    badge: "Demand Risk",
    heading: "Know what will run out before it does",
    palette: GradientPalette.YELLOW,
    seed: 0,
    imagePosition: "right",
    features: [
      {
        title: "Predict stockout probability",
        description:
          "PRONOI continuously estimates the probability of running out before your next delivery arrives, from live stock, demand, and lead-time data.",
      },
      {
        title: "Translate risk into revenue at stake",
        description: "Every point of stockout risk is converted into an estimated revenue impact, so urgency is measured in money, not just percentages.",
      },
      {
        title: "Recommend exact reorder quantity",
        description: "PRONOI recommends exactly how much to order — enough to cover demand through the next delivery, plus a safety buffer.",
      },
    ],
    overlay: (
      <OverlayCard>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-heading text-2xl font-extralight">{milk.product.name}</span>
          <span className="text-xs text-gray-500">{milk.product.currentStock} L left</span>
        </div>
        <StatLine label="Stockout risk this week" value={`${Math.round(milk.stockoutProbability * 100)}%`} tone="critical" />
        <StatLine label="Revenue at risk" value={KZT(milk.revenueAtRisk)} tone="critical" />
        <div className="mt-2 border-t border-gray-100 pt-2 text-sm">
          Recommended: <span className="font-medium">Order {milk.recommendedQuantity} L today</span>
        </div>
      </OverlayCard>
    ),
  },
  {
    badge: "Supplier Decision",
    heading: "Choose the lowest-risk supplier, not just the cheapest",
    palette: GradientPalette.GREEN,
    seed: 100,
    imagePosition: "left",
    features: [
      {
        title: "Compare price and reliability",
        description: "Every supplier offer is scored on price per unit and on-time delivery rate, side by side.",
      },
      {
        title: "Price the cost of delivery delays",
        description: "An unreliable supplier's expected delay cost is calculated in real currency, not just a star rating.",
      },
      {
        title: "Rank suppliers by expected business cost",
        description: "PRONOI ranks offers by total expected cost — purchase price plus the cost of the risk it carries.",
      },
    ],
    overlay: (
      <OverlayCard>
        <div className="mb-2 text-xs text-gray-500">{milk.product.name} suppliers</div>
        {milk.supplierScores.map((s) => (
          <div key={s.supplier.id} className={cn("flex items-center justify-between border-b border-gray-100 py-1.5 last:border-0", s.supplier.id === milk.recommendedSupplier.supplier.id && "font-medium")}>
            <span className="text-sm">{s.supplier.name}</span>
            <span className="text-xs text-gray-500">
              ₸{s.supplier.pricePerUnit}/L · {Math.round(s.supplier.onTimeRate * 100)}%
            </span>
          </div>
        ))}
        <div className="mt-2 text-sm">
          Recommended: <span className="font-medium">{milk.recommendedSupplier.supplier.name}</span>
        </div>
      </OverlayCard>
    ),
  },
  {
    badge: "Recovery Autopilot",
    heading: "When supply breaks, PRONOI replans",
    palette: GradientPalette.ORANGE,
    seed: 200,
    imagePosition: "right",
    features: [
      {
        title: "Detect delivery disruption",
        description: "The moment a supplier reports a delay or cancellation, PRONOI recalculates every affected product's risk.",
      },
      {
        title: "Estimate revenue under threat",
        description: "The financial impact of the disruption is quantified immediately, not discovered after the shelf is empty.",
      },
      {
        title: "Build the cheapest recovery plan",
        description: "PRONOI fills the gap from the cheapest available sources first — transfers, emergency orders, then pooled purchases.",
      },
    ],
    overlay: (
      <OverlayCard>
        <div className="mb-1 text-xs text-gray-500">Supplier delivery cancelled</div>
        <StatLine label="Milk runs out in" value={`${disruption.daysUntilStockout.toFixed(1)} days`} tone="critical" />
        <StatLine label="Revenue at risk" value={KZT(disruption.revenueAtRisk)} tone="critical" />
        <div className="mt-2 border-t border-gray-100 pt-2 text-sm">
          Recovery plan recovers <span className="font-medium">{Math.round(disruption.recoveryPlan.recoveredFractionOfGap * 100)}%</span> of the gap
        </div>
      </OverlayCard>
    ),
  },
];

function ShowcaseBlockView({ badge, heading, palette, seed, imagePosition, features, overlay }: ShowcaseBlock) {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const advance = useCallback(() => setActive((i) => (i + 1) % features.length), [features.length]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(advance, 8000);
    return () => clearInterval(id);
  }, [advance, active, reducedMotion]);

  const textColStart = imagePosition === "left" ? "md:col-start-2" : "md:col-start-1";
  const imageColStart = imagePosition === "left" ? "md:col-start-1" : "md:col-start-2";

  return (
    <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-2 md:gap-10">
      <div
        className={cn(
          "bg-cream relative order-2 aspect-731/708 h-full w-full overflow-hidden rounded-3xl md:row-span-2 md:row-start-1",
          imageColStart
        )}
      >
        <GradientBackground palette={palette} seed={seed} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-center p-4">{overlay}</div>
      </div>

      <div className={cn("order-1 flex flex-col items-start gap-4 md:row-start-1", textColStart)}>
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">{badge}</span>
        <h3 className="font-heading text-3xl font-extralight text-pretty md:text-4xl">{heading}</h3>
      </div>

      <div className={cn("order-3 flex flex-col self-end md:row-start-2", textColStart)}>
        {features.map((feature, i) => (
          <div key={feature.title} className="flex flex-col pb-6 last:pb-0">
            <div className="relative h-px w-full bg-gray-200">
              {i === active && (
                <motion.div
                  key={`progress-${active}`}
                  className="absolute inset-0 origin-left bg-gray-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 8, ease: "linear" }}
                />
              )}
            </div>
            <div className="pt-6">
              <button
                type="button"
                className="cursor-pointer text-left font-medium text-black transition-colors hover:text-gray-600"
                onClick={() => setActive(i)}
              >
                {feature.title}
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                style={{ gridTemplateRows: i === active ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="pt-1 text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentShowcase() {
  return (
    <section className="mx-auto w-full max-w-[94.5rem] px-4 py-8 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="font-heading mx-auto max-w-2xl text-3xl font-extralight md:text-4xl">
          PRONOI watches every purchasing decision
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          From demand risk to supplier selection and recovery, PRONOI continuously chooses the next best procurement
          action.
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {BLOCKS.map((block) => (
          <ScrollReveal key={block.badge} distance={24} duration={0.6}>
            <ShowcaseBlockView {...block} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
