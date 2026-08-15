import Link from "next/link";
import { DecisionDetailView } from "@/components/pronoi/DecisionDetailView";
import { getDecisionForProduct, type DecisionView } from "@/server/pronoi/decisions";
import { PronoiError } from "@/server/pronoi/errors";

export const dynamic = "force-dynamic";

async function loadDecision(id: string): Promise<DecisionView | null> {
  try {
    return await getDecisionForProduct(id);
  } catch (err) {
    if (err instanceof PronoiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

export default async function DecisionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const { id } = await params;
  const { focus } = await searchParams;
  const decision = await loadDecision(id);

  if (!decision) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500">Product not found.</p>
        <Link href="/dashboard/decisions" className="mt-4 inline-block underline">
          Back to decisions
        </Link>
      </div>
    );
  }

  return <DecisionDetailView decision={decision} autoFocusSuppliers={focus === "suppliers"} />;
}
