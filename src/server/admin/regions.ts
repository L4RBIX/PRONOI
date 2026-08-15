import type { RegionStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { writeAuditEvent } from "@/server/pronoi/audit";
import { PronoiError } from "@/server/pronoi/errors";

export interface RegionInput {
  name: string;
  country: string;
  status: RegionStatus;
  supportedBusinessTypes: string[];
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function getRegions() {
  const regions = await prisma.region.findMany({ orderBy: [{ country: "asc" }, { name: "asc" }] });
  return regions.map((r) => ({ ...r, supportedBusinessTypes: toStringArray(r.supportedBusinessTypes) }));
}

export async function createRegion(input: RegionInput) {
  const existing = await prisma.region.findUnique({ where: { name_country: { name: input.name, country: input.country } } });
  if (existing) throw new PronoiError("INVALID_INPUT", `${input.name}, ${input.country} already exists.`);
  const supplierCount = await prisma.supplier.count({ where: { region: input.name } });
  const region = await prisma.region.create({ data: { ...input, supplierCount } });
  await writeAuditEvent({ businessId: null, entityType: "Region", entityId: region.id, action: "ADMIN_CREATED", metadata: { name: region.name } });
  return region;
}

export async function updateRegion(id: string, input: RegionInput) {
  const supplierCount = await prisma.supplier.count({ where: { region: input.name } });
  const region = await prisma.region.update({ where: { id }, data: { ...input, supplierCount } });
  await writeAuditEvent({ businessId: null, entityType: "Region", entityId: region.id, action: "ADMIN_UPDATED", metadata: { name: region.name } });
  return region;
}

export async function deleteRegion(id: string) {
  await prisma.region.delete({ where: { id } });
  await writeAuditEvent({ businessId: null, entityType: "Region", entityId: id, action: "ADMIN_DELETED" });
}
