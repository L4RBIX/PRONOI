import { RegionsManager } from "@/components/admin/RegionsManager";
import { getRegions } from "@/server/admin/regions";

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  const regions = await getRegions();
  return <RegionsManager initialRegions={regions} />;
}
