# Codex Build Notes

## Files and Directories Created

- Root pnpm workspace, TypeScript, ESLint, Prettier, Docker ignore, environment example, and report placeholder files.
- `packages/domain` with order types, validation, transitions, inventory checks, and unit tests.
- `apps/api` with Fastify routes, memory storage, PostgreSQL storage, optional Redis monitoring, tests, and Dockerfile.
- `apps/web` with React/Vite UI, unit tests, Playwright E2E path, nginx config, and Dockerfile.
- `infra/docker/docker-compose.yml`.
- `infra/deployment/staging.manifest.example.json` and `infra/deployment/production.manifest.example.json`.
- `scripts/smoke-api.ts`, `scripts/write-build-metadata.ts`, and `scripts/write-sbom.ts`.
- Documentation under `docs/` plus root `README.md`.

## Implementation Decisions

- The API defaults to `STORAGE_DRIVER=memory` so smoke tests and the API image can run without external dependencies.
- PostgreSQL mode initializes its own `orders` table at startup to keep integration setup simple.
- Redis is optional and used for dependency health plus a lightweight request counter.
- The web app talks to the API through `VITE_API_BASE_URL` and does not import server internals.
- Vitest scripts run with coverage enabled and write reports under `reports/coverage`.
- No GitHub Actions workflows or custom actions were created.

## Commands Run

- `rtk pnpm install`: passed. pnpm reported deprecated transitive dependency warnings only.
- `rtk pnpm lint`: passed.
- `rtk pnpm format:check`: initially failed on formatting in six files; `rtk pnpm prettier --write .` was run; final `rtk pnpm format:check` passed.
- `rtk pnpm test:unit`: passed for domain, API, and web tests. JUnit and coverage reports were written under `reports/`.
- `rtk pnpm build`: initially failed on strict TypeScript issues in `packages/domain/src/index.ts` and `apps/api/src/redis-monitor.ts`; both were fixed. Final build passed.
- `rtk pnpm docker:build`: failed because the local Docker daemon was not reachable at `unix:///Users/juan-rodriguez/.docker/run/docker.sock`.
- `rtk pnpm test:integration`: completed with the integration suite skipped because `STORAGE_DRIVER=postgres` and `DATABASE_URL` were not set. Docker was unavailable locally to start PostgreSQL and Redis through Compose.
- `rtk pnpm --filter @pulsecart/api dev`: started the API in memory mode for smoke validation.
- `rtk pnpm smoke`: passed against `http://localhost:3000` in memory mode.
- `rtk pgrep -fl "tsx watch src/index.ts"` and `rtk kill <pid>`: used to confirm and stop the local API dev server after smoke validation.
- `rtk pnpm test:e2e`: initially failed because the orders page was unmounted during refresh before the success message persisted. The refresh behavior was fixed. Final E2E run passed.
- `rtk git status --short` and `rtk git rev-parse --show-toplevel`: inspected repository state. The Git root is `/Users/juan-rodriguez/Education/Github_Actions`, and this lab directory is currently untracked from that parent repo.
- `rtk rg --files -uu .github`: failed with `No such file or directory`, confirming no `.github` workflow or action directory was created.

## Remaining Limitations

- The SBOM script writes a non-production placeholder intended to be replaced by the learner.
- Playwright may require a browser install on fresh machines with `pnpm --filter @pulsecart/web exec playwright install chromium`.
- Docker images were not built in this local session because Docker was not running.
