# ==================== MULTI-STAGE PRODUCTION DOCKERFILE ====================
# OrangeCat Production Build - Optimized for Security & Performance
# Created: 2025-06-08
# Last Modified: 2025-06-08

# ==================== BASE NODE IMAGE ====================
FROM node:18-alpine AS base

# Install security updates and essential packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# ==================== DEPENDENCIES STAGE ====================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with security optimizations
RUN npm ci --only=production --audit --fund=false && \
    npm cache clean --force

# ==================== BUILD STAGE ====================
FROM base AS builder

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci --audit --fund=false

# Copy source code
COPY . .

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application with optimizations
RUN npm run build && \
    npm run export 2>/dev/null || true

# ==================== PRODUCTION STAGE ====================
FROM base AS production

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/api/health || exit 1' > /health-check.sh && \
    chmod +x /health-check.sh

# Security: Remove unnecessary files
RUN rm -rf /tmp/* /var/tmp/* /root/.npm /home/nextjs/.npm

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /health-check.sh

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# ==================== DEVELOPMENT STAGE ====================
FROM base AS development

# Install development dependencies
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"] 