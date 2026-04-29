# Local Development

## Setup

```bash
pnpm install
```

Copy `.env.example` only if you want local shell exports. Do not commit real `.env` files.

## Memory Mode

Memory mode is the default and does not require PostgreSQL or Redis.

```bash
pnpm --filter @pulsecart/api dev
VITE_API_BASE_URL=http://localhost:3000 pnpm --filter @pulsecart/web dev
```

API: `http://localhost:3000`  
Web: `http://localhost:5173`

## Docker Compose Mode

Run PostgreSQL, Redis, API, and web:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

API: `http://localhost:3000`  
Web: `http://localhost:8080`

Run only dependencies for integration tests:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
```

## Troubleshooting

- If port `3000`, `5173`, `5432`, `6379`, or `8080` is already in use, stop the local process or change the published port.
- If integration tests skip, confirm `STORAGE_DRIVER=postgres` and `DATABASE_URL` are set.
- If Redis health is degraded, verify `REDIS_URL=redis://localhost:6379` and that Redis is running.
- If Playwright reports missing browsers, run `pnpm --filter @pulsecart/web exec playwright install chromium`.
