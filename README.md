# じぶんサプリ育成アプリ

医療機関監修の健康管理・サプリメント提案アプリケーション

## プロジェクト概要

- **名称**: じぶんサプリ育成アプリ
- **目的**: 検査データと問診結果をAI解析し、個別化された健康アドバイスと最適なサプリメントを提案
- **監修**: 医療機関監修（本格的な健康管理アプリ）

## 公開URL

- **開発環境**: https://3000-i082b4qfhprar36r4od2x-583b4d74.sandbox.novita.ai
- **本番環境**: （Cloudflare Pagesにデプロイ後に更新）

## 主要機能

### ✅ 完成済み機能

**ユーザー認証システム**
- ユーザー登録（名前、メール、パスワード、年齢、性別）
- ログイン・ログアウト機能
- セッション管理（30日間有効）
- ダッシュボード（ユーザー専用ページ）

**データ管理**
- ユーザーごとのデータ分離
- プロフィール表示
- 検査データ履歴一覧
- AI解析結果履歴

1. **検査データ入力**
   - 血圧測定（収縮期・拡張期・脈拍）
   - 体組成計（体重・体脂肪率・筋肉量・BMI）
   - 血液検査（血糖値・HbA1c・コレステロール・中性脂肪・肝機能等）
   - カスタム検査項目（自由に追加可能）

2. **50問健康問診**
   - 睡眠・休養（5問）
   - 食事・栄養（10問）
   - 運動・活動（5問）
   - ストレス・メンタル（5問）
   - 生活習慣（5問）
   - 仕事・日常（5問）
   - 身体症状（5問）
   - 既往歴・家族歴（10問）

3. **AI健康解析**
   - OpenAI GPT-4o-miniによる総合分析
   - 100点満点の健康スコア算出
   - 個別化された健康アドバイス
   - 栄養指導（具体的な食事推奨）
   - 健康リスク評価と予防策

4. **レーダーチャート可視化**
   - 6項目の健康バランス表示
   - Chart.jsによる動的グラフ生成
   - 直感的な健康状態の把握

5. **サプリメント推奨**
   - AI による最適なサプリ提案（3-5種類）
   - 用量・頻度・推奨理由の詳細表示
   - 優先度別の分類

6. **処方オーダーシートPDF生成**
   - jsPDFによる自動PDF作成
   - 総合スコア、推奨サプリ、健康アドバイスを含む
   - ダウンロード可能な医療機関監修シート

## データアーキテクチャ

### データベース（Cloudflare D1 SQLite）

- **users**: ユーザー情報
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

### 検査データ

- `POST /api/exam` - 検査データ保存
- `GET /api/exam/:userId` - 検査データ取得

### 問診

- `POST /api/questionnaire` - 問診回答保存
- `GET /api/questionnaire/:userId` - 問診回答取得

### AI解析

- `POST /api/analysis` - AI解析実行（OpenAI API呼び出し）

## デプロイ手順

### Cloudflare Pagesへのデプロイ

1. **Cloudflare APIキー設定**

```bash
# Deploy タブでAPIキーを設定後
setup_cloudflare_api_key
```

2. **D1データベース作成**

```bash
npx wrangler d1 create jibun-supple-production
# 出力されたdatabase_idをwrangler.jsoncに設定
```

3. **マイグレーション実行**

```bash
npm run db:migrate:prod
```

4. **デプロイ**

```bash
npm run deploy
```

5. **環境変数設定**

```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple
```

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

© 2024 じぶんサプリ育成アプリ - 医療機関監修

## 最終更新日

2024年12月1日
