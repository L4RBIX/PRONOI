"use client";

import Link from "next/link";
import { useState } from "react";
import { BarsIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/icons";
import { PronoiLogo } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-30 w-full px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-[94.5rem] items-center justify-between">
        <Link href="/" aria-label="PRONOI home">
          <PronoiLogo />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/login" className="text-sm text-black">
            Sign in
          </Link>

          <Link href="/dashboard" className="rounded-full bg-black px-4 py-2 text-sm text-white">
            Open dashboard
          </Link>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="relative flex h-10 w-10 items-center justify-center"
          >
            {mobileMenuOpen ? (
              <span className="relative block h-4 w-5">
                <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rotate-45 bg-black" />
                <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 -rotate-45 bg-black" />
              </span>
            ) : (
              <BarsIcon className="h-5 w-5 text-black" />
            )}
          </button>

          {mobileMenuOpen && (
            <div className="absolute left-4 right-4 z-50 mt-2 flex flex-col gap-1 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur">
              <Link href="/dashboard" className="py-2 text-base font-bold" onClick={() => setMobileMenuOpen(false)}>
                Open dashboard
              </Link>
              <Link href="/login" className="py-2 text-base" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
