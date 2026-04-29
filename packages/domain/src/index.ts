export type OrderStatus = "pending" | "fulfilled" | "cancelled";

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
  status: OrderStatus;
  items: OrderItem[];
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
  cancelledAt?: string;
}

export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  items: OrderItem[];
}

export interface FulfillmentResult {
  order: Order;
  fulfilledAt: string;
  message: string;
}

export interface InventoryReservationResult {
  ok: boolean;
  shortages: Array<{
    sku: string;
    requested: number;
    available: number;
  }>;
}

export class DomainValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "DomainValidationError";
    this.details = details;
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(
    readonly from: OrderStatus,
    readonly to: OrderStatus
  ) {
    super(`Order cannot transition from ${from} to ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: []
};

export function calculateOrderTotal(items: OrderItem[]): number {
  validateLineItems(items);
  return items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0);
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionOrderStatus(
  order: Order,
  nextStatus: OrderStatus,
  now = new Date()
): Order {
  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    throw new InvalidStatusTransitionError(order.status, nextStatus);
  }

  const timestamp = now.toISOString();
  const updatedOrder: Order = {
    ...order,
    status: nextStatus,
    updatedAt: timestamp
  };

  if (nextStatus === "fulfilled") {
    updatedOrder.fulfilledAt = timestamp;
  }

  if (nextStatus === "cancelled") {
    updatedOrder.cancelledAt = timestamp;
  }

  return updatedOrder;
}

export function fulfillOrder(order: Order, now = new Date()): FulfillmentResult {
  const fulfilledAt = now.toISOString();
  const updatedOrder = transitionOrderStatus(order, "fulfilled", now);

  return {
    order: updatedOrder,
    fulfilledAt,
    message: `Order ${order.id} fulfilled`
  };
}

export function validateInventoryReservation(
  items: OrderItem[],
  inventoryBySku: Record<string, number>
): InventoryReservationResult {
  validateLineItems(items);

  const shortages = items
    .map((item) => ({
      sku: item.sku,
      requested: item.quantity,
      available: inventoryBySku[item.sku] ?? 0
    }))
    .filter((entry) => entry.requested > entry.available);

  return {
    ok: shortages.length === 0,
    shortages
  };
}

export function validateCreateOrderInput(input: unknown): CreateOrderInput {
  const errors: string[] = [];

  if (!isRecord(input)) {
    throw new DomainValidationError("Invalid order input", ["Input must be an object"]);
  }

  if (!isNonEmptyString(input.customerId)) {
    errors.push("customerId is required");
  }

  if (!isNonEmptyString(input.customerName)) {
    errors.push("customerName is required");
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    errors.push("items must contain at least one line item");
  } else {
    collectLineItemErrors(input.items, errors);
  }

  if (errors.length > 0) {
    throw new DomainValidationError("Invalid order input", errors);
  }

  const items = input.items as OrderItem[];

  return {
    customerId: input.customerId as string,
    customerName: input.customerName as string,
    items: items.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents
    }))
  };
}

export function createOrder(
  input: unknown,
  options: {
    id: string;
    now?: Date;
    inventoryBySku?: Record<string, number>;
  }
): Order {
  const validInput = validateCreateOrderInput(input);
  const inventoryResult = options.inventoryBySku
    ? validateInventoryReservation(validInput.items, options.inventoryBySku)
    : { ok: true, shortages: [] };

  if (!inventoryResult.ok) {
    const details = inventoryResult.shortages.map(
      (shortage) =>
        `${shortage.sku} requested ${shortage.requested}, only ${shortage.available} available`
    );
    throw new DomainValidationError("Insufficient inventory", details);
  }

  const timestamp = (options.now ?? new Date()).toISOString();

  return {
    id: options.id,
    customerId: validInput.customerId,
    customerName: validInput.customerName,
    status: "pending",
    items: validInput.items,
    totalCents: calculateOrderTotal(validInput.items),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validateLineItems(items: OrderItem[]): void {
  const errors: string[] = [];
  collectLineItemErrors(items, errors);

  if (errors.length > 0) {
    throw new DomainValidationError("Invalid order items", errors);
  }
}

function collectLineItemErrors(items: unknown[], errors: string[]): void {
  items.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`items[${index}] must be an object`);
      return;
    }

    if (!isNonEmptyString(item.sku)) {
      errors.push(`items[${index}].sku is required`);
    }

    if (!isNonEmptyString(item.name)) {
      errors.push(`items[${index}].name is required`);
    }

    const quantity = item.quantity;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
      errors.push(`items[${index}].quantity must be a positive integer`);
    }

    const unitPriceCents = item.unitPriceCents;
    if (
      typeof unitPriceCents !== "number" ||
      !Number.isInteger(unitPriceCents) ||
      unitPriceCents < 0
    ) {
      errors.push(`items[${index}].unitPriceCents must be a non-negative integer`);
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
