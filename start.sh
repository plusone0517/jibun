#!/bin/sh
set -e

echo "🚀 Starting jibun-supple application..."

# Check if running in production (Cloud Run) or local
if [ -n "$PORT" ] && [ "$PORT" != "3000" ]; then
    echo "🌍 Production mode detected (PORT=$PORT)"
    USE_REMOTE_DB=true
else
    echo "💻 Local development mode detected"
    USE_REMOTE_DB=false
fi

# Run database migrations
if [ "$USE_REMOTE_DB" = true ]; then
    echo "📦 Running database migrations on REMOTE database..."
    npx wrangler d1 migrations apply jibun-supple-production --remote || echo "⚠️ Migrations already applied or failed"
    
    echo "👤 Creating default admin user on REMOTE database..."
    npx wrangler d1 execute jibun-supple-production --remote --command="INSERT OR IGNORE INTO admin_users (username, password_hash, created_at) VALUES ('admin', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', datetime('now'))" || echo "⚠️ Admin user already exists"
    
    echo "✅ Starting wrangler pages dev with REMOTE D1..."
    exec npx wrangler pages dev dist --d1=jibun-supple-production --remote --port=${PORT:-8080} --ip=0.0.0.0
else
    mkdir -p .wrangler/state/v3/d1
    
    echo "📦 Running database migrations on LOCAL database..."
    npx wrangler d1 migrations apply jibun-supple-production --local || echo "⚠️ Migrations already applied or failed"
    
    echo "👤 Creating default admin user on LOCAL database..."
    npx wrangler d1 execute jibun-supple-production --local --command="INSERT OR IGNORE INTO admin_users (username, password_hash, created_at) VALUES ('admin', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', datetime('now'))" || echo "⚠️ Admin user already exists"
    
    echo "✅ Starting wrangler pages dev with LOCAL D1..."
    exec npx wrangler pages dev dist --d1=jibun-supple-production --local --port=${PORT:-8080} --ip=0.0.0.0
fi
