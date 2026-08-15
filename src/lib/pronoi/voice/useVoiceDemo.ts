"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_AUDIO_MAP, DEMO_USER_LINES } from "./demoAudio";
import { emptySessionContext, type AgentUiState, type DemoAudioState, type VoiceAgentResponse, type VoiceNavigateTarget, type VoiceSessionContext } from "./types";

/**
 * Deterministic 4-step voice demo, driven by a two-click mic interaction —
 * no timers ever auto-trigger anything:
 *
 *   IDLE --(click 1)--> LISTENING (purely visual, nothing executes)
 *   LISTENING --(click 2)--> PROCESSING (now the real step executes)
 *   PROCESSING --(response arrives)--> SPEAKING (audio + transcript)
 *   SPEAKING --(audio ends)--> IDLE
 *
 * The internal step counter only advances once the second click's step has
 * actually succeeded — never on the first click, never on failure.
 */

const TOTAL_STEPS = 4;
/**
 * Minimum perceived "thinking" time after the second click, so PRONOI never
 * appears to answer instantly. The first question gets a slightly longer
 * pause — it's the audience's first impression of the agent "working".
 */
const MIN_THINKING_MS_BY_STEP: Record<1 | 2 | 3 | 4, number> = { 1: 1700, 2: 1300, 3: 1300, 4: 1300 };
/** Brief pause after the second click, before the spoken line appears as text — stands in for "converting speech to text". */
const TRANSCRIBE_PAUSE_MS = 550;

function resolveRoute(target: VoiceNavigateTarget): string {
  switch (target.kind) {
    case "DECISION":
      return `/dashboard/decisions/${target.productId}`;
    case "SUPPLIER_COMPARISON":
      return `/dashboard/decisions/${target.productId}?focus=suppliers`;
    case "ORDERS":
      return target.highlightOrderId ? `/dashboard/orders?highlight=${target.highlightOrderId}` : "/dashboard/orders";
    case "INVENTORY":
      return "/dashboard/inventory";
    case "POOLING":
      return "/dashboard/pooling";
    case "SIMULATION":
      return "/dashboard/simulation";
    case "DASHBOARD":
      return "/dashboard";
  }
}

export interface DemoTurn {
  role: "user" | "agent";
  text: string;
  demoAudioState?: DemoAudioState;
}

export function useVoiceDemo() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uiState, setUiState] = useState<AgentUiState>("IDLE");
  const [session, setSession] = useState<VoiceSessionContext>(emptySessionContext());
  const [turns, setTurns] = useState<DemoTurn[]>([]);
  const [displayedReply, setDisplayedReply] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uiStateRef = useRef<AgentUiState>("IDLE");
  const sessionRef = useRef(session);
  const stepRef = useRef(step);
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload all 4 demo files on mount so the very first play is instant.
  useEffect(() => {
    if (typeof window === "undefined") return;
    Object.values(DEMO_AUDIO_MAP).forEach((entry) => {
      const audio = new Audio(entry.src);
      audio.preload = "auto";
    });
  }, []);

  useEffect(
    () => () => {
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);
      audioRef.current?.pause();
    },
    []
  );

  const revealProgressively = useCallback((text: string, durationMs: number) => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    setDisplayedReply("");
    const words = text.split(" ").filter(Boolean);
    if (words.length === 0) return;
    let idx = 0;
    const stepMs = Math.max(30, durationMs / words.length);
    revealTimerRef.current = setInterval(() => {
      idx += 1;
      setDisplayedReply(words.slice(0, idx).join(" "));
      if (idx >= words.length && revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }, stepMs);
  }, []);

  const playDemoAudio = useCallback(
    (state: DemoAudioState) => {
      const entry = DEMO_AUDIO_MAP[state];
      const audio = new Audio(entry.src);
      audioRef.current = audio;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        setUiState("IDLE");
      };
      // Playback failure (blocked autoplay, missing file, mid-play error) must
      // never leave the demo stuck — show the full line once and stop. Must
      // also cancel any in-flight reveal interval, otherwise its next tick
      // overwrites this full text with a partial word a moment later, which
      // looks like the response "flashing and disappearing".
      const showFullTextAndStop = () => {
        if (revealTimerRef.current) {
          clearInterval(revealTimerRef.current);
          revealTimerRef.current = null;
        }
        setDisplayedReply(entry.transcript);
        finish();
      };
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", showFullTextAndStop);
      // Only start the word-by-word reveal once playback has actually
      // started — starting it eagerly races with a rejected play() promise.
      audio
        .play()
        .then(() => revealProgressively(entry.transcript, entry.durationMs))
        .catch(showFullTextAndStop);
    },
    [revealProgressively]
  );

  const handleResponse = useCallback(
    (res: VoiceAgentResponse) => {
      setSession(res.session);

      if (!res.success) {
        setErrorMessage(res.reply);
        setDisplayedReply(res.reply);
        setUiState("ERROR");
        return;
      }
      setErrorMessage(null);
      if (res.demoAudioState) {
        setTurns((prev) => [...prev, { role: "agent", text: res.reply, demoAudioState: res.demoAudioState as DemoAudioState }]);
      }

      const speak = () => {
        setUiState("SPEAKING");
        if (res.demoAudioState) {
          playDemoAudio(res.demoAudioState);
        } else {
          // No audio for this step (a real-data edge case) — show the text and return to idle immediately.
          setDisplayedReply(res.reply);
          setUiState("IDLE");
        }
      };

      if (res.navigate) {
        router.push(resolveRoute(res.navigate));
        // Give the route transition a beat to visually land before speaking over it.
        setTimeout(speak, 450);
      } else {
        speak();
      }
    },
    [playDemoAudio, router]
  );

  /** Executes the current step for real — only ever called from the second click. */
  const processCurrentStep = useCallback(async () => {
    if (stepRef.current >= TOTAL_STEPS) {
      setDisplayedReply("Демо завершено. Нажмите «Reset», чтобы начать заново.");
      setUiState("IDLE");
      return;
    }

    const nextStep = (stepRef.current + 1) as 1 | 2 | 3 | 4;
    setErrorMessage(null);
    setDisplayedReply("");
    setUiState("TRANSCRIBING");

    // A brief pause before the spoken line appears as text, so it reads as
    // "converting speech to text" rather than text just materializing on click.
    await new Promise((resolve) => setTimeout(resolve, TRANSCRIBE_PAUSE_MS));

    setTurns((prev) => [...prev, { role: "user", text: DEMO_USER_LINES[nextStep] }]);
    setUiState("PROCESSING");

    const startedAt = Date.now();
    try {
      const res = await fetch("/api/voice/demo-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: nextStep, session: sessionRef.current }),
      });
      const data = (await res.json()) as VoiceAgentResponse | { error: string };
      if (!res.ok || "error" in data) {
        setUiState("ERROR");
        setErrorMessage("error" in data ? data.error : "Что-то пошло не так. Попробуйте ещё раз.");
        return;
      }
      // Never answer instantly — pad out to a minimum "thinking" duration, but
      // never add extra wait if the request itself already took that long.
      const remaining = MIN_THINKING_MS_BY_STEP[nextStep] - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      // The step counter advances only now — after the second click's step has actually succeeded.
      setStep(nextStep);
      handleResponse(data);
    } catch {
      setUiState("ERROR");
      setErrorMessage("Не удалось выполнить шаг демо. Проверьте соединение и попробуйте снова.");
    }
  }, [handleResponse]);

  /**
   * The single mic-button handler. Dispatches purely on the current visible
   * state — IDLE starts listening (visual only, nothing executes), LISTENING
   * triggers real execution. PROCESSING/SPEAKING/ERROR are no-ops here; the
   * button is disabled for PROCESSING/SPEAKING in the UI, and ERROR resets
   * to IDLE on click so the user isn't stuck.
   */
  const handleMicClick = useCallback(() => {
    const current = uiStateRef.current;
    if (current === "IDLE") {
      setErrorMessage(null);
      setUiState("LISTENING");
      return;
    }
    if (current === "LISTENING") {
      processCurrentStep();
      return;
    }
    if (current === "ERROR") {
      setErrorMessage(null);
      setUiState("IDLE");
    }
  }, [processCurrentStep]);

  const reset = useCallback(() => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    audioRef.current?.pause();
    setStep(0);
    setSession(emptySessionContext());
    setTurns([]);
    setDisplayedReply("");
    setErrorMessage(null);
    setUiState("IDLE");
  }, []);

  return {
    step,
    totalSteps: TOTAL_STEPS,
    uiState,
    turns,
    displayedReply,
    errorMessage,
    pendingAction: session.pendingAction,
    handleMicClick,
    reset,
  };
}
