# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace root and package manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/web/package.json packages/web/
COPY packages/server/package.json packages/server/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY packages/web/ packages/web/
COPY packages/server/ packages/server/

# Build web frontend then server
RUN npm run build

# Stage 2: Production
FROM node:22-slim

WORKDIR /app

# Install build tools required for native modules (node-pty, better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace root and package manifests
COPY package.json package-lock.json ./
COPY packages/web/package.json packages/web/
COPY packages/server/package.json packages/server/

# Install production dependencies only (rebuilds native modules for this stage)
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/web/dist packages/web/dist
COPY --from=builder /app/packages/server/dist packages/server/dist

# Create data directory for SQLite
RUN mkdir -p data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=./data/pulse.db

CMD ["npm", "start"]
