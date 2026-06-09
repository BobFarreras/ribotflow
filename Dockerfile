# ==========================================
# RIBOTFLOW - Dockerfile (Multi-stage Build)
# Security: non-root, no dev deps, minimal image
# Target: <200MB final image
# ==========================================

# --- Stage 1: Install dependencies ---
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# --- Stage 2: Build the application ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- Stage 3: Production runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/docker/scripts ./docker/scripts

# Create uploads directory with proper permissions
RUN chmod +x /app/docker/scripts/start.sh && \
    mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app/uploads /app/src/db/migrations /app/docker/scripts

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1

CMD ["/app/docker/scripts/start.sh"]
