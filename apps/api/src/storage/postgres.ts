import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createOrder, type CreateOrderInput, type Order, type OrderItem } from "@pulsecart/domain";
import { defaultInventoryBySku } from "../inventory.js";
import type { DependencyHealth, OrderStorage } from "./types.js";

interface OrderRow {
  id: string;
  customer_id: string;
  customer_name: string;
  status: Order["status"];
  items: OrderItem[] | string;
  total_cents: number;
  created_at: Date;
  updated_at: Date;
  fulfilled_at: Date | null;
  cancelled_at: Date | null;
}

export class PostgresOrderStorage implements OrderStorage {
  readonly mode = "postgres";
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl
    });
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
        items JSONB NOT NULL,
        total_cents INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        fulfilled_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ
      );
    `);
  }

  async listOrders(): Promise<Order[]> {
    const result = await this.pool.query<OrderRow>(
      "SELECT * FROM orders ORDER BY created_at ASC, id ASC"
    );
    return result.rows.map(rowToOrder);
  }

  async getOrder(id: string): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>("SELECT * FROM orders WHERE id = $1", [id]);
    const row = result.rows[0];
    return row ? rowToOrder(row) : null;
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const order = createOrder(input, {
      id: randomUUID(),
      inventoryBySku: defaultInventoryBySku
    });
    await this.insertOrUpdate(order);
    return order;
  }

  async updateOrder(order: Order): Promise<Order> {
    await this.insertOrUpdate(order);
    return order;
  }

  async health(): Promise<DependencyHealth> {
    try {
      await this.pool.query("SELECT 1");
      return {
        configured: true,
        ok: true,
        message: "postgres connection ready"
      };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        message: error instanceof Error ? error.message : "postgres health check failed"
      };
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async insertOrUpdate(order: Order): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO orders (
        id,
        customer_id,
        customer_name,
        status,
        items,
        total_cents,
        created_at,
        updated_at,
        fulfilled_at,
        cancelled_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        customer_name = EXCLUDED.customer_name,
        status = EXCLUDED.status,
        items = EXCLUDED.items,
        total_cents = EXCLUDED.total_cents,
        updated_at = EXCLUDED.updated_at,
        fulfilled_at = EXCLUDED.fulfilled_at,
        cancelled_at = EXCLUDED.cancelled_at
      `,
      [
        order.id,
        order.customerId,
        order.customerName,
        order.status,
        JSON.stringify(order.items),
        order.totalCents,
        order.createdAt,
        order.updatedAt,
        order.fulfilledAt ?? null,
        order.cancelledAt ?? null
      ]
    );
  }
}

function rowToOrder(row: OrderRow): Order {
  const items = typeof row.items === "string" ? (JSON.parse(row.items) as OrderItem[]) : row.items;
  const order: Order = {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    status: row.status,
    items,
    totalCents: row.total_cents,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };

  if (row.fulfilled_at) {
    order.fulfilledAt = row.fulfilled_at.toISOString();
  }

  if (row.cancelled_at) {
    order.cancelledAt = row.cancelled_at.toISOString();
  }

  return order;
}
