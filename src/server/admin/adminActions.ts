"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as businessTypesService from "./businessTypes";
import * as categoriesService from "./categories";
import * as regionsService from "./regions";
import * as rulesService from "./rules";
import * as supplierTemplatesService from "./supplierTemplates";
import { actionError, actionOk, type ActionResult } from "@/server/pronoi/errors";

/**
 * The only mutation entry points for the admin panel — mirrors the
 * business-facing src/server/pronoi/actions.ts pattern: each action is
 * Zod-validated, calls the matching src/server/admin/* service function,
 * revalidates the affected paths, and returns { ok, data } / { ok:false,
 * error } instead of throwing across the client/server boundary.
 */

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/rules");
  revalidatePath("/admin/business-types");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/regions");
}

/** Supplier/rule edits change what the real decision engine computes — revalidate the business-facing dashboard too. */
function revalidateBusinessDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/decisions");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/suppliers");
}

const idSchema = z.string().min(1);

// ---------- Categories ----------

const categoryInputSchema = z.object({
  name: z.string().min(1).max(60),
  defaultUnit: z.string().min(1).max(20),
  defaultShelfLifeDays: z.number().int().min(0).nullable(),
  defaultServiceLevel: z.number().min(0.5).max(0.999),
  active: z.boolean(),
});

export async function createCategoryAction(input: unknown): Promise<ActionResult<categoriesService.CategoryView>> {
  try {
    const parsed = categoryInputSchema.parse(input);
    const result = await categoriesService.createCategory(parsed);
    revalidateAdmin();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function updateCategoryAction(id: string, input: unknown): Promise<ActionResult<categoriesService.CategoryView>> {
  try {
    const parsedId = idSchema.parse(id);
    const parsed = categoryInputSchema.parse(input);
    const result = await categoriesService.updateCategory(parsedId, parsed);
    revalidateAdmin();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function setCategoryActiveAction(id: string, active: boolean): Promise<ActionResult<{ active: boolean }>> {
  try {
    await categoriesService.setCategoryActive(idSchema.parse(id), active);
    revalidateAdmin();
    return actionOk({ active });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    await categoriesService.deleteCategory(idSchema.parse(id));
    revalidateAdmin();
    return actionOk({ deleted: true });
  } catch (err) {
    return actionError(err);
  }
}

// ---------- Supplier templates ----------

const supplierProfileSchema = z.object({
  name: z.string().min(1).max(80),
  region: z.string().max(60).nullable(),
  minOrderQuantity: z.number().min(0).nullable(),
  active: z.boolean(),
});

const supplierQuoteSchema = z.object({
  pricePerUnit: z.number().min(0),
  leadTimeDays: z.number().min(0).max(60),
  onTimeRate: z.number().min(0).max(1),
  typicalDelayDays: z.number().min(0).max(30),
  isActive: z.boolean(),
});

export async function updateSupplierProfileAction(supplierId: string, input: unknown): Promise<ActionResult<{ updated: true }>> {
  try {
    await supplierTemplatesService.updateSupplierProfile(idSchema.parse(supplierId), supplierProfileSchema.parse(input));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ updated: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateSupplierProductQuoteAction(supplierProductId: string, input: unknown): Promise<ActionResult<{ updated: true }>> {
  try {
    await supplierTemplatesService.updateSupplierProductQuote(idSchema.parse(supplierProductId), supplierQuoteSchema.parse(input));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ updated: true });
  } catch (err) {
    return actionError(err);
  }
}

const createSupplierSchema = z.object({
  id: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "id must be lowercase letters, numbers, and hyphens"),
  name: z.string().min(1).max(80),
  region: z.string().max(60).nullable(),
  minOrderQuantity: z.number().min(0).nullable(),
  active: z.boolean(),
  productId: z.string().min(1),
  quote: supplierQuoteSchema,
});

export async function createSupplierAction(input: unknown): Promise<ActionResult<{ created: true }>> {
  try {
    await supplierTemplatesService.createSupplierWithQuote(createSupplierSchema.parse(input));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ created: true });
  } catch (err) {
    return actionError(err);
  }
}

const addQuoteSchema = z.object({ supplierId: idSchema, productId: idSchema, quote: supplierQuoteSchema });

export async function addSupplierProductQuoteAction(input: unknown): Promise<ActionResult<{ created: true }>> {
  try {
    const parsed = addQuoteSchema.parse(input);
    await supplierTemplatesService.addSupplierProductQuote(parsed.supplierId, parsed.productId, parsed.quote);
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ created: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteSupplierProductQuoteAction(supplierProductId: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    await supplierTemplatesService.deleteSupplierProductQuote(idSchema.parse(supplierProductId));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ deleted: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteSupplierAction(supplierId: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    await supplierTemplatesService.deleteSupplier(idSchema.parse(supplierId));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ deleted: true });
  } catch (err) {
    return actionError(err);
  }
}

// ---------- Auto-order rules ----------

const ruleInputSchema = z.object({
  name: z.string().min(1).max(80),
  businessType: z.string().max(60).nullable(),
  category: z.string().min(1).max(60),
  stockoutRiskThreshold: z.number().min(0).max(1),
  minRunwayDays: z.number().min(0).max(60).nullable(),
  targetServiceLevel: z.number().min(0.5).max(0.999),
  reorderHorizonDays: z.number().int().min(0).max(30),
  approvalRequired: z.boolean(),
  active: z.boolean(),
});

export async function createRuleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await rulesService.createRule(ruleInputSchema.parse(input));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ id: result.id });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateRuleAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await rulesService.updateRule(idSchema.parse(id), ruleInputSchema.parse(input));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ id: result.id });
  } catch (err) {
    return actionError(err);
  }
}

export async function setRuleActiveAction(id: string, active: boolean): Promise<ActionResult<{ active: boolean }>> {
  try {
    await rulesService.setRuleActive(idSchema.parse(id), active);
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ active });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteRuleAction(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    await rulesService.deleteRule(idSchema.parse(id));
    revalidateAdmin();
    revalidateBusinessDashboard();
    return actionOk({ deleted: true });
  } catch (err) {
    return actionError(err);
  }
}

// ---------- Business types ----------

const businessTypeInputSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).nullable(),
  recommendedTools: z.array(z.string().min(1).max(60)).max(12),
  defaultCategories: z.array(z.string().min(1).max(60)).max(12),
  seasonalityProfile: z.string().max(300).nullable(),
});

export async function createBusinessTypeAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await businessTypesService.createBusinessType(businessTypeInputSchema.parse(input));
    revalidateAdmin();
    return actionOk(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function updateBusinessTypeAction(id: string, input: unknown): Promise<ActionResult<{ updated: true }>> {
  try {
    await businessTypesService.updateBusinessType(idSchema.parse(id), businessTypeInputSchema.parse(input));
    revalidateAdmin();
    return actionOk({ updated: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteBusinessTypeAction(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    await businessTypesService.deleteBusinessType(idSchema.parse(id));
    revalidateAdmin();
    return actionOk({ deleted: true });
  } catch (err) {
    return actionError(err);
  }
}

// ---------- Regions ----------

const regionInputSchema = z.object({
  name: z.string().min(1).max(60),
  country: z.string().min(1).max(60),
  status: z.enum(["ACTIVE", "AVAILABLE", "PLANNED"]),
  supportedBusinessTypes: z.array(z.string().min(1).max(60)).max(20),
});

export async function createRegionAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await regionsService.createRegion(regionInputSchema.parse(input));
    revalidateAdmin();
    return actionOk({ id: result.id });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateRegionAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await regionsService.updateRegion(idSchema.parse(id), regionInputSchema.parse(input));
    revalidateAdmin();
    return actionOk({ id: result.id });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteRegionAction(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    await regionsService.deleteRegion(idSchema.parse(id));
    revalidateAdmin();
    return actionOk({ deleted: true });
  } catch (err) {
    return actionError(err);
  }
}
