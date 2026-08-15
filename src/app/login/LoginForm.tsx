"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { GoogleIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/icons";

const inputClassName =
  "bg-transparent border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 w-full outline-none focus:border-white/40 transition-colors";

export function LoginForm() {
  const router = useRouter();

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/dashboard");
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className={inputClassName}
          />
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            type="submit"
            className="bg-white text-black rounded-full px-6 py-2.5 font-medium hover:bg-white/90 transition-colors"
          >
            Sign in
          </button>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Forgot password?
          </Link>
        </div>
      </form>

      <div className="flex items-center gap-4 text-xs text-gray-500 my-6">
        <span className="flex-1 border-t border-white/10" />
        OR
        <span className="flex-1 border-t border-white/10" />
      </div>

      <button
        type="button"
        className="w-full border border-white/15 rounded-full py-2.5 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
      >
        <GoogleIcon className="w-[18px] h-[18px]" />
        Continue with Google
      </button>
    </>
  );
}
