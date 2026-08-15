import Link from "next/link";
import { PronoiLogo } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";

export function LegalHeader() {
  return (
    <header className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" aria-label="PRONOI home" className="text-gray-900">
          <PronoiLogo />
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Try for free
          </Link>
        </div>
      </div>
    </header>
  );
}
