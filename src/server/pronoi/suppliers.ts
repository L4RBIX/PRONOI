import { prisma } from "@/server/db";
import { getAllCurrentDecisions, getDecisionForProduct } from "./decisions";

export interface SupplierIndexRow {
  id: string;
  name: string;
  products: { productId: string; productName: string; unit: string; pricePerUnit: number; onTimeRate: number; recommended: boolean }[];
  avgOnTimeRate: number;
  orderCount: number;
  recommendedCount: number;
}

/** One row per supplier, with every product it quotes — powers the Suppliers page's dense table. */
export async function getSuppliersIndex(businessId: string): Promise<SupplierIndexRow[]> {
  const [suppliers, decisions, orderCounts] = await Promise.all([
    prisma.supplier.findMany({
      include: { supplierProducts: { where: { isActive: true }, include: { product: true } } },
    }),
    getAllCurrentDecisions(businessId),
    prisma.purchaseOrder.groupBy({ by: ["supplierId"], where: { businessId }, _count: { _all: true } }),
  ]);

  const recommendedByProduct = new Map(decisions.map((d) => [d.product.id, d.recommendedSupplierId]));
  const orderCountBySupplier = new Map(orderCounts.map((row) => [row.supplierId, row._count._all]));

  return suppliers
    .filter((s) => s.supplierProducts.some((sp) => sp.product.businessId === businessId))
    .map((supplier) => {
      const products = supplier.supplierProducts
        .filter((sp) => sp.product.businessId === businessId)
        .map((sp) => ({
          productId: sp.productId,
          productName: sp.product.name,
          unit: sp.product.unit,
          pricePerUnit: sp.pricePerUnit,
          onTimeRate: sp.onTimeRate,
          recommended: recommendedByProduct.get(sp.productId) === supplier.id,
        }));
      return {
        id: supplier.id,
        name: supplier.name,
        products,
        avgOnTimeRate: products.reduce((sum, p) => sum + p.onTimeRate, 0) / products.length,
        orderCount: orderCountBySupplier.get(supplier.id) ?? 0,
        recommendedCount: products.filter((p) => p.recommended).length,
      };
    })
    .sort((a, b) => b.products.length - a.products.length);
}

/** Finds a real example, across the business's current decisions, where the cheapest-priced supplier isn't the one PRONOI recommends. */
export async function findPriceVsCostExample(businessId: string) {
  const decisions = await getAllCurrentDecisions(businessId);
  for (const d of decisions) {
    if (d.supplierScores.length === 0) continue;
    const cheapest = [...d.supplierScores].sort((a, b) => a.supplier.pricePerUnit - b.supplier.pricePerUnit)[0];
    const recommended = d.supplierScores.find((s) => s.supplier.id === d.recommendedSupplierId);
    if (recommended && cheapest.supplier.id !== recommended.supplier.id) {
      return { product: d.product, cheapest, recommended };
    }
  }
  return null;
}

export interface SupplierComparisonRow {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  onTimeRate: number;
  purchaseCost: number;
  expectedDelayCost: number;
  totalExpectedCost: number;
  recommended: boolean;
}

/** Risk-adjusted supplier ranking for one product — reuses the same scoring the decision itself was built from. */
export async function getSupplierComparison(productId: string): Promise<SupplierComparisonRow[]> {
  const decision = await getDecisionForProduct(productId);
  return decision.supplierScores.map((s) => ({
    supplierId: s.supplier.id,
    supplierName: s.supplier.name,
    unitPrice: s.supplier.pricePerUnit,
    onTimeRate: s.supplier.onTimeRate,
    purchaseCost: s.purchaseCost,
    expectedDelayCost: s.expectedDelayCost,
    totalExpectedCost: s.totalExpectedCost,
    recommended: s.supplier.id === decision.recommendedSupplierId,
  }));
}
