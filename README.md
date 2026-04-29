# PulseCart

PulseCart is a small B2B order, inventory, and fulfillment application prepared for a GitHub Actions SRE/DevSecOps capstone lab. The application code is intentionally complete enough to test, build, containerize, smoke-check, and document, while CI/CD automation is intentionally left for the learner.

## Repository Structure

- `packages/domain`: TypeScript domain model, validation, status transitions, price calculation, and inventory reservation rules.
- `apps/api`: Fastify API with memory and PostgreSQL storage modes plus optional Redis health and counters.
- `apps/web`: React and Vite operations UI for dashboard, orders, and deployment placeholders.
- `infra/docker`: Docker Compose stack for PostgreSQL, Redis, API, and web.
- `infra/deployment`: Example deployment manifests for later governance automation.
- `scripts`: Smoke, SBOM placeholder, and build metadata scripts.
- `docs`: Architecture, local development, testing, API, and SRE handoff notes.
- `reports`: Ignored output location for test reports, coverage, SBOM, and metadata artifacts.

## Prerequisites

- Node.js 20 or newer
- pnpm 9
- Docker Desktop or a compatible Docker engine
- PostgreSQL and Redis only for integration tests or Docker Compose mode

## Install

```bash
pnpm install
```

## Run Locally

Run the API in memory mode:

```bash
pnpm --filter @pulsecart/api dev
```

Run the web app:

```bash
VITE_API_BASE_URL=http://localhost:3000 pnpm --filter @pulsecart/web dev
```

Open `http://localhost:5173`.

## Test Commands

```bash
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
```

Integration tests require `STORAGE_DRIVER=postgres`, `DATABASE_URL`, and optionally `REDIS_URL`. Start local services with Docker Compose first:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
STORAGE_DRIVER=postgres DATABASE_URL=postgres://pulsecart:pulsecart@localhost:5432/pulsecart REDIS_URL=redis://localhost:6379 pnpm test:integration
```

## Docker

Build the local images:

```bash
pnpm docker:build
```

Run the full stack:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

The API is available at `http://localhost:3000`; the web app is available at `http://localhost:8080`.

## Smoke Test

With the API running:

```bash
pnpm smoke
```

Override the target:

```bash
API_BASE_URL=http://localhost:3000 pnpm smoke
```

## SRE/DevSecOps Boundary

This repository does not include completed GitHub Actions workflows, custom actions, deployment automation, release automation, policy audit workflows, or cloud credentials. Those are intentionally left for the capstone learner to implement using the scripts, tests, Dockerfiles, manifests, and docs provided here.
