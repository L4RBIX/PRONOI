import { prisma } from "@/server/db";
import { getAllCurrentDecisions } from "@/server/pronoi/decisions";

/**
 * Platform-level aggregates for the admin Overview and Analytics pages.
 * Every number here is computed from real structured data (the same
 * Postgres tables the business-facing dashboard reads) — nothing is a
 * hand-typed growth number. Decisions are recomputed via the same
 * getAllCurrentDecisions the business dashboard uses, so risk % reflects
 * live inventory, not a stale cached snapshot.
 */

export interface PlatformOverview {
  activeBusinesses: number;
  productsMonitored: number;
  activeSuppliers: number;
  purchaseOrdersCreated: number;
  avgStockoutRiskPercent: number;
  avgPoolingSavingsPercent: number;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const businesses = await prisma.business.findMany();
  const allDecisions = (await Promise.all(businesses.map((b) => getAllCurrentDecisions(b.id)))).flat();

  const [productsMonitored, activeSuppliers, purchaseOrdersCreated, pools] = await Promise.all([
    prisma.product.count(),
    prisma.supplier.count({ where: { active: true } }),
    prisma.purchaseOrder.count(),
    prisma.poolingOpportunity.findMany({ where: { status: "OPEN" } }),
  ]);

  const avgStockoutRisk = allDecisions.length ? allDecisions.reduce((sum, d) => sum + d.stockoutRisk, 0) / allDecisions.length : 0;
  const avgPoolingSavings = pools.length
    ? pools.reduce((sum, p) => sum + (p.basePrice > 0 ? (p.basePrice - p.pooledPrice) / p.basePrice : 0), 0) / pools.length
    : 0;

  return {
    activeBusinesses: businesses.length,
    productsMonitored,
    activeSuppliers,
    purchaseOrdersCreated,
    avgStockoutRiskPercent: Math.round(avgStockoutRisk * 1000) / 10,
    avgPoolingSavingsPercent: Math.round(avgPoolingSavings * 1000) / 10,
  };
}

export interface ActivityItem {
  id: string;
  text: string;
  createdAt: Date;
}

export async function getPlatformActivity(limit = 12): Promise<ActivityItem[]> {
  const events = await prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { business: true } });
  if (events.length === 0) return [];

  const productIds = new Set<string>();
  const supplierIds = new Set<string>();
  for (const e of events) {
    const meta = (e.metadataJson ?? {}) as Record<string, unknown>;
    if (typeof meta.productId === "string") productIds.add(meta.productId);
    if (typeof meta.supplierId === "string") supplierIds.add(meta.supplierId);
  }
  const [products, suppliers] = await Promise.all([
    productIds.size ? prisma.product.findMany({ where: { id: { in: [...productIds] } } }) : Promise.resolve([]),
    supplierIds.size ? prisma.supplier.findMany({ where: { id: { in: [...supplierIds] } } }) : Promise.resolve([]),
  ]);
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));

  return events.map((e) => ({ id: e.id, text: describeEvent(e, productName, supplierName), createdAt: e.createdAt }));
}

type AuditEventRow = Awaited<ReturnType<typeof prisma.auditEvent.findMany<{ include: { business: true } }>>>[number];

function describeEvent(e: AuditEventRow, productName: Map<string, string>, supplierName: Map<string, string>): string {
  const meta = (e.metadataJson ?? {}) as Record<string, unknown>;
  const business = e.business?.name ?? "A business";
  const product = typeof meta.productId === "string" ? (productName.get(meta.productId) ?? meta.productId) : null;

  switch (e.entityType) {
    case "Decision":
      return e.action === "DECISION_REJECTED" ? `${business} dismissed the ${product ?? ""} recommendation`.trim() : `${business} approved ${product ?? "a"} reorder`;
    case "PurchaseOrder":
      return `${business} created a purchase order${product ? ` for ${product}` : ""}`;
    case "PoolingParticipant":
      return `${business} joined a pooled ${product ?? "purchase"}`;
    case "SupplierProduct": {
      const supplier = typeof meta.supplierId === "string" ? (supplierName.get(meta.supplierId) ?? meta.supplierId) : "A supplier";
      if (typeof meta.onTimeRate === "number") return `${supplier} reliability updated to ${Math.round(meta.onTimeRate * 100)}%`;
      return `${supplier}'s quote for ${product ?? "a product"} was updated`;
    }
    case "Supplier":
      if (e.action === "ADMIN_CREATED") return `New supplier added${typeof meta.name === "string" ? `: ${meta.name}` : ""}`;
      if (e.action === "ADMIN_DELETED") return "A supplier was removed";
      return `Supplier profile updated${typeof meta.name === "string" ? `: ${meta.name}` : ""}`;
    case "ProductCategory":
      if (e.action === "ADMIN_CREATED") return `New product category added${typeof meta.name === "string" ? `: ${meta.name}` : ""}`;
      if (e.action === "ADMIN_DELETED") return "A product category was removed";
      return `Product category updated${typeof meta.name === "string" ? `: ${meta.name}` : ""}`;
    case "AutoOrderRule":
      if (e.action === "ADMIN_CREATED") return `New auto-order rule created${typeof meta.name === "string" ? `: ${meta.name}` : ""}`;
      if (e.action === "ADMIN_DELETED") return "An auto-order rule was removed";
      return `Auto-order rule updated${typeof meta.name === "string" ? `: ${meta.name}` : ""}`;
    case "BusinessType":
      return "Business profile changed";
    case "Region":
      return "Region configuration updated";
    default:
      return `${e.entityType} ${e.action.toLowerCase().replace("admin_", "")}`;
  }
}

export interface PlatformAnalytics {
  businessesByType: { type: string; count: number }[];
  categoriesByUsage: { category: string; productCount: number }[];
  avgSupplierOnTimeRatePercent: number;
  purchaseOrdersByStatus: { status: string; count: number }[];
  simulatedStockoutLossesAvoided: number;
  pooledPurchaseSavings: number;
  avgOrderLeadTimeDays: number;
}

/** Everything here is labeled "Demo simulation" where it derives from SimulationRun's what-if scenarios, not real historical outcomes. */
export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const [businesses, products, supplierProducts, orders, simulationRuns, pools] = await Promise.all([
    prisma.business.findMany(),
    prisma.product.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.supplierProduct.findMany({ where: { isActive: true } }),
    prisma.purchaseOrder.findMany(),
    prisma.simulationRun.findMany({ where: { scenarioType: "WEEKLY_COMPARISON" } }),
    prisma.poolingOpportunity.findMany(),
  ]);

  const businessTypeCounts = new Map<string, number>();
  for (const b of businesses) {
    const key = b.businessType ?? "Unclassified";
    businessTypeCounts.set(key, (businessTypeCounts.get(key) ?? 0) + 1);
  }

  const statusCounts = new Map<string, number>();
  for (const o of orders) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);

  const avgOnTimeRate = supplierProducts.length ? supplierProducts.reduce((s, sp) => s + sp.onTimeRate, 0) / supplierProducts.length : 0;
  const avgLeadTime = orders.length ? orders.reduce((s, o) => s + o.etaDays, 0) / orders.length : 0;

  const simulatedLossesAvoided = simulationRuns.reduce((sum, run) => {
    const baseline = run.baselineRevenueLost ?? 0;
    const withPronoi = run.pronoiRevenueLost ?? 0;
    return sum + Math.max(0, baseline - withPronoi);
  }, 0);

  const pooledSavings = pools.reduce((sum, p) => sum + Math.max(0, (p.basePrice - p.pooledPrice) * p.combinedQuantity), 0);

  return {
    businessesByType: [...businessTypeCounts.entries()].map(([type, count]) => ({ type, count })),
    categoriesByUsage: products.map((p) => ({ category: p.category, productCount: p._count._all })).sort((a, b) => b.productCount - a.productCount),
    avgSupplierOnTimeRatePercent: Math.round(avgOnTimeRate * 1000) / 10,
    purchaseOrdersByStatus: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
    simulatedStockoutLossesAvoided: Math.round(simulatedLossesAvoided),
    pooledPurchaseSavings: Math.round(pooledSavings),
    avgOrderLeadTimeDays: Math.round(avgLeadTime * 10) / 10,
  };
}
