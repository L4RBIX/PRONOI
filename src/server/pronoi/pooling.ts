import type { NextPoolTier } from "@/lib/pronoi/calc";
import { computePooledPurchase, nextPoolTier } from "@/lib/pronoi/calc";
import { prisma } from "@/server/db";
import { writeAuditEvent } from "./audit";
import { getOrCreateCurrentDecision } from "./decisions";
import { PronoiError } from "./errors";

export interface PoolingParticipantView {
  name: string;
  quantity: number;
  isYou: boolean;
}

export interface PoolingView {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  targetQuantity: number;
  combinedQuantity: number;
  individualPrice: number;
  pooledPrice: number;
  totalSavings: number;
  savingsPercent: number;
  yourQuantity: number;
  yourSavings: number;
  joined: boolean;
  participants: PoolingParticipantView[];
  nextTier: NextPoolTier | null;
}

async function buildView(
  opp: { id: string; productId: string; targetQuantity: number; basePrice: number; product: { name: string; unit: string } },
  participants: { businessId: string | null; externalBusinessName: string | null; quantity: number }[],
  businessId: string,
  businessName: string
): Promise<PoolingView> {
  const decision = await getOrCreateCurrentDecision(opp.productId);
  const yourParticipant = participants.find((p) => p.businessId === businessId);
  const externalParticipants = participants.filter((p) => p.businessId !== businessId);
  const yourQuantity = yourParticipant?.quantity ?? decision.recommendedQty;
  const individualPrice =
    decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId)?.supplier.pricePerUnit ?? opp.basePrice;

  const pooled = computePooledPurchase(
    yourQuantity,
    externalParticipants.map((p) => ({ name: p.externalBusinessName ?? "Business", quantity: p.quantity })),
    individualPrice
  );

  return {
    id: opp.id,
    productId: opp.productId,
    productName: opp.product.name,
    unit: opp.product.unit,
    targetQuantity: opp.targetQuantity,
    combinedQuantity: pooled.combinedQuantity,
    individualPrice: pooled.individualPrice,
    pooledPrice: pooled.pooledPrice,
    totalSavings: pooled.totalSavings,
    savingsPercent: pooled.savingsPercent,
    yourQuantity,
    yourSavings: Math.round((pooled.individualPrice - pooled.pooledPrice) * yourQuantity),
    joined: Boolean(yourParticipant),
    participants: [
      { name: businessName, quantity: yourQuantity, isYou: true },
      ...externalParticipants.map((p) => ({ name: p.externalBusinessName ?? "Business", quantity: p.quantity, isYou: false })),
    ],
    nextTier: nextPoolTier(pooled.combinedQuantity),
  };
}

export async function getPoolingOpportunities(businessId: string): Promise<PoolingView[]> {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const opportunities = await prisma.poolingOpportunity.findMany({
    where: { status: "OPEN", product: { businessId } },
    include: { participants: true, product: true },
  });

  return Promise.all(opportunities.map((opp) => buildView(opp, opp.participants, businessId, business.name)));
}

/**
 * Joins a pooling opportunity for the current business, using the product's
 * live recommended reorder quantity as your contribution. Idempotent: the
 * [poolingOpportunityId, businessId] unique constraint prevents a double
 * join even under a concurrent double-click.
 */
export async function joinPoolingOpportunity(poolId: string, businessId: string): Promise<PoolingView> {
  try {
    return await prisma.$transaction(async (tx) => {
      const opp = await tx.poolingOpportunity.findUnique({ where: { id: poolId }, include: { participants: true, product: true } });
      if (!opp) throw new PronoiError("NOT_FOUND", `Pooling opportunity ${poolId} not found.`);
      if (opp.participants.some((p) => p.businessId === businessId)) {
        throw new PronoiError("ALREADY_JOINED", "You've already joined this pool.");
      }

      const decision = await getOrCreateCurrentDecision(opp.productId, tx);
      const quantity = decision.recommendedQty;

      const participant = await tx.poolingParticipant.create({
        data: { poolingOpportunityId: poolId, businessId, quantity },
      });

      const externalParticipants = opp.participants.filter((p) => p.businessId !== businessId);
      const individualPrice =
        decision.supplierScores.find((s) => s.supplier.id === decision.recommendedSupplierId)?.supplier.pricePerUnit ?? opp.basePrice;
      const pooled = computePooledPurchase(
        quantity,
        externalParticipants.map((p) => ({ name: p.externalBusinessName ?? "Business", quantity: p.quantity })),
        individualPrice
      );

      const updatedOpp = await tx.poolingOpportunity.update({
        where: { id: poolId },
        data: { combinedQuantity: pooled.combinedQuantity, pooledPrice: pooled.pooledPrice },
      });

      await writeAuditEvent(
        { businessId, entityType: "PoolingParticipant", entityId: participant.id, action: "POOL_JOINED", metadata: { poolId, quantity } },
        tx
      );

      const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
      return buildView({ ...updatedOpp, product: opp.product }, [...opp.participants, participant], businessId, business.name);
    });
  } catch (err) {
    if (err instanceof PronoiError) throw err;
    if (err && typeof err === "object" && (err as { code?: string }).code === "P2002") {
      throw new PronoiError("ALREADY_JOINED", "You've already joined this pool.");
    }
    throw err;
  }
}
