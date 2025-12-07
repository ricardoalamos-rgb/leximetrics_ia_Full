ARG NODE_VERSION=18.17.0
FROM node:${NODE_VERSION}-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy workspace package.jsons
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY services/jarvis-service/package.json ./services/jarvis-service/

RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (explicitly for the container architecture)
# CACHE BUST: 3
RUN pnpm --filter @leximetrics/db build

# Build Web (Standard Mode)
RUN pnpm --filter web build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Install pnpm in runner
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules

# Copy everything from builder (Standard build needs source + .next)
COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
