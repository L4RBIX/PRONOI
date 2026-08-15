import { RulesManager } from "@/components/admin/RulesManager";
import { prisma } from "@/server/db";
import { getRules } from "@/server/admin/rules";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  const [rules, businessTypes, categories] = await Promise.all([
    getRules(),
    prisma.businessType.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  return <RulesManager initialRules={rules} businessTypeNames={businessTypes.map((b) => b.name)} categoryNames={categories.map((c) => c.name)} />;
}
