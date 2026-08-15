import type { PendingAction } from "@/lib/pronoi/voice/types";
import { approveDecision, getDecisionForProduct, type DecisionView } from "./decisions";
import { PronoiError } from "./errors";
import { getSupplierComparison, type SupplierComparisonRow } from "./suppliers";

/**
 * The small set of real service-layer calls the voice demo script uses.
 * No business logic is duplicated here — every function is a thin wrapper
 * over the same src/server/pronoi/* functions the dashboard pages and
 * Server Actions already call, plus the prepare/confirm split so a
 * consequential write only ever happens after explicit confirmation.
 */

export async function toolGetDecision(productId: string): Promise<DecisionView> {
  return getDecisionForProduct(productId);
}

export async function toolCompareSuppliers(productId: string): Promise<{ decision: DecisionView; rows: SupplierComparisonRow[] }> {
  const [decision, rows] = await Promise.all([getDecisionForProduct(productId), getSupplierComparison(productId)]);
  return { decision, rows };
}

export interface PreparePurchaseResult {
  decision: DecisionView;
  pendingAction: PendingAction;
}

/** No DB write — computes exactly what approveDecision would create, for the confirmation card. */
export async function toolPreparePurchaseOrder(productId: string): Promise<PreparePurchaseResult> {
  const decision = await getDecisionForProduct(productId);
  if (decision.status !== "PENDING") {
    throw new PronoiError("DECISION_NOT_PENDING", `Решение по ${decision.product.name} уже ${decision.status === "APPROVED" ? "одобрено" : "отклонено"}.`);
  }
  const supplierScore = decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId);
  if (!supplierScore) throw new PronoiError("NO_SUPPLIER_RECOMMENDATION", "Для этого товара пока нет рекомендованного поставщика.");

  const totalAmount = Math.round(supplierScore.supplier.pricePerUnit * decision.recommendedQty);
  return {
    decision,
    pendingAction: {
      decisionId: decision.id,
      productId: decision.product.id,
      productName: decision.product.name,
      quantity: decision.recommendedQty,
      unit: decision.product.unit,
      supplierId: supplierScore.supplier.id,
      supplierName: supplierScore.supplier.name,
      totalAmount,
      etaDays: Math.round(supplierScore.supplier.avgLeadTimeDays * 10) / 10,
    },
  };
}

/**
 * The only function in this file that mutates state. Only ever called
 * after the client has confirmed the exact pendingAction it is passed.
 */
export async function toolConfirmPendingAction(pending: PendingAction): Promise<Awaited<ReturnType<typeof approveDecision>>> {
  return approveDecision(pending.decisionId);
}
