import {
  assessStockoutRisk,
  buildRecoveryPlan,
  computeRevenueAtRisk,
  projectDaysUntilStockout,
  recommendReorderQuantity,
  riskLevelFor,
  scoreSuppliers,
  type RecoveryPlan,
  type RiskLevel,
  type SupplierScore,
} from "./calc";
import { MILK_RECOVERY_SOURCES, PRODUCTS, type Product } from "./demoData";

export interface Decision {
  product: Product;
  riskLevel: RiskLevel;
  stockoutProbability: number;
  expectedShortageUnits: number;
  revenueAtRisk: number;
  recommendedQuantity: number;
  daysUntilStockout: number;
  supplierScores: SupplierScore[];
  recommendedSupplier: SupplierScore;
  z: number;
  expectedDemandDuringLeadTime: number;
  leadTimeDemandStdDev: number;
  safetyStock: number;
}

/** Runs the full engine (risk assessment -> reorder quantity -> supplier ranking) for a single product. */
export function computeDecision(product: Product): Decision {
  const risk = assessStockoutRisk(product);
  const reorder = recommendReorderQuantity(product);
  const revenueAtRisk = computeRevenueAtRisk(risk.expectedShortageUnits, product.unitRevenueAtRisk);
  const revenueAtRiskPerDay = product.unitRevenueAtRisk * product.avgDailyDemand;
  const supplierScores = scoreSuppliers(product.suppliers, reorder.recommendedQuantity || product.avgDailyDemand * product.leadTimeDays, revenueAtRiskPerDay);
  const { days } = projectDaysUntilStockout(product.currentStock, product.avgDailyDemand);

  return {
    product,
    riskLevel: riskLevelFor(risk.stockoutProbability),
    stockoutProbability: risk.stockoutProbability,
    expectedShortageUnits: risk.expectedShortageUnits,
    revenueAtRisk,
    recommendedQuantity: reorder.recommendedQuantity,
    daysUntilStockout: days,
    supplierScores,
    recommendedSupplier: supplierScores[0],
    z: risk.z,
    expectedDemandDuringLeadTime: risk.expectedDemandDuringLeadTime,
    leadTimeDemandStdDev: risk.leadTimeDemandStdDev,
    safetyStock: reorder.safetyStock,
  };
}

let cache: Decision[] | null = null;

/** All products' decisions, ranked most-urgent first (highest stockout probability). */
export function getAllDecisions(): Decision[] {
  if (cache) return cache;
  cache = PRODUCTS.map(computeDecision).sort((a, b) => b.stockoutProbability - a.stockoutProbability);
  return cache;
}

export function getDecision(productId: string): Decision | undefined {
  return getAllDecisions().find((d) => d.product.id === productId);
}

export function KZT(amount: number): string {
  const rounded = Math.round(amount);
  return `₸${rounded.toLocaleString("en-US")}`;
}

/**
 * Milk's supplier-disruption scenario: primary delivery is cancelled, so the
 * effective time to restock balloons from its normal 2.4-day lead time to
 * ~3.15 days via alternate sourcing. Used by both the landing page's
 * "Recovery Autopilot" showcase card and the dashboard's Simulation page —
 * one definition, so both surfaces show the same real computed numbers.
 */
export const MILK_DISRUPTED_LEAD_TIME_DAYS = 3.15;

export interface DisruptionScenario {
  stockoutProbability: number;
  gapUnits: number;
  revenueAtRisk: number;
  daysUntilStockout: number;
  recoveryPlan: RecoveryPlan;
}

export function computeMilkDisruptionScenario(): DisruptionScenario {
  const result = computeMilkStressTest({ demandMultiplier: 1, extraLeadTimeDays: 0, cancelled: true });
  return {
    stockoutProbability: result.stockoutProbability,
    gapUnits: result.gapUnits,
    revenueAtRisk: result.revenueAtRisk,
    daysUntilStockout: result.daysUntilStockout,
    recoveryPlan: result.recoveryPlan!,
  };
}

export interface StressTestInputs {
  /** 1 = normal demand, 1.2 = +20%, 1.4 = +40% */
  demandMultiplier: number;
  /** extra days added to the supplier's normal lead time (ignored when cancelled) */
  extraLeadTimeDays: number;
  /** primary supplier fully unavailable — sourced via MILK_DISRUPTED_LEAD_TIME_DAYS + recovery plan instead */
  cancelled: boolean;
}

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
 * Generalized version of the Milk disruption scenario used by the
 * Simulation page's interactive stress test — same calc engine
 * (assessStockoutRisk / buildRecoveryPlan), just parameterized by demand
 * multiplier and extra supplier delay instead of the single fixed
 * "cancelled" case. computeMilkDisruptionScenario() above is the original
 * fixed scenario, kept for the landing page's Recovery Autopilot card.
 */
export function computeMilkStressTest(inputs: StressTestInputs): StressTestResult {
  const milk = PRODUCTS.find((p) => p.id === "milk")!;
  const avgDailyDemand = milk.avgDailyDemand * inputs.demandMultiplier;
  const leadTimeDays = inputs.cancelled ? MILK_DISRUPTED_LEAD_TIME_DAYS : milk.leadTimeDays + inputs.extraLeadTimeDays;
  const risk = assessStockoutRisk({ ...milk, avgDailyDemand, leadTimeDays });
  const revenueAtRisk = computeRevenueAtRisk(risk.expectedShortageUnits, milk.unitRevenueAtRisk);
  const { days } = projectDaysUntilStockout(milk.currentStock, avgDailyDemand);
  const recoveryPlan = inputs.cancelled ? buildRecoveryPlan(risk.expectedShortageUnits, MILK_RECOVERY_SOURCES, milk.unitRevenueAtRisk) : null;
  return {
    stockoutProbability: risk.stockoutProbability,
    gapUnits: risk.expectedShortageUnits,
    revenueAtRisk,
    daysUntilStockout: days,
    leadTimeDays,
    avgDailyDemand,
    recoveryPlan,
  };
}
