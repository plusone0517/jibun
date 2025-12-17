# Cloudflare Pages デプロイ手順書

このガイドに従って、アプリをCloudflare Pagesにデプロイしてください。

---

## 🔧 事前準備（完了済み✅）

- [x] Cloudflareアカウント作成
- [x] Deploy タブでAPIキー設定
- [x] プロジェクトビルド完了

---

## 📝 デプロイ手順

### ステップ1: D1データベースの作成

ターミナルで以下のコマンドを実行：

```bash
cd /home/user/webapp
npx wrangler d1 create jibun-supple-production
```

**出力例：**
```
✅ Successfully created DB 'jibun-supple-production'

[[d1_databases]]
binding = "DB"
database_name = "jibun-supple-production"
database_id = "12345678-abcd-1234-abcd-1234567890ab"  # ← この値をコピー！
```

**👉 `database_id` の値をメモ帳にコピーしてください！**

---

### ステップ2: wrangler.jsonc の更新

`wrangler.jsonc` ファイルを開いて、以下の部分を修正：

**修正前：**
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "jibun-supple-production",
    "database_id": "local-db-for-development"  # ← ここを変更
  }
]
```

**修正後：**
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "jibun-supple-production",
    "database_id": "12345678-abcd-1234-abcd-1234567890ab"  # ← コピーしたIDを貼り付け
  }
]
```

---

### ステップ3: データベースのマイグレーション実行

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply jibun-supple-production
```

**確認メッセージが表示されたら `y` を入力して Enter**

**出力例：**
```
About to apply 16 migration(s)
Your database may not be available to serve requests during the migration...
Ok to proceed? (y/n)  # ← y を入力
✅ Successfully applied 16 migration(s)
```

---

### ステップ4: R2ストレージバケットの作成

```bash
cd /home/user/webapp
npx wrangler r2 bucket create jibun-supple-ocr-images
```

**出力例：**
```
✅ Created bucket 'jibun-supple-ocr-images'
```

---

### ステップ5: Cloudflare Pagesプロジェクトの作成

```bash
cd /home/user/webapp
npx wrangler pages project create jibun-supple --production-branch main
```

**出力例：**
```
✅ Successfully created the 'jibun-supple' project.
```

---

### ステップ6: アプリのデプロイ

```bash
cd /home/user/webapp
npm run deploy
```

または

```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name jibun-supple
```

**デプロイには数分かかります。完了すると以下のような出力が表示されます：**

```
✨ Success! Uploaded 2 files (1.2 sec)

✨ Deployment complete! Take a peek over at https://abcd1234.jibun-supple.pages.dev
```

**👉 この URL があなたのアプリの本番URLです！**

---

## 🔐 セキュリティ設定（重要！）

### 管理者パスワードの変更

デフォルトの管理者パスワードは `admin123` です。**必ず変更してください！**

1. 本番URL（https://xxxxx.jibun-supple.pages.dev）にアクセス
2. `/admin/login` にアクセス
3. `admin` / `admin123` でログイン
4. ダッシュボード → ユーザー一覧 → admin ユーザーを選択
5. 「パスワードをリセット」で新しい強力なパスワードを設定

**推奨パスワード要件：**
- 12文字以上
- 大文字・小文字・数字・記号を含む
- 例: `Admin@2024!Secure#`

---

## 🎉 デプロイ完了！

デプロイが成功すると、以下のURLでアクセスできます：

- **本番URL**: `https://xxxxx.jibun-supple.pages.dev`
- **管理画面**: `https://xxxxx.jibun-supple.pages.dev/admin/login`

---

## 🔄 更新デプロイ方法

コードを変更した後、再デプロイする方法：

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name jibun-supple
```

または package.json に追加されている便利なコマンド：

```bash
npm run deploy
```

---

## ❓ トラブルシューティング

### エラー: "You need to be authenticated"

```bash
npx wrangler login
```

または Deploy タブで API キーを再設定してください。

---

### エラー: "Database not found"

`wrangler.jsonc` の `database_id` が正しく設定されているか確認してください。

---

### エラー: "Bucket not found"

R2バケットが作成されているか確認：

```bash
npx wrangler r2 bucket list
```

作成されていない場合：

```bash
npx wrangler r2 bucket create jibun-supple-ocr-images
```

---

### データベースマイグレーションの再実行

```bash
npx wrangler d1 migrations list jibun-supple-production  # 適用済みマイグレーション確認
npx wrangler d1 migrations apply jibun-supple-production  # 新しいマイグレーション適用
```

---

## 📊 本番環境の管理

### データベースの確認

```bash
# データベース一覧
npx wrangler d1 list

# SQLクエリ実行
npx wrangler d1 execute jibun-supple-production --command="SELECT COUNT(*) FROM users"

# テーブル一覧
npx wrangler d1 execute jibun-supple-production --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### R2バケットの確認

```bash
# バケット一覧
npx wrangler r2 bucket list

# バケット内のオブジェクト一覧
npx wrangler r2 object list jibun-supple-ocr-images
```

### デプロイ履歴の確認

```bash
npx wrangler pages deployment list --project-name jibun-supple
```

---

## 🌐 カスタムドメインの設定（オプション）

独自ドメインを使いたい場合：

1. Cloudflare ダッシュボードにログイン
2. Pages → jibun-supple → Custom domains
3. 「Set up a custom domain」をクリック
4. ドメイン名を入力（例: app.example.com）
5. DNS レコードが自動設定されます

---

## 📧 サポート

問題が発生した場合は、以下の情報を確認してください：

- Cloudflare ダッシュボード: https://dash.cloudflare.com
- Wrangler ログ: `~/.config/.wrangler/logs/`
- プロジェクトログ: Cloudflare Pages → jibun-supple → Deployment logs

---

**✅ デプロイ成功を祈っています！🎉**
