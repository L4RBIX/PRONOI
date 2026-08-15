import { describe, expect, it } from "vitest";
import { nextOrderStatus, ORDER_STATUS_SEQUENCE } from "./orderStatus";

describe("nextOrderStatus", () => {
  it("walks the full happy-path sequence forward, one step at a time", () => {
    expect(nextOrderStatus("APPROVED")).toBe("ORDER_SENT");
    expect(nextOrderStatus("ORDER_SENT")).toBe("SUPPLIER_CONFIRMED");
    expect(nextOrderStatus("SUPPLIER_CONFIRMED")).toBe("IN_TRANSIT");
    expect(nextOrderStatus("IN_TRANSIT")).toBe("DELIVERED");
  });

  it("has no next status once DELIVERED — the terminal happy-path state", () => {
    expect(nextOrderStatus("DELIVERED")).toBeNull();
  });

  it("has no next status for CANCELLED — not part of the forward sequence", () => {
    expect(nextOrderStatus("CANCELLED")).toBeNull();
  });

  it("sequence has no duplicate or skipped steps", () => {
    expect(new Set(ORDER_STATUS_SEQUENCE).size).toBe(ORDER_STATUS_SEQUENCE.length);
    expect(ORDER_STATUS_SEQUENCE[0]).toBe("APPROVED");
    expect(ORDER_STATUS_SEQUENCE.at(-1)).toBe("DELIVERED");
  });
});
