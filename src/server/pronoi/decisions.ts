import type { Prisma, Product as DbProduct } from "@/generated/prisma/client";
import {
  assessStockoutRisk,
  computeRevenueAtRisk,
  projectDaysUntilStockout,
  recommendReorderQuantity,
  riskLevelFor,
  scoreSuppliers,
  type RiskLevel,
  type SupplierScore,
} from "@/lib/pronoi/calc";
import { prisma } from "@/server/db";
import { toDemandInputs, toSupplierOffer } from "./adapters";
import { writeAuditEvent } from "./audit";
import { PronoiError } from "./errors";

type Tx = Prisma.TransactionClient | typeof prisma;

interface DecisionSnapshot {
  stockoutRisk: number;
  revenueAtRisk: number;
  recommendedQty: number;
  recommendedSupplierId: string | null;
  expectedDemandLeadTime: number;
  demandStdLeadTime: number;
  safetyStock: number;
  zScore: number;
  daysUntilStockout: number;
}

async function getSupplierScores(tx: Tx, product: DbProduct): Promise<SupplierScore[]> {
  const supplierProducts = await tx.supplierProduct.findMany({
    where: { productId: product.id, isActive: true, supplier: { active: true } },
    include: { supplier: true },
  });
  if (supplierProducts.length === 0) return [];

  const suppliers = supplierProducts.map(toSupplierOffer);
  const reorder = recommendReorderQuantity(toDemandInputs(product));
  const quantityForScoring = reorder.recommendedQuantity || product.avgDailyDemand * product.leadTimeDays;
  const revenueAtRiskPerDay = product.unitRevenue * product.avgDailyDemand;
  return scoreSuppliers(suppliers, quantityForScoring, revenueAtRiskPerDay);
}

/**
 * Resolves the target service level for a product's reorder calculation:
 * an active admin-configured AutoOrderRule (src/app/admin/rules) for the
 * product's category, preferring one scoped to the business's businessType
 * over a global (businessType: null) rule, falling back to the product's
 * own serviceLevel field. This is the real connection between the admin
 * panel's rule editor and the live decision engine — editing a rule's
 * target service level changes the actual recommended quantity/safety
 * stock on the next read, not just what's displayed in the admin table.
 */
async function resolveServiceLevel(tx: Tx, product: DbProduct): Promise<number> {
  const business = await tx.business.findUnique({ where: { id: product.businessId }, select: { businessType: true } });
  if (business?.businessType) {
    const specific = await tx.autoOrderRule.findFirst({
      where: { active: true, category: product.category, businessType: business.businessType },
    });
    if (specific) return specific.targetServiceLevel;
  }
  const global = await tx.autoOrderRule.findFirst({ where: { active: true, category: product.category, businessType: null } });
  return global?.targetServiceLevel ?? product.serviceLevel;
}

async function computeSnapshot(tx: Tx, product: DbProduct): Promise<{ snapshot: DecisionSnapshot; supplierScores: SupplierScore[] }> {
  const supplierScores = await getSupplierScores(tx, product);
  const inputs = toDemandInputs(product);
  const risk = assessStockoutRisk(inputs);
  const serviceLevel = await resolveServiceLevel(tx, product);
  const reorder = recommendReorderQuantity(inputs, serviceLevel);
  const revenueAtRisk = computeRevenueAtRisk(risk.expectedShortageUnits, product.unitRevenue);
  const { days } = projectDaysUntilStockout(product.currentStock, product.avgDailyDemand);

  return {
    snapshot: {
      stockoutRisk: risk.stockoutProbability,
      revenueAtRisk,
      recommendedQty: reorder.recommendedQuantity,
      recommendedSupplierId: supplierScores[0]?.supplier.id ?? null,
      expectedDemandLeadTime: risk.expectedDemandDuringLeadTime,
      demandStdLeadTime: risk.leadTimeDemandStdDev,
      safetyStock: reorder.safetyStock,
      zScore: risk.z,
      daysUntilStockout: days,
    },
    supplierScores,
  };
}

export interface DecisionView {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  riskLevel: RiskLevel;
  stockoutRisk: number;
  revenueAtRisk: number;
  recommendedQty: number;
  recommendedSupplierId: string | null;
  expectedDemandLeadTime: number;
  demandStdLeadTime: number;
  safetyStock: number;
  zScore: number;
  daysUntilStockout: number;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  product: DbProduct;
  supplierScores: SupplierScore[];
}

/**
 * The "current" decision for a product: recomputed in place on every read
 * while PENDING (so the numbers are always fresh), frozen once
 * APPROVED/REJECTED (so approval history stays exactly what was approved).
 * riskLevel is derived from stockoutRisk on the way out, never stored.
 */
export async function getOrCreateCurrentDecision(productId: string, tx: Tx = prisma): Promise<DecisionView> {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) throw new PronoiError("NOT_FOUND", `Product ${productId} not found.`);

  const latest = await tx.decision.findFirst({ where: { productId }, orderBy: { createdAt: "desc" } });

  if (latest && latest.status !== "PENDING") {
    const supplierScores = await getSupplierScores(tx, product);
    return toView(latest, product, supplierScores);
  }

  const { snapshot, supplierScores } = await computeSnapshot(tx, product);
  const decision = latest
    ? await tx.decision.update({ where: { id: latest.id }, data: snapshot })
    : await tx.decision.create({ data: { businessId: product.businessId, productId, status: "PENDING", ...snapshot } });

  return toView(decision, product, supplierScores);
}

function toView(
  decision: {
    id: string;
    status: string;
    stockoutRisk: number;
    revenueAtRisk: number;
    recommendedQty: number;
    recommendedSupplierId: string | null;
    expectedDemandLeadTime: number;
    demandStdLeadTime: number;
    safetyStock: number;
    zScore: number;
    daysUntilStockout: number;
    approvedAt: Date | null;
    rejectedAt: Date | null;
    createdAt: Date;
  },
  product: DbProduct,
  supplierScores: SupplierScore[]
): DecisionView {
  return {
    id: decision.id,
    status: decision.status as DecisionView["status"],
    riskLevel: riskLevelFor(decision.stockoutRisk),
    stockoutRisk: decision.stockoutRisk,
    revenueAtRisk: decision.revenueAtRisk,
    recommendedQty: decision.recommendedQty,
    recommendedSupplierId: decision.recommendedSupplierId,
    expectedDemandLeadTime: decision.expectedDemandLeadTime,
    demandStdLeadTime: decision.demandStdLeadTime,
    safetyStock: decision.safetyStock,
    zScore: decision.zScore,
    daysUntilStockout: decision.daysUntilStockout,
    approvedAt: decision.approvedAt,
    rejectedAt: decision.rejectedAt,
    createdAt: decision.createdAt,
    product,
    supplierScores,
  };
}

/** All products' current decisions for a business, ranked most-urgent first. */
export async function getAllCurrentDecisions(businessId: string): Promise<DecisionView[]> {
  const products = await prisma.product.findMany({ where: { businessId }, orderBy: { name: "asc" } });
  const decisions = await Promise.all(products.map((p) => getOrCreateCurrentDecision(p.id)));
  return decisions.sort((a, b) => b.stockoutRisk - a.stockoutRisk);
}

export async function getDecisionForProduct(productId: string): Promise<DecisionView> {
  return getOrCreateCurrentDecision(productId);
}

async function nextPoNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.purchaseOrder.count();
  return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
}

export interface ApproveDecisionResult {
  decision: DecisionView;
  purchaseOrder: Prisma.PurchaseOrderGetPayload<{ include: { items: true; supplier: true } }>;
  alreadyApproved: boolean;
}

/**
 * Approves a decision and creates its purchase order in one transaction.
 * Idempotent: a PurchaseOrder.decisionId is unique, so re-approving (double
 * click, retried request) returns the already-created order instead of
 * erroring or duplicating it — both via an up-front check and, for the
 * concurrent-request race, by catching the DB's own unique-constraint
 * violation and re-reading.
 */
export async function approveDecision(decisionId: string): Promise<ApproveDecisionResult> {
  const attempt = async () => {
    return prisma.$transaction(async (tx) => {
      const decision = await tx.decision.findUnique({
        where: { id: decisionId },
        include: { purchaseOrder: { include: { items: true, supplier: true } }, product: true },
      });
      if (!decision) throw new PronoiError("NOT_FOUND", `Decision ${decisionId} not found.`);

      if (decision.purchaseOrder) {
        const view = toView(decision, decision.product, await getSupplierScores(tx, decision.product));
        return { decision: view, purchaseOrder: decision.purchaseOrder, alreadyApproved: true };
      }
      if (decision.status !== "PENDING") {
        throw new PronoiError("DECISION_NOT_PENDING", `Decision is already ${decision.status.toLowerCase()}.`);
      }
      if (!decision.recommendedSupplierId) {
        throw new PronoiError("NO_SUPPLIER_RECOMMENDATION", "No supplier is recommended for this product yet.");
      }

      const supplierProduct = await tx.supplierProduct.findUnique({
        where: { supplierId_productId: { supplierId: decision.recommendedSupplierId, productId: decision.productId } },
      });
      if (!supplierProduct) throw new PronoiError("NOT_FOUND", "Recommended supplier no longer quotes this product.");

      const quantity = decision.recommendedQty;
      const totalAmount = Math.round(supplierProduct.pricePerUnit * quantity);
      const poNumber = await nextPoNumber(tx);

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          businessId: decision.businessId,
          supplierId: decision.recommendedSupplierId,
          decisionId: decision.id,
          poNumber,
          status: "APPROVED",
          totalAmount,
          etaDays: Math.round(supplierProduct.leadTimeDays * 10) / 10,
          items: { create: [{ productId: decision.productId, quantity, unitPrice: supplierProduct.pricePerUnit }] },
        },
        include: { items: true, supplier: true },
      });

      const updated = await tx.decision.update({
        where: { id: decision.id },
        data: { status: "APPROVED", approvedAt: new Date() },
      });

      await writeAuditEvent(
        { businessId: decision.businessId, entityType: "Decision", entityId: decision.id, action: "DECISION_APPROVED", metadata: { productId: decision.productId } },
        tx
      );
      await writeAuditEvent(
        {
          businessId: decision.businessId,
          entityType: "PurchaseOrder",
          entityId: purchaseOrder.id,
          action: "PURCHASE_ORDER_CREATED",
          metadata: { poNumber, supplierId: decision.recommendedSupplierId, quantity, totalAmount },
        },
        tx
      );

      const view = toView(updated, decision.product, await getSupplierScores(tx, decision.product));
      return { decision: view, purchaseOrder, alreadyApproved: false };
    });
  };

  try {
    return await attempt();
  } catch (err) {
    // Concurrent double-approve: the unique decisionId constraint on
    // PurchaseOrder rejected the second insert. Re-read and return what the
    // first request already created, instead of surfacing a raw DB error.
    if (isUniqueConstraintError(err, "PurchaseOrder_decisionId_key")) {
      const decision = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
        include: { purchaseOrder: { include: { items: true, supplier: true } }, product: true },
      });
      if (!decision.purchaseOrder) throw err;
      const view = toView(decision, decision.product, await getSupplierScores(prisma, decision.product));
      return { decision: view, purchaseOrder: decision.purchaseOrder, alreadyApproved: true };
    }
    throw err;
  }
}

function isUniqueConstraintError(err: unknown, constraintHint: string): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  if (code !== "P2002") return false;
  const target = (err as { meta?: { target?: string[] | string } }).meta?.target;
  const targetStr = Array.isArray(target) ? target.join(",") : (target ?? "");
  return targetStr.includes("decisionId") || targetStr.includes(constraintHint);
}

export async function rejectDecision(decisionId: string): Promise<DecisionView> {
  return prisma.$transaction(async (tx) => {
    const decision = await tx.decision.findUnique({ where: { id: decisionId }, include: { product: true } });
    if (!decision) throw new PronoiError("NOT_FOUND", `Decision ${decisionId} not found.`);
    if (decision.status !== "PENDING") {
      throw new PronoiError("DECISION_NOT_PENDING", `Decision is already ${decision.status.toLowerCase()}.`);
    }

    const updated = await tx.decision.update({
      where: { id: decision.id },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });
    await writeAuditEvent(
      { businessId: decision.businessId, entityType: "Decision", entityId: decision.id, action: "DECISION_REJECTED", metadata: { productId: decision.productId } },
      tx
    );

    const supplierScores = await getSupplierScores(tx, decision.product);
    return toView(updated, decision.product, supplierScores);
  });
}
