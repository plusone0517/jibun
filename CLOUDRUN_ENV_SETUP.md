# Cloud Run 環境変数設定ガイド

## 🔑 必須環境変数

Cloud Runで永続的なCloudflare D1データベースを使用するため、以下の環境変数を設定してください。

### 1. CLOUDFLARE_API_TOKEN

Cloudflare APIトークン（D1とPagesの権限が必要）

**設定方法**:
```bash
# Cloud Runコンソールで設定
# または wranglerコマンドで設定
wrangler pages secret put CLOUDFLARE_API_TOKEN --project-name jibun-supple
```

**値**: あなたのCloudflare APIトークン
- Cloudflare Dashboard → My Profile → API Tokens
- 「Edit Cloudflare Workers」テンプレートを使用

### 2. CLOUDFLARE_ACCOUNT_ID

Cloudflare Account ID

**設定方法**:
```bash
wrangler pages secret put CLOUDFLARE_ACCOUNT_ID --project-name jibun-supple
```

**値**: `5346c04a48779ed2c86f2f4135f40c23`

### 3. OPENAI_API_KEY (オプション)

OpenAI APIキー（AI解析機能に必要）

**設定方法**:
```bash
wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple
```

---

## 📝 Cloud Runでの設定手順

### Google Cloud Consoleから設定

1. **Cloud Runコンソール**: https://console.cloud.google.com/run
2. サービス「**jibun-supple**」をクリック
3. 「**新しいリビジョンの編集とデプロイ**」をクリック
4. 「**変数とシークレット**」タブ
5. 以下の環境変数を追加:

| 名前 | 値 |
|------|---|
| `CLOUDFLARE_API_TOKEN` | [Your Cloudflare API Token] |
| `CLOUDFLARE_ACCOUNT_ID` | `5346c04a48779ed2c86f2f4135f40c23` |
| `OPENAI_API_KEY` | [Your OpenAI API Key] (オプション) |

6. 「**デプロイ**」をクリック

---

## ✅ データベース情報

- **Database ID**: `810ebef1-c3a8-496a-b349-1295c45cd0c8`
- **Database Name**: `jibun-supple-production`
- **リージョン**: ENAM (ヨーロッパ・北米)

---

## 🔍 動作確認

環境変数設定後、以下を確認:

1. アプリが起動すること
2. ユーザー登録が永続化されること
3. 再デプロイ後もデータが保持されること

---

## ⚠️ トラブルシューティング

### エラー: "Authentication failed"

→ `CLOUDFLARE_API_TOKEN`が正しく設定されていません
→ Cloudflare APIトークンの権限を確認してください

### エラー: "Database not found"

→ `CLOUDFLARE_ACCOUNT_ID`が正しく設定されていません
→ Database IDが正しいか確認してください

### データが消える

→ まだローカルモード（`--local`）で起動しています
→ ログで「Production mode detected」が表示されているか確認してください
