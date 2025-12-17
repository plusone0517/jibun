#!/bin/bash

# Cloudflare本番環境セットアップスクリプト
# このスクリプトは、Cloudflareへのデプロイに必要な全ての設定を自動で行います

set -e  # エラーが発生したら停止

echo "=================================="
echo "🚀 Cloudflare本番環境セットアップ"
echo "=================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# プロジェクト名
PROJECT_NAME="jibun-supple"
DB_NAME="jibun-supple-production"
BUCKET_NAME="jibun-supple-ocr-images"

echo -e "${YELLOW}📋 このスクリプトは以下の処理を実行します：${NC}"
echo "  1. D1データベースの作成"
echo "  2. データベースマイグレーションの実行"
echo "  3. R2ストレージバケットの作成"
echo "  4. Cloudflare Pagesプロジェクトの作成"
echo "  5. アプリケーションのデプロイ"
echo ""
echo -e "${YELLOW}⚠️  注意: Deploy タブでCloudflare APIキーを設定済みである必要があります${NC}"
echo ""
read -p "続行しますか？ (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "キャンセルされました"
    exit 1
fi

echo ""
echo "=================================="
echo "ステップ1: 認証確認"
echo "=================================="

if ! npx wrangler whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Cloudflare認証に失敗しました${NC}"
    echo ""
    echo "以下の手順でAPIキーを設定してください："
    echo "1. Deploy タブを開く"
    echo "2. Cloudflare API Token を設定"
    echo "3. このスクリプトを再実行"
    exit 1
fi

echo -e "${GREEN}✅ 認証成功${NC}"
echo ""

echo "=================================="
echo "ステップ2: D1データベースの作成"
echo "=================================="

# D1データベースが既に存在するかチェック
if npx wrangler d1 list | grep -q "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  データベース '$DB_NAME' は既に存在します${NC}"
    read -p "既存のデータベースを使用しますか？ (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "処理を中断しました"
        exit 1
    fi
    
    # 既存のdatabase_idを取得
    DB_ID=$(npx wrangler d1 list | grep "$DB_NAME" | awk '{print $2}')
    echo -e "${GREEN}✅ 既存のデータベースを使用: $DB_ID${NC}"
else
    echo "データベースを作成中..."
    CREATE_OUTPUT=$(npx wrangler d1 create "$DB_NAME" 2>&1)
    echo "$CREATE_OUTPUT"
    
    # database_idを抽出
    DB_ID=$(echo "$CREATE_OUTPUT" | grep "database_id" | sed 's/.*database_id = "\(.*\)"/\1/')
    
    if [ -z "$DB_ID" ]; then
        echo -e "${RED}❌ database_id の取得に失敗しました${NC}"
        echo "出力を確認してください："
        echo "$CREATE_OUTPUT"
        exit 1
    fi
    
    echo -e "${GREEN}✅ データベース作成完了${NC}"
    echo -e "${YELLOW}📝 Database ID: $DB_ID${NC}"
    
    # wrangler.jsonc を更新
    echo ""
    echo "wrangler.jsonc を更新中..."
    
    # macOSとLinuxの両方に対応したsed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"database_id\": \".*\"/\"database_id\": \"$DB_ID\"/" wrangler.jsonc
    else
        # Linux
        sed -i "s/\"database_id\": \".*\"/\"database_id\": \"$DB_ID\"/" wrangler.jsonc
    fi
    
    echo -e "${GREEN}✅ wrangler.jsonc 更新完了${NC}"
fi

echo ""
echo "=================================="
echo "ステップ3: マイグレーション実行"
echo "=================================="

echo "データベースマイグレーションを実行中..."
echo ""
echo -e "${YELLOW}⚠️  確認メッセージが表示されたら 'y' を入力してください${NC}"
echo ""

npx wrangler d1 migrations apply "$DB_NAME"

echo -e "${GREEN}✅ マイグレーション完了${NC}"

echo ""
echo "=================================="
echo "ステップ4: R2バケットの作成"
echo "=================================="

# R2バケットが既に存在するかチェック
if npx wrangler r2 bucket list | grep -q "$BUCKET_NAME"; then
    echo -e "${YELLOW}⚠️  R2バケット '$BUCKET_NAME' は既に存在します${NC}"
    echo -e "${GREEN}✅ 既存のバケットを使用${NC}"
else
    echo "R2バケットを作成中..."
    npx wrangler r2 bucket create "$BUCKET_NAME"
    echo -e "${GREEN}✅ R2バケット作成完了${NC}"
fi

echo ""
echo "=================================="
echo "ステップ5: プロジェクト作成"
echo "=================================="

# プロジェクトが既に存在するかチェック
if npx wrangler pages project list | grep -q "$PROJECT_NAME"; then
    echo -e "${YELLOW}⚠️  プロジェクト '$PROJECT_NAME' は既に存在します${NC}"
    echo -e "${GREEN}✅ 既存のプロジェクトを使用${NC}"
else
    echo "Cloudflare Pagesプロジェクトを作成中..."
    npx wrangler pages project create "$PROJECT_NAME" --production-branch main
    echo -e "${GREEN}✅ プロジェクト作成完了${NC}"
fi

echo ""
echo "=================================="
echo "ステップ6: ビルド"
echo "=================================="

echo "アプリケーションをビルド中..."
npm run build
echo -e "${GREEN}✅ ビルド完了${NC}"

echo ""
echo "=================================="
echo "ステップ7: デプロイ"
echo "=================================="

echo "アプリケーションをデプロイ中..."
echo -e "${YELLOW}⚠️  デプロイには数分かかる場合があります${NC}"
echo ""

DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name "$PROJECT_NAME" 2>&1)
echo "$DEPLOY_OUTPUT"

# デプロイURLを抽出
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o "https://[a-zA-Z0-9.-]*\.pages\.dev" | head -1)

echo ""
echo "=================================="
echo "🎉 デプロイ完了！"
echo "=================================="
echo ""
echo -e "${GREEN}✅ アプリケーションが正常にデプロイされました${NC}"
echo ""
echo "📍 アクセスURL:"
echo -e "   ${GREEN}$DEPLOY_URL${NC}"
echo ""
echo "🔐 管理画面:"
echo -e "   ${GREEN}$DEPLOY_URL/admin/login${NC}"
echo ""
echo -e "${YELLOW}⚠️  セキュリティ対策（重要！）${NC}"
echo "   1. 管理画面にログイン (admin / admin123)"
echo "   2. 管理者パスワードを変更してください"
echo ""
echo "📚 詳細な情報:"
echo "   - Cloudflareダッシュボード: https://dash.cloudflare.com"
echo "   - プロジェクト: Workers & Pages → $PROJECT_NAME"
echo ""
echo "🔄 更新デプロイ方法:"
echo "   npm run deploy:prod"
echo ""
echo "=================================="
echo "✨ セットアップ完了！"
echo "=================================="
