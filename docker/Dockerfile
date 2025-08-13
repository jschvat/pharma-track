# Multi-stage Dockerfile for PharmaTrack Backend

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pharmatrak -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder --chown=pharmatrak:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=pharmatrak:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown pharmatrak:nodejs logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER pharmatrak

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]