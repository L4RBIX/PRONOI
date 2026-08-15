"use client";

import { useState } from "react";
import {
  PlusIcon,
  MinusIcon,
} from "@/components/sites/handhold-io-1ee60dfc/shared/icons";

const FAQS = [
  {
    q: "How does PRONOI calculate stockout risk?",
    a: "PRONOI models demand during your supplier's lead time as a normal distribution built from your average daily demand and its volatility, then computes the probability that demand exceeds what you currently have on hand. It's a standard inventory-theory model, not a black box — every input is visible and every output is recomputed the moment your data changes.",
  },
  {
    q: "Does PRONOI place orders automatically?",
    a: "No. PRONOI recommends a reorder quantity and a supplier, but a person always approves the purchase. Once approved, PRONOI tracks the resulting purchase order through confirmation and delivery.",
  },
  {
    q: "How does PRONOI choose a supplier?",
    a: "PRONOI ranks every supplier offer by expected total cost: purchase price plus the expected cost of that supplier's own unreliability, priced in real currency. A cheaper supplier with a high late-delivery rate can lose to a pricier, more reliable one once that risk is accounted for.",
  },
  {
    q: "What happens if a supplier delivery is delayed or cancelled?",
    a: "PRONOI immediately recalculates the affected product's stockout risk under the new lead time and proposes a recovery plan — filling the gap from the cheapest available sources first, such as a branch transfer, an emergency order, or a pooled purchase.",
  },
  {
    q: "Is the AI making the purchasing decisions?",
    a: "No. A deterministic calculation engine computes every number — risk, quantity, cost. A language model is only used, optionally, to explain the recommendation in plain language. If that explanation service is unavailable, PRONOI still works using a built-in explanation template.",
  },
  {
    q: "What data does PRONOI need?",
    a: "Current stock, average daily demand and its variability, supplier lead times, and supplier price and reliability. The more accurate this data, the more accurate the recommendation — PRONOI is transparent about the model it's using, not a guess dressed up as a prediction.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((current) => (current === i ? null : i));
  };

  return (
    <section className="py-16">
      <p className="text-sm text-gray-500 mb-4">Frequently Asked Questions</p>

      <div>
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          const isLast = i === FAQS.length - 1;

          return (
            <div
              key={faq.q}
              className={`border-t border-gray-200 py-5 cursor-pointer ${
                isLast ? "border-b" : ""
              }`}
              onClick={() => toggle(i)}
            >
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-xl md:text-2xl font-heading font-light">
                  {faq.q}
                </h3>
                <button
                  type="button"
                  aria-label={isOpen ? "Collapse answer" : "Expand answer"}
                  aria-expanded={isOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(i);
                  }}
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    isOpen ? "bg-black text-white" : "bg-gray-100"
                  }`}
                >
                  {isOpen ? (
                    <MinusIcon className="w-4 h-4" />
                  ) : (
                    <PlusIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div
                className="grid transition-[grid-template-rows] duration-300"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="text-gray-500 mt-3 max-w-3xl">{faq.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
