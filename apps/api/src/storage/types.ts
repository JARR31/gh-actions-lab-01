import type { CreateOrderInput, Order } from "@pulsecart/domain";

export interface DependencyHealth {
  configured: boolean;
  ok: boolean;
  message?: string;
}

export interface OrderStorage {
  readonly mode: "memory" | "postgres";
  initialize(): Promise<void>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrder(order: Order): Promise<Order>;
  health(): Promise<DependencyHealth>;
  close(): Promise<void>;
}
