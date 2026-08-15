"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { resetVoiceDemoAction } from "@/server/pronoi/voiceDemo";
import { useVoiceDemo } from "./useVoiceDemo";

/**
 * Shares one useVoiceDemo() instance between the Copilot widget and the
 * dashboard sidebar's standalone Reset button, so resetting from the
 * sidebar actually clears the mic-flow state (step counter, turns,
 * session) the Copilot is showing — not just the server-side demo data.
 */

interface VoiceDemoApi extends ReturnType<typeof useVoiceDemo> {
  /** Resets both the server-side demo data (real DB) and the client's step/turn state in one call. */
  resetAll: () => void;
  isResetting: boolean;
}

const VoiceDemoContext = createContext<VoiceDemoApi | null>(null);

export function VoiceDemoProvider({ children }: { children: ReactNode }) {
  const voiceDemo = useVoiceDemo();
  const [isResetting, startResetTransition] = useTransition();

  function resetAll() {
    startResetTransition(async () => {
      await resetVoiceDemoAction();
      voiceDemo.reset();
    });
  }

  return <VoiceDemoContext.Provider value={{ ...voiceDemo, resetAll, isResetting }}>{children}</VoiceDemoContext.Provider>;
}

/** Returns null outside a provider (e.g. on the public landing page). */
export function useVoiceDemoOptional(): VoiceDemoApi | null {
  return useContext(VoiceDemoContext);
}
