import { assessStockoutRisk, buildRecoveryPlan, computeRevenueAtRisk, projectDaysUntilStockout, type RecoveryPlan } from "@/lib/pronoi/calc";
import { naiveBaselineStrategy, pronoiStrategy, simulateWeek, type WeekSimulation } from "@/lib/pronoi/simulate";
import { prisma } from "@/server/db";
import { toRecoverySource, toSimProduct } from "./adapters";
import { PronoiError } from "./errors";

export interface WeeklyComparisonResult {
  baseline: WeekSimulation;
  pronoi: WeekSimulation;
}

/** Naive-reorder-habit vs PRONOI over the next 7 days, using the product's real demand. Deterministic — no LLM involved. */
export async function runWeeklyComparison(businessId: string, productId: string): Promise<WeeklyComparisonResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new PronoiError("NOT_FOUND", `Product ${productId} not found.`);

  const simProduct = toSimProduct(product);
  const baseline = simulateWeek(simProduct, naiveBaselineStrategy(simProduct));
  const pronoi = simulateWeek(simProduct, pronoiStrategy(simProduct));

  await prisma.simulationRun.create({
    data: {
      businessId,
      productId,
      scenarioType: "WEEKLY_COMPARISON",
      baselineStockoutDays: baseline.stockoutDays,
      pronoiStockoutDays: pronoi.stockoutDays,
      baselineRevenueLost: baseline.totalRevenueLost,
      pronoiRevenueLost: pronoi.totalRevenueLost,
      resultJson: JSON.parse(JSON.stringify({ baseline, pronoi })),
    },
  });

  return { baseline, pronoi };
}

export interface StressTestInput {
  demandMultiplier: number;
  extraLeadTimeDays: number;
  cancelled: boolean;
}

/** The lead time used once a product's primary supplier is fully cancelled — same widened-sourcing assumption as the original Milk disruption scenario. */
const CANCELLED_LEAD_TIME_MULTIPLIER = 1.3125; // 2.4 -> 3.15 days for Milk's own lead time, applied proportionally to any product

export interface StressTestResult {
  stockoutProbability: number;
  gapUnits: number;
  revenueAtRisk: number;
  daysUntilStockout: number;
  leadTimeDays: number;
  avgDailyDemand: number;
  recoveryPlan: RecoveryPlan | null;
}

/**
 * Generalized disruption stress test: demand multiplier x supplier delay
 * (or full cancellation). All quantities come from assessStockoutRisk /
 * buildRecoveryPlan — DeepSeek never invents a number here (see
 * deepseekChat.ts, which only explains an already-computed plan).
 */
export async function runStressTest(businessId: string, productId: string, input: StressTestInput): Promise<StressTestResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new PronoiError("NOT_FOUND", `Product ${productId} not found.`);

  const avgDailyDemand = product.avgDailyDemand * input.demandMultiplier;
  const leadTimeDays = input.cancelled ? product.leadTimeDays * CANCELLED_LEAD_TIME_MULTIPLIER : product.leadTimeDays + input.extraLeadTimeDays;

  const risk = assessStockoutRisk({ currentStock: product.currentStock, avgDailyDemand, demandStdDev: product.demandStdDev, leadTimeDays });
  const revenueAtRisk = computeRevenueAtRisk(risk.expectedShortageUnits, product.unitRevenue);
  const { days } = projectDaysUntilStockout(product.currentStock, avgDailyDemand);

  let recoveryPlan: RecoveryPlan | null = null;
  if (input.cancelled) {
    const sources = await prisma.recoverySource.findMany({ where: { productId } });
    if (sources.length > 0) {
      recoveryPlan = buildRecoveryPlan(risk.expectedShortageUnits, sources.map(toRecoverySource), product.unitRevenue);
    }
  }

  const result: StressTestResult = {
    stockoutProbability: risk.stockoutProbability,
    gapUnits: risk.expectedShortageUnits,
    revenueAtRisk,
    daysUntilStockout: days,
    leadTimeDays,
    avgDailyDemand,
    recoveryPlan,
  };

  await prisma.simulationRun.create({
    data: {
      businessId,
      productId,
      scenarioType: "DISRUPTION_STRESS_TEST",
      demandMultiplier: input.demandMultiplier,
      supplierDelayDays: input.extraLeadTimeDays,
      supplierCancelled: input.cancelled,
      pronoiRevenueLost: revenueAtRisk,
      resultJson: JSON.parse(JSON.stringify(result)),
    },
  });

  return result;
}
