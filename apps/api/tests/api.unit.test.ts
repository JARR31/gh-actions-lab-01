import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { MemoryOrderStorage } from "../src/storage/memory.js";

const orderInput = {
  customerId: "customer-200",
  customerName: "Bright Market",
  items: [
    {
      sku: "SKU-COFFEE",
      name: "Cold brew concentrate",
      quantity: 1,
      unitPriceCents: 1499
    }
  ]
};

describe("PulseCart API memory mode", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      logger: false,
      storage: new MemoryOrderStorage({ seed: false })
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns expected health structure", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: "pulsecart-api",
      storage: {
        mode: "memory"
      },
      dependencies: {
        storage: {
          configured: true,
          ok: true
        },
        redis: {
          configured: false,
          ok: true
        }
      }
    });
  });

  it("creates and retrieves an order", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/orders",
      payload: orderInput
    });
    const created = createResponse.json();

    expect(createResponse.statusCode).toBe(201);
    expect(created).toMatchObject({
      customerId: "customer-200",
      status: "pending",
      totalCents: 1499
    });

    const getResponse = await app.inject({
      method: "GET",
      url: `/orders/${created.id}`
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: created.id,
      customerName: "Bright Market"
    });
  });

  it("returns 404 for a missing order", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/orders/not-real"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: "OrderNotFound"
    });
  });

  it("fulfills a pending order", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/orders",
      payload: orderInput
    });
    const created = createResponse.json();

    const fulfillResponse = await app.inject({
      method: "POST",
      url: `/orders/${created.id}/fulfill`
    });

    expect(fulfillResponse.statusCode).toBe(200);
    expect(fulfillResponse.json()).toMatchObject({
      order: {
        id: created.id,
        status: "fulfilled"
      },
      message: `Order ${created.id} fulfilled`
    });
  });

  it("returns a useful error for invalid fulfillment transition", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/orders",
      payload: orderInput
    });
    const created = createResponse.json();

    await app.inject({
      method: "POST",
      url: `/orders/${created.id}/fulfill`
    });
    const secondFulfillment = await app.inject({
      method: "POST",
      url: `/orders/${created.id}/fulfill`
    });

    expect(secondFulfillment.statusCode).toBe(409);
    expect(secondFulfillment.json()).toMatchObject({
      error: "InvalidStatusTransitionError",
      from: "fulfilled",
      to: "fulfilled"
    });
  });

  it("returns Prometheus-style metrics", async () => {
    await app.inject({
      method: "POST",
      url: "/orders",
      payload: orderInput
    });

    const response = await app.inject({
      method: "GET",
      url: "/metrics"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("pulsecart_orders_total 1");
    expect(response.body).toContain('pulsecart_storage_driver{driver="memory"} 1');
  });
});
