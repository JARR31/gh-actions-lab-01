import { describe, expect, it } from "vitest";
import {
  DomainValidationError,
  InvalidStatusTransitionError,
  calculateOrderTotal,
  canTransitionOrderStatus,
  createOrder,
  transitionOrderStatus,
  validateCreateOrderInput,
  validateInventoryReservation
} from "../src/index.js";

const validInput = {
  customerId: "customer-100",
  customerName: "Northwind Wholesale",
  items: [
    {
      sku: "SKU-COFFEE",
      name: "Cold brew concentrate",
      quantity: 2,
      unitPriceCents: 1499
    },
    {
      sku: "SKU-FILTER",
      name: "Commercial filter pack",
      quantity: 1,
      unitPriceCents: 899
    }
  ]
};

describe("order domain", () => {
  it("calculates total price from line items", () => {
    expect(calculateOrderTotal(validInput.items)).toBe(3897);
  });

  it("rejects invalid order input with useful details", () => {
    expect(() =>
      validateCreateOrderInput({
        customerName: "",
        items: [{ sku: "", name: "Broken item", quantity: 0, unitPriceCents: -1 }]
      })
    ).toThrow(DomainValidationError);
  });

  it("allows pending orders to be fulfilled or cancelled", () => {
    expect(canTransitionOrderStatus("pending", "fulfilled")).toBe(true);
    expect(canTransitionOrderStatus("pending", "cancelled")).toBe(true);
  });

  it("rejects invalid status transitions", () => {
    const order = createOrder(validInput, {
      id: "order-1",
      now: new Date("2026-01-01T00:00:00.000Z")
    });
    const fulfilled = transitionOrderStatus(order, "fulfilled", new Date("2026-01-01T00:01:00Z"));

    expect(() => transitionOrderStatus(fulfilled, "cancelled")).toThrow(
      InvalidStatusTransitionError
    );
  });

  it("validates inventory reservation availability", () => {
    expect(
      validateInventoryReservation(validInput.items, {
        "SKU-COFFEE": 2,
        "SKU-FILTER": 1
      })
    ).toEqual({ ok: true, shortages: [] });

    expect(
      validateInventoryReservation(validInput.items, {
        "SKU-COFFEE": 1,
        "SKU-FILTER": 1
      })
    ).toEqual({
      ok: false,
      shortages: [{ sku: "SKU-COFFEE", requested: 2, available: 1 }]
    });
  });
});
