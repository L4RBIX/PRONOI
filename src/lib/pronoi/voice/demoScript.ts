import { PronoiError } from "@/server/pronoi/errors";
import { toolCompareSuppliers, toolConfirmPendingAction, toolGetDecision, toolPreparePurchaseOrder } from "@/server/pronoi/voiceTools";
import { DEMO_AUDIO_MAP } from "./demoAudio";
import type { VoiceAgentResponse, VoiceSessionContext } from "./types";

/**
 * The competition demo's fixed 4-step script. There is no speech
 * recognition and no live TTS — each mic click just advances to the next
 * step, and PRONOI's spoken response is always one of the 4 prerecorded
 * files. Only the CHOICE of which product the script talks about is
 * scripted (always "milk", matching the rehearsed audio's numbers); every
 * number, the supplier ranking, the prepared purchase, and the order
 * creation are still computed/executed for real by the same service layer
 * every other part of the dashboard uses.
 */

const DEMO_PRODUCT_ID = "milk";

function ok(partial: Omit<VoiceAgentResponse, "success">): VoiceAgentResponse {
  return { ...partial, success: true };
}

function errorResponse(session: VoiceSessionContext, message: string): VoiceAgentResponse {
  return { reply: message, demoAudioState: null, navigate: null, session, success: false, source: "deterministic" };
}

async function stepAttention(session: VoiceSessionContext): Promise<VoiceAgentResponse> {
  await toolGetDecision(DEMO_PRODUCT_ID); // real read — confirms the decision exists and is current before narrating it
  return ok({
    reply: DEMO_AUDIO_MAP.ATTENTION_RESPONSE.transcript,
    demoAudioState: "ATTENTION_RESPONSE",
    navigate: { kind: "DECISION", productId: DEMO_PRODUCT_ID },
    session: { ...session, activeProductId: DEMO_PRODUCT_ID },
    source: "deterministic",
  });
}

async function stepSupplierReasoning(session: VoiceSessionContext): Promise<VoiceAgentResponse> {
  const { rows } = await toolCompareSuppliers(DEMO_PRODUCT_ID);
  if (rows.length === 0) return errorResponse(session, "Для молока пока нет поставщиков для сравнения.");
  return ok({
    reply: DEMO_AUDIO_MAP.SUPPLIER_REASONING.transcript,
    demoAudioState: "SUPPLIER_REASONING",
    navigate: { kind: "SUPPLIER_COMPARISON", productId: DEMO_PRODUCT_ID },
    session: { ...session, activeProductId: DEMO_PRODUCT_ID, activeSupplierComparisonProductId: DEMO_PRODUCT_ID },
    source: "deterministic",
  });
}

async function stepPreparePurchase(session: VoiceSessionContext): Promise<VoiceAgentResponse> {
  try {
    const { pendingAction } = await toolPreparePurchaseOrder(DEMO_PRODUCT_ID);
    return ok({
      reply: DEMO_AUDIO_MAP.PURCHASE_CONFIRMATION.transcript,
      demoAudioState: "PURCHASE_CONFIRMATION",
      navigate: { kind: "DECISION", productId: DEMO_PRODUCT_ID },
      session: { ...session, activeProductId: DEMO_PRODUCT_ID, pendingAction },
      source: "deterministic",
    });
  } catch (err) {
    if (err instanceof PronoiError) return errorResponse(session, err.message);
    throw err;
  }
}

async function stepConfirmOrder(session: VoiceSessionContext): Promise<VoiceAgentResponse> {
  const pending = session.pendingAction;
  if (!pending) return errorResponse(session, "Нет подготовленной закупки для подтверждения. Начните демо заново.");
  try {
    const result = await toolConfirmPendingAction(pending);
    return ok({
      reply: DEMO_AUDIO_MAP.ORDER_CREATED.transcript,
      demoAudioState: "ORDER_CREATED",
      navigate: { kind: "ORDERS", highlightOrderId: result.purchaseOrder.id },
      session: { ...session, pendingAction: null },
      source: "deterministic",
    });
  } catch (err) {
    if (err instanceof PronoiError) return errorResponse(session, err.message);
    throw err;
  }
}

export type DemoStep = 1 | 2 | 3 | 4;

export async function runDemoStep(step: DemoStep, session: VoiceSessionContext): Promise<VoiceAgentResponse> {
  switch (step) {
    case 1:
      return stepAttention(session);
    case 2:
      return stepSupplierReasoning(session);
    case 3:
      return stepPreparePurchase(session);
    case 4:
      return stepConfirmOrder(session);
  }
}
