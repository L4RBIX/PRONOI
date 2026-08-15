import type { ReactNode } from "react";
import Link from "next/link";
import { LegalHeader } from "@/components/sites/handhold-io-1ee60dfc/legal/LegalHeader";
import { LegalFooter } from "@/components/sites/handhold-io-1ee60dfc/legal/LegalFooter";

interface LegalLayoutProps {
  title: string;
  lastModified: string;
  children: ReactNode;
}

export function LegalLayout({ title, lastModified, children }: LegalLayoutProps) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <LegalHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-1">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900">{title}</span>
          </div>
          <h1 className="font-heading font-extralight text-5xl mb-2">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Last modified {lastModified}
          </p>
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
