# Codex Prompt: Build the PulseCart Application Handoff Only

Paste this prompt into Codex from the repository workspace.

```text
You are Codex acting as a senior full-stack engineer. Your job is to build the application handoff for a GitHub Actions SRE/DevSecOps capstone lab. The human learner is not expected to build product features; they are expected to build the CI/CD, security, deployment, release, and operations automation later.

Repository path:
/Users/juan-rodriguez/Education/Github_Actions/gh-actions-lab-01/

Work directly inside that repository path. First inspect the current repository. If it is empty, create the project from scratch. If it already contains files, preserve useful existing files and avoid destructive overwrites unless clearly necessary. Do not ask the user to choose a stack; use the stack below.

PRIMARY OBJECTIVE
Build a small but realistic monorepo application named PulseCart that is rich enough for later GitHub Actions testing. The app must support unit tests, integration tests with PostgreSQL and Redis, Docker builds, a smoke test, basic E2E validation, coverage output, JUnit-style test reports where practical, and Markdown documentation. The SRE/DevSecOps engineer will later create the GitHub Actions workflows, custom actions, deployment governance, and policy audits.

ROLE BOUNDARY
You must implement application and developer-handoff assets only. Do not implement the SRE/DevSecOps lab. Specifically, do not create completed GitHub Actions workflows, custom GitHub Actions, deployment workflows, release workflows, policy audit workflows, or cloud deployment automation. It is acceptable to create empty directories only if needed, but prefer not to create .github/workflows or .github/actions at all. The human learner must build those later.

TECH STACK
Use:
- Node.js 20+
- TypeScript
- pnpm workspaces
- Fastify or Express for the API, preferably Fastify
- React + Vite for the web app
- Vitest for unit and integration tests
- Playwright for one minimal E2E path if practical
- PostgreSQL for integration-test persistence
- Redis for cache/health integration
- Docker and Docker Compose
- ESLint and Prettier

TARGET STRUCTURE
Create or complete this structure:

pulsecart repository root
  apps/
    api/
      src/
      tests/
      Dockerfile
    web/
      src/
      tests/
      Dockerfile
  packages/
    domain/
      src/
      tests/
  infra/
    docker/
      docker-compose.yml
    deployment/
      staging.manifest.example.json
      production.manifest.example.json
  scripts/
    smoke-api.ts or smoke-api.mjs
    write-build-metadata.ts or write-build-metadata.mjs
  docs/
    architecture.md
    api-contract.md
    local-development.md
    testing-guide.md
    sre-handoff.md
    codex-build-notes.md
  reports/
    .gitkeep
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  .env.example
  .gitignore
  .editorconfig
  README.md

APPLICATION REQUIREMENTS
Implement PulseCart, a small B2B order/inventory/fulfillment app.

API endpoints:
- GET /health
- GET /orders
- POST /orders
- GET /orders/:id
- POST /orders/:id/fulfill
- GET /metrics

Domain package behavior:
- order status validation
- allowed status transitions, at least pending -> fulfilled and pending -> cancelled
- price calculation from line items
- inventory reservation rule validation
- clear TypeScript types for Order, OrderItem, OrderStatus, CreateOrderInput, and FulfillmentResult

API behavior:
- POST /orders validates input through packages/domain
- GET /orders returns seeded or persisted orders
- GET /orders/:id returns 404 for missing orders
- POST /orders/:id/fulfill transitions pending orders to fulfilled and returns useful error for invalid transition
- GET /health returns JSON including service name, version, uptime, storage mode, and dependency health when applicable
- GET /metrics returns simple Prometheus-style text or structured metrics suitable for smoke checks

Persistence design:
- Support STORAGE_DRIVER=memory for simple smoke tests and container smoke tests without requiring a database.
- Support STORAGE_DRIVER=postgres for integration tests and local Docker Compose.
- When STORAGE_DRIVER=postgres, use DATABASE_URL and create/initialize a simple orders table through a migration/setup script or test setup.
- Redis should be used lightly, for example health check, cache ping, or simple request counter, when REDIS_URL is provided.
- The API must still be easy to run in memory mode.

Web app behavior:
- Dashboard page showing service status cards.
- Orders page showing a small order list and a create-order form or simple static/demo interaction.
- Deployments page showing placeholder deployment status cards so the SRE can later connect deployment manifests or GitHub Pages status.
- Use environment variable VITE_API_BASE_URL for API location.
- Keep the UI simple and reliable; do not over-polish.

ROOT SCRIPTS
The root package.json must provide these scripts and they must be non-interactive:
- lint
- format:check
- test:unit
- test:integration
- test:e2e
- build
- docker:build
- smoke
- sbom

Recommended behavior:
- lint runs all workspace lint tasks.
- format:check runs Prettier check.
- test:unit runs domain, API unit tests, and web unit tests.
- test:integration runs API integration tests that require PostgreSQL and Redis. Document how to start those services locally.
- test:e2e runs one small web/API path if practical. If Playwright setup is too heavy, still create the script and document exactly what is needed to run it.
- build builds all workspaces.
- docker:build builds local API and web images named pulsecart-api:local and pulsecart-web:local.
- smoke runs a deterministic smoke test against the API. It should support API_BASE_URL and default to http://localhost:3000.
- sbom generates an SBOM into reports/sbom.json if dependencies/tools are available. If a generator is not installed, implement a documented placeholder script that writes a clearly marked non-production SBOM placeholder so the later SRE workflow can replace it.

TESTING REQUIREMENTS
Add meaningful tests, not just trivial existence checks.

Domain unit tests:
- price calculation
- invalid order input
- valid and invalid status transitions
- inventory reservation validation

API unit/integration tests:
- /health returns expected structure
- create order works
- get order works
- missing order returns 404
- fulfill order works
- invalid fulfillment returns useful error
- PostgreSQL mode is covered by integration tests
- Redis health or ping is covered when REDIS_URL is provided

Web tests:
- dashboard renders
- orders page renders
- deployments page renders
- at least one interaction test if practical

Reports and coverage:
- Configure tests to produce coverage into reports/coverage or workspace coverage directories.
- Configure JUnit-style XML reports where practical, for example reports/junit-domain.xml, reports/junit-api.xml, reports/junit-web.xml. If tooling differs, document the actual paths.
- Do not commit generated reports except reports/.gitkeep.

DOCKER REQUIREMENTS
- apps/api/Dockerfile builds and runs the API. Default to STORAGE_DRIVER=memory so the image can pass a simple container smoke test without PostgreSQL.
- apps/web/Dockerfile builds the Vite app and serves static files, using a simple production server or nginx if appropriate.
- infra/docker/docker-compose.yml starts PostgreSQL, Redis, API, and web for local development.
- Include health checks where practical.
- Use .dockerignore files where useful.

ENVIRONMENT FILES
Create .env.example only. Do not create .env with real values. Include safe examples:
- NODE_ENV=development
- API_PORT=3000
- STORAGE_DRIVER=memory
- DATABASE_URL=postgres://pulsecart:pulsecart@localhost:5432/pulsecart
- REDIS_URL=redis://localhost:6379
- VITE_API_BASE_URL=http://localhost:3000

DOCUMENTATION REQUIREMENTS
Create Markdown docs that clearly explain what you created.

README.md must include:
- project overview
- repo structure
- prerequisites
- install commands
- local run commands
- test commands
- Docker commands
- smoke command
- what is intentionally left for the SRE/DevSecOps engineer

Create docs/architecture.md with:
- app architecture
- package boundaries
- storage modes
- test strategy

Create docs/api-contract.md with:
- endpoints
- request/response examples
- error behavior

Create docs/local-development.md with:
- setup
- running in memory mode
- running with Docker Compose
- common troubleshooting

Create docs/testing-guide.md with:
- unit/integration/E2E commands
- required services
- expected report/coverage locations

Create docs/sre-handoff.md with:
- exact scripts the SRE can call from GitHub Actions
- which scripts need PostgreSQL/Redis service containers
- expected artifacts and report paths
- known assumptions
- recommended environment variables
- statement that CI/CD workflows are intentionally not implemented

Create docs/codex-build-notes.md with:
- files/directories created
- implementation decisions
- any commands you ran
- any commands that failed and why
- remaining limitations or follow-up items

QUALITY BAR
- TypeScript should compile cleanly.
- Scripts should be deterministic and suitable for GitHub-hosted runners.
- Avoid flaky tests and sleeps unless health polling is required.
- Keep dependencies reasonable.
- No secrets, no tokens, no real cloud credentials.
- Do not add GitHub Actions workflows.
- Do not add completed custom GitHub Actions.
- Do not use generated code that is impossible to maintain.
- Prefer clear, boring code over clever code.

IMPLEMENTATION ORDER
1. Inspect repository.
2. Create workspace files and shared config.
3. Implement packages/domain and tests.
4. Implement apps/api with memory and postgres storage modes, Redis optional health, tests, Dockerfile.
5. Implement apps/web with simple pages, tests, Dockerfile.
6. Implement scripts, Docker Compose, .env.example, and docs.
7. Run or attempt these commands from repo root:
   pnpm install
   pnpm lint
   pnpm format:check
   pnpm test:unit
   pnpm build
   pnpm docker:build
8. If local PostgreSQL/Redis are available, run pnpm test:integration. Otherwise document how to run it with Docker Compose.
9. Run or document the smoke test.
10. Update docs/codex-build-notes.md with the final status.

FINAL RESPONSE
When finished, summarize:
- What you created.
- Exact commands run and pass/fail status.
- How to run the app locally.
- Which files are the most important for the SRE/DevSecOps learner.
- Confirmation that you did not implement GitHub Actions workflows or custom actions.
```
