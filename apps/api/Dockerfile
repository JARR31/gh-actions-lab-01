FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/domain/package.json packages/domain/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY packages/domain packages/domain
COPY apps/api apps/api
RUN pnpm --filter @pulsecart/domain build
RUN pnpm --filter @pulsecart/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3000
ENV STORAGE_DRIVER=memory
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=build /app/packages/domain/dist ./packages/domain/dist

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
