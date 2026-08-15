/**
 * Integration tests against a real Postgres database (see src/test/setup.ts
 * — these run against `pronoi_test`, never the dev/demo database). Each
 * test creates and tears down its own throwaway product/supplier so runs
 * don't interfere with each other or with the seeded demo data.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { approveDecision, getOrCreateCurrentDecision, rejectDecision } from "./decisions";
import { advanceOrderStatus } from "./orders";
import { PronoiError } from "./errors";

const BUSINESS_ID = "mokka-coffee";

async function makeTestProduct(id: string, overrides: Partial<{ currentStock: number }> = {}) {
  const supplierId = `${id}-supplier`;
  await prisma.supplier.upsert({ where: { id: supplierId }, update: {}, create: { id: supplierId, name: `Test Supplier ${id}` } });
  await prisma.product.upsert({
    where: { id },
    update: {},
    create: {
      id,
      businessId: BUSINESS_ID,
      name: `Test Product ${id}`,
      category: "Test",
      unit: "unit",
      currentStock: overrides.currentStock ?? 5,
      avgDailyDemand: 10,
      demandStdDev: 2,
      unitRevenue: 100,
      leadTimeDays: 2,
    },
  });
  await prisma.supplierProduct.upsert({
    where: { supplierId_productId: { supplierId, productId: id } },
    update: {},
    create: { supplierId, productId: id, pricePerUnit: 50, leadTimeDays: 2, onTimeRate: 0.9, typicalDelayDays: 1 },
  });
  return { productId: id, supplierId };
}

async function cleanupTestProduct(id: string, supplierId: string) {
  await prisma.purchaseOrderItem.deleteMany({ where: { productId: id } });
  await prisma.purchaseOrder.deleteMany({ where: { decision: { productId: id } } });
  await prisma.decision.deleteMany({ where: { productId: id } });
  await prisma.supplierProduct.deleteMany({ where: { productId: id } });
  await prisma.inventorySnapshot.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  await prisma.supplier.delete({ where: { id: supplierId } });
}

describe("approveDecision", () => {
  const productId = "test-approve-widget";
  const supplierId = `${productId}-supplier`;

  beforeAll(async () => {
    await makeTestProduct(productId);
  });

  afterAll(async () => {
    await cleanupTestProduct(productId, supplierId);
  });

  it("creates exactly one purchase order even when approved twice, and the approval persists", async () => {
    const decision = await getOrCreateCurrentDecision(productId);
    expect(decision.status).toBe("PENDING");

    const first = await approveDecision(decision.id);
    expect(first.alreadyApproved).toBe(false);
    expect(first.decision.status).toBe("APPROVED");

    const second = await approveDecision(decision.id);
    expect(second.alreadyApproved).toBe(true);
    expect(second.purchaseOrder.id).toBe(first.purchaseOrder.id);

    const purchaseOrderCount = await prisma.purchaseOrder.count({ where: { decisionId: decision.id } });
    expect(purchaseOrderCount).toBe(1);

    // Simulates "refresh the browser" — re-read from the DB independently of the in-memory result above.
    const reFetched = await prisma.decision.findUniqueOrThrow({ where: { id: decision.id } });
    expect(reFetched.status).toBe("APPROVED");
    expect(reFetched.approvedAt).not.toBeNull();
  });
});

describe("rejectDecision", () => {
  const productId = "test-reject-widget";
  const supplierId = `${productId}-supplier`;

  beforeAll(async () => {
    await makeTestProduct(productId);
  });

  afterAll(async () => {
    await cleanupTestProduct(productId, supplierId);
  });

  it("persists REJECTED and refuses to reject twice", async () => {
    const decision = await getOrCreateCurrentDecision(productId);
    const rejected = await rejectDecision(decision.id);
    expect(rejected.status).toBe("REJECTED");

    const reFetched = await prisma.decision.findUniqueOrThrow({ where: { id: decision.id } });
    expect(reFetched.status).toBe("REJECTED");

    await expect(rejectDecision(decision.id)).rejects.toThrow(PronoiError);
  });
});

describe("advanceOrderStatus", () => {
  const productId = "test-delivery-widget";
  const supplierId = `${productId}-supplier`;

  beforeAll(async () => {
    await makeTestProduct(productId, { currentStock: 5 });
  });

  afterAll(async () => {
    await cleanupTestProduct(productId, supplierId);
  });

  it("increases inventory exactly once when an order reaches DELIVERED, and refuses to advance further", async () => {
    const decision = await getOrCreateCurrentDecision(productId);
    const { purchaseOrder } = await approveDecision(decision.id);
    const deliveredQuantity = purchaseOrder.items[0].quantity;

    const stockBefore = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).currentStock;

    let order = purchaseOrder;
    for (let i = 0; i < 4; i++) {
      order = (await advanceOrderStatus(order.id)) as typeof purchaseOrder;
    }
    expect(order.status).toBe("DELIVERED");

    const stockAfterFirstDelivery = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).currentStock;
    expect(stockAfterFirstDelivery).toBe(stockBefore + deliveredQuantity);

    // Advancing a delivered order further must be rejected — this is what
    // guarantees the inventory increment can never apply a second time.
    await expect(advanceOrderStatus(order.id)).rejects.toThrow(PronoiError);

    const stockAfterSecondAttempt = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).currentStock;
    expect(stockAfterSecondAttempt).toBe(stockAfterFirstDelivery);
  });
});
