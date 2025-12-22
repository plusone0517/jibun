#!/bin/sh
set -e

echo "🚀 Starting jibun-supple application..."

# Create D1 database directory if not exists
mkdir -p .wrangler/state/v3/d1

# Run database migrations
echo "📦 Running database migrations..."
npx wrangler d1 migrations apply jibun-supple-production --local || echo "⚠️ Migrations already applied or failed"

# Start the application
echo "✅ Starting wrangler pages dev..."
exec npx wrangler pages dev dist --d1=jibun-supple-production --local --port=${PORT:-8080} --ip=0.0.0.0
