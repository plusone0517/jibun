#!/bin/sh
set -e

echo "🚀 Starting jibun-supple application..."

# Create D1 database directory if not exists
mkdir -p .wrangler/state/v3/d1

# Run database migrations
echo "📦 Running database migrations..."
npx wrangler d1 migrations apply jibun-supple-production --local || echo "⚠️ Migrations already applied or failed"

# Insert default admin user if not exists (password: admin123)
echo "👤 Creating default admin user..."
npx wrangler d1 execute jibun-supple-production --local --command="INSERT OR IGNORE INTO admin_users (username, password_hash, created_at) VALUES ('admin', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', datetime('now'))" || echo "⚠️ Admin user already exists"

# Start the application
echo "✅ Starting wrangler pages dev..."
exec npx wrangler pages dev dist --d1=jibun-supple-production --local --port=${PORT:-8080} --ip=0.0.0.0
