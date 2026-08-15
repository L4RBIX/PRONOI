import { prisma } from "@/server/db";

/**
 * The single seeded demo business for this hackathon build (see prisma/seed.ts).
 * This is the ONLY place the demo business ID is hardcoded — every other
 * server module receives a businessId as a parameter instead of hardcoding
 * it, so swapping this for real auth later only means changing this file.
 */
const DEMO_BUSINESS_ID = "mokka-coffee";

export async function getCurrentDemoBusiness() {
  return prisma.business.findUniqueOrThrow({ where: { id: DEMO_BUSINESS_ID } });
}

export async function getCurrentDemoBusinessId(): Promise<string> {
  return DEMO_BUSINESS_ID;
}
