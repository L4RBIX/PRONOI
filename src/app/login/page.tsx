import type { Metadata } from "next";
import Link from "next/link";

import { AuthLayout } from "@/components/sites/handhold-io-1ee60dfc/login-7e93fba0/AuthLayout";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — PRONOI",
  description: "Sign in to your PRONOI account.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold underline text-white">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
