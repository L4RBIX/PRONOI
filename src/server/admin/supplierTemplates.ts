import { prisma } from "@/server/db";
import { writeAuditEvent } from "@/server/pronoi/audit";
import { PronoiError } from "@/server/pronoi/errors";

/**
 * Platform-admin view of supplier quotes — one row per (supplier, product)
 * relationship, matching how the data is actually modeled (see
 * SupplierProduct in schema.prisma: price/lead time/reliability are
 * per-relationship, not per-supplier, because the real demo data has the
 * same supplier at different reliability for different products).
 *
 * These are NOT a separate "template" table — editing a row here writes
 * directly to the same Supplier/SupplierProduct rows the business-facing
 * decision engine (src/server/pronoi/decisions.ts) reads on every
 * computation, so a reliability/lead-time change here is reflected the
 * next time any dashboard page recomputes a decision.
 */

export interface SupplierTemplateRow {
  supplierProductId: string;
  supplierId: string;
  supplierName: string;
  region: string | null;
  minOrderQuantity: number | null;
  supplierActive: boolean;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  leadTimeDays: number;
  onTimeRate: number;
  typicalDelayDays: number;
  isActive: boolean;
}

export async function getSupplierTemplateRows(): Promise<SupplierTemplateRow[]> {
  const rows = await prisma.supplierProduct.findMany({
    include: { supplier: true, product: true },
    orderBy: [{ supplier: { name: "asc" } }, { product: { name: "asc" } }],
  });
  return rows.map((r) => ({
    supplierProductId: r.id,
    supplierId: r.supplierId,
    supplierName: r.supplier.name,
    region: r.supplier.region,
    minOrderQuantity: r.supplier.minOrderQuantity,
    supplierActive: r.supplier.active,
    productId: r.productId,
    productName: r.product.name,
    category: r.product.category,
    unit: r.product.unit,
    pricePerUnit: r.pricePerUnit,
    leadTimeDays: r.leadTimeDays,
    onTimeRate: r.onTimeRate,
    typicalDelayDays: r.typicalDelayDays,
    isActive: r.isActive,
  }));
}

export interface SupplierProductQuoteInput {
  pricePerUnit: number;
  leadTimeDays: number;
  onTimeRate: number;
  typicalDelayDays: number;
  isActive: boolean;
}

export interface SupplierProfileInput {
  name: string;
  region: string | null;
  minOrderQuantity: number | null;
  active: boolean;
}

/** Updates the supplier-level profile (name/region/min order/active) — applies to every product it quotes. */
export async function updateSupplierProfile(supplierId: string, input: SupplierProfileInput): Promise<void> {
  const supplier = await prisma.supplier.update({ where: { id: supplierId }, data: input });
  await writeAuditEvent({ businessId: null, entityType: "Supplier", entityId: supplier.id, action: "ADMIN_UPDATED", metadata: { ...input } });
}

/** Updates one supplier's quote for one product — reliability, lead time, price. The real decision-engine input. */
export async function updateSupplierProductQuote(supplierProductId: string, input: SupplierProductQuoteInput): Promise<void> {
  const row = await prisma.supplierProduct.update({ where: { id: supplierProductId }, data: input });
  await writeAuditEvent({
    businessId: null,
    entityType: "SupplierProduct",
    entityId: row.id,
    action: "ADMIN_UPDATED",
    metadata: { supplierId: row.supplierId, productId: row.productId, ...input },
  });
}

export interface CreateSupplierInput extends SupplierProfileInput {
  id: string;
  productId: string;
  quote: SupplierProductQuoteInput;
}

export async function createSupplierWithQuote(input: CreateSupplierInput): Promise<void> {
  const existing = await prisma.supplier.findUnique({ where: { id: input.id } });
  if (existing) throw new PronoiError("INVALID_INPUT", `A supplier with id "${input.id}" already exists.`);

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new PronoiError("NOT_FOUND", "Selected product not found.");

  const supplier = await prisma.$transaction(async (tx) => {
    const created = await tx.supplier.create({
      data: { id: input.id, name: input.name, region: input.region, minOrderQuantity: input.minOrderQuantity, active: input.active },
    });
    await tx.supplierProduct.create({ data: { supplierId: created.id, productId: input.productId, ...input.quote } });
    return created;
  });

  await writeAuditEvent({ businessId: null, entityType: "Supplier", entityId: supplier.id, action: "ADMIN_CREATED", metadata: { name: supplier.name, productId: input.productId } });
}

/** Assigns an existing supplier to quote another product it doesn't already quote. */
export async function addSupplierProductQuote(supplierId: string, productId: string, input: SupplierProductQuoteInput): Promise<void> {
  const existing = await prisma.supplierProduct.findUnique({ where: { supplierId_productId: { supplierId, productId } } });
  if (existing) throw new PronoiError("INVALID_INPUT", "This supplier already quotes this product.");
  const row = await prisma.supplierProduct.create({ data: { supplierId, productId, ...input } });
  await writeAuditEvent({ businessId: null, entityType: "SupplierProduct", entityId: row.id, action: "ADMIN_CREATED", metadata: { supplierId, productId } });
}

/** Removes one supplier's quote for one product. Existing purchase orders keep their own captured price/supplier, so this is always safe. */
export async function deleteSupplierProductQuote(supplierProductId: string): Promise<void> {
  const row = await prisma.supplierProduct.delete({ where: { id: supplierProductId } });
  await writeAuditEvent({
    businessId: null,
    entityType: "SupplierProduct",
    entityId: supplierProductId,
    action: "ADMIN_DELETED",
    metadata: { supplierId: row.supplierId, productId: row.productId },
  });
}

/** Full supplier deletion — only allowed once it has no purchase order or decision history, to protect referential integrity. */
export async function deleteSupplier(supplierId: string): Promise<void> {
  const [poCount, decisionCount] = await Promise.all([
    prisma.purchaseOrder.count({ where: { supplierId } }),
    prisma.decision.count({ where: { recommendedSupplierId: supplierId } }),
  ]);
  if (poCount > 0 || decisionCount > 0) {
    throw new PronoiError("INVALID_INPUT", "Can't delete this supplier — it has purchase order or decision history. Disable it instead.");
  }
  await prisma.supplierProduct.deleteMany({ where: { supplierId } });
  await prisma.supplier.delete({ where: { id: supplierId } });
  await writeAuditEvent({ businessId: null, entityType: "Supplier", entityId: supplierId, action: "ADMIN_DELETED" });
}
