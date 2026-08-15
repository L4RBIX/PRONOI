import { nextOrderStatus, type OrderStatus } from "@/lib/pronoi/orderStatus";
import { prisma } from "@/server/db";
import { writeAuditEvent } from "./audit";
import { PronoiError } from "./errors";

export async function getOrders(businessId: string) {
  return prisma.purchaseOrder.findMany({
    where: { businessId },
    include: { items: { include: { product: true } }, supplier: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Advances a PO to the next status in the happy-path sequence. Only valid
 * forward transitions are allowed (no skipping, no advancing a delivered or
 * cancelled order). Reaching DELIVERED bumps Product.currentStock by the
 * delivered quantity exactly once, in the same transaction as the status
 * change — since DELIVERED can only be reached once (there's no valid
 * transition away from or back to it), the increment can't double-apply.
 */
export async function advanceOrderStatus(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!po) throw new PronoiError("NOT_FOUND", `Purchase order ${orderId} not found.`);

    const next = nextOrderStatus(po.status as OrderStatus);
    if (!next) {
      throw new PronoiError("INVALID_TRANSITION", `Cannot advance a ${po.status.toLowerCase().replace("_", " ")} order further.`);
    }

    const updated = await tx.purchaseOrder.update({
      where: { id: orderId },
      data: { status: next, deliveredAt: next === "DELIVERED" ? new Date() : undefined },
    });

    if (next === "DELIVERED") {
      for (const item of po.items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.inventorySnapshot.create({
          data: { productId: item.productId, stock: product.currentStock, reason: "order-delivered" },
        });
      }
    }

    await writeAuditEvent(
      { businessId: po.businessId, entityType: "PurchaseOrder", entityId: po.id, action: "ORDER_STATUS_CHANGED", metadata: { from: po.status, to: next } },
      tx
    );

    return updated;
  });
}
