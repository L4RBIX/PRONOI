import { NextResponse } from "next/server";
import { chatWithCopilot, type CopilotMessage, type CopilotScope } from "@/lib/pronoi/deepseekChat";

// Server-only route — DEEPSEEK_API_KEY never reaches the client.
export async function POST(request: Request) {
  let body: { messages: CopilotMessage[]; scope?: CopilotScope };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const result = await chatWithCopilot(body.messages, body.scope ?? "landing");
  return NextResponse.json(result);
}
