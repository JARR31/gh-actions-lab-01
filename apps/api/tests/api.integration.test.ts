import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = process.env.STORAGE_DRIVER === "postgres" && Boolean(databaseUrl);
const describeIf = runIntegration ? describe : describe.skip;

const orderInput = {
  customerId: "customer-integration",
  customerName: "Integration Supply Co",
  items: [
    {
      sku: "SKU-THERMOS",
      name: "Insulated delivery thermos",
      quantity: 2,
      unitPriceCents: 2499
    }
  ]
};

describeIf("PulseCart API PostgreSQL and Redis integration", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await resetDatabase(databaseUrl as string);
    app = await buildApp({
      logger: false,
      config: {
        ...loadConfig(),
        storageDriver: "postgres",
        databaseUrl: databaseUrl as string,
        redisUrl: process.env.REDIS_URL
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates, persists, reads, and fulfills an order through PostgreSQL storage", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/orders",
      payload: orderInput
    });
    const created = createResponse.json();

    expect(createResponse.statusCode).toBe(201);
    expect(created.status).toBe("pending");

    const getResponse = await app.inject({
      method: "GET",
      url: `/orders/${created.id}`
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: created.id,
      customerName: "Integration Supply Co"
    });

    const fulfillResponse = await app.inject({
      method: "POST",
      url: `/orders/${created.id}/fulfill`
    });

    expect(fulfillResponse.statusCode).toBe(200);
    expect(fulfillResponse.json().order.status).toBe("fulfilled");
  });

  it("reports PostgreSQL and Redis dependency health", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.storage.mode).toBe("postgres");
    expect(body.dependencies.storage).toMatchObject({
      configured: true,
      ok: true
    });

    if (process.env.REDIS_URL) {
      expect(body.dependencies.redis).toMatchObject({
        configured: true,
        ok: true
      });
    }
  });
});

async function resetDatabase(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  await pool.query("DROP TABLE IF EXISTS orders");
  await pool.end();
}
