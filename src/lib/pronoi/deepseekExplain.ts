import type { Decision } from "./decisions";
import { KZT } from "./decisions";
import type { DecisionView } from "@/server/pronoi/decisions";

/**
 * Server-only DeepSeek integration. The statistical engine (calc.ts) always
 * computes every number first — this module only asks DeepSeek to *phrase*
 * those already-computed values into an owner-facing explanation. The
 * prompt explicitly forbids DeepSeek from inventing or adjusting any figure.
 * If the API key is missing or the call fails, a deterministic template
 * (buildFallbackExplanation) is used instead, so the product never depends
 * on the LLM being available.
 */

export interface DecisionExplainRequest {
  product: string;
  unit: string;
  currentStock: number;
  stockoutProbability: number;
  expectedRevenueAtRisk: number;
  recommendedQuantity: number;
  recommendedSupplier: string;
  supplierReasoning: {
    name: string;
    pricePerUnit: number;
    onTimeRate: number;
    totalExpectedCost: number;
  }[];
  daysUntilStockout: number;
  language?: "en" | "ru" | "kk";
}

export function decisionToExplainRequest(decision: Decision, language: DecisionExplainRequest["language"] = "en"): DecisionExplainRequest {
  return {
    product: decision.product.name,
    unit: decision.product.unit,
    currentStock: decision.product.currentStock,
    stockoutProbability: Math.round(decision.stockoutProbability * 1000) / 1000,
    expectedRevenueAtRisk: Math.round(decision.revenueAtRisk),
    recommendedQuantity: decision.recommendedQuantity,
    recommendedSupplier: decision.recommendedSupplier.supplier.name,
    supplierReasoning: decision.supplierScores.map((s) => ({
      name: s.supplier.name,
      pricePerUnit: s.supplier.pricePerUnit,
      onTimeRate: s.supplier.onTimeRate,
      totalExpectedCost: Math.round(s.totalExpectedCost),
    })),
    daysUntilStockout: Math.round(decision.daysUntilStockout * 10) / 10,
    language,
  };
}

/** Same request shape, built from the DB-backed DecisionView instead of the demoData-based Decision. */
export function decisionViewToExplainRequest(decision: DecisionView, language: DecisionExplainRequest["language"] = "en"): DecisionExplainRequest {
  const recommended = decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId) ?? decision.supplierScores[0];
  return {
    product: decision.product.name,
    unit: decision.product.unit,
    currentStock: decision.product.currentStock,
    stockoutProbability: Math.round(decision.stockoutRisk * 1000) / 1000,
    expectedRevenueAtRisk: Math.round(decision.revenueAtRisk),
    recommendedQuantity: decision.recommendedQty,
    recommendedSupplier: recommended?.supplier.name ?? "a supplier",
    supplierReasoning: decision.supplierScores.map((s) => ({
      name: s.supplier.name,
      pricePerUnit: s.supplier.pricePerUnit,
      onTimeRate: s.supplier.onTimeRate,
      totalExpectedCost: Math.round(s.totalExpectedCost),
    })),
    daysUntilStockout: Math.round(decision.daysUntilStockout * 10) / 10,
    language,
  };
}

export function buildFallbackExplanation(req: DecisionExplainRequest): string {
  const pct = Math.round(req.stockoutProbability * 100);
  const cheapest = [...req.supplierReasoning].sort((a, b) => a.pricePerUnit - b.pricePerUnit)[0];
  const recommended = req.supplierReasoning.find((s) => s.name === req.recommendedSupplier) ?? req.supplierReasoning[0];
  const sentences = [
    `${req.product} has an ${pct}% chance of running out within the next ${req.daysUntilStockout} days, which would put about ${KZT(req.expectedRevenueAtRisk)} of revenue at risk.`,
    `Ordering ${req.recommendedQuantity} ${req.unit} from ${req.recommendedSupplier} today covers the gap.`,
  ];
  if (cheapest && recommended && cheapest.name !== recommended.name) {
    sentences.push(
      `${cheapest.name} is cheaper per unit, but its lower on-time rate (${Math.round(cheapest.onTimeRate * 100)}%) raises its expected total cost above ${recommended.name}'s (${KZT(recommended.totalExpectedCost)} vs ${KZT(cheapest.totalExpectedCost)}), so ${recommended.name} is the safer buy overall.`
    );
  }
  return sentences.join(" ");
}

function buildPrompt(req: DecisionExplainRequest): string {
  return [
    "You are writing a one-to-three sentence explanation for a small business owner using a procurement decision tool called PRONOI.",
    "You are given ALREADY-COMPUTED numbers. Do not invent, adjust, round differently, or estimate any number that is not explicitly provided below.",
    "Only explain and contextualize the given values in plain, confident, financially-grounded language. No marketing language, no mention of AI or machine learning.",
    req.language && req.language !== "en" ? `Respond in ${req.language === "ru" ? "Russian" : "Kazakh"}.` : "Respond in English.",
    "",
    "Computed data:",
    JSON.stringify(req, null, 2),
  ].join("\n");
}

export async function explainDecision(req: DecisionExplainRequest): Promise<{ explanation: string; source: "deepseek" | "fallback" }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { explanation: buildFallbackExplanation(req), source: "fallback" };
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
        temperature: 0.2,
        max_tokens: 220,
        messages: [{ role: "user", content: buildPrompt(req) }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { explanation: buildFallbackExplanation(req), source: "fallback" };
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { explanation: buildFallbackExplanation(req), source: "fallback" };
    }
    return { explanation: text, source: "deepseek" };
  } catch {
    return { explanation: buildFallbackExplanation(req), source: "fallback" };
  }
}
