"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/sites/handhold-io-1ee60dfc/shared/icons";
import { getAllDecisions, KZT } from "@/lib/pronoi/decisions";

const decisions = getAllDecisions().slice(0, 3);

const TESTIMONIALS = decisions.map((d) => ({
  quote: `${d.product.name} is projected to run out in ${d.daysUntilStockout.toFixed(1)} days. PRONOI recommends ordering ${d.recommendedQuantity} ${d.product.unit} from ${d.recommendedSupplier.supplier.name} today, protecting ${KZT(d.revenueAtRisk)} in revenue.`,
  name: d.product.name,
  title: `${Math.round(d.stockoutProbability * 100)}% stockout risk · ${d.product.category}`,
}));

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const goPrev = () => {
    setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    startInterval();
  };

  const goNext = () => {
    setIndex((i) => (i + 1) % TESTIMONIALS.length);
    startInterval();
  };

  const testimonial = TESTIMONIALS[index];

  return (
    <section className="py-16">
      <p className="text-sm text-gray-500 mb-4">
        What PRONOI decided today, live from Mokka Coffee&rsquo;s data
      </p>

      <div className="flex items-start justify-between gap-6">
        <div
          key={index}
          className="flex-1 animate-in fade-in duration-300 [animation-fill-mode:forwards]"
        >
          <p className="font-heading font-extralight text-2xl md:text-3xl leading-snug">
            {testimonial.quote}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
              {getInitials(testimonial.name)}
            </div>
            <div>
              <p className="font-medium text-sm">{testimonial.name}</p>
              <p className="text-xs text-gray-500">{testimonial.title}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 mt-1">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={goPrev}
            className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={goNext}
            className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
