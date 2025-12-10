# Cloudflare Pages デプロイメントガイド

## 📋 目次
1. [事前準備](#事前準備)
2. [Cloudflare API設定](#cloudflare-api設定)
3. [D1データベース作成](#d1データベース作成)
4. [環境変数設定](#環境変数設定)
5. [デプロイ実行](#デプロイ実行)
6. [デプロイ後の確認](#デプロイ後の確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 必要なもの
- Cloudflareアカウント（無料プランでOK）
- Cloudflare API トークン
- OpenAI API キー（AI解析用）

### プロジェクト情報
- **プロジェクト名**: `jibun-supple`
- **データベース名**: `jibun-supple-production`
- **本番ブランチ**: `main`

---

## Cloudflare API設定

### 1. API トークンを取得

1. https://dash.cloudflare.com/profile/api-tokens にアクセス
2. 「Create Token」をクリック
3. 「Edit Cloudflare Workers」テンプレートを選択
4. 権限を確認:
   - ✅ Account Settings: Read
   - ✅ User Details: Read
   - ✅ Workers Scripts: Edit
   - ✅ Pages: Edit
   - ✅ D1: Edit
5. 「Create Token」をクリック
6. **トークンをコピー**（後で使用）

### 2. このツールで設定

1. 左サイドバーの **「Deploy」タブ** を開く
2. 「Cloudflare API Key」欄にトークンを貼り付け
3. 「保存」をクリック

### 3. 認証確認

サンドボックスで以下のコマンドを実行:

```bash
cd /home/user/webapp
npx wrangler whoami
```

✅ アカウント情報が表示されればOK

---

## D1データベース作成

### 1. 本番用D1データベースを作成

```bash
cd /home/user/webapp
npx wrangler d1 create jibun-supple-production
```

### 2. データベースIDをコピー

出力例:
```
✅ Successfully created DB 'jibun-supple-production'

[[d1_databases]]
binding = "DB"
database_name = "jibun-supple-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← このIDをコピー
```

### 3. wrangler.jsonc を更新

`database_id`を実際のIDに置き換え:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "jibun-supple-production",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // ← 実際のIDに変更
    }
  ]
}
```

### 4. マイグレーションを適用

```bash
npx wrangler d1 migrations apply jibun-supple-production
```

⚠️ 「About to apply XX migration(s)」と表示されたら `y` を入力

---

## 環境変数設定

### OpenAI API キーを設定

本番環境用のシークレットを設定:

```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple
```

プロンプトが表示されたらAPIキーを入力（入力中は非表示）

### 確認

```bash
npx wrangler pages secret list --project-name jibun-supple
```

---

## デプロイ実行

### 1. プロジェクトをビルド

```bash
cd /home/user/webapp
npm run build
```

✅ `dist/_worker.js` が生成されることを確認

### 2. Cloudflare Pages プロジェクトを作成

```bash
npx wrangler pages project create jibun-supple \
  --production-branch main \
  --compatibility-date 2025-12-01
```

### 3. デプロイを実行

```bash
npx wrangler pages deploy dist --project-name jibun-supple
```

### 4. デプロイ完了

成功すると以下のURLが表示されます:

```
✨ Success! Uploaded 1 files (XXX KiB)

✨ Deployment complete! Take a peek over at
   https://jibun-supple.pages.dev
```

---

## デプロイ後の確認

### 1. アプリケーションにアクセス

- **本番URL**: https://jibun-supple.pages.dev
- **ブランチURL**: https://main.jibun-supple.pages.dev

### 2. 動作確認

1. トップページが表示されることを確認
2. ユーザー登録/ログインをテスト
3. 検査データ入力をテスト
4. AI解析を実行してみる

### 3. ログ確認

```bash
npx wrangler pages deployment tail --project-name jibun-supple
```

---

## トラブルシューティング

### エラー: "API token not found"

**原因**: Cloudflare API トークンが未設定

**解決策**:
1. 「Deploy」タブでAPIキーを設定
2. `setup_cloudflare_api_key` ツールを実行

### エラー: "D1 database not found"

**原因**: データベースIDが正しくない

**解決策**:
1. `npx wrangler d1 list` でデータベース一覧を確認
2. `wrangler.jsonc` の `database_id` を正しいIDに更新

### エラー: "OPENAI_API_KEY is not defined"

**原因**: 環境変数が未設定

**解決策**:
```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple
```

### デプロイ後にページが表示されない

**原因**: ビルドファイルが正しくない

**解決策**:
1. `npm run build` を再実行
2. `dist/_worker.js` が存在することを確認
3. 再度デプロイ

### データベースが空

**原因**: マイグレーションが未適用

**解決策**:
```bash
npx wrangler d1 migrations apply jibun-supple-production
```

---

## 更新デプロイ

コードを更新した後の再デプロイ手順:

```bash
# 1. ビルド
cd /home/user/webapp
npm run build

# 2. デプロイ
npx wrangler pages deploy dist --project-name jibun-supple
```

---

## カスタムドメイン設定（オプション）

独自ドメインを使用する場合:

```bash
npx wrangler pages domain add example.com --project-name jibun-supple
```

---

## サポート

質問や問題がある場合:
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/

---

**最終更新**: 2025-12-10
**プロジェクト**: じぶんを知ることから (jibun-supple)
