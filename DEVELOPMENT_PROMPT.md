# じぶんサプリ育成アプリ - 完全開発プロンプト

> このアプリケーションを最初から構築するための完全なガイド

---

## 🎯 プロジェクト概要

**医療機関監修の健康管理・AI解析・サプリメント推奨アプリケーション**

ユーザーが健康問診と検査データを入力すると、AIが健康状態を分析し、パーソナライズされたサプリメントを推奨するWebアプリケーション。

---

## 📚 技術スタック

### バックエンド
- **フレームワーク**: Hono (TypeScript) - 軽量・高速なWebフレームワーク
- **デプロイ先**: Cloudflare Pages/Workers - エッジコンピューティング
- **データベース**: Cloudflare D1 - SQLiteベースの分散データベース
- **認証**: Cookie/Session ベース
- **AI**: OpenAI GPT-4o-mini
- **OCR**: Google Gemini Vision API

### フロントエンド
- **スタイル**: Tailwind CSS (CDN)
- **アイコン**: Font Awesome 6.4.0
- **HTTP**: Axios 1.6.0
- **グラフ**: Chart.js 4.4.0

### 開発ツール
- **ビルド**: Vite 5.x
- **CLI**: Wrangler 3.x (Cloudflare CLI)
- **ローカル開発**: PM2 (プロセス管理)

---

## 📂 プロジェクト構造

```
webapp/
├── src/
│   ├── index.tsx                    # メインエントリーポイント
│   ├── routes-auth.ts              # 認証（登録・ログイン・ログアウト）
│   ├── routes-dashboard.ts         # ダッシュボード
│   ├── routes-questionnaire.ts     # 健康問診（50問）
│   ├── routes-exam-ocr.ts          # OCR画像読み取り
│   ├── routes-blood-test.ts        # 血液検査52項目入力
│   ├── routes-analysis.ts          # AI解析エンジン
│   ├── routes-analysis-history.ts  # AI解析履歴
│   ├── routes-history.ts           # 検査履歴グラフ
│   ├── routes-admin.ts             # 管理者機能
│   └── routes-password-reset.ts    # パスワードリセット
├── migrations/                      # データベースマイグレーション
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_data_source.sql
│   └── ...
├── public/                          # 静的ファイル
├── .dev.vars                        # 環境変数（ローカル）
├── wrangler.jsonc                   # Cloudflare設定
├── package.json
├── tsconfig.json
├── vite.config.ts
└── ecosystem.config.cjs            # PM2設定
```

---

## 💾 データベース設計

### ERD概要
```
users (ユーザー)
  ↓
sessions (セッション)
  ↓
questionnaire_responses (問診回答)
exam_data (検査データ) → exam_measurements (測定値)
  ↓
analysis_results (AI解析結果) → supplement_recommendations (サプリ推奨)
  ↓
supplements_master (サプリマスター)
```

### テーブル定義

#### 1. users (ユーザー)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  birthdate DATE,
  gender TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
```

#### 2. sessions (セッション)
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

#### 3. questionnaire_responses (問診回答)
```sql
CREATE TABLE questionnaire_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_questionnaire_user_id ON questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_category ON questionnaire_responses(category);
```

#### 4. exam_data (検査データ)
```sql
CREATE TABLE exam_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exam_date DATE NOT NULL,
  exam_type TEXT NOT NULL,  -- 'blood_test', 'blood_pressure', 'body_composition'
  data_source TEXT NOT NULL, -- 'ocr', 'manual_input'
  ocr_raw_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_exam_user_id ON exam_data(user_id);
CREATE INDEX idx_exam_date ON exam_data(exam_date);
```

#### 5. exam_measurements (検査測定値)
```sql
CREATE TABLE exam_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  measurement_name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  FOREIGN KEY (exam_id) REFERENCES exam_data(id) ON DELETE CASCADE
);
CREATE INDEX idx_measurements_exam_id ON exam_measurements(exam_id);
CREATE INDEX idx_measurements_name ON exam_measurements(measurement_name);
```

#### 6. analysis_results (AI解析結果)
```sql
CREATE TABLE analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  overall_score INTEGER,
  health_advice TEXT,
  nutrition_guidance TEXT,
  risk_assessment TEXT,
  radar_chart_data TEXT,
  selected_exam_ids TEXT,
  data_completeness_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_analysis_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_created_at ON analysis_results(created_at);
```

#### 7. supplement_recommendations (サプリ推奨)
```sql
CREATE TABLE supplement_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_result_id INTEGER NOT NULL,
  supplement_name TEXT NOT NULL,
  supplement_type TEXT,
  dosage TEXT,
  frequency TEXT,
  reason TEXT,
  priority INTEGER,
  FOREIGN KEY (analysis_result_id) REFERENCES analysis_results(id) ON DELETE CASCADE
);
CREATE INDEX idx_supplement_analysis_id ON supplement_recommendations(analysis_result_id);
```

#### 8. supplements_master (サプリマスター)
```sql
CREATE TABLE supplements_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  supplement_category TEXT,
  content_amount TEXT,
  recommended_for TEXT,
  description TEXT,
  price INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_supplements_product_code ON supplements_master(product_code);
CREATE INDEX idx_supplements_is_active ON supplements_master(is_active);
```

#### 9. admin_users (管理者)
```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. admin_sessions (管理者セッション)
```sql
CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

#### 11. password_reset_tokens (パスワードリセット)
```sql
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_reset_token ON password_reset_tokens(token);
```

---

## 🚀 セットアップ手順（ステップバイステップ）

### STEP 1: プロジェクト作成

```bash
# ホームディレクトリに移動
cd /home/user

# Honoプロジェクト作成（Cloudflare Pagesテンプレート使用）
npm create -y hono@latest webapp -- --template cloudflare-pages --install --pm npm

# プロジェクトディレクトリに移動
cd webapp

# Git初期化
git init
git add .
git commit -m "Initial commit: プロジェクト作成"
```

### STEP 2: 依存関係インストール

```bash
# 必要なパッケージをインストール
npm install hono @hono/vite-cloudflare-pages
npm install -D @cloudflare/workers-types wrangler typescript vite

# package.json を確認
cat package.json
```

### STEP 3: D1データベース作成

```bash
# ローカル開発用D1データベース作成
npx wrangler d1 create jibun-supple-production

# 出力される database_id をコピーして wrangler.jsonc に記載
```

**wrangler.jsonc 設定:**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jibun-supple",
  "main": "src/index.tsx",
  "compatibility_date": "2025-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "jibun-supple-production",
      "database_id": "your-database-id-here"
    }
  ]
}
```

### STEP 4: マイグレーションファイル作成

```bash
# マイグレーションディレクトリ作成
mkdir migrations
```

**migrations/0001_initial_schema.sql を作成:**
```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  birthdate DATE,
  gender TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 他のテーブルも同様に作成...
```

**マイグレーション実行:**
```bash
# ローカルデータベースにマイグレーション適用
npx wrangler d1 migrations apply jibun-supple-production --local
```

### STEP 5: 環境変数設定

**.dev.vars ファイル作成:**
```bash
cat > .dev.vars << 'EOF'
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
MEDICAL_INSTITUTION_NAME=〇〇クリニック
SUPERVISING_DOCTOR=山田太郎
EOF
```

### STEP 6: PM2設定ファイル作成

**ecosystem.config.cjs:**
```javascript
module.exports = {
  apps: [
    {
      name: 'jibun-supple',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=jibun-supple-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
```

### STEP 7: package.json スクリプト設定

```json
{
  "scripts": {
    "dev": "wrangler pages dev dist --d1=jibun-supple-production --local --ip 0.0.0.0 --port 3000",
    "build": "vite build",
    "deploy": "npm run build && wrangler pages deploy dist --project-name jibun-supple",
    "db:migrate:local": "wrangler d1 migrations apply jibun-supple-production --local",
    "db:migrate:prod": "wrangler d1 migrations apply jibun-supple-production",
    "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local"
  }
}
```

### STEP 8: ビルド＆起動

```bash
# プロジェクトをビルド
npm run build

# PM2でサーバー起動
pm2 start ecosystem.config.cjs

# サーバー確認
curl http://localhost:3000
```

---

## 🎨 主要機能の実装

### 1. 認証システム (routes-auth.ts)

**基本構造:**
```typescript
import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { v4 as uuidv4 } from 'uuid'

type Bindings = {
  DB: D1Database
}

export const authRoutes = new Hono<{ Bindings: Bindings }>()

// ユーザー登録
authRoutes.post('/register', async (c) => {
  const { email, password, name, birthdate, gender } = await c.req.json()
  
  // パスワードハッシュ化（bcrypt使用）
  const password_hash = await hashPassword(password)
  
  // ユーザー作成
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, birthdate, gender) VALUES (?, ?, ?, ?, ?)'
  ).bind(email, password_hash, name, birthdate, gender).run()
  
  // セッション作成
  const sessionId = uuidv4()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日後
  
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, result.meta.last_row_id, expiresAt.toISOString()).run()
  
  // Cookie設定
  setCookie(c, 'session_id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60
  })
  
  return c.json({ success: true, user: { id: result.meta.last_row_id, name, email } })
})

// ログイン
authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  
  // ユーザー検索
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first()
  
  if (!user) {
    return c.json({ success: false, error: 'ユーザーが見つかりません' }, 401)
  }
  
  // パスワード確認
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    return c.json({ success: false, error: 'パスワードが間違っています' }, 401)
  }
  
  // セッション作成（同様の処理）
  // ...
})

// 認証確認
authRoutes.get('/me', async (c) => {
  const sessionId = getCookie(c, 'session_id')
  if (!sessionId) {
    return c.json({ success: false, error: '未認証' }, 401)
  }
  
  // セッション確認
  const session = await c.env.DB.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  ).bind(sessionId).first()
  
  if (!session) {
    return c.json({ success: false, error: 'セッション無効' }, 401)
  }
  
  // ユーザー情報取得
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, birthdate, gender FROM users WHERE id = ?'
  ).bind(session.user_id).first()
  
  return c.json({ success: true, user })
})

// ログアウト
authRoutes.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id')
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }
  deleteCookie(c, 'session_id')
  return c.json({ success: true })
})
```

### 2. ダッシュボード (routes-dashboard.ts)

**5つのアクションカード:**

```typescript
export const dashboardRoutes = new Hono<{ Bindings: Bindings }>()

dashboardRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>ダッシュボード</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <h1 class="text-2xl font-bold text-blue-600">
                    <i class="fas fa-heartbeat mr-2"></i>じぶんサプリ育成
                </h1>
            </div>
        </nav>
        
        <!-- Action Cards -->
        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 1. 健康問診 -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="text-5xl mb-4">📋</div>
                    <h3 class="text-xl font-bold mb-3">健康問診</h3>
                    <p class="text-gray-600 mb-4">50問の詳細な問診</p>
                    <a href="/questionnaire" class="bg-green-600 text-white px-6 py-2 rounded-lg">
                        問診開始
                    </a>
                </div>
                
                <!-- 2. OCR画像読み取り -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6">
                    <div class="text-5xl mb-4">📸</div>
                    <h3 class="text-xl font-bold mb-3 text-purple-700">画像読み取り</h3>
                    <p class="text-gray-600 mb-4">OCRで検査結果を読取</p>
                    <a href="/exam/ocr" class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg">
                        OCR入力
                    </a>
                </div>
                
                <!-- 3. 血液検査52項目 -->
                <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-lg p-6 border-2 border-red-200">
                    <div class="text-5xl mb-4">🩸</div>
                    <h3 class="text-xl font-bold mb-3 text-red-700">血液検査52項目</h3>
                    <p class="text-gray-600 mb-4">詳細な血液検査データ</p>
                    <a href="/exam/blood-test" class="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-lg">
                        52項目入力 <span class="text-xs">⭐NEW</span>
                    </a>
                </div>
                
                <!-- 4. 手動入力 -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="text-5xl mb-4">✍️</div>
                    <h3 class="text-xl font-bold mb-3">手動入力</h3>
                    <p class="text-gray-600 mb-4">血圧、体組成など</p>
                    <a href="/exam" class="bg-blue-600 text-white px-6 py-2 rounded-lg">
                        データ入力
                    </a>
                </div>
                
                <!-- 5. AI解析 -->
                <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg p-6">
                    <div class="text-5xl mb-4">🤖</div>
                    <h3 class="text-xl font-bold mb-3 text-indigo-700">AI解析</h3>
                    <p class="text-gray-600 mb-4">健康アドバイスとサプリ</p>
                    <a href="/analysis" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg">
                        AI解析実行
                    </a>
                </div>
            </div>
        </main>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            async function checkAuth() {
                try {
                    const response = await axios.get('/api/auth/me');
                    if (!response.data.success) {
                        window.location.href = '/auth/login';
                    }
                } catch (error) {
                    window.location.href = '/auth/login';
                }
            }
            window.addEventListener('load', checkAuth);
        </script>
    </body>
    </html>
  `)
})
```

### 3. 健康問診 (routes-questionnaire.ts)

**50問の問診フォーム:**

```typescript
export const questionnaireRoutes = new Hono<{ Bindings: Bindings }>()

// 問診カテゴリー定義
const questionnaireCategories = [
  {
    category: '食事・栄養',
    questions: [
      { id: 'q1', text: '主食（ご飯・パン・麺類）を毎食食べますか？', type: 'radio', options: ['はい', 'いいえ', '時々'] },
      { id: 'q2', text: '野菜を1日に何回食べますか？', type: 'select', options: ['0回', '1回', '2回', '3回以上'] },
      // ... 他の質問
    ]
  },
  {
    category: '睡眠・休息',
    questions: [
      { id: 'q9', text: '平均的な睡眠時間は何時間ですか？', type: 'select', options: ['4時間未満', '4-5時間', '6-7時間', '8時間以上'] },
      // ...
    ]
  }
  // ... 他のカテゴリー
]

// 問診ページ表示
questionnaireRoutes.get('/', (c) => {
  return c.html(`
    <!-- 問診フォームHTML -->
    <div class="tabs">
      ${questionnaireCategories.map((cat, index) => `
        <button class="tab" data-category="${cat.category}">
          ${cat.category}
        </button>
      `).join('')}
    </div>
    
    <form id="questionnaire-form">
      ${questionnaireCategories.map(cat => `
        <div class="category-section" data-category="${cat.category}">
          <h2>${cat.category}</h2>
          ${cat.questions.map(q => `
            <div class="question">
              <label>${q.text}</label>
              ${q.type === 'radio' ? 
                q.options.map(opt => `
                  <input type="radio" name="${q.id}" value="${opt}"> ${opt}
                `).join('') : 
                `<select name="${q.id}">
                  ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>`
              }
            </div>
          `).join('')}
        </div>
      `).join('')}
    </form>
  `)
})

// 問診保存API
questionnaireRoutes.post('/api/questionnaire', async (c) => {
  const data = await c.req.json()
  const { user_id, responses } = data
  
  // 既存の回答を削除
  await c.env.DB.prepare('DELETE FROM questionnaire_responses WHERE user_id = ?')
    .bind(user_id).run()
  
  // 新しい回答を保存
  for (const response of responses) {
    await c.env.DB.prepare(
      'INSERT INTO questionnaire_responses (user_id, category, question_text, answer) VALUES (?, ?, ?, ?)'
    ).bind(user_id, response.category, response.question_text, response.answer).run()
  }
  
  return c.json({ success: true })
})
```

### 4. 血液検査52項目入力 (routes-blood-test.ts)

**7カテゴリー52項目のフォーム:**

```typescript
export const bloodTestRoutes = new Hono<{ Bindings: Bindings }>()

bloodTestRoutes.get('/', (c) => {
  return c.html(`
    <form id="blood-test-form">
      <input type="date" id="exam_date" required>
      
      <!-- CBC (14項目) -->
      <div class="category">
        <h2>血球算定（CBC）- 14項目</h2>
        <input type="number" name="rbc" placeholder="赤血球数"> <span>×10⁴/µL</span>
        <input type="number" name="wbc" placeholder="白血球数"> <span>/µL</span>
        <!-- ... 他の項目 -->
      </div>
      
      <!-- 肝機能 (10項目) -->
      <div class="category">
        <h2>肝機能 - 10項目</h2>
        <input type="number" name="ast" placeholder="AST"> <span>U/L</span>
        <input type="number" name="alt" placeholder="ALT"> <span>U/L</span>
        <!-- ... -->
      </div>
      
      <!-- 他のカテゴリー... -->
      
      <button type="submit">保存してAI解析へ</button>
    </form>
    
    <script>
      document.getElementById('blood-test-form').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const measurements = {}
        const inputs = document.querySelectorAll('input[name]')
        inputs.forEach(input => {
          if (input.value) {
            measurements[input.name] = {
              value: parseFloat(input.value),
              unit: input.nextElementSibling?.textContent || ''
            }
          }
        })
        
        await axios.post('/api/exam', {
          user_id: currentUser.id,
          exam_date: document.getElementById('exam_date').value,
          exam_type: 'blood_test',
          data_source: 'manual_input',
          measurements: measurements
        })
        
        window.location.href = '/analysis'
      })
    </script>
  `)
})
```

### 5. AI解析エンジン (routes-analysis.ts)

**最も重要な機能:**

```typescript
export const analysisRoutes = new Hono<{ Bindings: Bindings }>()

analysisRoutes.post('/api/analysis', async (c) => {
  const { user_id, selected_exam_ids, use_questionnaire } = await c.req.json()
  
  // 1. 検査データ取得
  const examData = await c.env.DB.prepare(`
    SELECT e.*, GROUP_CONCAT(m.measurement_name || ':' || m.value || m.unit) as measurements
    FROM exam_data e
    LEFT JOIN exam_measurements m ON e.id = m.exam_id
    WHERE e.user_id = ? AND e.id IN (${selected_exam_ids.join(',')})
    GROUP BY e.id
  `).bind(user_id).all()
  
  // 2. 問診データ取得
  const questionnaireData = use_questionnaire ? 
    await c.env.DB.prepare(
      'SELECT * FROM questionnaire_responses WHERE user_id = ?'
    ).bind(user_id).all() : { results: [] }
  
  // 3. サプリメントマスター取得
  const supplementsMaster = await c.env.DB.prepare(
    'SELECT * FROM supplements_master WHERE is_active = 1'
  ).all()
  
  // 4. データを整形
  const examSummary = examData.results?.map(exam => 
    `[${exam.exam_date}] ${exam.exam_type}:\n` +
    exam.measurements.split(',').map(m => `  - ${m}`).join('\n')
  ).join('\n\n') || 'なし'
  
  const questionnaireSummary = questionnaireData.results?.map(q =>
    `【${q.category}】${q.question_text}: ${q.answer}`
  ).join('\n') || 'なし'
  
  const supplementsList = supplementsMaster.results?.map(s => 
    `[${s.product_code}] ${s.product_name} (${s.supplement_category}) - ${s.content_amount} - ¥${s.price}`
  ).join('\n')
  
  // 5. AIプロンプト構築
  const systemPrompt = `
【重要】あなたは医療機関監修の健康アドバイザーです。
提供された検査データと問診結果を詳細に分析し、
**必ず具体的な項目名・数値・回答内容を明記しながら**、
客観的で一貫性のある健康アドバイス、栄養指導、リスク評価を行ってください。
サプリメントは3-5個を推奨してください。
必ず有効なJSON形式で回答してください。
  `
  
  const userPrompt = `
以下のデータを分析して、総合的な健康アドバイスとサプリメント推奨を提供してください。

【検査データ】
${examSummary}

【問診結果（50問）】
${questionnaireSummary}

【利用可能なサプリメント一覧】
${supplementsList}

以下のJSON形式で回答してください：
{
  "overall_score": 70,
  "health_advice": "【重要】必ず以下のフォーマットで記載してください:

■検査データ分析
提供された検査データから、具体的な項目名と数値を明記してください
（例：HbA1c 5.5%、血糖値 95mg/dL など）。

■問診結果分析
提供された問診データから、具体的な回答内容を引用してください
（例：「睡眠時間：4-5時間」「ストレスレベル：中程度」など）。

■総合アドバイス
上記の検査データと問診結果を踏まえた、今後取り組むべき具体的な
アクションプランを提示してください（500文字以上）。",
  
  "nutrition_guidance": "具体的なデータを引用しながら栄養アドバイス（400文字以上）",
  "risk_assessment": "具体的なデータを引用しながらリスク評価（400文字以上）",
  "supplements": [
    {
      "product_code": "S001",
      "name": "サプリメント名",
      "dosage": "用量",
      "frequency": "1日1回",
      "reason": "推奨理由（150文字以上、検査データまたは問診結果を具体的に引用）"
    }
  ]
}
  `
  
  // 6. OpenAI API 呼び出し
  const openaiApiKey = c.env.OPENAI_API_KEY
  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 6000,
      response_format: { type: "json_object" }
    })
  })
  
  const aiData = await aiResponse.json()
  const aiResult = JSON.parse(aiData.choices[0].message.content)
  
  // 7. サプリメント推奨（3-5個、最大5個）
  const supplements = parseSupplementsFromJSON(
    aiResult.supplements || [], 
    supplementsMaster.results
  ).slice(0, 5)
  
  // 8. データベース保存
  const analysisResult = await c.env.DB.prepare(`
    INSERT INTO analysis_results 
    (user_id, overall_score, health_advice, nutrition_guidance, 
     risk_assessment, selected_exam_ids, data_completeness_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    user_id,
    aiResult.overall_score,
    aiResult.health_advice,
    aiResult.nutrition_guidance,
    aiResult.risk_assessment,
    JSON.stringify(selected_exam_ids),
    calculateDataCompletenessScore(examData.results, questionnaireData.results)
  ).run()
  
  const analysisId = analysisResult.meta.last_row_id
  
  // 9. サプリメント推奨保存
  for (const supplement of supplements) {
    await c.env.DB.prepare(`
      INSERT INTO supplement_recommendations 
      (analysis_result_id, supplement_name, supplement_type, 
       dosage, frequency, reason, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      analysisId,
      supplement.supplement_name,
      supplement.supplement_type,
      supplement.dosage,
      supplement.frequency,
      supplement.reason,
      supplement.priority
    ).run()
  }
  
  // 10. レスポンス返却
  return c.json({
    success: true,
    analysis: {
      overall_score: aiResult.overall_score,
      health_advice: aiResult.health_advice,
      nutrition_guidance: aiResult.nutrition_guidance,
      risk_assessment: aiResult.risk_assessment,
      supplements: supplements.map(s => ({
        name: s.supplement_name,
        type: s.supplement_type,
        dosage: s.dosage,
        frequency: s.frequency,
        reason: s.reason,
        priority: s.priority
      }))
    }
  })
})

// ヘルパー関数
function parseSupplementsFromJSON(aiSupplements, masterSupplements) {
  return aiSupplements.map(aiSup => {
    const master = masterSupplements.find(
      m => m.product_code === aiSup.product_code || 
           m.product_name.includes(aiSup.name)
    )
    return {
      supplement_name: master?.product_name || aiSup.name,
      supplement_type: master?.supplement_category || aiSup.type || 'その他',
      dosage: aiSup.dosage || '適量',
      frequency: aiSup.frequency || '1日1回',
      reason: aiSup.reason || '健康維持のため',
      priority: 1
    }
  })
}

function calculateDataCompletenessScore(examData, questionnaireData) {
  const examScore = Math.min((examData?.length || 0) * 20, 50)
  const questionnaireScore = Math.min((questionnaireData?.length || 0) * 1, 50)
  return examScore + questionnaireScore
}
```

---

## 📦 サプリメントマスターデータ

**初期データ投入 (seed.sql):**

```sql
INSERT INTO supplements_master 
(product_code, product_name, category, supplement_category, content_amount, recommended_for, description, price)
VALUES 
('S001', 'ビタミンミックス11種類', 'ビタミン', 'ビタミン', '30錠', '全般的な栄養サポート', 
 'ビタミンA、B群、C、D、Eなど11種類を配合', 1200),

('S002', 'クリルオイル', '脂肪酸', 'オメガ3', '250mg×60カプセル', '心血管健康・抗炎症', 
 'EPA・DHA豊富なオメガ3脂肪酸', 2800),

('S003', 'ビタミンD3+グルコン酸亜鉛+シクロデキストリン', 'ビタミン+ミネラル', 'ビタミン', 
 '60カプセル', '骨の健康・免疫機能', 'ビタミンD3 2000IU、亜鉛15mg配合', 1800),

('S004', 'マグネシウム', 'ミネラル', 'ミネラル', '400mg×90錠', '神経・筋肉機能', 
 '高吸収型マグネシウム', 1500),

('S005', 'プロバイオティクス', '乳酸菌', 'プロバイオティクス', '100億個×30カプセル', 
 '腸内環境改善', '5種類の乳酸菌株をブレンド', 2200);

-- ... 他のサプリメント
```

---

## 🚀 本番環境デプロイ

### 1. Cloudflare認証

```bash
# Cloudflare API Token設定
npx wrangler login

# または setup_cloudflare_api_key ツール使用
```

### 2. 本番D1データベース作成

```bash
# 本番環境のD1データベース作成
npx wrangler d1 create jibun-supple-production

# database_id を wrangler.jsonc に記載
```

### 3. 本番マイグレーション

```bash
# 本番環境にマイグレーション適用
npx wrangler d1 migrations apply jibun-supple-production
```

### 4. 環境変数設定

```bash
# Cloudflare Pages Secrets
npx wrangler pages secret put OPENAI_API_KEY --project-name jibun-supple
npx wrangler pages secret put GEMINI_API_KEY --project-name jibun-supple
```

### 5. デプロイ

```bash
# ビルド
npm run build

# Cloudflare Pagesにデプロイ
npx wrangler pages deploy dist --project-name jibun-supple
```

**デプロイ後のURL:**
```
Production: https://jibun-supple.pages.dev
Branch: https://main.jibun-supple.pages.dev
```

---

## 🧪 テスト・デバッグ

### ローカルテスト

```bash
# ユーザー登録
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "テストユーザー"
  }'

# 検査データ投入
curl -X POST http://localhost:3000/api/exam \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "exam_date": "2025-12-03",
    "exam_type": "blood_test",
    "data_source": "manual_input",
    "measurements": {
      "rbc": {"value": 450, "unit": "×10⁴/µL"},
      "hba1c": {"value": 5.5, "unit": "%"}
    }
  }'

# AI解析実行
curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "selected_exam_ids": [1],
    "use_questionnaire": true
  }'
```

### PM2管理

```bash
# プロセス一覧
pm2 list

# ログ確認
pm2 logs jibun-supple --nostream --lines 100

# 再起動
pm2 restart jibun-supple

# 停止
pm2 stop jibun-supple

# 削除
pm2 delete jibun-supple
```

---

## 📚 重要なポイント

### Cloudflare Workers制限

1. **Node.js APIs 使用不可**: `fs`, `path`, `crypto` など
2. **ファイルシステムアクセス不可**: 実行時にファイル読み書き不可
3. **静的ファイル**: `public/` に配置、`serveStatic` 使用（`hono/cloudflare-workers`）
4. **CPU時間制限**: Free 10ms、Paid 30ms
5. **サイズ制限**: 10MB (compressed)

### 認証パターン（すべてのページで統一）

```javascript
let currentUser = null;

async function checkAuth() {
  try {
    const response = await axios.get('/api/auth/me');
    if (response.data.success) {
      currentUser = response.data.user;
    } else {
      window.location.href = '/auth/login';
    }
  } catch (error) {
    window.location.href = '/auth/login';
  }
}

window.addEventListener('load', checkAuth);
```

### AIプロンプト設計のコツ

1. **具体性を要求**: 「必ず項目名と数値を明記」
2. **構造化**: セクション分け（■検査データ分析、■問診結果分析）
3. **JSON形式**: `response_format: { type: "json_object" }`
4. **エラーハンドリング**: JSON parse失敗時の対応
5. **temperature調整**: 0.3-0.7（一貫性と創造性のバランス）
6. **max_tokens増加**: 6000以上（詳細な回答用）

---

## 🎨 UI/UXガイドライン

### カラースキーム

```css
/* Primary Colors */
--blue: #2563EB;
--green: #16A34A;
--red: #DC2626;
--orange: #EA580C;
--purple: #9333EA;
--indigo: #4F46E5;
--pink: #DB2777;

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-600: #4B5563;
--gray-800: #1F2937;
```

### アイコン使用

- 健康問診: 📋 / `<i class="fas fa-clipboard-list"></i>`
- OCR: 📸 / `<i class="fas fa-camera"></i>`
- 血液検査: 🩸 / `<i class="fas fa-vial"></i>`
- AI解析: 🤖 / `<i class="fas fa-robot"></i>`
- グラフ: 📊 / `<i class="fas fa-chart-line"></i>`

### レスポンシブデザイン

```html
<!-- Grid レイアウト -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- カード -->
</div>

<!-- モバイル対応ナビゲーション -->
<nav class="hidden md:flex">...</nav>
<button class="md:hidden">☰</button>
```

---

## 📋 チェックリスト

### 実装前
- [ ] Cloudflare アカウント作成
- [ ] OpenAI API キー取得
- [ ] Gemini API キー取得
- [ ] Git リポジトリ準備

### セットアップ
- [ ] Hono プロジェクト作成
- [ ] D1 データベース作成
- [ ] マイグレーション実行
- [ ] 環境変数設定
- [ ] サプリマスターデータ投入

### 機能実装
- [ ] 認証システム（登録・ログイン・ログアウト）
- [ ] ダッシュボード
- [ ] 健康問診（50問）
- [ ] OCR画像読み取り
- [ ] 血液検査52項目入力
- [ ] AI解析エンジン
- [ ] AI解析履歴
- [ ] 検査履歴グラフ
- [ ] 管理者機能

### テスト
- [ ] ユーザー登録・ログイン
- [ ] 問診データ保存
- [ ] 検査データ保存
- [ ] AI解析実行
- [ ] サプリ推奨表示
- [ ] レスポンシブデザイン確認

### デプロイ
- [ ] ビルド成功確認
- [ ] 本番D1マイグレーション
- [ ] Cloudflare Pages デプロイ
- [ ] 環境変数設定（本番）
- [ ] 本番環境動作確認

---

## 🎓 学習リソース

### 公式ドキュメント
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 参考記事
- Honoで始めるCloudflare Workers開発
- D1データベースの使い方
- OpenAI APIを使ったAI解析の実装

---

## ✅ このプロンプトの使い方

1. **段階的実装**: 各セクションを順番に実装
2. **テスト駆動**: 各機能実装後、必ずテスト
3. **Git管理**: 定期的にコミット
4. **ドキュメント更新**: README.mdを常に最新に保つ
5. **エラーログ確認**: pm2 logs で問題を早期発見

---

**このプロンプトを使用して、じぶんサプリ育成アプリを完全に再構築できます！**
