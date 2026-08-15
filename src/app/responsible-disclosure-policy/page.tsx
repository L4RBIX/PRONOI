import type { Metadata } from "next";
import { LegalLayout } from "@/components/sites/handhold-io-1ee60dfc/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Responsible Disclosure | Handhold",
  description: "How to report security vulnerabilities to Handhold.",
};

export default function ResponsibleDisclosurePolicyPage() {
  return (
    <LegalLayout title="Responsible disclosure" lastModified="June 3, 2026">
      <p className="text-gray-700 leading-relaxed mb-4">
        At Handhold, we take the security of our users and our systems
        seriously. We value the work of security researchers and encourage
        the responsible disclosure of any vulnerabilities you discover.
        This page outlines how to report a vulnerability and what you can
        expect from us in return.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Reporting a vulnerability
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        If you believe you have found a security vulnerability in any of
        our systems, please report it to us by email at{" "}
        <a
          href="mailto:support@handhold.io"
          className="underline hover:text-gray-900"
        >
          support@handhold.io
        </a>
        . Please include a description of the vulnerability, the steps
        needed to reproduce it, and any relevant screenshots or proof of
        concept so our team can investigate quickly.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Please do not publicly disclose the issue until we have had a
        reasonable opportunity to investigate and address it.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Our commitment
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        We will acknowledge receipt of your report within a reasonable
        timeframe, keep you informed of our progress, and work to resolve
        confirmed vulnerabilities promptly. We will not pursue legal action
        against researchers who act in good faith, report issues promptly,
        and avoid privacy violations, data destruction, or service
        disruption during their research.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">Scope</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        This policy applies to the Handhold website and application. It
        does not extend to third-party services we integrate with, denial
        of service testing, social engineering of our staff or users, or
        physical security testing. Please avoid accessing, modifying, or
        deleting data that does not belong to you.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">Contact</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        For any questions about this policy or to submit a report, reach
        out to our team at{" "}
        <a
          href="mailto:support@handhold.io"
          className="underline hover:text-gray-900"
        >
          support@handhold.io
        </a>
        . We appreciate the efforts of the security research community in
        helping us keep Handhold safe.
      </p>
    </LegalLayout>
  );
}
