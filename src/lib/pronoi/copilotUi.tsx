"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface CopilotUiApi {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CopilotUiContext = createContext<CopilotUiApi | null>(null);

/** Lets the sidebar's "PRONOI Copilot" row open the same floating widget instance, instead of duplicating chat state. */
export function CopilotUiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <CopilotUiContext.Provider value={value}>{children}</CopilotUiContext.Provider>;
}

/** Returns null outside a provider (e.g. on the public landing page) — callers fall back to local state. */
export function useCopilotUiOptional(): CopilotUiApi | null {
  return useContext(CopilotUiContext);
}
