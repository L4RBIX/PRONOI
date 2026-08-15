import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { getCategories } from "@/server/admin/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return <CategoriesManager initialCategories={categories} />;
}
