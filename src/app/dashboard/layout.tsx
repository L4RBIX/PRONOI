import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Copilot } from "@/components/pronoi/Copilot";
import { DashboardSidebar } from "@/components/pronoi/DashboardSidebar";
import { CopilotUiProvider } from "@/lib/pronoi/copilotUi";
import { VoiceDemoProvider } from "@/lib/pronoi/voice/voiceDemoContext";

export const metadata: Metadata = {
  title: "Dashboard — PRONOI",
  description: "Today's procurement decisions for Mokka Coffee.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CopilotUiProvider>
      <VoiceDemoProvider>
        <div className="min-h-screen min-w-0 bg-white lg:pl-60">
          <DashboardSidebar />
          <main className="mx-auto max-w-[80rem] px-4 py-8 pb-28 sm:px-6 lg:px-10">{children}</main>
          <Copilot scope="dashboard" />
        </div>
      </VoiceDemoProvider>
    </CopilotUiProvider>
  );
}
