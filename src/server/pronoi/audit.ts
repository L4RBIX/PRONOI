import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export type AuditAction =
  | "DECISION_APPROVED"
  | "DECISION_REJECTED"
  | "PURCHASE_ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "POOL_JOINED"
  | "SIMULATION_RUN"
  | "ADMIN_CREATED"
  | "ADMIN_UPDATED"
  | "ADMIN_DELETED";

interface WriteAuditEventInput {
  /** null for platform-level admin events not scoped to one business. */
  businessId: string | null;
  entityType:
    | "Decision"
    | "PurchaseOrder"
    | "PoolingParticipant"
    | "SimulationRun"
    | "ProductCategory"
    | "Supplier"
    | "SupplierProduct"
    | "AutoOrderRule"
    | "BusinessType"
    | "Region";
  entityId: string;
  action: AuditAction;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Records a business event for the decision audit trail (section 22/23 —
 * "Decision history"). Takes an optional Prisma transaction client `tx` so
 * callers can write the audit row inside the same transaction as the
 * mutation it's describing.
 */
export async function writeAuditEvent(
  { businessId, entityType, entityId, action, metadata }: WriteAuditEventInput,
  tx: Pick<typeof prisma, "auditEvent"> = prisma
) {
  return tx.auditEvent.create({
    data: { businessId, entityType, entityId, action, metadataJson: metadata },
  });
}

export async function getAuditTrail(entityType: string, entityId: string) {
  return prisma.auditEvent.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "asc" },
  });
}
