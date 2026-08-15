import { recommendReorderQuantity } from "./calc";
import type { Product } from "./demoData";

/**
 * Deterministic day-stepped (s, Q) reorder-point simulation, used to compare
 * a naive human reorder habit against PRONOI's computed reorder point and
 * quantity over a week. Both strategies use the SAME simulation loop and
 * the SAME product demand — only the reorder point and quantity differ —
 * so any gap between them comes from the policy, not from the simulator.
 */

export interface SimStrategy {
  label: string;
  reorderPoint: number;
  reorderQuantity: number;
}

export interface DaySimResult {
  day: number;
  stockStart: number;
  stockEnd: number;
  shortfallUnits: number;
  orderedToday: boolean;
  orderArrivedToday: boolean;
}

export interface WeekSimulation {
  strategy: SimStrategy;
  days: DaySimResult[];
  totalShortfallUnits: number;
  totalRevenueLost: number;
  stockoutDays: number;
}

export function simulateWeek(product: Product, strategy: SimStrategy, days = 7): WeekSimulation {
  const leadTimeDaysRounded = Math.max(1, Math.round(product.leadTimeDays));
  let stock = product.currentStock;
  const pending: { quantity: number; arrivalDay: number }[] = [];
  const results: DaySimResult[] = [];
  let totalShortfall = 0;
  let stockoutDays = 0;

  for (let day = 0; day < days; day++) {
    const stockStart = stock;
    let orderArrivedToday = false;
    for (const order of pending) {
      if (order.arrivalDay === day) {
        stock += order.quantity;
        orderArrivedToday = true;
      }
    }

    const hasPending = pending.some((o) => o.arrivalDay > day);
    let orderedToday = false;
    if (stock <= strategy.reorderPoint && !hasPending) {
      pending.push({ quantity: strategy.reorderQuantity, arrivalDay: day + leadTimeDaysRounded });
      orderedToday = true;
    }

    const demand = product.avgDailyDemand;
    const shortfall = Math.max(0, demand - stock);
    stock = Math.max(0, stock - demand);
    totalShortfall += shortfall;
    if (shortfall > 0) stockoutDays += 1;

    results.push({
      day,
      stockStart: Math.round(stockStart * 10) / 10,
      stockEnd: Math.round(stock * 10) / 10,
      shortfallUnits: Math.round(shortfall * 10) / 10,
      orderedToday,
      orderArrivedToday,
    });
  }

  return {
    strategy,
    days: results,
    totalShortfallUnits: Math.round(totalShortfall * 10) / 10,
    totalRevenueLost: Math.round(totalShortfall * product.unitRevenueAtRisk),
    stockoutDays,
  };
}

/** The naive baseline: reorder a fixed lead-time's worth of stock once you're down to about a day of cover. No safety buffer, no lead-time math. */
export function naiveBaselineStrategy(product: Product): SimStrategy {
  const leadTimeDaysRounded = Math.max(1, Math.round(product.leadTimeDays));
  return {
    label: "Simple reorder-point baseline",
    reorderPoint: Math.round(product.avgDailyDemand),
    reorderQuantity: Math.round(product.avgDailyDemand * leadTimeDaysRounded),
  };
}

export function pronoiStrategy(product: Product): SimStrategy {
  const reorder = recommendReorderQuantity(product);
  return {
    label: "PRONOI",
    reorderPoint: reorder.reorderPoint,
    reorderQuantity: reorder.recommendedQuantity,
  };
}
