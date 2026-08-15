import { OrdersView, type OrderView } from "@/components/pronoi/OrdersView";
import type { OrderStatus } from "@/lib/pronoi/orderStatus";
import { getCurrentDemoBusiness } from "@/server/pronoi/business";
import { getOrders } from "@/server/pronoi/orders";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ highlight?: string }> }) {
  const { highlight } = await searchParams;
  const business = await getCurrentDemoBusiness();
  const orders = await getOrders(business.id);

  const views: OrderView[] = orders.map((o) => ({
    id: o.id,
    poNumber: o.poNumber,
    status: o.status as OrderStatus,
    totalAmount: o.totalAmount,
    etaDays: o.etaDays,
    supplierName: o.supplier.name,
    items: o.items.map((item) => ({ productName: item.product.name, quantity: item.quantity, unit: item.product.unit })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-light">Orders</h1>
        <p className="mt-2 max-w-xl text-gray-600">Every purchase order PRONOI has created, from approval to delivery.</p>
      </div>

      <OrdersView orders={views} highlightOrderId={highlight} />
    </div>
  );
}
