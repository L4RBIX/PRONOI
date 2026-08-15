import Link from "next/link";

export function BlogFooter() {
  return (
    <footer className="border-t border-gray-100 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Handhold. All rights reserved.</p>
        <nav className="flex items-center gap-6">
          <Link href="/privacy-policy" className="hover:text-gray-900">
            Privacy Policy
          </Link>
          <Link href="/cookie-policy" className="hover:text-gray-900">
            Cookie Policy
          </Link>
          <Link
            href="/responsible-disclosure-policy"
            className="hover:text-gray-900"
          >
            Responsible Disclosure
          </Link>
        </nav>
      </div>
    </footer>
  );
}
