import { randomUUID } from "node:crypto";
import { createOrder, type CreateOrderInput, type Order } from "@pulsecart/domain";
import { defaultInventoryBySku } from "../inventory.js";
import type { DependencyHealth, OrderStorage } from "./types.js";

interface MemoryOrderStorageOptions {
  seed?: boolean;
  now?: Date;
}

export class MemoryOrderStorage implements OrderStorage {
  readonly mode = "memory";
  private readonly orders = new Map<string, Order>();
  private readonly now: Date;

  constructor(options: MemoryOrderStorageOptions = {}) {
    this.now = options.now ?? new Date("2026-01-01T00:00:00.000Z");

    if (options.seed !== false) {
      const seeded = createOrder(
        {
          customerId: "customer-demo",
          customerName: "Summit Office Supply",
          items: [
            {
              sku: "SKU-COFFEE",
              name: "Cold brew concentrate",
              quantity: 3,
              unitPriceCents: 1499
            }
          ]
        },
        {
          id: "order-demo-001",
          now: this.now,
          inventoryBySku: defaultInventoryBySku
        }
      );
      this.orders.set(seeded.id, seeded);
    }
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async listOrders(): Promise<Order[]> {
    return [...this.orders.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const order = createOrder(input, {
      id: randomUUID(),
      inventoryBySku: defaultInventoryBySku
    });
    this.orders.set(order.id, order);
    return order;
  }

  async updateOrder(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async health(): Promise<DependencyHealth> {
    return {
      configured: true,
      ok: true,
      message: "in-memory storage ready"
    };
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }
}
