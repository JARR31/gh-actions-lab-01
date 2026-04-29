# Testing Guide

## Unit Tests

```bash
pnpm test:unit
```

Covers:

- Domain order rules
- API memory-mode routes
- Web rendering and create-order interaction

JUnit outputs:

- `reports/junit-domain.xml`
- `reports/junit-api.xml`
- `reports/junit-web.xml`

Coverage outputs:

- `reports/coverage/domain`
- `reports/coverage/api-unit`
- `reports/coverage/web`

## Integration Tests

Start PostgreSQL and Redis:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
```

Run:

```bash
STORAGE_DRIVER=postgres DATABASE_URL=postgres://pulsecart:pulsecart@localhost:5432/pulsecart REDIS_URL=redis://localhost:6379 pnpm test:integration
```

JUnit output:

- `reports/junit-api-integration.xml`

Coverage output:

- `reports/coverage/api-integration`

If the required environment variables are not set, the integration suite is skipped so local unit checks remain deterministic.

## E2E Tests

```bash
pnpm test:e2e
```

Playwright starts the API in memory mode and a Vite dev server. If Chromium is not installed:

```bash
pnpm --filter @pulsecart/web exec playwright install chromium
```

JUnit output:

- `reports/junit-e2e.xml`

## Smoke Test

Run with the API already reachable:

```bash
API_BASE_URL=http://localhost:3000 pnpm smoke
```

The script validates `/health`, creates and reads an order, fulfills it, and checks `/metrics`.
