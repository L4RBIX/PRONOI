import { prisma } from "@/server/db";
import { writeAuditEvent } from "@/server/pronoi/audit";

export interface RuleInput {
  name: string;
  businessType: string | null;
  category: string;
  stockoutRiskThreshold: number;
  minRunwayDays: number | null;
  targetServiceLevel: number;
  reorderHorizonDays: number;
  approvalRequired: boolean;
  active: boolean;
}

export async function getRules() {
  return prisma.autoOrderRule.findMany({ orderBy: [{ active: "desc" }, { category: "asc" }] });
}

export async function createRule(input: RuleInput) {
  const rule = await prisma.autoOrderRule.create({ data: input });
  await writeAuditEvent({ businessId: null, entityType: "AutoOrderRule", entityId: rule.id, action: "ADMIN_CREATED", metadata: { name: rule.name } });
  return rule;
}

export async function updateRule(id: string, input: RuleInput) {
  const rule = await prisma.autoOrderRule.update({ where: { id }, data: input });
  await writeAuditEvent({ businessId: null, entityType: "AutoOrderRule", entityId: rule.id, action: "ADMIN_UPDATED", metadata: { name: rule.name } });
  return rule;
}

export async function setRuleActive(id: string, active: boolean) {
  const rule = await prisma.autoOrderRule.update({ where: { id }, data: { active } });
  await writeAuditEvent({ businessId: null, entityType: "AutoOrderRule", entityId: rule.id, action: "ADMIN_UPDATED", metadata: { active } });
}

export async function deleteRule(id: string) {
  await prisma.autoOrderRule.delete({ where: { id } });
  await writeAuditEvent({ businessId: null, entityType: "AutoOrderRule", entityId: id, action: "ADMIN_DELETED" });
}
