import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Handhold. All rights reserved.</p>
        <nav className="flex items-center gap-6">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <Link href="/privacy-policy" className="hover:text-gray-900">
            Privacy policy
          </Link>
          <Link href="/cookie-policy" className="hover:text-gray-900">
            Cookie policy
          </Link>
          <Link
            href="/responsible-disclosure-policy"
            className="hover:text-gray-900"
          >
            Responsible disclosure
          </Link>
        </nav>
      </div>
    </footer>
  );
}
