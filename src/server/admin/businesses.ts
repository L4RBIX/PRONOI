import { prisma } from "@/server/db";
import { getAllCurrentDecisions } from "@/server/pronoi/decisions";
import { getOrders } from "@/server/pronoi/orders";
import { getPoolingOpportunities } from "@/server/pronoi/pooling";

export interface BusinessOverviewRow {
  id: string;
  name: string;
  businessType: string | null;
  city: string;
  productCount: number;
  openDecisions: number;
  activeOrders: number;
  poolingParticipation: number;
}

export async function getBusinessesOverview(): Promise<BusinessOverviewRow[]> {
  const businesses = await prisma.business.findMany({ orderBy: { name: "asc" } });
  return Promise.all(
    businesses.map(async (b) => {
      const [productCount, openDecisions, activeOrders, poolingParticipation] = await Promise.all([
        prisma.product.count({ where: { businessId: b.id } }),
        prisma.decision.count({ where: { businessId: b.id, status: "PENDING" } }),
        prisma.purchaseOrder.count({ where: { businessId: b.id, status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
        prisma.poolingParticipant.count({ where: { businessId: b.id } }),
      ]);
      return { id: b.id, name: b.name, businessType: b.businessType, city: b.city, productCount, openDecisions, activeOrders, poolingParticipation };
    })
  );
}

export async function getBusinessDetail(businessId: string) {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const [decisions, orders, pools, rules] = await Promise.all([
    getAllCurrentDecisions(businessId),
    getOrders(businessId),
    getPoolingOpportunities(businessId),
    prisma.autoOrderRule.findMany({
      where: { active: true, OR: [{ businessType: business.businessType ?? undefined }, { businessType: null }] },
      orderBy: { category: "asc" },
    }),
  ]);
  return { business, decisions, orders, pools, rules };
}
