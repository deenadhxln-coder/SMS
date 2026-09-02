# ==========================================
# Stage 1: Dependency Installation
# ==========================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build dependencies if needed
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:20-alpine AS runtime

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Create non-root system group and user
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Copy production node_modules and application code
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs package.json ./

# Switch to non-root user
USER nodejs

# Expose backend API port
EXPOSE 5000

# Health check using the liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health/liveness || exit 1

# Start production server
CMD ["node", "src/server.js"]
