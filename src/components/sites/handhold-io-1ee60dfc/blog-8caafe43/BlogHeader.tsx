import Link from "next/link";
import { PronoiLogo } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";

export function BlogHeader() {
  return (
    <header className="border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="PRONOI home" className="text-gray-900">
          <PronoiLogo />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
          >
            Try for free
          </Link>
        </nav>
      </div>
    </header>
  );
}
