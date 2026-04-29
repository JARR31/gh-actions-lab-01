# Architecture

PulseCart is a pnpm workspace with one shared domain package and two applications.

## Application Architecture

- `packages/domain` owns business types and rules: order creation input, status transitions, fulfillment output, price totals, and inventory reservation checks.
- `apps/api` exposes the domain through Fastify routes. It validates create-order requests through the domain package and keeps storage behind an `OrderStorage` interface.
- `apps/web` is a React/Vite client that reads API health and order data, creates a simple demo order, and shows placeholder deployment cards for later automation.

## Package Boundaries

The API depends on `@pulsecart/domain`. The web app intentionally consumes only HTTP API responses so later CI workflows can test app integration through public contracts instead of internal imports.

## Storage Modes

- `STORAGE_DRIVER=memory`: default mode for local smoke checks, API unit tests, and container smoke tests. It includes one seeded demo order.
- `STORAGE_DRIVER=postgres`: integration/local Compose mode. The API uses `DATABASE_URL` and creates a simple `orders` table on startup.
- `REDIS_URL`: optional. When provided, the API checks Redis health and increments a lightweight request counter for metrics.

## Test Strategy

- Domain unit tests cover price calculation, invalid input, status transitions, and inventory reservation validation.
- API unit tests run in memory mode and validate health, order creation/read, 404s, fulfillment, invalid fulfillment, and metrics.
- API integration tests run against PostgreSQL and Redis when the required environment variables are provided.
- Web unit tests render the dashboard, orders, deployments, and a create-order interaction with mocked HTTP.
- Playwright E2E starts the API in memory mode plus the Vite dev server and validates one dashboard-to-order path.
