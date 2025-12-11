#!/bin/bash
# Google Cloud Run デプロイスクリプト

set -e

echo "=========================================="
echo "Google Cloud Run デプロイスクリプト"
echo "プロジェクト: jibun-supple"
echo "=========================================="
echo ""

cd /home/user/webapp

# Step 1: Google Cloud 認証確認
echo "📋 Step 1: Google Cloud 認証確認"
if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
    echo "✅ 認証済み: $ACCOUNT"
else
    echo "❌ Google Cloud認証が必要です"
    echo ""
    echo "認証方法:"
    echo "  gcloud auth login"
    exit 1
fi
echo ""

# Step 2: プロジェクトID確認
echo "📋 Step 2: プロジェクトID確認"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "❌ プロジェクトIDが設定されていません"
    echo ""
    echo "設定方法:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    echo ""
    echo "プロジェクト一覧:"
    gcloud projects list --format="table(projectId,name)"
    exit 1
else
    echo "✅ プロジェクトID: $PROJECT_ID"
fi
echo ""

# Step 3: 必要なAPI有効化確認
echo "📋 Step 3: 必要なAPI有効化確認"
REQUIRED_APIS=(
    "run.googleapis.com"
    "containerregistry.googleapis.com"
    "cloudbuild.googleapis.com"
)

for API in "${REQUIRED_APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$API" --format="value(name)" | grep -q "$API"; then
        echo "  ✅ $API"
    else
        echo "  ⚠️  $API が無効です"
        read -p "有効化しますか？ (y/N): " enable_api
        if [ "$enable_api" = "y" ] || [ "$enable_api" = "Y" ]; then
            gcloud services enable "$API"
            echo "  ✅ $API を有効化しました"
        else
            echo "  ❌ デプロイには $API が必要です"
            exit 1
        fi
    fi
done
echo ""

# Step 4: 環境変数確認
echo "📋 Step 4: 環境変数確認"
if [ -f ".env.production" ]; then
    echo "✅ .env.production ファイルが存在します"
    if grep -q "OPENAI_API_KEY=" .env.production; then
        echo "✅ OPENAI_API_KEY が設定されています"
    else
        echo "⚠️  OPENAI_API_KEY が設定されていません"
    fi
else
    echo "⚠️  .env.production ファイルがありません"
    echo ""
    read -p "OPENAI API Keyを入力してください: " OPENAI_KEY
    if [ -n "$OPENAI_KEY" ]; then
        cat > .env.production << EOF
OPENAI_API_KEY=$OPENAI_KEY
NODE_ENV=production
PORT=8080
EOF
        echo "✅ .env.production を作成しました"
    else
        echo "❌ OPENAI_API_KEY が必要です"
        exit 1
    fi
fi
echo ""

# Step 5: ビルド
echo "🔨 Step 5: アプリケーションをビルド"
npm run build
if [ -f "dist/_worker.js" ]; then
    echo "✅ ビルド成功"
else
    echo "❌ ビルド失敗"
    exit 1
fi
echo ""

# Step 6: Dockerイメージビルド
echo "🐳 Step 6: Dockerイメージをビルド"
IMAGE_NAME="gcr.io/$PROJECT_ID/jibun-supple"
IMAGE_TAG="latest"

echo "イメージ名: $IMAGE_NAME:$IMAGE_TAG"
docker build -t "$IMAGE_NAME:$IMAGE_TAG" .
echo "✅ Dockerイメージビルド完了"
echo ""

# Step 7: Dockerイメージプッシュ
echo "📤 Step 7: Dockerイメージをプッシュ"
docker push "$IMAGE_NAME:$IMAGE_TAG"
echo "✅ プッシュ完了"
echo ""

# Step 8: Cloud Runデプロイ
echo "🚀 Step 8: Cloud Runにデプロイ"
SERVICE_NAME="jibun-supple"
REGION="asia-northeast1"

# 環境変数を読み込み
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME:$IMAGE_TAG" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars "OPENAI_API_KEY=$OPENAI_API_KEY,NODE_ENV=production"

echo ""
echo "=========================================="
echo "✅ デプロイ完了！"
echo "=========================================="
echo ""

# サービスURLを取得
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format 'value(status.url)')

echo "📱 サービスURL:"
echo "   $SERVICE_URL"
echo ""
echo "📝 次のステップ:"
echo "1. URLにアクセスして動作確認"
echo "   $SERVICE_URL"
echo ""
echo "2. ログを確認:"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo "3. サービス情報を確認:"
echo "   gcloud run services describe $SERVICE_NAME --region $REGION"
echo ""
