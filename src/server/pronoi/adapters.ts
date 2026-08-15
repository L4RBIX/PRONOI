import type { Product as DbProduct, Supplier as DbSupplier, SupplierProduct as DbSupplierProduct } from "@/generated/prisma/client";
import type { DemandInputs, RecoverySource, SupplierOffer } from "@/lib/pronoi/calc";
import type { Product as SimProduct } from "@/lib/pronoi/demoData";

/**
 * Thin adapters from Prisma rows to the plain-object shapes calc.ts and
 * simulate.ts already expect. The math itself is untouched — this is the
 * only place that knows about the DB schema on the way in.
 */

export function toDemandInputs(product: DbProduct): DemandInputs {
  return {
    currentStock: product.currentStock,
    avgDailyDemand: product.avgDailyDemand,
    demandStdDev: product.demandStdDev,
    leadTimeDays: product.leadTimeDays,
  };
}

export function toSimProduct(product: DbProduct): SimProduct {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit,
    category: product.category,
    currentStock: product.currentStock,
    avgDailyDemand: product.avgDailyDemand,
    demandStdDev: product.demandStdDev,
    leadTimeDays: product.leadTimeDays,
    unitRevenueAtRisk: product.unitRevenue,
    suppliers: [],
  };
}

export function toSupplierOffer(sp: DbSupplierProduct & { supplier: DbSupplier }): SupplierOffer {
  return {
    id: sp.supplierId,
    name: sp.supplier.name,
    pricePerUnit: sp.pricePerUnit,
    onTimeRate: sp.onTimeRate,
    avgLeadTimeDays: sp.leadTimeDays,
    typicalDelayDays: sp.typicalDelayDays,
  };
}

export function toRecoverySource(rs: { id: string; label: string; type: string; availableQuantity: number; costPerUnit: number }): RecoverySource {
  return {
    id: rs.id,
    label: rs.label,
    type: rs.type as RecoverySource["type"],
    availableQuantity: rs.availableQuantity,
    costPerUnit: rs.costPerUnit,
  };
}
