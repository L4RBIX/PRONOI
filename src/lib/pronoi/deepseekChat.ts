import { COPILOT_ACTIONS, sanitizeActionIds, type CopilotActionDef } from "./copilotActions";
import { KZT } from "./decisions";

/**
 * Server-only DeepSeek chat for the PRONOI copilot widget. On the dashboard,
 * the system prompt is grounded in a live snapshot pulled from the database
 * (getAllCurrentDecisions / getOrders / getPoolingOpportunities — the same
 * server service layer every dashboard page reads from) and computed by
 * calc.ts — the model is explicitly told never to invent a number that
 * isn't in that snapshot. On the landing page there's no business data to
 * ground it in, so it only answers general "how PRONOI works" questions. If
 * the API key is missing or the call fails, a deterministic fallback keeps
 * the widget useful without the LLM.
 *
 * DeepSeek is asked to reply with structured JSON: a plain-text message plus
 * zero or more action IDs from COPILOT_ACTIONS. It never returns a URL or
 * HTML — only an ID, which is validated against the allowlist before it's
 * ever trusted. If the model's output isn't valid JSON, we fall back to
 * treating the raw text as the message with no actions, so a formatting
 * slip never breaks the chat.
 */

export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

export type CopilotScope = "landing" | "dashboard";

export interface CopilotChatResult {
  reply: string;
  actions: CopilotActionDef[];
  source: "deepseek" | "fallback";
}

/**
 * Pulls current business state from the DB (decisions, orders, pooling) —
 * the same "tools" a function-calling model would use, just resolved
 * up-front by the server rather than requested by the model. This is the
 * only place chat context is assembled, so the model can never see
 * anything the server didn't actually read from the database.
 */
async function buildDashboardContextSnapshot(): Promise<string> {
  // Deferred imports: this module is imported by the API route AND
  // (type-only) elsewhere, but only actually needs Prisma-backed services
  // when a dashboard-scope chat happens — keeping the require inside the
  // function avoids pulling server/db into any accidental client bundle.
  const { getCurrentDemoBusinessId } = await import("@/server/pronoi/business");
  const { getAllCurrentDecisions } = await import("@/server/pronoi/decisions");
  const { getOrders } = await import("@/server/pronoi/orders");
  const { getPoolingOpportunities } = await import("@/server/pronoi/pooling");
  const { ORDER_STATUS_LABELS } = await import("./orderStatus");

  const businessId = await getCurrentDemoBusinessId();
  const [decisions, orders, pools] = await Promise.all([
    getAllCurrentDecisions(businessId),
    getOrders(businessId),
    getPoolingOpportunities(businessId),
  ]);

  const decisionLines = decisions.map((d) => {
    const recommended = d.supplierScores.find((s) => s.supplier.id === d.recommendedSupplierId);
    return `- ${d.product.name} (${d.product.category}): status=${d.status}, ${d.product.currentStock} ${d.product.unit} on hand, ${Math.round(d.stockoutRisk * 100)}% stockout risk, runs out in ${d.daysUntilStockout.toFixed(1)} days, ${KZT(d.revenueAtRisk)} revenue at risk, recommended order ${d.recommendedQty} ${d.product.unit} from ${recommended?.supplier.name ?? "n/a"} (total expected cost ${recommended ? KZT(recommended.totalExpectedCost) : "n/a"}).`;
  });

  const orderLines =
    orders.length === 0
      ? ["(no purchase orders yet)"]
      : orders.slice(0, 10).map((o) => {
          const item = o.items[0];
          return `- ${o.poNumber}: ${item?.quantity ?? "?"} ${item?.product.unit ?? ""} ${item?.product.name ?? ""} from ${o.supplier.name}, status=${ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}, ETA ${o.etaDays} days.`;
        });

  const poolLines =
    pools.length === 0
      ? ["(no open pooling opportunities)"]
      : pools.map(
          (p) =>
            `- ${p.productName}: ${p.combinedQuantity} ${p.unit} combined, you ${p.joined ? "have joined" : "have not joined"} this pool, pooled price ₸${p.pooledPrice}/${p.unit} vs ₸${p.individualPrice}/${p.unit} alone.`
        );

  return [
    "Live inventory & decisions:",
    decisionLines.join("\n"),
    "",
    "Purchase orders:",
    orderLines.join("\n"),
    "",
    "Demand pooling:",
    poolLines.join("\n"),
  ].join("\n");
}

function buildActionsCatalog(): string {
  const lines = COPILOT_ACTIONS.map((a) => `- ${a.id} — ${a.description}`);
  return `Available navigation actions (use the ID only, never a URL):\n${lines.join("\n")}`;
}

async function buildSystemPrompt(scope: CopilotScope): Promise<string> {
  const rules = [
    "You are the PRONOI copilot, a procurement decision assistant for small businesses.",
    "PRONOI predicts stockout risk, recommends reorder quantities, and ranks suppliers by expected total cost using a deterministic statistical model (normal demand-during-lead-time, safety stock, expected-cost supplier ranking) — not a black box and not deep learning.",
    "You must NEVER invent a number (risk %, quantity, price, day count, order status) that is not explicitly given to you in this prompt. If asked about something you don't have data for, say you don't have it rather than guessing.",
    "Answer in 1-4 short sentences, plain and confident, no marketing language.",
    buildActionsCatalog(),
    "When your answer naturally points the user to one of those destinations (e.g. you say 'open the dashboard' or 'check the suppliers page'), include the matching action ID in the actions array, and phrase the sentence so it naturally contains the destination's name (e.g. the word 'dashboard' or 'suppliers'). Only include an action ID when you are actually directing the user there — do not add actions that aren't relevant. Never invent an action ID that isn't in the list above, and never output a URL or HTML.",
    'Respond with ONLY a JSON object of the exact shape {"message": string, "actions": string[]}. No markdown, no code fences, no extra keys.',
  ];
  if (scope === "dashboard") {
    rules.push(await buildDashboardContextSnapshot());
  } else {
    rules.push(
      "This is the public landing page — you have no specific business data here. Answer general questions about how PRONOI works. If asked about live numbers, tell the user to open the dashboard to see it computed on real data."
    );
  }
  return rules.join("\n\n");
}

async function buildFallbackReply(scope: CopilotScope): Promise<{ message: string; actions: CopilotActionDef[] }> {
  if (scope === "dashboard") {
    try {
      const { getCurrentDemoBusinessId } = await import("@/server/pronoi/business");
      const { getAllCurrentDecisions } = await import("@/server/pronoi/decisions");
      const businessId = await getCurrentDemoBusinessId();
      const [top] = await getAllCurrentDecisions(businessId);
      const recommended = top.supplierScores.find((s) => s.supplier.id === top.recommendedSupplierId);
      return {
        message: `I can't reach the AI service right now, but here's what I can tell you directly: ${top.product.name} has the highest stockout risk today at ${Math.round(top.stockoutRisk * 100)}%, putting ${KZT(top.revenueAtRisk)} of revenue at risk. Recommended: order ${top.recommendedQty} ${top.product.unit} from ${recommended?.supplier.name ?? "a supplier"}.`,
        actions: sanitizeActionIds(["OPEN_DASHBOARD"]),
      };
    } catch {
      // DB unavailable too — degrade to the same generic fallback as the landing page.
    }
  }
  return {
    message:
      "I can't reach the AI service right now. PRONOI predicts stockout risk from your inventory data, recommends exact reorder quantities, and ranks suppliers by expected total cost — try the Decision Lab below to see it compute live.",
    actions: sanitizeActionIds(["OPEN_DECISION_LAB"]),
  };
}

function parseModelOutput(text: string): { message: string; actionIds: unknown } | null {
  let raw = text.trim();
  // Strip accidental markdown code fences, just in case the model doesn't follow instructions exactly.
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
      return { message: parsed.message, actionIds: parsed.actions };
    }
    return null;
  } catch {
    return null;
  }
}

export async function chatWithCopilot(messages: CopilotMessage[], scope: CopilotScope): Promise<CopilotChatResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const fallback = await buildFallbackReply(scope);
    return { reply: fallback.message, actions: fallback.actions, source: "fallback" };
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: await buildSystemPrompt(scope) }, ...messages.slice(-8)],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[pronoi] DeepSeek chat request failed: ${response.status} ${response.statusText} — ${body.slice(0, 300)}`);
      const fallback = await buildFallbackReply(scope);
      return { reply: fallback.message, actions: fallback.actions, source: "fallback" };
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error("[pronoi] DeepSeek chat returned no message content", JSON.stringify(data).slice(0, 300));
      const fallback = await buildFallbackReply(scope);
      return { reply: fallback.message, actions: fallback.actions, source: "fallback" };
    }

    const parsed = parseModelOutput(text);
    if (!parsed) {
      // Model didn't return valid structured JSON — degrade gracefully to
      // plain text rather than breaking the chat or showing raw JSON.
      return { reply: text, actions: [], source: "deepseek" };
    }
    return { reply: parsed.message, actions: sanitizeActionIds(parsed.actionIds), source: "deepseek" };
  } catch (err) {
    console.error("[pronoi] DeepSeek chat request threw:", err instanceof Error ? `${err.name}: ${err.message}` : err);
    const fallback = await buildFallbackReply(scope);
    return { reply: fallback.message, actions: fallback.actions, source: "fallback" };
  }
}
