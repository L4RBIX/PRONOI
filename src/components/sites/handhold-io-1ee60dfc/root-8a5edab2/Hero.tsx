"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { PronoiMarkIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";
import { HeroWave } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/HeroWave";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const LOGOS = [
  { name: "Mokka Coffee", className: "text-lg font-semibold" },
  { name: "Nomad Bakery", className: "text-lg font-semibold" },
  { name: "Alma Market", className: "text-lg font-semibold" },
  { name: "Daily Cup", className: "text-lg font-semibold" },
  { name: "Orion Retail", className: "text-lg font-semibold" },
  { name: "Urban Beans", className: "text-lg font-semibold" },
];

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const waveY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ["0%", "0%"] : ["0%", "15%"]);

  return (
    <section
      ref={sectionRef}
      className="relative grid h-[calc(100vh-72px)] min-h-[560px] w-full grid-cols-1 grid-rows-[minmax(max-content,1fr)_minmax(150px,1fr)_max-content] place-items-center overflow-hidden lg:grid-rows-[minmax(max-content,1fr)_minmax(0px,1fr)_max-content]"
    >
      <div className="z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-24 md:py-12 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="font-[family-name:var(--font-heading)] text-center text-5xl font-extralight leading-[1] tracking-[-0.03em] text-black md:text-7xl"
        >
          Your procurement,
          <br />
          already handled.
        </motion.h1>
        <div className="flex flex-col items-center gap-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: EASE }}
            className="max-w-xl text-center text-lg text-gray-600"
          >
            PRONOI predicts stockout risk, selects the safest supplier, and turns inventory data into purchasing
            decisions.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16, ease: EASE }}
            className="flex items-center gap-3"
          >
            <a
              href="#decision-lab"
              className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white"
            >
              <PronoiMarkIcon className="h-4 w-auto" theme="onDark" />
              See PRONOI in action
            </a>
            <Link
              href="/dashboard"
              className="flex items-center rounded-full bg-cream px-4 py-2 text-sm text-black"
            >
              Open dashboard
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        style={{ y: waveY }}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.215, 0.61, 0.355, 1] }}
        className="pointer-events-none relative -z-1 h-full min-h-0 w-full"
      >
        <HeroWave className="absolute top-1/2 left-1/2 aspect-[3024/1592] w-full min-w-[1440px] -translate-x-1/2 -translate-y-1/2" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
        className="absolute inset-x-0 bottom-0 z-10 w-full px-4 py-8 md:static md:mt-auto md:py-14"
      >
        <div className="flex items-center justify-start overflow-hidden mask-[linear-gradient(to_right,rgba(0,0,0,0)_0%,rgb(0,0,0)_20%,rgb(0,0,0)_80%,rgba(0,0,0,0)_100%)] xl:hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="mx-auto flex w-auto max-w-none flex-none animate-[logoSlide_40s_linear_infinite] items-center justify-center will-change-transform motion-reduce:animate-none"
            >
              {LOGOS.map((logo) => (
                <span key={logo.name} className={`mx-6 text-black opacity-80 ${logo.className}`}>
                  {logo.name}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="hidden items-center justify-center gap-18 px-6 xl:flex">
          {LOGOS.map((logo) => (
            <span key={logo.name} className={`shrink-0 text-black opacity-80 ${logo.className}`}>
              {logo.name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
