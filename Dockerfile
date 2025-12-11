# Multi-stage build for Cloud Run deployment
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/.wrangler ./.wrangler

# Install wrangler globally for D1 local database
RUN npm install -g wrangler

# Create directory for local D1 database
RUN mkdir -p .wrangler/state/v3/d1

# Expose port (Cloud Run will set PORT env variable)
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/api/auth/me', (r) => {process.exit(r.statusCode === 200 || r.statusCode === 401 ? 0 : 1)})"

# Start the application with wrangler pages dev
CMD ["sh", "-c", "wrangler pages dev dist --d1=jibun-supple-production --local --port=${PORT:-8080} --ip=0.0.0.0"]
