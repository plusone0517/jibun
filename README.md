# じぶんを知ることから

医療機関監修の健康管理・AI健康分析アプリケーション **β版**

## プロジェクト概要

- **名称**: じぶんを知ることから
- **目的**: 検査データとヒアリング結果をAI解析し、個別化された健康アドバイスと最適なサプリメントを提案
- **監修**: 医療機関監修（本格的な健康管理アプリ）
- **ステータス**: β版（機能追加・改善を継続中）

## 公開URL

- **開発環境**: https://3000-i082b4qfhprar36r4od2x-583b4d74.sandbox.novita.ai
- **本番環境**: （Cloudflare Pagesにデプロイ後に更新）

## 主要機能

### ✅ 完成済み機能

#### 1. **ユーザー認証システム** 🔐
- ユーザー登録（名前、メール、パスワード、年齢、性別）
- ログイン・ログアウト機能
- セッション管理（30日間有効）
- パスワードハッシュ化（SHA-256）
- 認証チェックミドルウェア
- **パスワードリセット機能**（セキュリティトークン方式）
  - リセットトークン発行（1時間有効）
  - 新しいパスワード設定
  - 既存セッション無効化（強制再ログイン）

#### 2. **ダッシュボード** 📊
- ユーザー専用ページ
- プロフィール表示
- 検査データ履歴一覧（最新5件）
- AI解析結果履歴（最新5件）
- 各機能へのクイックアクセス

#### 3. **検査データ入力**
   - 血圧測定（収縮期・拡張期・脈拍）
   - 体組成計（体重・体脂肪率・筋肉量・BMI）
   - 血液検査（血糖値・HbA1c・コレステロール・中性脂肪・肝機能等）
   - カスタム検査項目（自由に追加可能）

4. **45問健康ヒアリング**（名称変更）
   - 食事・栄養習慣（8問）
   - ストレス・メンタル・睡眠（7問）
   - 運動・活動習慣（6問）
   - 身体症状（6問）
   - 生活習慣（6問）
   - 既往歴・家族歴（6問）
   - 健康目標・関心事（6問）
   - **途中保存・再開可能**（localStorage使用）
   - **session_id管理**で履歴を保持

5. **AI健康解析**
   - OpenAI GPT-4o-miniによる総合分析
   - 100点満点の健康スコア算出
   - 個別化された健康アドバイス
   - 栄養指導（具体的な食事推奨）
   - 健康リスク評価と予防策

6. **レーダーチャート可視化**
   - 6項目の健康バランス表示
   - Chart.jsによる動的グラフ生成
   - 直感的な健康状態の把握

7. **サプリメント推奨**
   - AI による最適なサプリ提案（3-5種類）
   - 用量・頻度・推奨理由の詳細表示
   - 優先度別の分類

8. **処方オーダーシートPDF生成**
   - jsPDFによる自動PDF作成
   - 総合スコア、推奨サプリ、健康アドバイスを含む
   - ダウンロード可能な医療機関監修シート

9. **データ履歴管理**
   - 検査データの時系列保存
   - ヒアリング回答の履歴（session_id管理）
   - AI解析結果の保存と閲覧

10. **OCR画像読み取り**（📸 NEW!）
   - Gemini 2.0 Flash Vision APIによる自動OCR
   - 検査結果の画像をアップロード
   - 自動的にデータ抽出（血圧、体組成、血液検査等）
   - OCRテキストをデータベースに保存（AI解析用）

11. **血液検査52項目入力**（🩸 NEW!）
   - 詳細な血液検査データ入力
   - 糖代謝、脂質代謝、肝機能、腎機能、炎症マーカー、貧血指標など
   - 基準値範囲の自動表示
   - カテゴリー別グループ化で入力しやすい

12. **管理者ダッシュボード**（🔐 NEW!）
   - ユーザー一覧と統計情報
   - 検査データ件数、ヒアリング回答数、AI解析回数の集計
   - サプリマスター管理（登録・編集・無効化）
   - **ユーザー詳細閲覧**:
     - 基本情報（名前、メール、年齢、性別、登録日）
     - 検査履歴（チャート＋テーブル、データソース、OCRテキスト）
     - **ヒアリングデータ**（カテゴリー別質問・回答）
     - AI解析履歴（スコア、健康アドバイス）

## データアーキテクチャ

### データベース（Cloudflare D1 SQLite）

- **users**: ユーザー情報（名前、メール、パスワードハッシュ、年齢、性別）
- **sessions**: セッション管理（トークン、有効期限）
- **password_reset_tokens**: パスワードリセット用トークン（1時間有効）
- **exam_data**: 検査データ（親テーブル）
- **exam_measurements**: 検査測定値（子テーブル、柔軟なキーバリュー形式）
- **questionnaire_responses**: 問診回答（50問分）
- **analysis_results**: AI解析結果
- **supplement_recommendations**: サプリメント推奨
- **prescription_orders**: 処方オーダーシート履歴

### ストレージ

- **Cloudflare D1**: リレーショナルデータの永続化
- **ローカル開発**: `.wrangler/state/v3/d1`に自動生成されるSQLite

## 技術スタック

- **フレームワーク**: Hono (v4.10.7)
- **ランタイム**: Cloudflare Workers/Pages
- **データベース**: Cloudflare D1 (SQLite)
- **認証**: Cookie-based Session Authentication
- **AI**: OpenAI GPT-4o-mini API
- **フロントエンド**:
  - TailwindCSS (CDN)
  - Font Awesome (CDN)
  - Axios (CDN)
  - Chart.js (CDN) - レーダーチャート
  - jsPDF (CDN) - PDF生成
  - html2canvas (CDN) - 画像変換
- **開発ツール**:
  - TypeScript
  - Vite
  - Wrangler
  - PM2 (プロセス管理)

## セットアップ手順

### 1. 環境変数設定

`.dev.vars`ファイルを作成し、OpenAI APIキーを設定：

```bash
OPENAI_API_KEY=your-openai-api-key-here
MEDICAL_INSTITUTION_NAME=医療法人〇〇クリニック
SUPERVISING_DOCTOR=山田太郎 医師
```

### 2. データベース初期化

```bash
# マイグレーション実行
npm run db:migrate:local

# サンプルデータ投入
npm run db:seed
```

### 3. ローカル開発サーバー起動

```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# 動作確認
npm run test  # または curl http://localhost:3000
```

### 4. 開発中のデータリセット

```bash
# データベースを初期状態に戻す
npm run db:reset
```

## 使い方ガイド

### 0. ユーザー登録・ログイン

1. `/auth/register` で新規ユーザー登録
2. `/auth/login` でログイン
3. ログイン後は自動的にダッシュボードへリダイレクト

#### パスワードを忘れた場合

1. ログインページの「パスワードを忘れた方」をクリック
2. 登録済みのメールアドレスを入力
3. 発行されたリセットトークンをコピー
4. 「パスワードをリセットする」をクリック
5. トークンと新しいパスワードを入力
6. パスワード変更後、新しいパスワードでログイン

### 1. 検査データ入力（/exam）

1. 検査日を選択
2. 検査タイプを選択（血圧、体組成、血液検査、カスタム）
3. 各測定値を入力
4. 「保存する」をクリック

### 2. 健康問診（/questionnaire）

1. 50問の問診に順番に回答
2. 進捗バーで進行状況を確認
3. 「前へ」「次へ」で質問を移動
4. 最後に「送信する」をクリック

### 3. AI解析結果の確認（/analysis）

1. 自動的にAI解析が開始
2. 総合健康スコア（0-100）を確認
3. レーダーチャートで6項目のバランスを確認
4. 健康アドバイス、栄養指導、リスク評価を読む
5. 推奨サプリメントを確認
6. 「PDFをダウンロード」で処方シートを取得

## API エンドポイント

### 認証

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

### パスワードリセット

- `POST /api/password-reset/request` - リセットトークン発行（メールアドレス必須）
- `POST /api/password-reset/reset` - パスワード変更（トークン + 新パスワード）

### 検査データ

- `POST /api/exam` - 検査データ保存
- `GET /api/exam/:userId` - 検査データ取得

### 問診

- `POST /api/questionnaire` - 問診回答保存
- `GET /api/questionnaire/:userId` - 問診回答取得

### AI解析

- `POST /api/analysis` - AI解析実行（OpenAI API呼び出し）
- `GET /api/analysis-history/:userId` - 解析結果履歴取得

## ページ一覧

### ユーザーページ
- `/` - トップページ（認証状態により自動リダイレクト）
- `/auth/register` - ユーザー登録（β版バッジ付き）
- `/auth/login` - ログイン（β版バッジ付き、メールアドレス認証）
- `/password-reset/forgot` - パスワードリセットトークン発行
- `/password-reset/reset` - 新しいパスワード設定
- `/dashboard` - ダッシュボード（要認証）
- `/exam` - 検査データ手動入力
- `/exam/ocr` - OCR画像読み取り（📸 NEW!）
- `/exam/blood-test` - 血液検査52項目入力（🩸 NEW!）
- `/questionnaire` - 健康ヒアリング（45問）
- `/analysis` - AI解析結果表示
- `/analysis-history` - AI解析履歴一覧
- `/history` - 検査履歴グラフ

### 管理者ページ
- `/admin/login` - 管理者ログイン（デフォルト: admin / admin123）
- `/admin/dashboard` - 管理者ダッシュボード（統計情報、ユーザー一覧）
- `/admin/user/:userId` - ユーザー詳細（検査・ヒアリング・解析データ全件閲覧）
- `/admin/supplements` - サプリマスター管理

## デプロイ手順

### 🚀 Cloudflare Pages デプロイ（推奨）

このアプリはCloudflare Pagesに最適化されています。

#### 特徴
- ✅ グローバルCDNで高速配信
- ✅ 無料枠が充実（D1, R2, Pages）
- ✅ 自動HTTPS設定
- ✅ 自動スケーリング

#### 📖 デプロイ方法

**初心者向け完全ガイド**: [`SIMPLE_DEPLOY.md`](./SIMPLE_DEPLOY.md)
- 図解付きの詳しい手順書
- 初めてでも15〜20分でデプロイ可能

**自動セットアップスクリプト**:
```bash
# 全自動で本番環境を構築
./setup-production.sh
```

**手動デプロイ手順**: [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md)
- 上級者向けの詳細ガイド
- トラブルシューティング情報あり

### 🚀 クイックコマンド集

```bash
# 1. Cloudflare認証確認
npm run cf:whoami

# 2. D1データベース作成
npm run db:create

# 3. マイグレーション実行（本番）
npm run db:migrate:prod

# 4. プロジェクト作成（初回のみ）
npm run cf:project:create

# 5. デプロイ（対話式）
npm run deploy

# 6. デプロイ（確認なし）
npm run deploy:quick

# 7. 環境変数設定
npx wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple

# 8. ログ確認
npm run cf:logs
```

### ⚙️ 利用可能なnpmスクリプト

**Cloudflare関連**:
- `npm run cf:whoami` - 認証確認
- `npm run cf:project:create` - プロジェクト作成
- `npm run cf:project:list` - プロジェクト一覧
- `npm run cf:secret:list` - 環境変数一覧
- `npm run cf:logs` - ログ監視

**データベース関連**:
- `npm run db:create` - D1作成
- `npm run db:list` - D1一覧
- `npm run db:migrate:local` - ローカルマイグレーション
- `npm run db:migrate:prod` - 本番マイグレーション
- `npm run db:seed` - サンプルデータ投入
- `npm run db:reset` - ローカルDB初期化

**デプロイ関連**:
- `npm run build` - ビルドのみ
- `npm run deploy` - 対話式デプロイ
- `npm run deploy:quick` - 確認なしデプロイ
- `npm run deploy:prod` - 本番デプロイ

## 今後の開発予定

- [ ] ユーザー認証機能（複数ユーザー対応）
- [ ] データ履歴表示・グラフ化
- [ ] サプリメント購入機能との連携
- [ ] 定期的な健康チェックリマインダー
- [ ] 医師とのオンライン相談機能
- [ ] 多言語対応

## 注意事項

⚠️ **重要な免責事項**

本アプリケーションは健康情報の記録と参考情報の提供を目的としています。提供される情報は医学的アドバイスの代替ではありません。健康上の懸念がある場合は、必ず医師にご相談ください。

## ライセンス

© 2024 じぶんを知ることから - 医療機関監修

## 最終更新日

2024年12月10日（β版リリース）
