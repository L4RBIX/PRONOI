import { ZodError } from "zod";

/**
 * Structured errors for the PRONOI service layer (section 19). Server
 * Actions catch these and return a plain { error: { code, message } }
 * object instead of throwing, so a backend failure never crashes the UI —
 * it renders as an inline error state instead.
 */

export type PronoiErrorCode =
  | "NOT_FOUND"
  | "DECISION_NOT_PENDING"
  | "NO_SUPPLIER_RECOMMENDATION"
  | "INVALID_TRANSITION"
  | "ALREADY_JOINED"
  | "INVALID_INPUT"
  | "DB_UNAVAILABLE";

export class PronoiError extends Error {
  code: PronoiErrorCode;

  constructor(code: PronoiErrorCode, message: string) {
    super(message);
    this.name = "PronoiError";
    this.code = code;
  }
}

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(err: unknown): ActionResult<never> {
  if (err instanceof PronoiError) {
    return { ok: false, error: { code: err.code, message: err.message } };
  }
  if (err instanceof ZodError) {
    return { ok: false, error: { code: "INVALID_INPUT", message: err.issues[0]?.message ?? "Invalid input." } };
  }
  console.error("[pronoi] unexpected server action error:", err);
  return { ok: false, error: { code: "DB_UNAVAILABLE", message: "Something went wrong. Please try again." } };
}
