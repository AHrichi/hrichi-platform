# syntax=docker/dockerfile:1
# Build from the repository root: docker build -f apps/api/Dockerfile .

# 1. Build the API with Nx. The output carries a pruned package.json and lockfile.
FROM node:24-slim AS build
WORKDIR /repo
ENV NX_DAEMON=false NX_NO_CLOUD=true CI=true
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec nx build api --skip-nx-cache

# 2. Runtime: only the bundle and its production dependencies.
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build /repo/dist/apps/api ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune
USER node
EXPOSE 3000
CMD ["node", "main.js"]
