# API Contract

Base URL defaults to `http://localhost:3000`.

## `GET /health`

Returns API status and dependency health.

```json
{
  "service": "pulsecart-api",
  "version": "0.1.0",
  "uptime": 12,
  "storage": { "mode": "memory" },
  "dependencies": {
    "storage": { "configured": true, "ok": true, "message": "in-memory storage ready" },
    "redis": { "configured": false, "ok": true, "message": "redis not configured" }
  }
}
```

## `GET /orders`

Returns known orders.

```json
{
  "data": [
    {
      "id": "order-demo-001",
      "customerId": "customer-demo",
      "customerName": "Summit Office Supply",
      "status": "pending",
      "items": [
        {
          "sku": "SKU-COFFEE",
          "name": "Cold brew concentrate",
          "quantity": 3,
          "unitPriceCents": 1499
        }
      ],
      "totalCents": 4497,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

## `POST /orders`

Creates a pending order.

```json
{
  "customerId": "customer-200",
  "customerName": "Bright Market",
  "items": [
    {
      "sku": "SKU-COFFEE",
      "name": "Cold brew concentrate",
      "quantity": 1,
      "unitPriceCents": 1499
    }
  ]
}
```

Successful response: `201 Created` with the created order.

Validation failure: `400 Bad Request`.

```json
{
  "error": "DomainValidationError",
  "message": "Invalid order input",
  "details": ["customerId is required"]
}
```

## `GET /orders/:id`

Returns one order. Missing orders return `404`.

```json
{
  "error": "OrderNotFound",
  "message": "Order missing-id was not found"
}
```

## `POST /orders/:id/fulfill`

Transitions a pending order to fulfilled.

```json
{
  "order": {
    "id": "order-id",
    "status": "fulfilled"
  },
  "fulfilledAt": "2026-04-29T00:00:00.000Z",
  "message": "Order order-id fulfilled"
}
```

Invalid transitions return `409 Conflict`.

```json
{
  "error": "InvalidStatusTransitionError",
  "message": "Order cannot transition from fulfilled to fulfilled",
  "from": "fulfilled",
  "to": "fulfilled"
}
```

## `GET /metrics`

Returns Prometheus-style text:

```text
pulsecart_orders_total 1
pulsecart_orders_by_status{status="pending"} 1
pulsecart_storage_driver{driver="memory"} 1
```
