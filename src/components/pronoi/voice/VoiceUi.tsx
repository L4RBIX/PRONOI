import type { SVGProps } from "react";
import { KZT } from "@/lib/pronoi/decisions";
import type { AgentUiState, PendingAction } from "@/lib/pronoi/voice/types";
import { cn } from "@/lib/utils";

export function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_LABEL: Record<AgentUiState, string | null> = {
  IDLE: null,
  LISTENING: "Слушаю… (нажмите ещё раз, чтобы отправить)",
  TRANSCRIBING: "Распознаю речь…",
  PROCESSING: "Думаю…",
  SPEAKING: "Говорю…",
  ERROR: "Ошибка",
};

export function VoiceStatusLine({ uiState, error }: { uiState: AgentUiState; error: string | null }) {
  const label = uiState === "ERROR" ? error : STATUS_LABEL[uiState];
  if (!label) return null;
  return (
    <div className="flex items-center gap-1.5 px-4 pb-1 text-xs text-gray-500">
      {(uiState === "LISTENING" || uiState === "TRANSCRIBING" || uiState === "PROCESSING" || uiState === "SPEAKING") && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black/60" />
        </span>
      )}
      <span className={cn(uiState === "ERROR" && "text-red-600")}>{label}</span>
    </div>
  );
}

/** Purely informational — the next mic click (the scripted step 4) is what confirms it, not a button here. */
export function PendingActionCard({ pendingAction }: { pendingAction: PendingAction }) {
  return (
    <div className="rounded-2xl border border-black bg-white p-4 text-sm shadow-sm">
      <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Ожидает подтверждения</p>
      <p className="mt-1 font-medium">
        {pendingAction.quantity} {pendingAction.unit} {pendingAction.productName}
      </p>
      <p className="mt-0.5 text-gray-500">
        {pendingAction.supplierName} · {KZT(pendingAction.totalAmount)} · поставка через {pendingAction.etaDays} дн.
      </p>
    </div>
  );
}
