"use server";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { actionError, actionOk, type ActionResult } from "./errors";

const execFileAsync = promisify(execFile);

/**
 * Restores the demo tenant to its pristine seeded state so the voice-agent
 * demo can be rehearsed repeatedly: truncates every table the demo run
 * mutates (decisions, purchase orders, pooling participation, simulation
 * history, audit log, inventory snapshots), then re-runs the same seed
 * script `docs/PRONOI_BACKEND.md` documents for manual resets. Products and
 * suppliers are reseeded via upsert, which also resets fields a run may
 * have drifted (e.g. Product.currentStock after a delivery).
 *
 * Intentionally dev-only — this is a demo-rehearsal control, not a
 * production data-management feature.
 */
export async function resetVoiceDemoAction(): Promise<ActionResult<{ reset: true }>> {
  if (process.env.NODE_ENV === "production") {
    return actionError(new Error("Demo reset is disabled in production."));
  }
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE "AuditEvent", "SimulationRun", "PurchaseOrderItem", "PurchaseOrder", "Decision", "PoolingParticipant", "InventorySnapshot" CASCADE;`
    );
    await execFileAsync("npx", ["tsx", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 30_000,
    });

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
