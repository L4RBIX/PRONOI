import type { Metadata } from "next";
import { LegalLayout } from "@/components/sites/handhold-io-1ee60dfc/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy | Handhold",
  description: "How Handhold uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie policy" lastModified="June 3, 2026">
      <p className="text-gray-700 leading-relaxed mb-4">
        This cookie policy explains how Handhold uses cookies and similar
        technologies to recognize you when you visit our website and use
        our application. It explains what these technologies are, why we
        use them, and your rights to control our use of them.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        What are cookies
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Cookies are small text files that are placed on your device when
        you visit a website. They are widely used to make websites work,
        or work more efficiently, as well as to provide reporting
        information and support personalization.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Cookies we use
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        We use the following categories of cookies on our website and
        application:
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-700">
        <li>
          <span className="font-medium">Necessary</span> &mdash; required for
          the website and application to function properly, such as
          keeping you signed in and remembering your preferences.
        </li>
        <li>
          <span className="font-medium">Analytical</span> &mdash; help us
          understand how visitors interact with our website so we can
          measure and improve its performance.
        </li>
        <li>
          <span className="font-medium">Functionality</span> &mdash; allow us
          to remember choices you make and provide enhanced, more
          personalized features.
        </li>
        <li>
          <span className="font-medium">Third-party</span> &mdash; set by
          trusted partners we work with, such as analytics or customer
          support providers, to help deliver their services.
        </li>
      </ul>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Managing your cookie preferences
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Most browsers allow you to control cookies through their settings.
        You can set your browser to refuse cookies, or to alert you when
        cookies are being sent. Please note that if you disable certain
        cookies, some parts of our website or application may not function
        as intended.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Contact us
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        If you have questions about our use of cookies, please contact us
        at{" "}
        <a
          href="mailto:support@handhold.io"
          className="underline hover:text-gray-900"
        >
          support@handhold.io
        </a>
        .
      </p>
    </LegalLayout>
  );
}
