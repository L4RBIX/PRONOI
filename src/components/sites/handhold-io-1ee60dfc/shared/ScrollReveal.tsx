"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Faithful port of handhold.io's own `ScrollReveal` wrapper (fade + slide-up on first intersection). */
export function ScrollReveal({
  children,
  className,
  distance = 20,
  duration = 0.5,
  delay = 0,
  scale,
  threshold = 0.2,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
  delay?: number;
  scale?: number;
  threshold?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  const initial = { opacity: 0, y: distance, ...(scale != null ? { scale } : {}) };
  const animate = { opacity: 1, y: 0, ...(scale != null ? { scale: 1 } : {}) };
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
