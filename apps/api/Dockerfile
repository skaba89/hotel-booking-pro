FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY apps/api/package.json ./
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app

# OpenSSL must be present so Prisma generates engine binaries for the correct target (linux-musl-openssl-3.0.x)
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ ./
COPY prisma/ ./prisma/

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL is required by Prisma engine binaries
RUN apk add --no-cache openssl

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/rooms

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app/uploads && \
    chown -R nestjs:nodejs /app/node_modules/.prisma && \
    chown -R nestjs:nodejs /app/node_modules/@prisma
USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/main.js"]
