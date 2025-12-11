# 🚀 Google Cloud Run クイックスタートガイド

## ⚡ 5分でデプロイ完了！

このガイドに従えば、5分でアプリをデプロイできます。

---

## 📋 事前準備（3分）

### 1. Googleアカウント

Gmail等のGoogleアカウントが必要です。
- まだない場合: https://accounts.google.com/signup

### 2. Google Cloud 無料トライアル登録

**重要**: クレジットカード登録が必要ですが、自動課金はありません。

1. https://console.cloud.google.com/ にアクセス
2. 「無料で開始」をクリック
3. 国を選択: 日本
4. 利用規約に同意
5. クレジットカード情報を入力（確認のみ、課金なし）
6. 「無料トライアルを開始」をクリック

✅ これで **$300の無料クレジット**が付与されます（90日間有効）

### 3. プロジェクトを作成

Google Cloud Console上で:

1. 画面上部の「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名: `jibun-supple` （または任意の名前）
4. 「作成」をクリック

✅ プロジェクトIDをメモしておく（例: `jibun-supple-123456`）

---

## 🔐 認証方法（このサンドボックス環境用）

このサンドボックスはブラウザベースのため、通常の `gcloud auth login` は使用できません。
代わりに **サービスアカウントキー**を使用します。

### ステップ1: サービスアカウント作成

1. Google Cloud Console を開く:
   https://console.cloud.google.com/iam-admin/serviceaccounts

2. 「サービスアカウントを作成」をクリック

3. サービスアカウントの詳細:
   - 名前: `cloudrun-deployer`
   - ID: 自動生成
   - 説明: `Cloud Run deployment account`
   - 「作成して続行」をクリック

4. ロール（権限）を付与:
   以下のロールを追加:
   ```
   ✅ Cloud Run 管理者
   ✅ Service Account ユーザー
   ✅ ストレージ管理者
   ```
   「続行」をクリック

5. 「完了」をクリック

### ステップ2: JSONキーを取得

1. 作成したサービスアカウント（`cloudrun-deployer@...`）をクリック

2. 「キー」タブを選択

3. 「鍵を追加」→「新しい鍵を作成」をクリック

4. キーのタイプ: **JSON** を選択

5. 「作成」をクリック

6. **JSONファイルがダウンロードされます**
   - ファイル名: `jibun-supple-123456-xxxxxx.json`
   - ⚠️ このファイルは安全に保管してください

### ステップ3: サンドボックスで認証

JSONキーの内容をサンドボックスに設定します:

```bash
# JSONキーファイルを作成
cat > /home/user/gcloud-key.json << 'EOF'
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxx...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "cloudrun-deployer@your-project-id.iam.gserviceaccount.com",
  "client_id": "xxxxx...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
EOF

# 認証を実行
export PATH="/home/user/google-cloud-sdk/bin:$PATH"
gcloud auth activate-service-account --key-file=/home/user/gcloud-key.json

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# 確認
gcloud auth list
gcloud config list
```

---

## 🚀 デプロイ実行（2分）

認証が完了したら、デプロイを実行:

```bash
cd /home/user/webapp
export PATH="/home/user/google-cloud-sdk/bin:$PATH"

# OpenAI API Keyを環境変数に設定
export OPENAI_API_KEY="your-openai-api-key-here"

# デプロイスクリプトを実行
npm run deploy:cloudrun
```

または手動で:

```bash
# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# ビルド
npm run build

# Dockerイメージをビルド
PROJECT_ID=$(gcloud config get-value project)
docker build -t gcr.io/$PROJECT_ID/jibun-supple:latest .

# Container Registryにプッシュ
docker push gcr.io/$PROJECT_ID/jibun-supple:latest

# Cloud Runにデプロイ
gcloud run deploy jibun-supple \
  --image gcr.io/$PROJECT_ID/jibun-supple:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "OPENAI_API_KEY=$OPENAI_API_KEY,NODE_ENV=production"
```

---

## ✅ デプロイ完了

デプロイが成功すると、以下のようなURLが表示されます:

```
Service URL: https://jibun-supple-xxxxx-an.a.run.app
```

このURLにアクセスしてアプリを確認してください！

---

## 📊 動作確認

```bash
# サービスURLを取得
gcloud run services describe jibun-supple \
  --region asia-northeast1 \
  --format 'value(status.url)'

# ヘルスチェック
curl https://YOUR_SERVICE_URL/api/auth/me
```

---

## 🔍 ログ確認

```bash
# リアルタイムログ
gcloud run services logs tail jibun-supple --region asia-northeast1

# 最新100件のログ
gcloud run services logs read jibun-supple --region asia-northeast1 --limit 100
```

---

## 💰 料金について

### 無料枠（毎月）
- ✅ リクエスト: 200万回
- ✅ CPU時間: 180,000 vCPU秒
- ✅ メモリ: 360,000 GiB秒

### このアプリの推定コスト
- 小規模利用: **$0/月**（無料枠内）
- 中規模利用: $5-10/月
- 大規模利用: $20-30/月

料金計算: https://cloud.google.com/products/calculator

---

## 🔄 更新デプロイ

コードを変更した後:

```bash
cd /home/user/webapp
export PATH="/home/user/google-cloud-sdk/bin:$PATH"

# ビルド
npm run build

# Dockerイメージ再構築
PROJECT_ID=$(gcloud config get-value project)
docker build -t gcr.io/$PROJECT_ID/jibun-supple:latest .
docker push gcr.io/$PROJECT_ID/jibun-supple:latest

# 再デプロイ
gcloud run deploy jibun-supple \
  --image gcr.io/$PROJECT_ID/jibun-supple:latest \
  --region asia-northeast1
```

---

## 🐛 トラブルシューティング

### エラー: "Permission denied"

**解決策**: サービスアカウントに必要な権限を付与
```bash
# プロジェクトオーナーの場合
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:cloudrun-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

### エラー: "API not enabled"

**解決策**: 必要なAPIを有効化
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### エラー: "Image not found"

**解決策**: Dockerイメージを再ビルド＆プッシュ
```bash
PROJECT_ID=$(gcloud config get-value project)
docker build -t gcr.io/$PROJECT_ID/jibun-supple:latest .
docker push gcr.io/$PROJECT_ID/jibun-supple:latest
```

---

## 🔐 セキュリティ注意事項

### サービスアカウントキーの管理

⚠️ **重要**: JSONキーファイルは機密情報です

**推奨事項**:
- [ ] キーファイルを `.gitignore` に追加
- [ ] 使用後はキーファイルを削除
- [ ] 定期的にキーをローテーション
- [ ] 必要最小限の権限のみ付与

**キーファイルを削除**:
```bash
rm /home/user/gcloud-key.json
```

---

## 📚 次のステップ

1. **カスタムドメインを設定**:
   ```bash
   gcloud run domain-mappings create \
     --service jibun-supple \
     --domain your-domain.com \
     --region asia-northeast1
   ```

2. **Cloud SQLを設定**（本番環境推奨）:
   ```bash
   gcloud sql instances create jibun-supple-db \
     --database-version=POSTGRES_14 \
     --tier=db-f1-micro \
     --region=asia-northeast1
   ```

3. **CI/CDを設定**:
   - GitHub Actionsとの連携
   - 自動デプロイ設定

---

## 🆘 サポート

- Google Cloud ドキュメント: https://cloud.google.com/run/docs
- 料金: https://cloud.google.com/run/pricing
- サポート: https://cloud.google.com/support

---

**最終更新**: 2025-12-11
**プロジェクト**: じぶんを知ることから
