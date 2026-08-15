import { prisma } from "@/server/db";
import { writeAuditEvent } from "@/server/pronoi/audit";
import { PronoiError } from "@/server/pronoi/errors";

export interface CategoryView {
  id: string;
  name: string;
  defaultUnit: string;
  defaultShelfLifeDays: number | null;
  defaultServiceLevel: number;
  active: boolean;
  productCount: number;
}

export interface CategoryInput {
  name: string;
  defaultUnit: string;
  defaultShelfLifeDays: number | null;
  defaultServiceLevel: number;
  active: boolean;
}

export async function getCategories(): Promise<CategoryView[]> {
  const [categories, productCounts] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.product.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);
  const countByName = new Map(productCounts.map((p) => [p.category, p._count._all]));
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    defaultUnit: c.defaultUnit,
    defaultShelfLifeDays: c.defaultShelfLifeDays,
    defaultServiceLevel: c.defaultServiceLevel,
    active: c.active,
    productCount: countByName.get(c.name) ?? 0,
  }));
}

export async function createCategory(input: CategoryInput): Promise<CategoryView> {
  const existing = await prisma.productCategory.findUnique({ where: { name: input.name } });
  if (existing) throw new PronoiError("INVALID_INPUT", `A category named "${input.name}" already exists.`);

  const category = await prisma.productCategory.create({ data: input });
  await writeAuditEvent({ businessId: null, entityType: "ProductCategory", entityId: category.id, action: "ADMIN_CREATED", metadata: { name: category.name } });
  return { ...category, productCount: 0 };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryView> {
  const category = await prisma.productCategory.update({ where: { id }, data: input });
  await writeAuditEvent({ businessId: null, entityType: "ProductCategory", entityId: category.id, action: "ADMIN_UPDATED", metadata: { name: category.name } });
  const productCount = await prisma.product.count({ where: { category: category.name } });
  return { ...category, productCount };
}

export async function setCategoryActive(id: string, active: boolean): Promise<void> {
  const category = await prisma.productCategory.update({ where: { id }, data: { active } });
  await writeAuditEvent({
    businessId: null,
    entityType: "ProductCategory",
    entityId: category.id,
    action: "ADMIN_UPDATED",
    metadata: { name: category.name, active },
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new PronoiError("NOT_FOUND", "Category not found.");
  const productCount = await prisma.product.count({ where: { category: category.name } });
  if (productCount > 0) {
    throw new PronoiError("INVALID_INPUT", `Can't delete "${category.name}" — ${productCount} product(s) still use it. Disable it instead.`);
  }
  await prisma.productCategory.delete({ where: { id } });
  await writeAuditEvent({ businessId: null, entityType: "ProductCategory", entityId: id, action: "ADMIN_DELETED", metadata: { name: category.name } });
}
