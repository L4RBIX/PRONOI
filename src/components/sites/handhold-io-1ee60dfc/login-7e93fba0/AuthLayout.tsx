import Link from "next/link";
import type { ReactNode } from "react";

import { GradientBackground } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/GradientBackground";
import { GradientPalette } from "@/components/sites/handhold-io-1ee60dfc/shared/webgl/shaders";
import { PronoiLogo } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";

const TRUSTED_LOGOS = [
  { name: "Mokka Coffee", className: "text-lg font-semibold" },
  { name: "Nomad Bakery", className: "text-lg font-semibold" },
  { name: "Alma Market", className: "text-lg font-semibold" },
  { name: "Daily Cup", className: "text-lg font-semibold" },
  { name: "Orion Retail", className: "text-lg font-semibold" },
  { name: "Urban Beans", className: "text-lg font-semibold" },
];

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  showTrustedBy?: boolean;
}

export function AuthLayout({ title, subtitle, children, showTrustedBy = false }: AuthLayoutProps) {
  return (
    <div className="bg-[#0a0a0a] text-white flex min-h-full flex-1">
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md md:w-96 xl:w-md">
          <Link href="/" className="mb-16 inline-block w-fit">
            <PronoiLogo className="text-white" theme="onDark" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center md:w-96 xl:w-md">
          <h1 className="font-heading font-extralight text-4xl mb-2">{title}</h1>
          <p className="text-gray-400 text-sm mb-8">{subtitle}</p>

          {children}
        </div>
      </div>

      <div className="hidden w-0 flex-1 p-12 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
          <GradientBackground palette={GradientPalette.YELLOW} seed={0} className="absolute inset-0 h-full w-full" />

          {showTrustedBy && (
            <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-4 rounded-2xl bg-black/30 p-6 backdrop-blur-md">
              <p className="text-xs text-white/70 text-center">Trusted by</p>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                {TRUSTED_LOGOS.map((logo) => (
                  <span key={logo.name} className={`text-white/90 ${logo.className}`}>
                    {logo.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
