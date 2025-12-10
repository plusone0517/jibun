#!/bin/bash
# Cloudflare Pages デプロイスクリプト
# 使い方: bash deploy.sh

set -e  # エラーで停止

echo "=========================================="
echo "Cloudflare Pages デプロイスクリプト"
echo "プロジェクト: jibun-supple"
echo "=========================================="
echo ""

# プロジェクトディレクトリに移動
cd /home/user/webapp

# Step 1: 認証確認
echo "📋 Step 1: Cloudflare認証確認"
if npx wrangler whoami > /dev/null 2>&1; then
    echo "✅ Cloudflare認証OK"
    npx wrangler whoami
else
    echo "❌ Cloudflare認証失敗"
    echo "⚠️  Deploy タブでCloudflare API Keyを設定してください"
    exit 1
fi
echo ""

# Step 2: ビルド
echo "🔨 Step 2: プロジェクトをビルド中..."
npm run build
if [ -f "dist/_worker.js" ]; then
    echo "✅ ビルド成功 (dist/_worker.js)"
    ls -lh dist/_worker.js
else
    echo "❌ ビルド失敗: dist/_worker.js が見つかりません"
    exit 1
fi
echo ""

# Step 3: D1データベース確認
echo "🗄️  Step 3: D1データベース確認"
echo "既存のD1データベース一覧:"
npx wrangler d1 list
echo ""

# Step 4: wrangler.jsonc の database_id 確認
echo "📝 Step 4: wrangler.jsonc 確認"
DATABASE_ID=$(grep -A 3 "d1_databases" wrangler.jsonc | grep "database_id" | cut -d'"' -f4)
echo "設定されているdatabase_id: $DATABASE_ID"

if [ "$DATABASE_ID" = "local-db-for-development" ]; then
    echo "⚠️  警告: database_id が 'local-db-for-development' のままです"
    echo "⚠️  本番デプロイ前に実際のD1データベースIDに変更してください"
    echo ""
    echo "手順:"
    echo "1. npx wrangler d1 create jibun-supple-production"
    echo "2. 出力されたdatabase_idをwrangler.jsonc に設定"
    echo "3. npx wrangler d1 migrations apply jibun-supple-production"
    echo ""
    read -p "database_idを更新しましたか？ (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "デプロイを中止しました"
        exit 1
    fi
fi
echo ""

# Step 5: 環境変数確認
echo "🔑 Step 5: 環境変数確認"
echo "Cloudflare Pagesのシークレット一覧:"
npx wrangler pages secret list --project-name jibun-supple 2>/dev/null || echo "⚠️  プロジェクトがまだ作成されていません（初回デプロイ時は正常）"
echo ""

# Step 6: プロジェクト作成確認
echo "🚀 Step 6: Cloudflare Pages プロジェクト確認"
if npx wrangler pages project list 2>/dev/null | grep -q "jibun-supple"; then
    echo "✅ プロジェクト 'jibun-supple' が既に存在します"
else
    echo "⚠️  プロジェクト 'jibun-supple' が存在しません"
    read -p "プロジェクトを作成しますか？ (y/N): " create_project
    if [ "$create_project" = "y" ] || [ "$create_project" = "Y" ]; then
        npx wrangler pages project create jibun-supple \
            --production-branch main \
            --compatibility-date 2025-12-01
        echo "✅ プロジェクト作成完了"
    else
        echo "デプロイを中止しました"
        exit 1
    fi
fi
echo ""

# Step 7: デプロイ実行
echo "🚀 Step 7: デプロイ実行"
read -p "デプロイを実行しますか？ (y/N): " deploy_confirm
if [ "$deploy_confirm" = "y" ] || [ "$deploy_confirm" = "Y" ]; then
    echo "デプロイ中..."
    npx wrangler pages deploy dist --project-name jibun-supple
    echo ""
    echo "=========================================="
    echo "✅ デプロイ完了！"
    echo "=========================================="
    echo ""
    echo "📱 アクセスURL:"
    echo "   https://jibun-supple.pages.dev"
    echo "   https://main.jibun-supple.pages.dev"
    echo ""
    echo "📝 次のステップ:"
    echo "1. 環境変数を設定（未設定の場合）:"
    echo "   npx wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple"
    echo ""
    echo "2. ログを確認:"
    echo "   npx wrangler pages deployment tail --project-name jibun-supple"
    echo ""
else
    echo "デプロイを中止しました"
    exit 0
fi
