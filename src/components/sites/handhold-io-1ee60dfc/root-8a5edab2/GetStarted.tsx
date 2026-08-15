import Link from "next/link";
import { getDecision, KZT } from "@/lib/pronoi/decisions";

const milk = getDecision("milk")!;

export function GetStarted() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <h2 className="mb-10 font-heading text-3xl font-extralight md:text-4xl">
        Get started in minutes
      </h2>

      <div>
        <div className="flex flex-col items-start gap-6 border-t border-gray-200 py-8 md:flex-row">
          <div className="md:w-1/3">
            <span className="font-heading text-3xl">1.</span>
            <p className="mt-2 text-lg">
              Connect your inventory, demand, and supplier data
            </p>
          </div>
          <div className="w-full rounded-3xl bg-cream p-6 md:w-2/3">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              {milk.product.name} — {milk.product.currentStock} {milk.product.unit} on hand
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-4/5 rounded-full bg-white/70" />
              <div className="h-3 w-3/5 rounded-full bg-white/70" />
              <div className="h-3 w-2/3 rounded-full bg-white/70" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6 border-t border-gray-200 py-8 md:flex-row">
          <div className="md:w-1/3">
            <span className="font-heading text-3xl">2.</span>
            <p className="mt-2 text-lg">
              PRONOI computes stockout risk and ranks suppliers by expected cost
            </p>
          </div>
          <div className="w-full rounded-3xl bg-cream p-6 md:w-2/3">
            <div className="rounded-2xl bg-white p-5 shadow-lg">
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-xl">{milk.product.name}</span>
                <span className="text-sm font-medium text-red-600">{Math.round(milk.stockoutProbability * 100)}% risk</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Recommended: order {milk.recommendedQuantity} {milk.product.unit} from{" "}
                {milk.recommendedSupplier.supplier.name}
              </p>
              <p className="mt-1 text-sm text-gray-600">{KZT(milk.revenueAtRisk)} in revenue protected</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6 border-t border-gray-200 py-8 md:flex-row">
          <div className="md:w-1/3">
            <span className="font-heading text-3xl">3.</span>
            <p className="mt-2 text-lg">Approve with one click, PRONOI tracks the order</p>
          </div>
          <div className="w-full md:w-2/3">
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {["Approved", "Order sent", "Supplier confirmed", "In transit", "Delivered"].map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1.5 ${i === 0 ? "bg-black text-white" : "bg-gray-100"}`}>{step}</span>
                  {i < 4 && <span>→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Open the dashboard
        </Link>
        <p className="text-sm text-gray-500">No setup required — explore with live demo data</p>
      </div>
    </section>
  );
}
