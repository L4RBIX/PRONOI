import { standardNormalCdf, standardNormalLoss, standardNormalQuantile } from "./stats";

/**
 * PRONOI's procurement decision engine.
 *
 * Model: demand during lead time is treated as normally distributed with
 * mean = avgDailyDemand * leadTimeDays and standard deviation =
 * demandStdDev * sqrt(leadTimeDays) (the standard square-root-of-time rule
 * for aggregating i.i.d. daily demand). This is the textbook continuous-
 * review safety-stock model used in inventory theory — transparent,
 * deterministic, and re-computed from whatever inputs are supplied. No
 * number here is ever hardcoded independent of its inputs.
 */

export interface DemandInputs {
  currentStock: number;
  avgDailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
}

export interface SupplierOffer {
  id: string;
  name: string;
  pricePerUnit: number;
  onTimeRate: number; // 0..1
  avgLeadTimeDays: number;
  /** typical extra days a late delivery takes, beyond its own lead time */
  typicalDelayDays: number;
}

export interface StockoutAssessment {
  z: number;
  expectedDemandDuringLeadTime: number;
  leadTimeDemandStdDev: number;
  stockoutProbability: number;
  expectedShortageUnits: number;
}

/** Core risk assessment: probability of running out before the next delivery arrives, and by how much. */
export function assessStockoutRisk({ currentStock, avgDailyDemand, demandStdDev, leadTimeDays }: DemandInputs): StockoutAssessment {
  const expectedDemandDuringLeadTime = avgDailyDemand * leadTimeDays;
  const leadTimeDemandStdDev = demandStdDev * Math.sqrt(Math.max(leadTimeDays, 1e-6));
  const z = leadTimeDemandStdDev > 0 ? (currentStock - expectedDemandDuringLeadTime) / leadTimeDemandStdDev : currentStock >= expectedDemandDuringLeadTime ? Infinity : -Infinity;
  const stockoutProbability = clamp01(1 - standardNormalCdf(z));
  const expectedShortageUnits = leadTimeDemandStdDev > 0 ? Math.max(0, leadTimeDemandStdDev * standardNormalLoss(z)) : Math.max(0, expectedDemandDuringLeadTime - currentStock);
  return { z, expectedDemandDuringLeadTime, leadTimeDemandStdDev, stockoutProbability, expectedShortageUnits };
}

/** Safety stock for a target service level (e.g. 0.95 -> ~1.645 std devs of buffer). */
export function computeSafetyStock(demandStdDev: number, leadTimeDays: number, serviceLevel = 0.95): number {
  const z = standardNormalQuantile(serviceLevel);
  return z * demandStdDev * Math.sqrt(Math.max(leadTimeDays, 1e-6));
}

export interface ReorderRecommendation {
  reorderPoint: number;
  safetyStock: number;
  recommendedQuantity: number;
  coverageDays: number;
}

/**
 * Recommended order quantity: enough to cover expected demand through lead
 * time plus a modest additional coverage window (so the business isn't
 * placing a new order again in two days), plus the safety-stock buffer,
 * minus what's already on hand.
 */
export function recommendReorderQuantity(inputs: DemandInputs, serviceLevel = 0.95, coverageDays = 1): ReorderRecommendation {
  const safetyStock = computeSafetyStock(inputs.demandStdDev, inputs.leadTimeDays, serviceLevel);
  const demandThroughCoverage = inputs.avgDailyDemand * (inputs.leadTimeDays + coverageDays);
  const reorderPoint = inputs.avgDailyDemand * inputs.leadTimeDays + safetyStock;
  const recommendedQuantity = Math.max(0, Math.round(demandThroughCoverage + safetyStock - inputs.currentStock));
  return { reorderPoint, safetyStock, recommendedQuantity, coverageDays };
}

/** Expected revenue placed at risk by the projected shortage. */
export function computeRevenueAtRisk(expectedShortageUnits: number, unitRevenueAtRisk: number): number {
  return expectedShortageUnits * unitRevenueAtRisk;
}

export interface SupplierScore {
  supplier: SupplierOffer;
  purchaseCost: number;
  expectedDelayCost: number;
  totalExpectedCost: number;
}

/**
 * Ranks suppliers by expected total cost — purchase price plus the expected
 * cost of their own unreliability (probability of a late delivery times how
 * many days late times how much a day of delay is worth in revenue at
 * risk). A cheaper supplier with a high late-delivery rate can lose to a
 * pricier, more reliable one once that risk is priced in.
 */
export function scoreSuppliers(suppliers: SupplierOffer[], quantity: number, revenueAtRiskPerDay: number): SupplierScore[] {
  return suppliers
    .map((supplier) => {
      const purchaseCost = supplier.pricePerUnit * quantity;
      const delayProbability = clamp01(1 - supplier.onTimeRate);
      const expectedDelayCost = delayProbability * supplier.typicalDelayDays * revenueAtRiskPerDay;
      return { supplier, purchaseCost, expectedDelayCost, totalExpectedCost: purchaseCost + expectedDelayCost };
    })
    .sort((a, b) => a.totalExpectedCost - b.totalExpectedCost);
}

export type RiskLevel = "critical" | "medium" | "healthy";

export function riskLevelFor(stockoutProbability: number): RiskLevel {
  if (stockoutProbability >= 0.6) return "critical";
  if (stockoutProbability >= 0.25) return "medium";
  return "healthy";
}

export interface DaysUntilStockout {
  days: number;
  date: Date;
}

/** Simple depletion projection at the current average daily demand, from a given reference time. */
export function projectDaysUntilStockout(currentStock: number, avgDailyDemand: number, from: Date = new Date()): DaysUntilStockout {
  const days = avgDailyDemand > 0 ? currentStock / avgDailyDemand : Infinity;
  const date = new Date(from.getTime() + days * 86400000);
  return { days, date };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export interface RecoveryStep {
  id: string;
  label: string;
  quantity: number;
  cost: number;
  costLabel: string;
}

export interface RecoveryPlan {
  steps: RecoveryStep[];
  totalRecoveredQuantity: number;
  totalCost: number;
  recoveredFractionOfGap: number;
  revenueProtected: number;
}

export interface RecoverySource {
  id: string;
  label: string;
  type: "transfer" | "emergency-order" | "pooled";
  availableQuantity: number;
  costPerUnit: number;
}

/**
 * Builds a recovery plan for a demand gap by greedily filling it from the
 * cheapest available sources first (branch transfer, then emergency order,
 * then pooled purchase) — every quantity/cost number is derived from the
 * gap and the sources supplied, never hardcoded.
 */
export function buildRecoveryPlan(gapUnits: number, sources: RecoverySource[], unitRevenueAtRisk: number): RecoveryPlan {
  const sorted = [...sources].sort((a, b) => a.costPerUnit - b.costPerUnit);
  let remaining = Math.max(0, gapUnits);
  const steps: RecoveryStep[] = [];
  for (const source of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, source.availableQuantity);
    if (take <= 0) continue;
    remaining -= take;
    steps.push({
      id: source.id,
      label: source.label,
      quantity: Math.round(take * 10) / 10,
      cost: Math.round(take * source.costPerUnit),
      costLabel: source.type === "pooled" ? "savings" : "additional cost",
    });
  }
  const totalRecoveredQuantity = Math.round((gapUnits - remaining) * 10) / 10;
  const totalCost = steps.reduce((sum, s) => sum + (s.costLabel === "savings" ? 0 : s.cost), 0);
  const recoveredFractionOfGap = gapUnits > 0 ? clamp01(totalRecoveredQuantity / gapUnits) : 1;
  return {
    steps,
    totalRecoveredQuantity,
    totalCost,
    recoveredFractionOfGap,
    revenueProtected: Math.round(totalRecoveredQuantity * unitRevenueAtRisk),
  };
}

export interface PooledPurchase {
  yourDemand: number;
  otherDemand: { name: string; quantity: number }[];
  combinedQuantity: number;
  individualPrice: number;
  pooledPrice: number;
  totalSavings: number;
  savingsPercent: number;
}

/** Volume-tiered pooled pricing: the more combined demand, the deeper the discount, deterministically. */
export function computePooledPurchase(yourDemand: number, otherDemand: { name: string; quantity: number }[], individualPrice: number): PooledPurchase {
  const combinedQuantity = yourDemand + otherDemand.reduce((sum, o) => sum + o.quantity, 0);
  const discountPercent = tierDiscount(combinedQuantity);
  const pooledPrice = Math.round(individualPrice * (1 - discountPercent) * 100) / 100;
  const totalSavings = Math.round((individualPrice - pooledPrice) * combinedQuantity);
  return { yourDemand, otherDemand, combinedQuantity, individualPrice, pooledPrice, totalSavings, savingsPercent: Math.round(discountPercent * 1000) / 10 };
}

const POOL_TIERS = [
  { threshold: 50, discount: 0.05 },
  { threshold: 100, discount: 0.09 },
  { threshold: 200, discount: 0.14 },
];

function tierDiscount(combinedQuantity: number): number {
  let discount = 0;
  for (const tier of POOL_TIERS) {
    if (combinedQuantity >= tier.threshold) discount = tier.discount;
  }
  return discount;
}

export interface NextPoolTier {
  threshold: number;
  discountPercent: number;
  unitsNeeded: number;
}

/** The next volume tier above the current combined quantity, or null if already at the top tier. */
export function nextPoolTier(combinedQuantity: number): NextPoolTier | null {
  const next = POOL_TIERS.find((tier) => combinedQuantity < tier.threshold);
  if (!next) return null;
  return {
    threshold: next.threshold,
    discountPercent: Math.round(next.discount * 1000) / 10,
    unitsNeeded: Math.round((next.threshold - combinedQuantity) * 10) / 10,
  };
}
