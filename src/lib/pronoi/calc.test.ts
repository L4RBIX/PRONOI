import { describe, expect, it } from "vitest";
import { assessStockoutRisk, computePooledPurchase, nextPoolTier, scoreSuppliers } from "./calc";
import { naiveBaselineStrategy, pronoiStrategy, simulateWeek } from "./simulate";
import { getProduct } from "./demoData";

describe("scoreSuppliers", () => {
  it("does not always recommend the cheapest-priced supplier", () => {
    const milk = getProduct("milk")!;
    // Supplier B is the cheapest per liter but has the worst on-time rate.
    const scores = scoreSuppliers(milk.suppliers, 42, milk.unitRevenueAtRisk * milk.avgDailyDemand);
    const cheapest = [...scores].sort((a, b) => a.supplier.pricePerUnit - b.supplier.pricePerUnit)[0];
    const recommended = scores[0]; // scoreSuppliers sorts ascending by totalExpectedCost

    expect(cheapest.supplier.id).toBe("supplier-b");
    expect(recommended.supplier.id).not.toBe(cheapest.supplier.id);
    expect(recommended.totalExpectedCost).toBeLessThan(cheapest.totalExpectedCost);
  });
});

describe("pooled purchase tiers", () => {
  it("gives no discount below 50 combined units", () => {
    const result = computePooledPurchase(20, [{ name: "Other", quantity: 20 }], 100);
    expect(result.combinedQuantity).toBe(40);
    expect(result.pooledPrice).toBe(100);
    expect(result.savingsPercent).toBe(0);
  });

  it("steps up the discount at each volume threshold", () => {
    const at49 = computePooledPurchase(49, [], 100);
    const at50 = computePooledPurchase(50, [], 100);
    const at100 = computePooledPurchase(100, [], 100);
    const at200 = computePooledPurchase(200, [], 100);

    expect(at49.savingsPercent).toBe(0);
    expect(at50.savingsPercent).toBe(5);
    expect(at100.savingsPercent).toBe(9);
    expect(at200.savingsPercent).toBe(14);
  });

  it("nextPoolTier reports the correct next threshold and units needed", () => {
    const tier = nextPoolTier(122);
    expect(tier).toEqual({ threshold: 200, discountPercent: 14, unitsNeeded: 78 });
    expect(nextPoolTier(200)).toBeNull();
  });
});

describe("simulateWeek", () => {
  it("produces different stockout outcomes for different demand levels", () => {
    const milk = getProduct("milk")!;
    const lowDemand = { ...milk, avgDailyDemand: milk.avgDailyDemand * 0.5 };
    const highDemand = { ...milk, avgDailyDemand: milk.avgDailyDemand * 2 };

    const lowResult = simulateWeek(lowDemand, naiveBaselineStrategy(lowDemand));
    const highResult = simulateWeek(highDemand, naiveBaselineStrategy(highDemand));

    expect(highResult.totalRevenueLost).toBeGreaterThan(lowResult.totalRevenueLost);
  });

  it("PRONOI's reorder policy never loses more than the naive baseline for the same demand", () => {
    const milk = getProduct("milk")!;
    const naive = simulateWeek(milk, naiveBaselineStrategy(milk));
    const pronoi = simulateWeek(milk, pronoiStrategy(milk));
    expect(pronoi.totalRevenueLost).toBeLessThanOrEqual(naive.totalRevenueLost);
  });
});

describe("assessStockoutRisk", () => {
  it("increases with a longer supplier lead time, all else equal", () => {
    const inputs = { currentStock: 42, avgDailyDemand: 21, demandStdDev: 5 };
    const shortLeadTime = assessStockoutRisk({ ...inputs, leadTimeDays: 1 });
    const longLeadTime = assessStockoutRisk({ ...inputs, leadTimeDays: 5 });
    expect(longLeadTime.stockoutProbability).toBeGreaterThan(shortLeadTime.stockoutProbability);
  });
});
