import type { DemoAudioState } from "./types";

/**
 * Central mapping from semantic agent state -> prerecorded demo audio. This
 * is the ONLY place the four demo files are referenced. Matching happens by
 * semantic state (what kind of thing the agent is telling the user), never
 * by comparing exact strings — the agent reaches a state like
 * SUPPLIER_REASONING through real tool execution on real data, and this map
 * just decides which recording narrates it while in Demo Mode.
 *
 * Durations are probed once (afinfo) — used for progressive transcript
 * reveal so the on-screen text doesn't dump all at once.
 */
export interface DemoAudioEntry {
  src: string;
  transcript: string;
  durationMs: number;
}

export const DEMO_AUDIO_MAP: Record<DemoAudioState, DemoAudioEntry> = {
  ATTENTION_RESPONSE: {
    src: "/audio/pronoi/11.mp3",
    transcript:
      "Самая критичная позиция — молоко. При текущем спросе оно может закончиться через два дня. Риск дефицита — 86%, под угрозой около 68 тысяч тенге выручки. Я рекомендую заказать 42 литра сегодня.",
    durationMs: 17_737,
  },
  SUPPLIER_REASONING: {
    src: "/audio/pronoi/22.mp3",
    transcript:
      "Supplier B дешевле на 40 тенге за литр, но только 71% его поставок приходят вовремя. После учёта риска его ожидаемая стоимость значительно выше. Поэтому я рекомендую Supplier A.",
    durationMs: 13_793,
  },
  PURCHASE_CONFIRMATION: {
    src: "/audio/pronoi/33.mp3",
    transcript: "Закупка 42 литров подготовлена. Подтвердить?",
    durationMs: 3_370,
  },
  ORDER_CREATED: {
    src: "/audio/pronoi/44.mp3",
    transcript: "Заказ создан. Я буду отслеживать его до доставки.",
    durationMs: 3_370,
  },
};

export const DEMO_AUDIO_STATES = Object.keys(DEMO_AUDIO_MAP) as DemoAudioState[];

/**
 * The rehearsed human line for each step — shown as a caption once the
 * second mic click "sends" it, so the audience can follow along on screen.
 * This is NOT speech recognition: the whole demo is scripted, so the line
 * is known in advance rather than transcribed live.
 */
export const DEMO_USER_LINES: Record<1 | 2 | 3 | 4, string> = {
  1: "PRONOI, что сегодня требует моего внимания?",
  2: "Почему Supplier A, если Supplier B дешевле?",
  3: "Тогда оформи заказ.",
  4: "Да, подтверждаю.",
};
