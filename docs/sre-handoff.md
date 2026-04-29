# SRE Handoff

This repository intentionally provides application assets only. CI/CD workflows, custom GitHub Actions, deployment automation, release automation, and policy audits are not implemented.

## Scripts for GitHub Actions

- `pnpm lint`: workspace ESLint checks.
- `pnpm format:check`: Prettier check.
- `pnpm test:unit`: domain, API memory-mode, and web unit tests.
- `pnpm test:integration`: API PostgreSQL and Redis integration tests.
- `pnpm test:e2e`: Playwright dashboard-to-order path.
- `pnpm build`: builds all workspaces.
- `pnpm docker:build`: builds `pulsecart-api:local` and `pulsecart-web:local`.
- `pnpm smoke`: deterministic API smoke test. Set `API_BASE_URL`.
- `pnpm sbom`: writes `reports/sbom.json` as a clearly marked placeholder.
- `pnpm build:metadata`: writes `reports/build-metadata.json`.

## Service Containers

`pnpm test:integration` needs:

- PostgreSQL service exposed to the runner
- Redis service exposed to the runner
- `STORAGE_DRIVER=postgres`
- `DATABASE_URL=postgres://pulsecart:pulsecart@localhost:5432/pulsecart`
- `REDIS_URL=redis://localhost:6379`

## Expected Artifacts

- `reports/junit-domain.xml`
- `reports/junit-api.xml`
- `reports/junit-api-integration.xml`
- `reports/junit-web.xml`
- `reports/junit-e2e.xml`
- `reports/coverage/**`
- `reports/sbom.json`
- `reports/build-metadata.json`

Generated files under `reports/` are ignored except for `.gitkeep`.

## Recommended Environment Variables

- `NODE_ENV=test`
- `API_PORT=3000`
- `STORAGE_DRIVER=memory` for smoke and unit-style API runs
- `STORAGE_DRIVER=postgres` for integration
- `DATABASE_URL`
- `REDIS_URL`
- `VITE_API_BASE_URL`
- `API_BASE_URL`

## Assumptions

- Node.js 20+ and pnpm 9 are available on runners.
- Docker is available for image builds and Compose-based local validation.
- The learner will replace the placeholder SBOM script with a real CycloneDX or SPDX generator in their workflow.
- Deployment manifests are examples for governance exercises, not live deployment definitions.
