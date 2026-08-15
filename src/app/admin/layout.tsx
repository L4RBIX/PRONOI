import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin — PRONOI",
  description: "Platform administration for PRONOI.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-w-0 bg-white lg:pl-60">
      <AdminSidebar />
      <main className="mx-auto max-w-[80rem] px-4 py-8 pb-16 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
