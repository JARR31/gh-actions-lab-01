export interface HealthResponse {
  service: string;
  version: string;
  uptime: number;
  storage: {
    mode: string;
  };
  dependencies: Record<
    string,
    {
      configured: boolean;
      ok: boolean;
      message?: string;
    }
  >;
}

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: "pending" | "fulfilled" | "cancelled";
  items: OrderItem[];
  totalCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: Order[];
  count: number;
}

export interface CreateOrderRequest {
  customerId: string;
  customerName: string;
  items: OrderItem[];
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/health");
}

export async function getOrders(): Promise<OrdersResponse> {
  return requestJson<OrdersResponse>("/orders");
}

export async function createOrder(input: CreateOrderRequest): Promise<Order> {
  return requestJson<Order>("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
