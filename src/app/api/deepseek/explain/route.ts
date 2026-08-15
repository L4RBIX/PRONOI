import { NextResponse } from "next/server";
import { z } from "zod";
import { decisionViewToExplainRequest, explainDecision } from "@/lib/pronoi/deepseekExplain";
import { getDecisionForProduct } from "@/server/pronoi/decisions";
import { PronoiError } from "@/server/pronoi/errors";

// Server-only route — DEEPSEEK_API_KEY never reaches the client. The client
// only ever sends a productId; the decision's computed numbers are looked
// up here from the database, never trusted from the request body, so the
// model can never be fed tampered or fabricated figures.
const bodySchema = z.object({
  productId: z.string().min(1),
  language: z.enum(["en", "ru", "kk"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    const decision = await getDecisionForProduct(parsed.data.productId);
    const explainRequest = decisionViewToExplainRequest(decision, parsed.data.language);
    const result = await explainDecision(explainRequest);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PronoiError && err.code === "NOT_FOUND") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[pronoi] /api/deepseek/explain failed:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
