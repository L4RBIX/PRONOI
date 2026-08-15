import { getAllCurrentDecisions } from "./decisions";

/** Inventory is the same product+decision data as the Overview, just presented as a table. */
export async function getInventory(businessId: string) {
  return getAllCurrentDecisions(businessId);
}
