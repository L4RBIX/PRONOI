import { SupplierTemplatesManager } from "@/components/admin/SupplierTemplatesManager";
import { prisma } from "@/server/db";
import { getSupplierTemplateRows } from "@/server/admin/supplierTemplates";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  const [rows, products] = await Promise.all([
    getSupplierTemplateRows(),
    prisma.product.findMany({ select: { id: true, name: true, category: true, unit: true }, orderBy: { name: "asc" } }),
  ]);
  return <SupplierTemplatesManager initialRows={rows} products={products} />;
}
