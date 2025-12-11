# Cloudflare API トークン設定ガイド

## 🔑 APIトークンとは？

Cloudflare APIトークンは、Cloudflareのサービス（Workers、Pages、D1など）を操作するための認証情報です。

## 📋 トークン取得手順（画像付き）

### ステップ1: Cloudflare ダッシュボードにログイン

1. https://dash.cloudflare.com/ にアクセス
2. Cloudflareアカウントでログイン
   - アカウントがない場合は新規登録（無料）

### ステップ2: APIトークンページに移動

1. 右上のプロフィールアイコンをクリック
2. 「My Profile」を選択
3. 左メニューから「API Tokens」を選択
   - または直接 https://dash.cloudflare.com/profile/api-tokens にアクセス

### ステップ3: 新しいトークンを作成

1. 「Create Token」ボタンをクリック

2. **推奨**: 「Edit Cloudflare Workers」テンプレートを使用
   - 「Use template」ボタンをクリック
   - このテンプレートには必要な権限がすべて含まれています

3. **カスタム設定する場合**:
   - 「Create Custom Token」を選択
   - 以下の権限を設定:

   ```
   Permissions (権限):
   ✅ Account - Account Settings: Read
   ✅ User - User Details: Read
   ✅ Account - Workers Scripts: Edit
   ✅ Account - D1: Edit
   ✅ Account - Cloudflare Pages: Edit
   ```

4. **Account Resources（対象アカウント）**:
   - 「All accounts」または特定のアカウントを選択

5. **Client IP Address Filtering（オプション）**:
   - 特定のIPアドレスからのみ使用可能にしたい場合は設定
   - 通常は空欄でOK

6. **TTL（有効期限）**:
   - デフォルトのままでOK（無期限または長期間）

### ステップ4: トークンを確認・コピー

1. 「Continue to summary」をクリック
2. 設定内容を確認
3. 「Create Token」をクリック

4. **🚨 重要**: 表示されたトークンをコピー
   ```
   例: aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCd
   ```
   - ⚠️ このトークンは一度しか表示されません
   - ⚠️ 必ずどこかに保存してください

5. 「Copy」ボタンでクリップボードにコピー

### ステップ5: このツールに設定

1. **このツールの左サイドバー**で「Deploy」タブを開く
2. 「Cloudflare API Token」の入力欄にトークンを貼り付け
3. 「保存」をクリック

### ステップ6: 認証確認

サンドボックスで以下のコマンドを実行:

```bash
cd /home/user/webapp
npm run cf:auth
```

または:

```bash
bash verify-cloudflare-auth.sh
```

✅ アカウント情報が表示されれば成功！

---

## ❌ トラブルシューティング

### エラー: "Invalid access token [code: 9109]"

**原因**: トークンが無効または期限切れ

**解決策**:
1. 新しいトークンを作成
2. Deploy タブで再設定
3. 認証確認を再実行

### エラー: "Insufficient permissions"

**原因**: トークンの権限が不足

**解決策**:
1. 既存のトークンを削除
2. 「Edit Cloudflare Workers」テンプレートで再作成
3. すべての権限（Edit, Read）が付与されているか確認

### トークンが見つからない

**原因**: 表示画面を閉じてしまった

**解決策**:
1. 古いトークンを削除（セキュリティのため）
2. 新しいトークンを作成
3. 今度は必ずコピーして保存

---

## 🔒 セキュリティのベストプラクティス

### ✅ 推奨事項

1. **トークンを安全に保管**
   - パスワード管理ツール（1Password、Bitwarden等）に保存
   - 平文ファイルには保存しない

2. **必要最小限の権限のみ付与**
   - このプロジェクトに必要な権限のみ設定

3. **定期的にトークンをローテーション**
   - 3-6ヶ月ごとに新しいトークンを作成
   - 古いトークンは削除

4. **トークンを共有しない**
   - GitHubやSlackに貼り付けない
   - 環境変数として管理

### ❌ 絶対にやってはいけないこと

1. ❌ トークンをGitにコミット
2. ❌ トークンを公開チャットに貼り付け
3. ❌ トークンをスクリーンショットで共有
4. ❌ 不要な権限（Delete, Purge等）を付与

---

## 📝 トークン管理

### トークン一覧の確認

Cloudflare ダッシュボード:
https://dash.cloudflare.com/profile/api-tokens

### トークンの無効化

1. APIトークンページで対象トークンの「...」メニューをクリック
2. 「Roll」（再生成）または「Delete」（削除）を選択

### 複数のトークン

用途別にトークンを分けることを推奨:
- 開発用トークン（短い有効期限）
- 本番用トークン（長い有効期限、厳密な権限）
- CI/CD用トークン（自動デプロイ専用）

---

## ✅ 設定完了後

認証が成功したら、以下のコマンドでデプロイを開始:

```bash
npm run deploy
```

または詳細ガイドを参照:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🆘 サポート

問題が解決しない場合:
- Cloudflare Docs: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- Cloudflare Community: https://community.cloudflare.com/

---

**最終更新**: 2025-12-11
**プロジェクト**: じぶんを知ることから (jibun-supple)
