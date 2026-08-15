"use client";

import { useState, useTransition } from "react";
import { ScrollReveal } from "@/components/sites/handhold-io-1ee60dfc/shared/ScrollReveal";
import { KZT } from "@/lib/pronoi/decisions";
import { joinPoolAction } from "@/server/pronoi/actions";
import type { PoolingView as PoolingOpportunity } from "@/server/pronoi/pooling";

function ConvergeLines() {
  return (
    <svg viewBox="0 0 120 216" className="h-[216px] w-14 shrink-0 text-gray-300 sm:w-20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,32 C60,32 60,108 120,108" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M0,108 L120,108" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M0,184 C60,184 60,108 120,108" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ContributorRow({ name, quantity, unit, isYou }: { name: string; quantity: number; unit: string; isYou?: boolean }) {
  return (
    <div className="flex h-16 items-center justify-between rounded-2xl border border-black/5 bg-[#F5F4F1] px-4">
      <span className="text-sm font-medium text-black">
        {name}
        {isYou && <span className="ml-1.5 text-xs font-normal text-gray-500">(you)</span>}
      </span>
      <span className="font-heading text-lg">
        {quantity} {unit}
      </span>
    </div>
  );
}

export function PoolingView({ opportunity: initial }: { opportunity: PoolingOpportunity }) {
  const [opportunity, setOpportunity] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const yourCostAlone = Math.round(opportunity.individualPrice * opportunity.yourQuantity);
  const yourCostPooled = Math.round(opportunity.pooledPrice * opportunity.yourQuantity);
  const progressPercent = opportunity.nextTier ? Math.min(100, (opportunity.combinedQuantity / opportunity.nextTier.threshold) * 100) : 100;
  const externalParticipants = opportunity.participants.filter((p) => !p.isYou);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinPoolAction(opportunity.id);
      if (!result.ok || !result.data) {
        setError(result.error?.message ?? "Couldn't join the pool. Please try again.");
        return;
      }
      setOpportunity(result.data);
    });
  }

  return (
    <div className="rounded-3xl border border-black/5 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-medium">{opportunity.productName} — this week&rsquo;s pool</h2>
        <span className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-medium text-gray-600">
          {opportunity.combinedQuantity} {opportunity.unit} combined
        </span>
      </div>

      <div className="mt-6 flex items-stretch gap-0 sm:gap-2">
        <div className="flex flex-1 flex-col justify-between gap-3">
          <ScrollReveal distance={10} duration={0.35} delay={0}>
            <ContributorRow
              name={opportunity.participants.find((p) => p.isYou)?.name ?? "You"}
              quantity={opportunity.yourQuantity}
              unit={opportunity.unit}
              isYou
            />
          </ScrollReveal>
          {externalParticipants.map((p, i) => (
            <ScrollReveal key={p.name} distance={10} duration={0.35} delay={(i + 1) * 0.08}>
              <ContributorRow name={p.name} quantity={p.quantity} unit={opportunity.unit} />
            </ScrollReveal>
          ))}
        </div>

        <ConvergeLines />

        <ScrollReveal distance={0} scale={0.94} duration={0.4} delay={0.3} className="flex w-36 shrink-0 sm:w-44">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-black text-center text-white">
            <p className="font-heading text-4xl font-light">{opportunity.combinedQuantity}</p>
            <p className="text-xs tracking-wide text-white/60 uppercase">{opportunity.unit} combined order</p>
          </div>
        </ScrollReveal>
      </div>

      <div className="mt-8 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 p-5">
          <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Buying alone</p>
          <p className="font-heading mt-2 text-2xl font-light">₸{opportunity.individualPrice}/{opportunity.unit}</p>
          <p className="mt-1 text-sm text-gray-500">Your cost: {KZT(yourCostAlone)}</p>
        </div>
        <div className="rounded-2xl border border-black bg-black p-5 text-white">
          <p className="text-xs font-medium tracking-wide text-white/50 uppercase">With PRONOI pool</p>
          <p className="font-heading mt-2 text-2xl font-light">₸{opportunity.pooledPrice}/{opportunity.unit}</p>
          <p className="mt-1 text-sm text-white/70">Your cost: {KZT(yourCostPooled)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-5 py-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">You save</p>
          <p className="font-heading text-2xl font-medium text-emerald-800">
            {KZT(opportunity.yourSavings)} <span className="text-base font-normal">({opportunity.savingsPercent}%)</span>
          </p>
        </div>
        {opportunity.joined ? (
          <span className="text-sm font-medium text-emerald-800">✓ Joined this week&rsquo;s pool</span>
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            disabled={isPending}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85 active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "Joining…" : "Join pooled order"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {opportunity.nextTier && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {opportunity.combinedQuantity} {opportunity.unit}
            </span>
            <span>
              {opportunity.nextTier.threshold} {opportunity.unit}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-[#F5F4F1]">
            <div className="h-2 rounded-full bg-black transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            At {opportunity.nextTier.threshold} {opportunity.unit}:{" "}
            <span className="font-medium text-black">{opportunity.nextTier.discountPercent}% discount.</span>{" "}
            {opportunity.nextTier.unitsNeeded} {opportunity.unit} more unlocks the next price tier.
          </p>
        </div>
      )}
    </div>
  );
}
