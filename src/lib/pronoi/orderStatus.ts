/**
 * Client-safe purchase-order status constants — deliberately independent of
 * the Prisma-generated enum so this file can be imported from client
 * components (Orders page stepper) without pulling any server/DB code into
 * the browser bundle. Values are kept in sync with the PurchaseOrderStatus
 * enum in prisma/schema.prisma by convention.
 */

export type OrderStatus = "APPROVED" | "ORDER_SENT" | "SUPPLIER_CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

/** The forward-only happy-path sequence. CANCELLED is reachable from any non-terminal step but isn't part of this sequence. */
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = ["APPROVED", "ORDER_SENT", "SUPPLIER_CONFIRMED", "IN_TRANSIT", "DELIVERED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  APPROVED: "Approved",
  ORDER_SENT: "Order sent",
  SUPPLIER_CONFIRMED: "Supplier confirmed",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Next status in the happy-path sequence, or null if `current` is DELIVERED, CANCELLED, or otherwise terminal. */
export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_SEQUENCE.indexOf(current);
  if (index === -1 || index === ORDER_STATUS_SEQUENCE.length - 1) return null;
  return ORDER_STATUS_SEQUENCE[index + 1];
}
