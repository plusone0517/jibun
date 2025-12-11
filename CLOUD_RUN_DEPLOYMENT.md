# Google Cloud Run デプロイメントガイド

## 🚀 Cloud Run とは？

Google Cloud Runは、コンテナ化されたアプリケーションをサーバーレスで実行できるプラットフォームです。

### Cloudflare Pages との違い

| 項目 | Cloud Run | Cloudflare Pages |
|------|-----------|------------------|
| 環境 | フルNode.js | Workers（制限あり） |
| ファイルシステム | ✅ 使用可能 | ❌ 使用不可 |
| データベース | SQLite, PostgreSQL等 | D1のみ |
| 認証設定 | 簡単 | 複雑 |
| 料金 | 従量課金 | 無料枠大きい |
| デプロイ | Docker | Wrangler |

---

## 📋 事前準備

### 1. Google Cloud アカウント

無料トライアル（$300クレジット）:
https://cloud.google.com/free

### 2. Google Cloud CLI インストール

このサンドボックスには既にインストールされています。

確認:
```bash
gcloud version
```

### 3. Google Cloud プロジェクト作成

1. https://console.cloud.google.com/ にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトIDをメモ（例: `jibun-supple-12345`）

---

## 🔧 セットアップ手順

### ステップ1: Google Cloud 認証

```bash
# ブラウザで認証
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# デフォルトリージョンを設定
gcloud config set run/region asia-northeast1
```

### ステップ2: 必要なAPIを有効化

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

### ステップ3: 環境変数を準備

`.env.production` ファイルを作成:

```bash
cat > .env.production << 'EOF'
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=production
PORT=8080
EOF
```

---

## 🚀 デプロイ方法

### 方法1: 簡単デプロイ（推奨）

```bash
cd /home/user/webapp
npm run deploy:cloudrun
```

### 方法2: 手動デプロイ

#### 2-1. Dockerイメージをビルド

```bash
cd /home/user/webapp

# ビルド
docker build -t gcr.io/YOUR_PROJECT_ID/jibun-supple:latest .

# プッシュ
docker push gcr.io/YOUR_PROJECT_ID/jibun-supple:latest
```

#### 2-2. Cloud Runにデプロイ

```bash
gcloud run deploy jibun-supple \
  --image gcr.io/YOUR_PROJECT_ID/jibun-supple:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

#### 2-3. 環境変数を設定

```bash
gcloud run services update jibun-supple \
  --region asia-northeast1 \
  --set-env-vars "OPENAI_API_KEY=your-key-here,NODE_ENV=production"
```

### 方法3: Cloud Build（CI/CD）

#### GitHub連携で自動デプロイ

```bash
# Cloud Buildトリガーを作成
gcloud builds submit --config cloudbuild.yaml
```

---

## 📊 デプロイ後の確認

### サービスURL取得

```bash
gcloud run services describe jibun-supple \
  --region asia-northeast1 \
  --format 'value(status.url)'
```

出力例:
```
https://jibun-supple-xxxxx-an.a.run.app
```

### ログ確認

```bash
# リアルタイムログ
gcloud run services logs tail jibun-supple --region asia-northeast1

# 最新100件
gcloud run services logs read jibun-supple --region asia-northeast1 --limit 100
```

### ヘルスチェック

```bash
curl https://YOUR_SERVICE_URL/api/auth/me
```

---

## 🔧 設定ファイル詳細

### Dockerfile

アプリケーションをコンテナ化:
- Node.js 20を使用
- マルチステージビルドで最適化
- ヘルスチェック付き

### cloudbuild.yaml

Cloud Buildの設定:
- Dockerイメージビルド
- Container Registryにプッシュ
- Cloud Runにデプロイ

### .gcloudignore

アップロード除外ファイル:
- node_modules
- .git
- 開発用ファイル

---

## 💰 料金について

### Cloud Run 無料枠

毎月以下が無料:
- リクエスト: 200万回
- CPU時間: 180,000 vCPU秒
- メモリ: 360,000 GiB秒
- ネットワーク（送信）: 1GB

### 推定コスト

中小規模アプリの場合、月額 $5-20程度

料金計算ツール:
https://cloud.google.com/products/calculator

---

## 🔄 更新デプロイ

コード変更後:

```bash
# 簡単デプロイ
npm run deploy:cloudrun

# または手動
docker build -t gcr.io/YOUR_PROJECT_ID/jibun-supple:latest .
docker push gcr.io/YOUR_PROJECT_ID/jibun-supple:latest
gcloud run deploy jibun-supple --image gcr.io/YOUR_PROJECT_ID/jibun-supple:latest
```

---

## 🗄️ データベース対応

### オプション1: Cloud SQL（本番推奨）

PostgreSQLやMySQLを使用:

```bash
# Cloud SQL インスタンス作成
gcloud sql instances create jibun-supple-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=asia-northeast1
```

### オプション2: ローカルSQLite（シンプル）

現在の設定では、コンテナ内でSQLiteを使用。
データは永続化されないため、本番環境ではCloud SQLを推奨。

---

## 🔐 セキュリティ設定

### IAMロールの設定

```bash
# Cloud Runサービスアカウントに権限付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/run.invoker"
```

### シークレット管理

Secret Managerを使用:

```bash
# シークレット作成
echo -n "your-openai-api-key" | \
  gcloud secrets create openai-api-key --data-file=-

# Cloud Runサービスに紐付け
gcloud run services update jibun-supple \
  --region asia-northeast1 \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest"
```

---

## 📈 スケーリング設定

### 自動スケーリング

```bash
gcloud run services update jibun-supple \
  --region asia-northeast1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80
```

### リソース調整

```bash
gcloud run services update jibun-supple \
  --region asia-northeast1 \
  --memory 1Gi \
  --cpu 2
```

---

## 🐛 トラブルシューティング

### エラー: "Permission denied"

**原因**: APIが有効化されていない

**解決策**:
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### エラー: "Image not found"

**原因**: Dockerイメージがプッシュされていない

**解決策**:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/jibun-supple:latest .
docker push gcr.io/YOUR_PROJECT_ID/jibun-supple:latest
```

### サービスが起動しない

**ログ確認**:
```bash
gcloud run services logs read jibun-supple --region asia-northeast1 --limit 50
```

### ポート設定エラー

Cloud Runは`PORT`環境変数を自動設定します。
Dockerfileで`ENV PORT=8080`を設定済み。

---

## 📋 デプロイチェックリスト

- [ ] Google Cloudプロジェクト作成
- [ ] gcloud CLI認証
- [ ] 必要なAPI有効化
- [ ] 環境変数準備（OPENAI_API_KEY）
- [ ] Dockerfileの確認
- [ ] ビルド＆プッシュ
- [ ] Cloud Runデプロイ
- [ ] サービスURLで動作確認
- [ ] ログ確認
- [ ] 本番用DB設定（オプション）

---

## 🚀 クイックスタート

```bash
# 1. 認証
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. API有効化
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# 3. デプロイ
cd /home/user/webapp
npm run deploy:cloudrun
```

---

## 📚 参考リンク

- Cloud Run ドキュメント: https://cloud.google.com/run/docs
- 料金: https://cloud.google.com/run/pricing
- クイックスタート: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service

---

**最終更新**: 2025-12-11
**プロジェクト**: じぶんを知ることから (jibun-supple)
