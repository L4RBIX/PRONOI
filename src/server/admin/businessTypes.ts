import { prisma } from "@/server/db";
import { writeAuditEvent } from "@/server/pronoi/audit";
import { PronoiError } from "@/server/pronoi/errors";

export interface BusinessTypeInput {
  name: string;
  description: string | null;
  recommendedTools: string[];
  defaultCategories: string[];
  seasonalityProfile: string | null;
}

export interface BusinessTypeView {
  id: string;
  name: string;
  description: string | null;
  recommendedTools: string[];
  defaultCategories: string[];
  seasonalityProfile: string | null;
  businessCount: number;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function getBusinessTypes(): Promise<BusinessTypeView[]> {
  const [types, counts] = await Promise.all([
    prisma.businessType.findMany({ orderBy: { name: "asc" } }),
    prisma.business.groupBy({ by: ["businessType"], _count: { _all: true } }),
  ]);
  const countByName = new Map(counts.map((c) => [c.businessType, c._count._all]));
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    recommendedTools: toStringArray(t.recommendedTools),
    defaultCategories: toStringArray(t.defaultCategories),
    seasonalityProfile: t.seasonalityProfile,
    businessCount: countByName.get(t.name) ?? 0,
  }));
}

export async function createBusinessType(input: BusinessTypeInput): Promise<{ id: string }> {
  const existing = await prisma.businessType.findUnique({ where: { name: input.name } });
  if (existing) throw new PronoiError("INVALID_INPUT", `A business type named "${input.name}" already exists.`);
  const created = await prisma.businessType.create({ data: input });
  await writeAuditEvent({ businessId: null, entityType: "BusinessType", entityId: created.id, action: "ADMIN_CREATED", metadata: { name: created.name } });
  return { id: created.id };
}

export async function updateBusinessType(id: string, input: BusinessTypeInput): Promise<void> {
  const updated = await prisma.businessType.update({ where: { id }, data: input });
  await writeAuditEvent({ businessId: null, entityType: "BusinessType", entityId: updated.id, action: "ADMIN_UPDATED", metadata: { name: updated.name } });
}

export async function deleteBusinessType(id: string): Promise<void> {
  const type = await prisma.businessType.findUnique({ where: { id } });
  if (!type) throw new PronoiError("NOT_FOUND", "Business type not found.");
  const businessCount = await prisma.business.count({ where: { businessType: type.name } });
  if (businessCount > 0) {
    throw new PronoiError("INVALID_INPUT", `Can't delete "${type.name}" — ${businessCount} business(es) are assigned this type.`);
  }
  await prisma.businessType.delete({ where: { id } });
  await writeAuditEvent({ businessId: null, entityType: "BusinessType", entityId: id, action: "ADMIN_DELETED", metadata: { name: type.name } });
}
