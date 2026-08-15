/**
 * Allowlist of internal destinations the PRONOI Copilot is allowed to link
 * to. This is the single source of truth for navigation — shared by the
 * server (to tell DeepSeek which action IDs exist, and to validate/strip
 * anything it returns that isn't on this list) and the client (to render an
 * approved action as an inline link and to navigate to its route).
 *
 * DeepSeek only ever returns an action ID (e.g. "OPEN_DASHBOARD"), never a
 * URL — the actual route always comes from this file, not from the model.
 * Routes below are the real routes implemented in src/app; nothing here is
 * invented.
 */

export interface CopilotActionDef {
  id: string;
  route: string;
  /** Default label used when the action can't be embedded inline in the sentence. */
  label: string;
  /** Lowercase phrases to look for in the model's sentence, longest first. */
  triggers: string[];
  description: string;
}

export const COPILOT_ACTIONS: CopilotActionDef[] = [
  {
    id: "OPEN_DASHBOARD",
    route: "/dashboard",
    label: "Open dashboard",
    triggers: ["dashboard"],
    description: "The main procurement dashboard (today's decisions overview).",
  },
  {
    id: "OPEN_DECISION_LAB",
    route: "/#decision-lab",
    label: "Open Decision Lab",
    triggers: ["decision lab"],
    description: "The interactive live-recalculating demo on the landing page.",
  },
  {
    id: "OPEN_DECISIONS",
    route: "/dashboard/decisions",
    label: "Open decisions",
    triggers: ["decisions page", "decisions list", "decisions"],
    description: "Every product's decision, ranked by stockout risk.",
  },
  {
    id: "OPEN_INVENTORY",
    route: "/dashboard/inventory",
    label: "Open inventory",
    triggers: ["inventory"],
    description: "Full inventory table, ranked by stockout risk.",
  },
  {
    id: "OPEN_SUPPLIERS",
    route: "/dashboard/suppliers",
    label: "Open suppliers",
    triggers: ["suppliers"],
    description: "Supplier comparison: price, reliability, which products they quote.",
  },
  {
    id: "OPEN_ORDERS",
    route: "/dashboard/orders",
    label: "Open orders",
    triggers: ["orders", "purchase orders"],
    description: "Purchase orders and their delivery status.",
  },
  {
    id: "OPEN_POOLING",
    route: "/dashboard/pooling",
    label: "Open pooling",
    triggers: ["demand pooling", "pooling"],
    description: "Joining nearby businesses' orders for a volume discount.",
  },
  {
    id: "OPEN_SIMULATION",
    route: "/dashboard/simulation",
    label: "Open simulation",
    triggers: ["simulation"],
    description: "7-day naive-vs-PRONOI comparison and supplier disruption scenario.",
  },
];

const ACTIONS_BY_ID = new Map(COPILOT_ACTIONS.map((a) => [a.id, a]));

export function getCopilotAction(id: string): CopilotActionDef | undefined {
  return ACTIONS_BY_ID.get(id);
}

/** Filters arbitrary input down to known, valid action IDs — never trusts the caller. */
export function sanitizeActionIds(ids: unknown): CopilotActionDef[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const result: CopilotActionDef[] = [];
  for (const id of ids) {
    if (typeof id !== "string") continue;
    const action = ACTIONS_BY_ID.get(id);
    if (action && !seen.has(action.id)) {
      seen.add(action.id);
      result.push(action);
    }
  }
  return result;
}
