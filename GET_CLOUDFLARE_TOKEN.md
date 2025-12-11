# 🔑 Cloudflare APIトークンの取得方法

## ⚠️ 現在の状況

提供されたトークンは無効です:
- `u3OS3x4bwWguIPwtOO12FUkVbaocbJGTDXXid02T` ❌ 無効
- `21dde2b0a669e8c44aa9401b5ecce18cd1615` ❌ 形式エラー（短すぎる）

## ✅ 正しいトークンの形式

Cloudflare APIトークンは以下の特徴があります:
- **長さ**: 約40文字以上
- **形式**: 英数字とハイフン（`-`）を含む
- **例**: `aBcDeFgH1234567890_iJkLmNoPqRsTuVwXyZ1234`

---

## 📋 ステップバイステップガイド

### ステップ 1: Cloudflare ダッシュボードにアクセス

ブラウザで以下のURLを開く:

```
https://dash.cloudflare.com/profile/api-tokens
```

ログインしていない場合は、Cloudflareアカウントでログイン

---

### ステップ 2: トークンを作成

1. 画面右上の **「Create Token」** ボタンをクリック

2. **「Edit Cloudflare Workers」** テンプレートを探す
   - ページをスクロールして「Edit Cloudflare Workers」を見つける
   - その横の **「Use template」** ボタンをクリック

   ```
   ┌─────────────────────────────────────────┐
   │  Edit Cloudflare Workers                │
   │  Deploy workers to Cloudflare's         │
   │  serverless platform                    │
   │                                         │
   │            [Use template] ←クリック      │
   └─────────────────────────────────────────┘
   ```

3. 権限を確認
   - 以下の権限が自動で設定されているはず:
   ```
   ✅ Account - Workers Scripts:Edit
   ✅ Account - Account Settings:Read
   ✅ User - User Details:Read
   ```

4. **追加で必要な権限**を設定:
   - 「+ Add more」をクリック
   - 以下を追加:
   ```
   ✅ Account - D1:Edit
   ✅ Account - Cloudflare Pages:Edit
   ```

5. **Account Resources** を確認:
   - 「All accounts」が選択されていることを確認

---

### ステップ 3: トークンを生成

1. 下にスクロールして **「Continue to summary」** をクリック

2. 設定内容を確認:
   ```
   Token name: Edit Cloudflare Workers
   
   Permissions:
   • Account - Workers Scripts:Edit
   • Account - Account Settings:Read
   • Account - D1:Edit
   • Account - Cloudflare Pages:Edit
   • User - User Details:Read
   
   Account Resources:
   • All accounts
   ```

3. **「Create Token」** ボタンをクリック

---

### ステップ 4: トークンをコピー 🚨 重要！

トークンが表示されます:

```
┌──────────────────────────────────────────────────────┐
│ Your API Token has been created                      │
│                                                      │
│  aBcDeFgH1234567890-iJkLmNoPqRsTuVwXyZ1234567890   │
│                                                      │
│  [Copy] ← このボタンをクリック                          │
│                                                      │
│  ⚠️ この画面を閉じると二度と表示されません！              │
└──────────────────────────────────────────────────────┘
```

**必ず「Copy」ボタンをクリックしてコピーしてください！**

---

### ステップ 5: このツールで設定

1. **左サイドバーの「Deploy」タブを開く**

2. **「Cloudflare API Token」の入力欄**にコピーしたトークンを貼り付け

3. **「保存」ボタン**をクリック

---

### ステップ 6: 認証を確認

サンドボックスで以下のコマンドを実行:

```bash
cd /home/user/webapp
npm run cf:auth
```

**成功例**:
```
==========================================
Cloudflare認証確認
==========================================

📋 Step 1: 環境変数確認
✅ CLOUDFLARE_API_TOKEN が設定されています
トークン長: 42 文字

📋 Step 2: 認証テスト

 ⛅️ wrangler 4.51.0
─────────────────────────────────────────────
Getting User settings...
👷 You are logged in with an API Token, associated with the email 'your-email@example.com'!

┌───────────────────────────────────┬──────────────────────────────────┐
│ Account Name                      │ Account ID                       │
├───────────────────────────────────┼──────────────────────────────────┤
│ Your Account Name                 │ 1234567890abcdef1234567890abcdef │
└───────────────────────────────────┴──────────────────────────────────┘

==========================================
✅ 認証成功！
==========================================

次のステップ:
  npm run deploy
```

**失敗例**:
```
❌ 認証失敗

トラブルシューティング:
1. トークンが正しいか確認
2. トークンの権限を確認（Edit Cloudflare Workers）
3. Deploy タブで再設定
```

---

## 🔍 よくある間違い

### ❌ 間違い 1: Global API Keyを使用
```
Global API Key: c1a2b3c4d5e6f7g8h9i0  ← これではない！
```
**正解**: API Tokenを使用（「Create Token」から作成）

### ❌ 間違い 2: Account IDを使用
```
Account ID: 1234567890abcdef1234567890abcdef  ← これではない！
```
**正解**: API Tokenは40文字以上の長い文字列

### ❌ 間違い 3: トークンの一部のみコピー
```
コピーした内容: 21dde2b0a669e8c44aa9401b5ecce18cd1615  ← 短すぎる！
```
**正解**: 全体をコピー（40文字以上）

### ❌ 間違い 4: 古いトークンを使用
トークンが失効している可能性があります。新しいトークンを作成してください。

---

## 📱 スクリーンショットで確認したい場合

1. Cloudflareの公式ドキュメント:
   https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

2. Wranglerの認証ガイド:
   https://developers.cloudflare.com/workers/wrangler/ci-cd/#authentication

---

## ✅ チェックリスト

トークン作成前に確認:
- [ ] Cloudflareアカウントを持っている
- [ ] ログインできる
- [ ] https://dash.cloudflare.com/profile/api-tokens にアクセスできる

トークン作成時に確認:
- [ ] 「Edit Cloudflare Workers」テンプレートを使用
- [ ] D1とPagesの権限を追加
- [ ] 「All accounts」を選択
- [ ] トークン全体をコピー（40文字以上）

このツールで設定時に確認:
- [ ] Deploy タブで設定
- [ ] トークンを貼り付け
- [ ] 保存をクリック
- [ ] `npm run cf:auth` で認証確認

---

## 🆘 まだ解決しない場合

1. **新しいトークンを作成**:
   - 古いトークンは削除
   - 上記の手順で新規作成

2. **権限を再確認**:
   - Workers Scripts: Edit ✅
   - D1: Edit ✅
   - Pages: Edit ✅
   - Account Settings: Read ✅
   - User Details: Read ✅

3. **トークンの長さを確認**:
   ```bash
   # サンドボックスで実行
   echo "トークンをここに貼り付け" | wc -c
   # 40以上であることを確認
   ```

4. **Cloudflareのステータスを確認**:
   https://www.cloudflarestatus.com/

---

**次のステップ**: 正しいトークンを取得して、Deploy タブで設定してください！

設定後、`npm run cf:auth` を実行して認証を確認します。

---

**最終更新**: 2025-12-11
**プロジェクト**: じぶんを知ることから
