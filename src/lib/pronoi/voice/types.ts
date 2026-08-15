/**
 * Shared types for PRONOI's scripted voice demo: a fixed 4-step sequence
 * (attention -> supplier reasoning -> prepare purchase -> confirm order),
 * each step triggered by a two-click mic interaction (click to listen,
 * click again to process), narrated by one of 4 prerecorded audio files.
 * No speech recognition, no live TTS — see demoScript.ts.
 */

/** Visible agent lifecycle state — drives the Copilot's status copy and mic button behavior. */
export type AgentUiState = "IDLE" | "LISTENING" | "TRANSCRIBING" | "PROCESSING" | "SPEAKING" | "ERROR";

/** The four demo states, each mapped to exactly one prerecorded file. */
export type DemoAudioState = "ATTENTION_RESPONSE" | "SUPPLIER_REASONING" | "PURCHASE_CONFIRMATION" | "ORDER_CREATED";

export interface PendingAction {
  decisionId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  etaDays: number;
}

/** Round-trips with every /api/voice/demo-step call so step 4 can resolve the purchase step 3 prepared. */
export interface VoiceSessionContext {
  activeProductId: string | null;
  activeSupplierComparisonProductId: string | null;
  pendingAction: PendingAction | null;
}

export function emptySessionContext(): VoiceSessionContext {
  return { activeProductId: null, activeSupplierComparisonProductId: null, pendingAction: null };
}

/** Client-side navigation instruction — routes are resolved locally, never trusted from the network as a raw URL. */
export type VoiceNavigateTarget =
  | { kind: "DECISION"; productId: string }
  | { kind: "SUPPLIER_COMPARISON"; productId: string }
  | { kind: "ORDERS"; highlightOrderId?: string }
  | { kind: "INVENTORY" }
  | { kind: "POOLING" }
  | { kind: "SIMULATION"; productId?: string }
  | { kind: "DASHBOARD" };

export interface VoiceAgentResponse {
  reply: string;
  demoAudioState: DemoAudioState | null;
  navigate: VoiceNavigateTarget | null;
  session: VoiceSessionContext;
  success: boolean;
  source: "deterministic";
}
