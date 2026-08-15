"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentDemoBusinessId } from "./business";
import { approveDecision, rejectDecision } from "./decisions";
import { actionError, actionOk, PronoiError, type ActionResult } from "./errors";
import { advanceOrderStatus } from "./orders";
import { joinPoolingOpportunity } from "./pooling";
import { runStressTest, runWeeklyComparison, type StressTestResult, type WeeklyComparisonResult } from "./simulations";

const idSchema = z.string().min(1, "id is required");

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/decisions");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/pooling");
}

export async function approveDecisionAction(decisionId: string): Promise<ActionResult<Awaited<ReturnType<typeof approveDecision>>>> {
  try {
    const id = idSchema.parse(decisionId);
    const result = await approveDecision(id);
    revalidateDashboard();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function rejectDecisionAction(decisionId: string): Promise<ActionResult<Awaited<ReturnType<typeof rejectDecision>>>> {
  try {
    const id = idSchema.parse(decisionId);
    const result = await rejectDecision(id);
    revalidateDashboard();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function advanceOrderStatusAction(orderId: string): Promise<ActionResult<Awaited<ReturnType<typeof advanceOrderStatus>>>> {
  try {
    const id = idSchema.parse(orderId);
    const result = await advanceOrderStatus(id);
    revalidateDashboard();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function joinPoolAction(poolId: string): Promise<ActionResult<Awaited<ReturnType<typeof joinPoolingOpportunity>>>> {
  try {
    const id = idSchema.parse(poolId);
    const businessId = await getCurrentDemoBusinessId();
    const result = await joinPoolingOpportunity(id, businessId);
    revalidateDashboard();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

const weeklyComparisonSchema = z.object({ productId: idSchema });

export async function runWeeklyComparisonAction(productId: string): Promise<ActionResult<WeeklyComparisonResult>> {
  try {
    const input = weeklyComparisonSchema.parse({ productId });
    const businessId = await getCurrentDemoBusinessId();
    const result = await runWeeklyComparison(businessId, input.productId);
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

const stressTestSchema = z.object({
  productId: idSchema,
  demandMultiplier: z.number().min(0.5, "demandMultiplier too low").max(3, "demandMultiplier too high"),
  extraLeadTimeDays: z.number().min(0, "extraLeadTimeDays cannot be negative").max(30, "extraLeadTimeDays too high"),
  cancelled: z.boolean(),
});

export async function runStressTestAction(input: {
  productId: string;
  demandMultiplier: number;
  extraLeadTimeDays: number;
  cancelled: boolean;
}): Promise<ActionResult<StressTestResult>> {
  try {
    const parsed = stressTestSchema.parse(input);
    const businessId = await getCurrentDemoBusinessId();
    const result = await runStressTest(businessId, parsed.productId, parsed);
    return actionOk(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return actionError(new PronoiError("INVALID_INPUT", err.issues[0]?.message ?? "Invalid simulation input."));
    }
    return actionError(err);
  }
}
