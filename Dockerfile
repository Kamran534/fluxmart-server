# Stage 1 — build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies for potential build steps)
RUN npm ci

# Copy source code
COPY . .

# Stage 2 — runtime
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy application source code from builder stage
COPY --from=builder --chown=app:app /app/index.js ./
COPY --from=builder --chown=app:app /app/src ./src

# Create logs directory and set proper ownership
RUN mkdir -p logs && chown -R app:app logs

# Switch to non-root user
USER app

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
