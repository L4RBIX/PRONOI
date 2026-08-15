import type { Metadata } from "next";
import { LegalLayout } from "@/components/sites/handhold-io-1ee60dfc/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Handhold",
  description: "How Handhold collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy policy" lastModified="June 3, 2026">
      <p className="text-gray-700 leading-relaxed mb-4">
        Handhold (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
        respects your privacy and is committed to protecting the personal
        data we collect when you visit our website or use our application.
        This policy explains what data we collect, why we collect it, and
        the choices you have.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Data processing with regard to visiting and using our website
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        When you visit our website, our hosting provider automatically
        collects technical information such as your IP address, browser
        type, device information, and the pages you visit. We use this
        information to operate, maintain, and improve our website, and to
        understand how visitors interact with our content.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        We may use cookies and similar technologies for this purpose. You
        can read more about the cookies we use in our{" "}
        <span className="font-medium">Cookie policy</span>.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Data processing with regard to using the Handhold application
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        When you create an account and use the Handhold application, we
        collect information you provide directly, such as your name, email
        address, and any content you upload or generate through the
        product. We process this data to provide the service, respond to
        support requests, and improve the reliability and quality of our
        product.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        We do not sell your personal data to third parties. We may share
        data with trusted service providers who help us operate the
        application, subject to appropriate confidentiality and data
        protection obligations.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Storing and transferring your personal data
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Your data is stored on secure servers operated by reputable cloud
        infrastructure providers. We retain personal data only for as long
        as necessary to fulfil the purposes described in this policy, or as
        required by law. Where data is transferred outside your region, we
        take steps to ensure it remains protected in accordance with
        applicable data protection laws.
      </p>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Your rights concerning the processing of your personal data
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Depending on where you live, you may have the right to access,
        correct, delete, or export your personal data, and to object to or
        restrict certain processing. To exercise any of these rights,
        please contact us using the details below.
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-700">
        <li>The right to access the personal data we hold about you</li>
        <li>The right to request correction of inaccurate data</li>
        <li>The right to request deletion of your data</li>
        <li>The right to object to or restrict certain processing</li>
        <li>The right to data portability</li>
      </ul>

      <h2 className="text-2xl font-bold uppercase mt-10 mb-4">
        Contacting us
      </h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        If you have any questions about this privacy policy or how we
        handle your personal data, please get in touch with us.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Handhold, Inc.
        <br />
        548 Market Street, San Francisco, CA 94104
        <br />
        Email:{" "}
        <a
          href="mailto:support@handhold.io"
          className="underline hover:text-gray-900"
        >
          support@handhold.io
        </a>
      </p>
    </LegalLayout>
  );
}
