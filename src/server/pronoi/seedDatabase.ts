import type { PrismaClient } from "@/generated/prisma/client";

/**
 * The demo dataset and seeding logic — shared between `prisma/seed.ts`
 * (the CLI entry point, used for local setup/migrations) and
 * resetVoiceDemoAction (in-process, used to restore the demo tenant from
 * the live app, including in production). Kept here instead of only in
 * prisma/seed.ts so a production serverless function can call it directly
 * with the app's own Prisma client, instead of shelling out to `npx tsx`
 * (which doesn't work in a serverless runtime).
 *
 * This is the ONLY place PRONOI's demo numbers are hand-typed — everything
 * the dashboard shows (stockout risk, revenue at risk, recommended
 * supplier, etc.) is computed from these seeded inputs by the server
 * service layer, never stored here directly.
 */

const BUSINESS_ID = "mokka-coffee";

interface SeedSupplierOffer {
  id: string;
  name: string;
  pricePerUnit: number;
  onTimeRate: number;
  avgLeadTimeDays: number;
  typicalDelayDays: number;
}

interface SeedProduct {
  id: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
  avgDailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
  unitRevenueAtRisk: number;
  suppliers: SeedSupplierOffer[];
}

const PRODUCTS: SeedProduct[] = [
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
      { id: "flavorworks", name: "FlavorWorks", pricePerUnit: 3100, onTimeRate: 0.9, avgLeadTimeDays: 5, typicalDelayDays: 2 },
      { id: "cafe-supply-kz", name: "Cafe Supply KZ", pricePerUnit: 2980, onTimeRate: 0.85, avgLeadTimeDays: 6, typicalDelayDays: 2.5 },
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
      { id: "urban-supply", name: "Urban Supply", pricePerUnit: 145, onTimeRate: 0.92, avgLeadTimeDays: 4, typicalDelayDays: 1.5 },
      { id: "daily-cup-supply", name: "Daily Cup Supply", pricePerUnit: 138, onTimeRate: 0.86, avgLeadTimeDays: 5, typicalDelayDays: 2 },
    ],
  },
];

// Milk's recovery sources if its primary supplier is disrupted (see calc.ts's buildRecoveryPlan).
const MILK_RECOVERY_SOURCES = [
  { id: "downtown-transfer", label: "Transfer from Downtown branch", type: "transfer", availableQuantity: 20, costPerUnit: 60 },
  { id: "emergency-supplier-a", label: "Emergency order from Supplier A", type: "emergency-order", availableQuantity: 30, costPerUnit: 610 + 115 },
  { id: "pooled-topup", label: "Add to community pooled purchase", type: "pooled", availableQuantity: 20, costPerUnit: -90 },
];

// Nearby businesses already pooling Milk demand in the same window (external — not PRONOI users).
const MILK_POOL_EXTERNAL_PARTICIPANTS = [
  { name: "Coffee Point", quantity: 50 },
  { name: "Nomad Cafe", quantity: 30 },
];

// Which region each seeded supplier operates out of, and its minimum order quantity —
// admin-managed platform metadata, not part of the original demo dataset.
const SUPPLIER_META: Record<string, { region: string; minOrderQuantity: number }> = {
  "supplier-a": { region: "Almaty", minOrderQuantity: 20 },
  "supplier-b": { region: "Almaty", minOrderQuantity: 15 },
  "supplier-c": { region: "Almaty", minOrderQuantity: 20 },
  packco: { region: "Almaty", minOrderQuantity: 100 },
  "urban-supply": { region: "Almaty", minOrderQuantity: 50 },
  flavorworks: { region: "Almaty", minOrderQuantity: 6 },
  "cafe-supply-kz": { region: "Almaty", minOrderQuantity: 6 },
  "nomad-bakery": { region: "Almaty", minOrderQuantity: 20 },
  "daily-bread-co": { region: "Almaty", minOrderQuantity: 20 },
  "orion-roasters": { region: "Almaty", minOrderQuantity: 10 },
  "alma-roast": { region: "Almaty", minOrderQuantity: 10 },
  "daily-cup-supply": { region: "Almaty", minOrderQuantity: 50 },
};

const PRODUCT_CATEGORIES = [
  { name: "Dairy", defaultUnit: "L", defaultShelfLifeDays: 7, defaultServiceLevel: 0.95 },
  { name: "Coffee", defaultUnit: "kg", defaultShelfLifeDays: 270, defaultServiceLevel: 0.95 },
  { name: "Packaging", defaultUnit: "sleeve", defaultShelfLifeDays: null, defaultServiceLevel: 0.9 },
  { name: "Bakery", defaultUnit: "unit", defaultShelfLifeDays: 1, defaultServiceLevel: 0.9 },
  { name: "Syrups", defaultUnit: "bottle", defaultShelfLifeDays: 365, defaultServiceLevel: 0.9 },
  { name: "Beverages", defaultUnit: "unit", defaultShelfLifeDays: 180, defaultServiceLevel: 0.9 },
] as const;

const BUSINESS_TYPES = [
  {
    name: "Coffee Shop",
    description: "Cafés and espresso bars — high-frequency dairy and cup consumption, tight morning-rush stockout risk.",
    recommendedTools: ["Dairy auto-reorder", "Cup monitoring", "Supplier reliability scoring", "Demand pooling"],
    defaultCategories: ["Dairy", "Coffee", "Packaging", "Syrups"],
    seasonalityProfile: "Morning peak demand; iced-beverage seasonality in summer.",
  },
  {
    name: "Mini Market",
    description: "Small-format convenience retail across a broad FMCG assortment.",
    recommendedTools: ["Seasonal beverage forecast", "FMCG reorder", "Broader inventory alerts"],
    defaultCategories: ["Beverages", "Packaging"],
    seasonalityProfile: "Broad seasonal swings across many low-margin SKUs.",
  },
  {
    name: "Bakery",
    description: "Fresh bakery goods with same-day perishability.",
    recommendedTools: ["Bakery freshness reorder", "Waste-aware safety stock", "Supplier reliability scoring"],
    defaultCategories: ["Bakery", "Dairy"],
    seasonalityProfile: "Weekend demand spikes; holiday order surges.",
  },
  {
    name: "Pharmacy",
    description: "Regulated retail where stockouts of critical items carry outsized cost.",
    recommendedTools: ["Strict availability thresholds", "Supplier reliability priority"],
    defaultCategories: ["Dairy"],
    seasonalityProfile: "Flu-season and holiday demand spikes for specific categories.",
  },
  {
    name: "Flower Shop",
    description: "Highly perishable inventory with sharp event-driven seasonality.",
    recommendedTools: ["Perishability-aware stock rules", "Holiday seasonality forecast"],
    defaultCategories: ["Bakery"],
    seasonalityProfile: "Major spikes around holidays (Mar 8, Feb 14, Sep 1).",
  },
] as const;

const REGIONS = [
  { name: "Almaty", country: "Kazakhstan", status: "ACTIVE" as const, supportedBusinessTypes: ["Coffee Shop", "Mini Market", "Bakery", "Pharmacy", "Flower Shop"] },
  { name: "Astana", country: "Kazakhstan", status: "AVAILABLE" as const, supportedBusinessTypes: ["Coffee Shop", "Mini Market"] },
  { name: "Shymkent", country: "Kazakhstan", status: "AVAILABLE" as const, supportedBusinessTypes: ["Coffee Shop", "Mini Market"] },
];

export async function seedDatabase(prisma: PrismaClient, log: (msg: string) => void = () => {}): Promise<void> {
  log(`Seeding business ${BUSINESS_ID}...`);
  await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: { name: "Mokka Coffee", city: "Almaty", businessType: "Coffee Shop" },
    create: { id: BUSINESS_ID, name: "Mokka Coffee", city: "Almaty", businessType: "Coffee Shop" },
  });

  const supplierIds = new Set<string>();

  for (const product of PRODUCTS) {
    log(`Seeding product ${product.id}...`);
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        category: product.category,
        unit: product.unit,
        currentStock: product.currentStock,
        avgDailyDemand: product.avgDailyDemand,
        demandStdDev: product.demandStdDev,
        unitRevenue: product.unitRevenueAtRisk,
        leadTimeDays: product.leadTimeDays,
      },
      create: {
        id: product.id,
        businessId: BUSINESS_ID,
        name: product.name,
        category: product.category,
        unit: product.unit,
        currentStock: product.currentStock,
        avgDailyDemand: product.avgDailyDemand,
        demandStdDev: product.demandStdDev,
        unitRevenue: product.unitRevenueAtRisk,
        leadTimeDays: product.leadTimeDays,
      },
    });

    await prisma.inventorySnapshot.create({
      data: { productId: product.id, stock: product.currentStock, reason: "seed" },
    });

    for (const supplier of product.suppliers) {
      if (!supplierIds.has(supplier.id)) {
        supplierIds.add(supplier.id);
        const meta = SUPPLIER_META[supplier.id] ?? { region: "Almaty", minOrderQuantity: 10 };
        await prisma.supplier.upsert({
          where: { id: supplier.id },
          update: { name: supplier.name, region: meta.region, minOrderQuantity: meta.minOrderQuantity },
          create: { id: supplier.id, name: supplier.name, region: meta.region, minOrderQuantity: meta.minOrderQuantity },
        });
      }

      await prisma.supplierProduct.upsert({
        where: { supplierId_productId: { supplierId: supplier.id, productId: product.id } },
        update: {
          pricePerUnit: supplier.pricePerUnit,
          leadTimeDays: supplier.avgLeadTimeDays,
          onTimeRate: supplier.onTimeRate,
          typicalDelayDays: supplier.typicalDelayDays,
        },
        create: {
          supplierId: supplier.id,
          productId: product.id,
          pricePerUnit: supplier.pricePerUnit,
          leadTimeDays: supplier.avgLeadTimeDays,
          onTimeRate: supplier.onTimeRate,
          typicalDelayDays: supplier.typicalDelayDays,
        },
      });
    }
  }

  log("Seeding Milk recovery sources...");
  for (const source of MILK_RECOVERY_SOURCES) {
    await prisma.recoverySource.upsert({
      where: { id: source.id },
      update: { ...source, productId: "milk" },
      create: { ...source, productId: "milk" },
    });
  }

  log("Seeding Milk pooling opportunity...");
  const externalTotal = MILK_POOL_EXTERNAL_PARTICIPANTS.reduce((sum, p) => sum + p.quantity, 0);
  const milkSupplierProduct = await prisma.supplierProduct.findUniqueOrThrow({
    where: { supplierId_productId: { supplierId: "supplier-a", productId: "milk" } },
  });

  const existingPool = await prisma.poolingOpportunity.findFirst({ where: { productId: "milk", status: "OPEN" } });
  const poolingOpportunity = existingPool
    ? existingPool
    : await prisma.poolingOpportunity.create({
        data: {
          productId: "milk",
          targetQuantity: 200,
          combinedQuantity: externalTotal,
          basePrice: milkSupplierProduct.pricePerUnit,
          pooledPrice: milkSupplierProduct.pricePerUnit, // below 50 units, no discount yet — matches calc.ts's tier logic
          status: "OPEN",
        },
      });

  // businessId is null for these external (non-PRONOI) participants, so the compound
  // [poolingOpportunityId, businessId] unique constraint doesn't apply to them —
  // dedupe by name instead, so re-running the seed doesn't create duplicates.
  for (const participant of MILK_POOL_EXTERNAL_PARTICIPANTS) {
    const already = await prisma.poolingParticipant.findFirst({
      where: { poolingOpportunityId: poolingOpportunity.id, externalBusinessName: participant.name },
    });
    if (!already) {
      await prisma.poolingParticipant.create({
        data: {
          poolingOpportunityId: poolingOpportunity.id,
          externalBusinessName: participant.name,
          quantity: participant.quantity,
        },
      });
    }
  }

  log("Seeding product categories...");
  for (const category of PRODUCT_CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { name: category.name },
      update: { defaultUnit: category.defaultUnit, defaultShelfLifeDays: category.defaultShelfLifeDays, defaultServiceLevel: category.defaultServiceLevel },
      create: { ...category },
    });
  }

  log("Seeding business types...");
  for (const businessType of BUSINESS_TYPES) {
    await prisma.businessType.upsert({
      where: { name: businessType.name },
      update: {
        description: businessType.description,
        recommendedTools: [...businessType.recommendedTools],
        defaultCategories: [...businessType.defaultCategories],
        seasonalityProfile: businessType.seasonalityProfile,
      },
      create: {
        name: businessType.name,
        description: businessType.description,
        recommendedTools: [...businessType.recommendedTools],
        defaultCategories: [...businessType.defaultCategories],
        seasonalityProfile: businessType.seasonalityProfile,
      },
    });
  }

  log("Seeding auto-order rules...");
  const existingMilkRule = await prisma.autoOrderRule.findFirst({ where: { name: "Milk Reorder Policy" } });
  if (!existingMilkRule) {
    await prisma.autoOrderRule.create({
      data: {
        name: "Milk Reorder Policy",
        businessType: "Coffee Shop",
        category: "Dairy",
        stockoutRiskThreshold: 0.7,
        minRunwayDays: 3,
        targetServiceLevel: 0.95,
        reorderHorizonDays: 1,
        approvalRequired: true,
        active: true,
      },
    });
  }

  log("Seeding regions...");
  for (const region of REGIONS) {
    const supplierCount = await prisma.supplier.count({ where: { region: region.name } });
    await prisma.region.upsert({
      where: { name_country: { name: region.name, country: region.country } },
      update: { status: region.status, supportedBusinessTypes: [...region.supportedBusinessTypes], supplierCount },
      create: {
        name: region.name,
        country: region.country,
        status: region.status,
        supportedBusinessTypes: [...region.supportedBusinessTypes],
        supplierCount,
      },
    });
  }

  log("Seed complete.");
}
