"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AgentIcon, ArrowUpIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/icons";
import { CopilotMessage } from "@/components/pronoi/CopilotMessage";
import { MicIcon, PendingActionCard, VoiceStatusLine } from "@/components/pronoi/voice/VoiceUi";
import type { CopilotActionDef } from "@/lib/pronoi/copilotActions";
import { sanitizeActionIds } from "@/lib/pronoi/copilotActions";
import { useCopilotUiOptional } from "@/lib/pronoi/copilotUi";
import { useVoiceDemo } from "@/lib/pronoi/voice/useVoiceDemo";
import { resetVoiceDemoAction } from "@/server/pronoi/voiceDemo";
import { cn } from "@/lib/utils";

const SAMPLE_QUESTIONS: Record<"landing" | "dashboard", string[]> = {
  landing: [
    "What does PRONOI do?",
    "How does PRONOI pick a supplier?",
    "Can PRONOI place orders automatically?",
  ],
  dashboard: [
    "What needs my attention today?",
    "Why is Milk high risk?",
    "Which supplier should I trust most?",
  ],
};

const TYPE_INTERVAL_MS = 40;
const PAUSE_AFTER_TYPED_MS = 1500;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: CopilotActionDef[];
}

function GradientAgentIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 via-amber-200 to-emerald-200",
        className
      )}
    >
      <AgentIcon className="h-3 w-3 text-black/60" />
    </div>
  );
}

export function Copilot({ scope }: { scope: "landing" | "dashboard" }) {
  const sampleQuestions = SAMPLE_QUESTIONS[scope];
  const sharedUi = useCopilotUiOptional();
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = sharedUi ? sharedUi.open : localExpanded;
  const setExpanded = sharedUi ? sharedUi.setOpen : setLocalExpanded;
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDashboard = scope === "dashboard";
  const voiceDemo = useVoiceDemo();
  const syncedVoiceCount = useRef(0);
  const [resettingDemo, startResetTransition] = useTransition();

  useEffect(() => {
    const turns = voiceDemo.turns;
    if (turns.length <= syncedVoiceCount.current) return;
    const newTurns = turns.slice(syncedVoiceCount.current);
    syncedVoiceCount.current = turns.length;
    setMessages((prev) => [...prev, ...newTurns.map((t) => ({ role: t.role === "user" ? ("user" as const) : ("assistant" as const), content: t.text }))]);
  }, [voiceDemo.turns]);

  function handleResetDemo() {
    startResetTransition(async () => {
      await resetVoiceDemoAction();
      voiceDemo.reset();
      syncedVoiceCount.current = 0;
      setMessages([]);
    });
  }

  useEffect(() => {
    if (expanded) return;
    let charIndex = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let pauseTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const currentQuestion = sampleQuestions[placeholderIndex];

    intervalId = setInterval(() => {
      charIndex += 1;
      setTypedText(currentQuestion.slice(0, charIndex));
      if (charIndex >= currentQuestion.length) {
        if (intervalId) clearInterval(intervalId);
        pauseTimeoutId = setTimeout(() => {
          setTypedText("");
          setPlaceholderIndex((prev) => (prev + 1) % sampleQuestions.length);
        }, PAUSE_AFTER_TYPED_MS);
      }
    }, TYPE_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
    };
  }, [expanded, placeholderIndex, sampleQuestions]);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, setExpanded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/deepseek/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, scope }),
      });
      const data = await res.json();
      // Never trust the network response's route/label — re-derive everything
      // from the local allowlist by ID only, so a tampered/unexpected payload
      // can never smuggle in an arbitrary route.
      const actionIds = Array.isArray(data.actions)
        ? data.actions.map((a: unknown) => (a && typeof a === "object" ? (a as { id?: unknown }).id : a))
        : [];
      const actions = sanitizeActionIds(actionIds);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: typeof data.reply === "string" ? data.reply : "Something went wrong.", actions },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't reach the copilot service. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {expanded && <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setExpanded(false)} />}

      <div
        ref={widgetRef}
        className={cn(
          "fixed right-4 bottom-4 z-50 transition-all duration-300 sm:right-6 sm:bottom-6",
          expanded ? "w-[min(92vw,420px)]" : "w-[min(80vw,280px)]"
        )}
      >
        {expanded ? (
          <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <GradientAgentIcon />
                <span className="text-sm font-medium">PRONOI Copilot</span>
              </div>
              <div className="flex items-center gap-2">
                {isDashboard && (
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    disabled={resettingDemo}
                    aria-label="Reset voice demo"
                    className="text-[10px] tracking-wide text-gray-300 uppercase hover:text-gray-500 disabled:opacity-50"
                  >
                    {resettingDemo ? "…" : "Reset"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Close"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-black"
                >
                  ✕
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400">Try asking:</p>
                  {sampleQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-2xl border px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => {
                const isLiveVoiceReply =
                  isDashboard && i === messages.length - 1 && m.role === "assistant" && (voiceDemo.uiState === "PROCESSING" || voiceDemo.uiState === "SPEAKING");
                return (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                        m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-black"
                      )}
                    >
                      {m.role === "assistant" ? (
                        isLiveVoiceReply ? (
                          voiceDemo.displayedReply || "…"
                        ) : (
                          <CopilotMessage content={m.content} actions={m.actions} />
                        )
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-3.5 py-2 text-sm text-gray-400">Thinking…</div>
                </div>
              )}
              {isDashboard && voiceDemo.uiState === "TRANSCRIBING" && (
                <div className="flex justify-end">
                  <div className="rounded-2xl bg-black/60 px-3.5 py-2 text-sm text-white">Распознаю речь…</div>
                </div>
              )}
              {isDashboard && voiceDemo.uiState === "PROCESSING" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-3.5 py-2 text-sm text-gray-400">Думаю…</div>
                </div>
              )}
              {isDashboard && voiceDemo.pendingAction && <PendingActionCard pendingAction={voiceDemo.pendingAction} />}
            </div>

            {isDashboard && <VoiceStatusLine uiState={voiceDemo.uiState} error={voiceDemo.errorMessage} />}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t px-4 py-3"
            >
              {isDashboard && (
                <button
                  type="button"
                  onClick={voiceDemo.handleMicClick}
                  disabled={voiceDemo.uiState === "TRANSCRIBING" || voiceDemo.uiState === "PROCESSING" || voiceDemo.uiState === "SPEAKING"}
                  aria-label={
                    voiceDemo.uiState === "LISTENING"
                      ? "Stop listening and send"
                      : `Voice demo step ${Math.min(voiceDemo.step + 1, voiceDemo.totalSteps)} of ${voiceDemo.totalSteps}`
                  }
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40",
                    voiceDemo.uiState === "LISTENING"
                      ? "animate-pulse bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <MicIcon className="h-4 w-4" />
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                autoFocus
                className="flex-1 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors disabled:bg-gray-100 disabled:text-gray-400"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full cursor-text items-center gap-2 rounded-full border border-black bg-black px-3 py-2 text-white shadow-lg transition-all duration-300"
          >
            <GradientAgentIcon />
            <span className="flex-1 truncate text-left text-white/70">
              {typedText}
              <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-white/70 align-middle" />
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
              <ArrowUpIcon className="h-4 w-4 text-white/70" />
            </span>
          </button>
        )}
      </div>
    </>
  );
}
