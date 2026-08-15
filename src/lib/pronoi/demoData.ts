import type { RecoverySource, SupplierOffer } from "./calc";

/**
 * Demo data for a fictional Almaty coffee shop, "Mokka Coffee." All figures
 * below (stock, demand, volatility, lead times) are clearly-labelled demo
 * inputs — every risk percentage, revenue-at-risk figure, and recommended
 * quantity shown in the product is *computed* from these inputs via
 * src/lib/pronoi/calc.ts, never hardcoded separately.
 */

export const COMPANY = {
  name: "Mokka Coffee",
  city: "Almaty",
  ownerGreetingName: "there",
};

export interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
  avgDailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
  unitRevenueAtRisk: number; // KZT of margin/revenue put at risk per unit short
  suppliers: SupplierOffer[];
}

export const PRODUCTS: Product[] = [
  {
    id: "milk",
    name: "Milk",
    unit: "L",
    category: "Dairy",
    currentStock: 42,
    avgDailyDemand: 21,
    demandStdDev: 5,
    leadTimeDays: 2.4,
    unitRevenueAtRisk: 7600,
    suppliers: [
      { id: "supplier-a", name: "Supplier A", pricePerUnit: 610, onTimeRate: 0.98, avgLeadTimeDays: 1.8, typicalDelayDays: 1.5 },
      { id: "supplier-b", name: "Supplier B", pricePerUnit: 570, onTimeRate: 0.71, avgLeadTimeDays: 3.4, typicalDelayDays: 2.5 },
      { id: "supplier-c", name: "Supplier C", pricePerUnit: 595, onTimeRate: 0.96, avgLeadTimeDays: 2.1, typicalDelayDays: 1.5 },
    ],
  },
  {
    id: "cups-12oz",
    name: "12 oz Cups",
    unit: "sleeve",
    category: "Packaging",
    currentStock: 470,
    avgDailyDemand: 150,
    demandStdDev: 45,
    leadTimeDays: 3,
    unitRevenueAtRisk: 45,
    suppliers: [
      { id: "packco", name: "PackCo", pricePerUnit: 38, onTimeRate: 0.94, avgLeadTimeDays: 3, typicalDelayDays: 2 },
      { id: "urban-supply", name: "Urban Supply", pricePerUnit: 35, onTimeRate: 0.82, avgLeadTimeDays: 4, typicalDelayDays: 2.5 },
    ],
  },
  {
    id: "vanilla-syrup",
    name: "Vanilla Syrup",
    unit: "bottle",
    category: "Syrups",
    currentStock: 22,
    avgDailyDemand: 4,
    demandStdDev: 1.5,
    leadTimeDays: 5,
    unitRevenueAtRisk: 950,
    suppliers: [
      { id: "flavorworks", name: "FlavorWorks", pricePerUnit: 3200, onTimeRate: 0.9, avgLeadTimeDays: 5, typicalDelayDays: 2 },
      { id: "cafe-supply-kz", name: "Cafe Supply KZ", pricePerUnit: 3050, onTimeRate: 0.85, avgLeadTimeDays: 6, typicalDelayDays: 2.5 },
    ],
  },
  {
    id: "croissants",
    name: "Croissants",
    unit: "unit",
    category: "Bakery",
    currentStock: 40,
    avgDailyDemand: 35,
    demandStdDev: 10,
    leadTimeDays: 1,
    unitRevenueAtRisk: 650,
    suppliers: [
      { id: "nomad-bakery", name: "Nomad Bakery", pricePerUnit: 280, onTimeRate: 0.93, avgLeadTimeDays: 1, typicalDelayDays: 0.5 },
      { id: "daily-bread-co", name: "Daily Bread Co", pricePerUnit: 260, onTimeRate: 0.88, avgLeadTimeDays: 1.2, typicalDelayDays: 1 },
    ],
  },
  {
    id: "coffee-beans",
    name: "Coffee Beans",
    unit: "kg",
    category: "Coffee",
    currentStock: 60,
    avgDailyDemand: 12,
    demandStdDev: 3,
    leadTimeDays: 4,
    unitRevenueAtRisk: 1800,
    suppliers: [
      { id: "orion-roasters", name: "Orion Roasters", pricePerUnit: 8200, onTimeRate: 0.97, avgLeadTimeDays: 4, typicalDelayDays: 1.5 },
      { id: "alma-roast", name: "Alma Roast Co", pricePerUnit: 7900, onTimeRate: 0.89, avgLeadTimeDays: 5, typicalDelayDays: 2 },
    ],
  },
  {
    id: "chocolate-syrup",
    name: "Chocolate Syrup",
    unit: "bottle",
    category: "Syrups",
    currentStock: 20,
    avgDailyDemand: 3,
    demandStdDev: 1,
    leadTimeDays: 5,
    unitRevenueAtRisk: 950,
    suppliers: [
      { id: "flavorworks-2", name: "FlavorWorks", pricePerUnit: 3100, onTimeRate: 0.9, avgLeadTimeDays: 5, typicalDelayDays: 2 },
      { id: "cafe-supply-kz-2", name: "Cafe Supply KZ", pricePerUnit: 2980, onTimeRate: 0.85, avgLeadTimeDays: 6, typicalDelayDays: 2.5 },
    ],
  },
  {
    id: "bottled-water",
    name: "Bottled Water",
    unit: "unit",
    category: "Beverages",
    currentStock: 140,
    avgDailyDemand: 25,
    demandStdDev: 8,
    leadTimeDays: 4,
    unitRevenueAtRisk: 250,
    suppliers: [
      { id: "urban-supply-2", name: "Urban Supply", pricePerUnit: 145, onTimeRate: 0.92, avgLeadTimeDays: 4, typicalDelayDays: 1.5 },
      { id: "daily-cup-supply", name: "Daily Cup Supply", pricePerUnit: 138, onTimeRate: 0.86, avgLeadTimeDays: 5, typicalDelayDays: 2 },
    ],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Recovery sources available if Milk's primary supplier is disrupted — used by the Simulation page. */
export const MILK_RECOVERY_SOURCES: RecoverySource[] = [
  { id: "downtown-transfer", label: "Transfer from Downtown branch", type: "transfer", availableQuantity: 20, costPerUnit: 60 },
  { id: "emergency-supplier-a", label: "Emergency order from Supplier A", type: "emergency-order", availableQuantity: 30, costPerUnit: 610 + 115 },
  { id: "pooled-topup", label: "Add to community pooled purchase", type: "pooled", availableQuantity: 20, costPerUnit: -90 },
];

/** Nearby businesses pooling milk demand in the same window — used by the Pooling page. */
export const MILK_POOL_NEARBY_DEMAND = [
  { name: "Coffee Point", quantity: 50 },
  { name: "Nomad Cafe", quantity: 30 },
];

export const DEMO_BUSINESS_NAMES = ["Mokka Coffee", "Nomad Bakery", "Alma Market", "Daily Cup", "Orion Retail", "Urban Beans"];
