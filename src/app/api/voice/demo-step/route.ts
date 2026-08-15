import { NextResponse } from "next/server";
import { z } from "zod";
import { runDemoStep } from "@/lib/pronoi/voice/demoScript";
import { emptySessionContext, type VoiceSessionContext } from "@/lib/pronoi/voice/types";

const pendingActionSchema = z
  .object({
    decisionId: z.string(),
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    unit: z.string(),
    supplierId: z.string(),
    supplierName: z.string(),
    totalAmount: z.number(),
    etaDays: z.number(),
  })
  .nullable();

const sessionSchema = z.object({
  activeProductId: z.string().nullable(),
  activeSupplierComparisonProductId: z.string().nullable(),
  pendingAction: pendingActionSchema,
});

const requestSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  session: sessionSchema.optional(),
});

/** Advances the scripted 4-step voice demo by exactly one step. No transcript, no NLU — the step number IS the input. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const session: VoiceSessionContext = parsed.data.session ?? emptySessionContext();

  try {
    const result = await runDemoStep(parsed.data.step, session);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "PRONOI не смог выполнить этот шаг демо. Попробуйте ещё раз.", session }, { status: 500 });
  }
}
