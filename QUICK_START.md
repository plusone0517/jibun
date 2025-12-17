# ⚡ クイックスタート - 5分でデプロイ

最速でCloudflare Pagesにデプロイする方法

---

## 📋 必要なもの

- ✅ Cloudflareアカウント（無料、5分で作成可能）
- ✅ Cloudflare APIキー（Deploy タブで設定）

---

## 🚀 3ステップデプロイ

### ステップ1: APIキーを設定（初回のみ、5分）

1. 画面左メニュー「**Deploy**」タブをクリック
2. 「Cloudflare API Token」セクションを見つける
3. 「トークンを取得」ボタンをクリック
4. Cloudflareページで「Create Token」→「Edit Cloudflare Workers」テンプレートを選択
5. 表示されたトークンをコピー（⚠️この画面を閉じると二度と見られません）
6. Deploy タブに戻って貼り付け→保存

✅ APIキー設定完了！

---

### ステップ2: 自動セットアップを実行（10分）

ターミナルで以下を実行：

```bash
cd /home/user/webapp
./setup-production.sh
```

このスクリプトが自動で以下を実行します：

1. ✅ D1データベース作成
2. ✅ データベーステーブル作成
3. ✅ R2ストレージバケット作成
4. ✅ Cloudflare Pagesプロジェクト作成
5. ✅ アプリケーションビルド
6. ✅ 本番環境へデプロイ

**確認メッセージが表示されたら `y` を入力してください**

✅ デプロイ完了！

---

### ステップ3: 管理者パスワードを変更（必須、1分）

1. スクリプトが表示した本番URLをブラウザで開く
   - 例: `https://xxxxx.jibun-supple.pages.dev`
2. URLの最後に `/admin/login` を追加してアクセス
3. 以下でログイン：
   - ユーザー名: `admin`
   - パスワード: `admin123`
4. ダッシュボードで管理者ユーザーを選択
5. 「パスワードをリセット」で新しい強力なパスワードを設定

✅ セキュリティ対策完了！

---

## 🎉 完了！

おめでとうございます！🎉

あなたのアプリが全世界に公開されました！

**本番URL**: スクリプトが表示したURL
**管理画面**: `https://xxxxx.jibun-supple.pages.dev/admin/login`

---

## 🔄 更新デプロイ（コード変更後）

コードを変更した後、再デプロイする方法：

```bash
cd /home/user/webapp
npm run deploy:prod
```

これだけで最新版がデプロイされます！

---

## ❓ トラブルシューティング

### エラー: "You need to be authenticated"

→ Deploy タブでAPIキーを再設定してください

### エラー: "Database not found"

→ `setup-production.sh` を再実行してください

### エラー: "Bucket not found"

```bash
cd /home/user/webapp
npx wrangler r2 bucket create jibun-supple-ocr-images
```

### データベースIDが取得できない

手動で取得する方法：

```bash
npx wrangler d1 list
# 出力から jibun-supple-production の ID をコピー

# wrangler.jsonc を編集
nano wrangler.jsonc
# "database_id": "local-db-for-development" を
# "database_id": "コピーしたID" に置き換え
```

---

## 📚 詳しいガイド

- **初心者向け完全ガイド**: [`SIMPLE_DEPLOY.md`](./SIMPLE_DEPLOY.md)
- **詳細な手順書**: [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md)
- **README**: [`README.md`](./README.md)

---

## 🆘 サポート

問題が解決しない場合：

1. エラーメッセージをコピー
2. Cloudflare ダッシュボードを確認
   - https://dash.cloudflare.com
   - Workers & Pages → jibun-supple → Logs
3. デプロイログを確認
   - `~/.config/.wrangler/logs/`

---

**✨ Happy Coding! 🚀**
