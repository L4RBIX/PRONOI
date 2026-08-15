"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { actionError, actionOk, type ActionResult } from "./errors";
import { seedDatabase } from "./seedDatabase";

/**
 * Restores the demo tenant to its pristine seeded state so the voice-agent
 * demo can be rehearsed repeatedly: truncates every table a demo run
 * mutates (decisions, purchase orders, pooling participation, simulation
 * history, audit log, inventory snapshots), then reseeds in-process via the
 * same seedDatabase() function `prisma/seed.ts` uses for local setup.
 *
 * Runs in-process (not by shelling out to `npx tsx prisma/seed.ts`) so it
 * works in a serverless production deployment, not just local dev.
 */
export async function resetVoiceDemoAction(): Promise<ActionResult<{ reset: true }>> {
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE "AuditEvent", "SimulationRun", "PurchaseOrderItem", "PurchaseOrder", "Decision", "PoolingParticipant", "InventorySnapshot" CASCADE;`
    );
    await seedDatabase(prisma);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/decisions");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/suppliers");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/pooling");
    revalidatePath("/dashboard/simulation");

    return actionOk({ reset: true });
  } catch (err) {
    return actionError(err);
  }
}
