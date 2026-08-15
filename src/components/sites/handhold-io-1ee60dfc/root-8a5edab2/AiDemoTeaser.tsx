import Image from "next/image";
import { AgentIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/icons";
import { ScrollReveal } from "@/components/sites/handhold-io-1ee60dfc/shared/ScrollReveal";

const ASSET_BASE = "/sites/handhold-io-1ee60dfc/root-8a5edab2";

/**
 * Small decorative "liquid" blobs scattered around the avatar image. The live
 * site renders these with its own `LiquidOrb` component (not reverse-engineered
 * here — a secondary decorative detail); positions/sizes below are extracted
 * verbatim from the site's bundle, rendered as soft radial-gradient blobs.
 */
const ORBS = [
  { className: "top-[5%] left-[8%] h-[70px] w-[62px] hidden xs:block", rotate: "-90deg" },
  { className: "top-[25%] left-[28%] h-[44px] w-[39px] hidden sm:block" },
  { className: "top-[15%] right-[18%] h-[50px] w-[42px] hidden xs:block" },
  { className: "bottom-[12%] left-[4%] h-[120px] w-[118px] hidden xs:block", rotate: "90deg", flipY: true },
  { className: "right-[2%] bottom-[12%] h-[130px] w-[52px] hidden xs:block", rotate: "180deg", flipY: true },
];

export function AiDemoTeaser() {
  return (
    <ScrollReveal className="mx-auto w-full max-w-7xl px-4 pb-16 lg:px-8" scale={0.97} duration={0.6}>
      <div className="relative overflow-hidden rounded-2xl bg-[#f2f1ed]">
        <div className="relative flex h-[560px] flex-col items-center md:h-[602px]">
          <div className="pointer-events-none absolute top-10 w-[920px] max-w-none md:top-7.5 md:w-[980px]">
            <Image src={`${ASSET_BASE}/demo-bot.webp`} alt="" width={1960} height={1017} className="h-auto w-full" />
          </div>

          {ORBS.map((orb, i) => (
            <div
              key={i}
              className={`pointer-events-none absolute rounded-full bg-gradient-to-br from-blue-200 via-amber-100 to-emerald-100 opacity-70 blur-md ${orb.className}`}
              style={{
                transform: [orb.flipY ? "scaleY(-1)" : "", orb.rotate ? `rotate(${orb.rotate})` : ""]
                  .filter(Boolean)
                  .join(" "),
              }}
            />
          ))}

          <div
            className="absolute right-0 bottom-0 left-0 z-[2] h-64"
            style={{ background: "linear-gradient(to bottom, rgba(242,241,237,0) 0%, #f2f1ed 70%)" }}
          />

          <div className="absolute bottom-12 z-10 flex flex-col items-center gap-4 md:bottom-16">
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-base text-gray-600">Decision Lab</p>
              <h2 className="font-heading text-center text-3xl font-extralight md:text-4xl">
                See PRONOI decide, live
              </h2>
              <p className="text-center text-xs text-gray-500">Change the inputs and watch the recommendation update</p>
            </div>
            <a href="#decision-lab" className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white">
              <AgentIcon className="h-4 w-4" />
              Try the Decision Lab
            </a>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
