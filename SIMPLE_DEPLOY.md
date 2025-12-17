# 🚀 簡単デプロイガイド（初心者向け）

このファイルは、技術的な知識がない方でもCloudflareにデプロイできるように、
**ステップバイステップ**で説明します。

---

## 📌 デプロイとは？

- **デプロイ** = アプリをインターネット上に公開すること
- 現在は開発環境（テスト用）で動いています
- デプロイすると、誰でもアクセスできる本番環境になります

---

## ⏱️ 所要時間

**約15〜20分**（初回のみ）

---

## 🎯 必要なもの

1. ✅ Cloudflareアカウント（無料）
2. ✅ Cloudflare APIキー（下記で取得）
3. ✅ このアプリのコード（準備済み✅）

---

## 📝 手順

### ステップ1️⃣: Cloudflareアカウントを作成

**すでにアカウントをお持ちの方はスキップしてください**

1. https://dash.cloudflare.com/sign-up を開く
2. メールアドレスとパスワードを入力
3. 「Sign Up」ボタンをクリック
4. メールに届いた確認リンクをクリック

✅ これでアカウント作成完了！

---

### ステップ2️⃣: APIキーを取得して設定

#### 方法A: GenSpark画面から設定（簡単！推奨）

1. **画面左のメニューから「Deploy」タブをクリック**
2. 「Cloudflare API Token」のセクションを探す
3. 「トークンを取得」ボタンをクリック
4. Cloudflareのページに移動するので、そこで指示に従ってトークンを作成
5. 表示されたトークン（長い文字列）を**コピー**
6. GenSparkの「Deploy」タブに戻って、コピーしたトークンを**貼り付け**
7. 「保存」ボタンをクリック

✅ APIキー設定完了！

#### 方法B: Cloudflareサイトで直接取得

1. https://dash.cloudflare.com/profile/api-tokens を開く
2. 「Create Token」ボタンをクリック
3. 「Edit Cloudflare Workers」の横にある「Use template」をクリック
4. 一番下までスクロールして「Continue to summary」をクリック
5. 「Create Token」をクリック
6. 表示されたトークン（長い文字列）を**コピー**
   - ⚠️ **重要**: この画面を閉じると二度と見られません！
7. GenSparkの「Deploy」タブに戻って、コピーしたトークンを貼り付け

✅ APIキー設定完了！

---

### ステップ3️⃣: デプロイスクリプトを実行

**以下のコマンドをターミナルで1つずつ実行してください**

#### 3-1. データベースを作成

```bash
cd /home/user/webapp
npx wrangler d1 create jibun-supple-production
```

**実行すると、以下のような表示が出ます：**

```
✅ Successfully created DB 'jibun-supple-production'

[[d1_databases]]
binding = "DB"
database_name = "jibun-supple-production"
database_id = "12345678-abcd-1234-abcd-1234567890ab"  ← この行に注目！
```

**👉 `database_id = "..."` の中の文字列（"で囲まれた部分）をコピーしてください**

例: `12345678-abcd-1234-abcd-1234567890ab`

---

#### 3-2. database_id を設定

**重要**: コピーした database_id を wrangler.jsonc に設定する必要があります。

以下のコマンドを実行してください（`YOUR_DATABASE_ID_HERE` の部分を、先ほどコピーしたIDに置き換えてください）：

```bash
# 例: database_id が 12345678-abcd-1234-abcd-1234567890ab の場合
cd /home/user/webapp
nano wrangler.jsonc
```

`wrangler.jsonc` ファイルが開いたら：

1. 矢印キーで `"database_id": "local-db-for-development"` の行に移動
2. `local-db-for-development` を削除
3. コピーした database_id を貼り付け
4. `Ctrl + O` を押して保存
5. `Enter` を押す
6. `Ctrl + X` を押して終了

**修正例：**

修正前：
```jsonc
"database_id": "local-db-for-development"
```

修正後：
```jsonc
"database_id": "12345678-abcd-1234-abcd-1234567890ab"
```

---

#### 3-3. データベースにテーブルを作成（マイグレーション）

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply jibun-supple-production
```

**確認メッセージが表示されたら `y` を入力して Enter を押してください**

```
About to apply 16 migration(s)
Your database may not be available to serve requests during the migration...
Ok to proceed? (y/n)  ← y を入力して Enter
```

✅ 完了すると `Successfully applied 16 migration(s)` と表示されます

---

#### 3-4. 画像保存用のストレージを作成

```bash
cd /home/user/webapp
npx wrangler r2 bucket create jibun-supple-ocr-images
```

✅ `Created bucket 'jibun-supple-ocr-images'` と表示されれば成功！

---

#### 3-5. Cloudflare Pagesプロジェクトを作成

```bash
cd /home/user/webapp
npx wrangler pages project create jibun-supple --production-branch main
```

✅ `Successfully created the 'jibun-supple' project` と表示されれば成功！

---

#### 3-6. アプリをデプロイ（公開）

```bash
cd /home/user/webapp
npm run deploy:prod
```

**デプロイには数分かかります。完了すると以下のような表示が出ます：**

```
✨ Success! Uploaded 2 files (1.2 sec)

✨ Deployment complete! Take a peek over at https://abcd1234.jibun-supple.pages.dev
```

**🎉 この URL があなたのアプリの本番URLです！**

URLをコピーしてブラウザで開いてみてください。

---

## 🔐 セキュリティ設定（必須！）

### 管理者パスワードを変更

デプロイしたら、**必ず**管理者パスワードを変更してください。

1. 本番URL（https://xxxxx.jibun-supple.pages.dev）をブラウザで開く
2. URLの最後に `/admin/login` を追加してアクセス
   - 例: `https://xxxxx.jibun-supple.pages.dev/admin/login`
3. ログイン画面で以下を入力：
   - ユーザー名: `admin`
   - パスワード: `admin123`
4. 「ログイン」ボタンをクリック
5. 管理画面が開いたら、左メニューから「顧客データ一覧」をクリック
6. （まだユーザーがいない場合は、一般ユーザーでログインしてから再度試してください）

**⚠️ 重要**: デフォルトパスワード `admin123` は誰でも知っているので、必ず変更してください！

**推奨パスワード：**
- 12文字以上
- 大文字・小文字・数字・記号を含む
- 例: `MySecure@Pass2024!`

---

## 🎉 完了！

おめでとうございます！🎉

あなたのアプリが全世界に公開されました！

**本番URL**: `https://xxxxx.jibun-supple.pages.dev`
**管理画面**: `https://xxxxx.jibun-supple.pages.dev/admin/login`

---

## 🔄 更新方法（コードを変更した後）

アプリに変更を加えた後、更新をデプロイする方法：

```bash
cd /home/user/webapp
npm run deploy:prod
```

これだけで、最新版がデプロイされます！

---

## ❓ よくある質問

### Q1: エラーが出た場合は？

**エラーメッセージをよく読んでください。** 以下のような場合があります：

- **"You need to be authenticated"** → APIキーが設定されていません。ステップ2️⃣をもう一度確認
- **"Database not found"** → database_id が正しく設定されていません。ステップ3-2をもう一度確認
- **"Bucket not found"** → R2バケットが作成されていません。ステップ3-4をもう一度実行

---

### Q2: デプロイしたURLを忘れた場合は？

以下のコマンドで確認できます：

```bash
cd /home/user/webapp
npx wrangler pages deployment list --project-name jibun-supple
```

最新のデプロイメントのURLが表示されます。

---

### Q3: カスタムドメイン（独自URL）を使いたい

1. Cloudflareダッシュボード（https://dash.cloudflare.com）にログイン
2. 左メニューから「Workers & Pages」をクリック
3. 「jibun-supple」プロジェクトをクリック
4. 「Custom domains」タブをクリック
5. 「Set up a custom domain」ボタンをクリック
6. 希望のドメイン名を入力（例: app.example.com）

**注意**: 独自ドメインを使うには、そのドメインをCloudflareで管理している必要があります。

---

### Q4: データベースの中身を確認したい

```bash
cd /home/user/webapp
npx wrangler d1 execute jibun-supple-production --command="SELECT COUNT(*) FROM users"
```

ユーザー数が表示されます。

---

## 📞 サポート

問題が解決しない場合は、以下の情報を確認してください：

- **Cloudflareダッシュボード**: https://dash.cloudflare.com
- **デプロイログ**: Cloudflare Pages → jibun-supple → Deployment logs

---

**🎊 デプロイ成功をお祈りしています！**

何か問題があれば、エラーメッセージをそのままコピーして質問してください。
