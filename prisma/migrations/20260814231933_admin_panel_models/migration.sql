-- CreateEnum
CREATE TYPE "RegionStatus" AS ENUM ('ACTIVE', 'AVAILABLE', 'PLANNED');

-- DropForeignKey
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_businessId_fkey";

-- AlterTable
ALTER TABLE "AuditEvent" ALTER COLUMN "businessId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "businessType" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minOrderQuantity" DOUBLE PRECISION,
ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "defaultShelfLifeDays" INTEGER,
    "defaultServiceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recommendedTools" JSONB NOT NULL,
    "defaultCategories" JSONB NOT NULL,
    "seasonalityProfile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoOrderRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" TEXT,
    "category" TEXT NOT NULL,
    "stockoutRiskThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "minRunwayDays" DOUBLE PRECISION,
    "targetServiceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "reorderHorizonDays" INTEGER NOT NULL DEFAULT 1,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoOrderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "status" "RegionStatus" NOT NULL DEFAULT 'PLANNED',
    "supplierCount" INTEGER NOT NULL DEFAULT 0,
    "supportedBusinessTypes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessType_name_key" ON "BusinessType"("name");

-- CreateIndex
CREATE INDEX "AutoOrderRule_category_businessType_idx" ON "AutoOrderRule"("category", "businessType");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_country_key" ON "Region"("name", "country");

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
