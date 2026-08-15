import { BusinessTypesManager } from "@/components/admin/BusinessTypesManager";
import { getBusinessTypes } from "@/server/admin/businessTypes";

export const dynamic = "force-dynamic";

export default async function AdminBusinessTypesPage() {
  const types = await getBusinessTypes();
  return <BusinessTypesManager initialTypes={types} />;
}
