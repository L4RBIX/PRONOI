import type { Metadata } from "next";
import Link from "next/link";

import { AuthLayout } from "@/components/sites/handhold-io-1ee60dfc/login-7e93fba0/AuthLayout";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Sign up — PRONOI",
  description: "Create your PRONOI account.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Welcome to PRONOI"
      subtitle={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold underline text-white">
            Sign in
          </Link>
        </>
      }
      showTrustedBy
    >
      <RegisterForm />
    </AuthLayout>
  );
}
