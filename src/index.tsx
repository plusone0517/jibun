import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { questionnaireRoutes } from './routes-questionnaire'
import { analysisRoutes } from './routes-analysis'
import { authRoutes } from './routes-auth'
import { dashboardRoutes } from './routes-dashboard'
import { passwordResetRoutes } from './routes-password-reset'
import { historyRoutes } from './routes-history'
import { analysisHistoryRoutes } from './routes-analysis-history'
import { adminRoutes } from './routes-admin'
import { examOcrRoutes } from './routes-exam-ocr'
import bloodTestRoutes from './routes-blood-test'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
  GEMINI_API_KEY?: string
  OCR_IMAGES?: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// ======================
// Priority API Routes (defined before sub-routes to avoid conflicts)
// ======================

// /api/auth/me - Get current logged-in user with membership_type
app.get('/api/auth/me', async (c) => {
  const cookies = c.req.header('cookie') || ''
  const sessionToken = cookies.split(';').find(cookie => cookie.trim().startsWith('session_token='))?.split('=')[1]

  if (!sessionToken) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }

  const db = c.env.DB
  const session = await db.prepare(
    'SELECT * FROM sessions WHERE session_token = ? AND expires_at > ?'
  ).bind(sessionToken, new Date().toISOString()).first()

  if (!session) {
    return c.json({ success: false, error: 'セッションが無効です' }, 401)
  }

  const user: any = await db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(session.user_id).first()

  if (!user) {
    return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
  }

  // Return filtered user data with membership_type
  return c.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      birthdate: user.birthdate,
      membership_type: user.membership_type || 'free'
    }
  })
})

// Mount sub-routes for pages
app.route('/auth', authRoutes)
app.route('/password-reset', passwordResetRoutes)
app.route('/dashboard', dashboardRoutes)
app.route('/questionnaire', questionnaireRoutes)
app.route('/analysis', analysisRoutes)
app.route('/analysis-history', analysisHistoryRoutes)
app.route('/history', historyRoutes)
app.route('/admin', adminRoutes)
app.route('/exam/ocr', examOcrRoutes)
app.route('/exam/blood-test', bloodTestRoutes)

// Mount API routes
app.route('/api/auth', authRoutes)
app.route('/api', analysisRoutes)

// ======================
// HTML Pages Routes
// ======================

// Terms of Service page
app.get('/terms', (c) => {
  return c.html(`
    <!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>利用規約 - じぶんを知ることから</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">利用規約およびプライバシーポリシー</h1>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <p class="text-gray-700 mb-4">
                本規約およびプライバシーポリシーは、[一般社団法人最先端予防医療研究所]（以下「当社」といいます）が提供するアプリ『じぶんを知ることから』（以下「本サービス」といいます）の利用条件および個人情報の取扱いを定めるものです。
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">第1部：利用規約</h2>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第1条（コンセプトとサービスの目的）</h3>
            <p class="text-gray-700 mb-4">
                本サービスは「じぶんの今の状態を正しく知る」ことを起点とし、ユーザーが入力した体質、生活習慣、栄養状態等のデータ（以下「自己分析データ」といいます）を解析することで、個々のライフスタイルに最適化された栄養補給の提案（以下「パーソナライズ提案」といいます）を行うヘルスケア・プラットフォームです。
            </p>
            <p class="text-gray-700 mb-4">
                本サービスは、ユーザーのセルフケアを支援するものであり、健康の維持・増進を目的としています。
            </p>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第2条（医師法・薬機法に基づく重要事項）</h3>
            <p class="text-gray-700 mb-4">
                本サービスの利用にあたり、ユーザーは以下の法的制約を理解し、同意するものとします。
            </p>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>診断・治療の否定（医師法遵守）：</strong> 本サービスによる解析結果およびパーソナライズ提案は、医師による診断、治療、処方、または特定の疾患の予防を目的とした医療行為ではありません。ユーザーの健康状態に関する医学的な判断については、必ず医師等の専門家に相談してください。</li>
                <li><strong>食品としての定義（薬機法遵守）：</strong> 本サービスが提案するオーダーメイドサプリメントは、医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律（薬機法）上の「医薬品」ではなく、あくまで「食品」です。疾病の治癒や症状の劇的な改善を保証するものではありません。</li>
                <li><strong>医療情報の優先：</strong> 現在、医師の治療を受けている、あるいは医薬品を服用している場合は、サプリメントの摂取前に必ず主治医に相談してください。</li>
            </ul>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第3条（自己責任原則）</h3>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>ユーザーは、自身の責任において正確な自己分析データを入力するものとします。</li>
                <li>パーソナライズ提案に基づきサプリメントを購入・摂取するかどうかの最終的な判断は、ユーザー自身の自由な意思と責任において行うものとします。</li>
                <li>万一、摂取後に体調の異変を感じた場合は、直ちに摂取を中止し、医療機関を受診してください。</li>
            </ul>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第4条（禁止事項）</h3>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>虚偽の情報を入力し、不適切な解析結果を誘発する行為。</li>
                <li>本サービスを、第三者の診断や医療目的で転用する行為。</li>
                <li>当社、他のユーザー、または第三者の権利を侵害する行為。</li>
            </ul>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">第2部：個人情報の取扱い（プライバシーポリシー）</h2>
            <p class="text-gray-700 mb-4">
                当社は、ユーザーが「じぶんを知る」ために提供する大切な情報を、以下の指針に基づき厳重に管理します。
            </p>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第1条（収集する情報）</h3>
            <p class="text-gray-700 mb-4">本サービスでは、以下の情報を収集します。</p>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>基本情報：</strong> 氏名、メールアドレス、配送先住所、生年月日。</li>
                <li><strong>健康・ライフスタイル情報：</strong> 体重、身長、食事内容、睡眠時間、運動習慣、アレルギー情報、現在感じている体調の悩み等。</li>
                <li><strong>決済情報：</strong> クレジットカード決済に必要な情報（決済代行会社を通じて処理されます）。</li>
            </ul>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第2条（利用目的）</h3>
            <p class="text-gray-700 mb-4">収集した情報は、以下の目的でのみ利用します。</p>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>ユーザーの体質・栄養状態の解析およびオーダーメイドサプリメントの配合設計。</li>
                <li>商品の発送およびアフターサービス。</li>
                <li>ユーザーに適した健康情報の配信（オプトアウト可能）。</li>
                <li>統計データ（個人を特定できない形式）としての、サービス品質向上や新成分の研究開発。</li>
            </ul>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第3条（機微情報の管理）</h3>
            <p class="text-gray-700 mb-4">
                健康状態や体質に関する情報は、プライバシー保護の観点から特に機微な情報として扱い、以下の対策を講じます。
            </p>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>アクセス制限：</strong> 解析業務に従事する最小限のスタッフのみが閲覧できるようアクセス権限を制限します。</li>
                <li><strong>暗号化：</strong> 通信およびデータベース保存時において、高度な暗号化技術を使用します。</li>
            </ul>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第4条（第三者提供の制限）</h3>
            <p class="text-gray-700 mb-4">
                当社は、次の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
            </p>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>法令に基づく場合。</li>
                <li>商品の製造・発送等、業務委託先に必要な範囲で提供する場合（この場合、委託先と機密保持契約を締結し、厳格な監督を行います）。</li>
            </ul>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第5条（開示・訂正・削除）</h3>
            <p class="text-gray-700 mb-4">
                ユーザーは、アプリ内の設定画面、またはお問い合わせ窓口を通じて、自身の個人情報の開示、訂正、および利用停止（アカウント削除）をいつでも請求することができます。
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">第3部：その他</h2>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第1条（規約の変更）</h3>
            <p class="text-gray-700 mb-4">
                当社は、法改正やサービス内容の変更に伴い、本規約を改定することがあります。重要な変更がある場合は、アプリ内通知またはメールにて告知します。
            </p>

            <h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">第2条（準拠法・管轄裁判所）</h3>
            <p class="text-gray-700 mb-4">
                本規約は日本法に基づき解釈されます。本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>

            <p class="text-gray-700 text-right mt-8">以上</p>
        </div>

        <div class="text-center space-x-4">
            <button onclick="window.history.back()" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                <i class="fas fa-arrow-left mr-2"></i>戻る
            </button>
            <button onclick="window.close()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                <i class="fas fa-times mr-2"></i>閉じる
            </button>
        </div>
    </div>
</body>
</html>
  `)
})

// Home page - redirect to dashboard or login
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center">
        <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-gray-600">読み込み中...</p>
        </div>
        <script>
            async function checkAuth() {
                try {
                    const response = await axios.get('/api/auth/me');
                    if (response.data.success) {
                        window.location.href = '/dashboard';
                    } else {
                        window.location.href = '/auth/login';
                    }
                } catch (error) {
                    window.location.href = '/auth/login';
                }
            }
            checkAuth();
        </script>
    </body>
    </html>
  `)
})

// Landing page (for non-authenticated users)
app.get('/welcome', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-blue-600">
                            <i class="fas fa-lightbulb mr-2"></i>
                            じぶんを知ることから
                        </h1>
                        <span class="ml-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">β版</span>
                    </div>
                    <div class="flex space-x-4">
                        <a href="/auth/login" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-sign-in-alt mr-1"></i>ログイン
                        </a>
                        <a href="/auth/register" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            新規登録
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="text-center mb-12">
                <h2 class="text-4xl font-bold text-gray-800 mb-4">あなた専用の健康サポート</h2>
                <p class="text-lg text-gray-600">検査データをAI解析して、最適な栄養指導とサプリメントを提案します</p>
                <div class="mt-8">
                    <a href="/auth/register" class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-bold">
                        <i class="fas fa-user-plus mr-2"></i>今すぐ始める
                    </a>
                </div>
            </div>

            <div class="grid md:grid-cols-3 gap-6 mb-12">
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🩺</div>
                        <h3 class="text-xl font-bold mb-3">検査データ入力</h3>
                        <p class="text-gray-600 mb-4">血圧、体組成、血液検査など様々な健康データを記録</p>
                        <a href="/exam" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            データ入力
                        </a>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🎤</div>
                        <h3 class="text-xl font-bold mb-3">健康ヒアリング</h3>
                        <p class="text-gray-600 mb-4">45問の詳細なヒアリングで生活習慣を分析<br><span class="text-sm text-green-600">途中保存・再開可能</span></p>
                        <a href="/questionnaire" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                            ヒアリング開始
                        </a>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🎯</div>
                        <h3 class="text-xl font-bold mb-3">AI解析結果</h3>
                        <p class="text-gray-600 mb-4">あなた専用の健康アドバイスとサプリ提案</p>
                        <a href="/analysis" class="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                            結果を見る
                        </a>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-8">
                <h3 class="text-2xl font-bold mb-6 text-center">このアプリでできること</h3>
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                        <div>
                            <h4 class="font-bold mb-1">多様な検査データ対応</h4>
                            <p class="text-gray-600 text-sm">血圧、体組成、血液検査など、カスタマイズ可能な検査項目</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                        <div>
                            <h4 class="font-bold mb-1">AI による健康分析</h4>
                            <p class="text-gray-600 text-sm">最新のAI技術で検査データと問診結果を総合的に解析</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                        <div>
                            <h4 class="font-bold mb-1">レーダーチャート可視化</h4>
                            <p class="text-gray-600 text-sm">健康状態を直感的に理解できるビジュアル表示</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                        <div>
                            <h4 class="font-bold mb-1">健康レポート自動生成</h4>
                            <p class="text-gray-600 text-sm">医療機関監修の処方オーダーシートをPDFで出力</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="bg-gray-800 text-white mt-16 py-8">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-sm">© 2024 じぶんを知ることから - 医療機関監修</p>
                <p class="text-xs text-gray-400 mt-2">本アプリの情報は医学的アドバイスの代わりにはなりません。必ず医師にご相談ください。</p>
            </div>
        </footer>
    </body>
    </html>
  `)
})

// Exam data input page
app.get('/exam', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>検査データ入力 - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg mb-8">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-blue-600">
                            <a href="/" class="hover:text-blue-700">
                                <i class="fas fa-lightbulb mr-2"></i>
                                じぶんを知ることから
                            </a>
                        </h1>
                        <span class="ml-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">β版</span>
                    </div>
                    <a href="/" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-home mr-1"></i>ホーム
                    </a>
                </div>
            </div>
        </nav>

        <main class="max-w-4xl mx-auto px-4 pb-12">
            <h2 class="text-3xl font-bold text-gray-800 mb-8">
                <i class="fas fa-keyboard mr-2"></i>
                検査データ入力（手動）
            </h2>

            <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">検査日</label>
                    <input type="date" id="examDate" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">検査タイプ</label>
                    <select id="examType" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="blood_pressure">血圧測定</option>
                        <option value="body_composition">体組成計</option>
                        <option value="blood_test">血液検査</option>
                        <option value="custom">カスタム検査</option>
                    </select>
                </div>

                <!-- Blood Pressure Form -->
                <div id="bloodPressureForm" class="exam-form">
                    <h3 class="text-xl font-bold mb-4 text-blue-600">血圧測定データ</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">収縮期血圧 (mmHg)</label>
                            <input type="number" id="systolic_bp" class="w-full px-4 py-2 border rounded-lg" placeholder="120">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">拡張期血圧 (mmHg)</label>
                            <input type="number" id="diastolic_bp" class="w-full px-4 py-2 border rounded-lg" placeholder="80">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">脈拍 (bpm)</label>
                            <input type="number" id="pulse" class="w-full px-4 py-2 border rounded-lg" placeholder="70">
                        </div>
                    </div>
                </div>

                <!-- Body Composition Form -->
                <div id="bodyCompositionForm" class="exam-form hidden">
                    <h3 class="text-xl font-bold mb-4 text-green-600">体組成計データ</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">体重 (kg)</label>
                            <input type="number" step="0.1" id="weight" class="w-full px-4 py-2 border rounded-lg" placeholder="65.5">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">体脂肪率 (%)</label>
                            <input type="number" step="0.1" id="body_fat" class="w-full px-4 py-2 border rounded-lg" placeholder="20.5">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">筋肉量 (kg)</label>
                            <input type="number" step="0.1" id="muscle_mass" class="w-full px-4 py-2 border rounded-lg" placeholder="50.0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">BMI</label>
                            <input type="number" step="0.1" id="bmi" class="w-full px-4 py-2 border rounded-lg" placeholder="22.0">
                        </div>
                    </div>
                </div>

                <!-- Blood Test Form -->
                <div id="bloodTestForm" class="exam-form hidden">
                    <h3 class="text-xl font-bold mb-4 text-purple-600">血液検査データ</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">血糖値 (mg/dL)</label>
                            <input type="number" id="blood_sugar" class="w-full px-4 py-2 border rounded-lg" placeholder="100">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">HbA1c (%)</label>
                            <input type="number" step="0.1" id="hba1c" class="w-full px-4 py-2 border rounded-lg" placeholder="5.5">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">総コレステロール (mg/dL)</label>
                            <input type="number" id="total_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="200">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">LDLコレステロール (mg/dL)</label>
                            <input type="number" id="ldl_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="120">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">HDLコレステロール (mg/dL)</label>
                            <input type="number" id="hdl_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="60">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">中性脂肪 (mg/dL)</label>
                            <input type="number" id="triglycerides" class="w-full px-4 py-2 border rounded-lg" placeholder="150">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">AST (U/L)</label>
                            <input type="number" id="ast" class="w-full px-4 py-2 border rounded-lg" placeholder="25">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ALT (U/L)</label>
                            <input type="number" id="alt" class="w-full px-4 py-2 border rounded-lg" placeholder="25">
                        </div>
                    </div>
                </div>

                <!-- Custom Form -->
                <div id="customForm" class="exam-form hidden">
                    <h3 class="text-xl font-bold mb-4 text-orange-600">カスタム検査データ</h3>
                    <div id="customFields" class="space-y-4">
                        <!-- Dynamic custom fields will be added here -->
                    </div>
                    <button onclick="addCustomField()" class="mt-4 btn-3d bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                        <i class="fas fa-plus mr-2"></i>検査項目を追加
                    </button>
                </div>

                <div class="mt-8 flex gap-4">
                    <button onclick="saveExamData()" class="flex-1 btn-3d bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                        <i class="fas fa-save mr-2"></i>保存する
                    </button>
                    <a href="/" class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition text-center font-bold">
                        キャンセル
                    </a>
                </div>
            </div>

            <div id="successMessage" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong class="font-bold">成功！</strong>
                <span class="block sm:inline">検査データが保存されました。</span>
            </div>

            <div id="errorMessage" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong class="font-bold">エラー！</strong>
                <span class="block sm:inline" id="errorText"></span>
            </div>

            <!-- Exam History Section -->
            <div class="bg-white rounded-lg shadow-lg p-6 mt-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-history mr-2"></i>検査履歴
                </h3>
                <div id="examHistoryList" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">読み込み中...</p>
                </div>
            </div>
        </main>

        <script>
            // Set today's date as default
            document.getElementById('examDate').valueAsDate = new Date();

            // Store all exams globally
            let allExams = [];

            // Handle exam type change
            document.getElementById('examType').addEventListener('change', function() {
                const forms = document.querySelectorAll('.exam-form');
                forms.forEach(form => form.classList.add('hidden'));

                const selectedType = this.value;
                const formMap = {
                    'blood_pressure': 'bloodPressureForm',
                    'body_composition': 'bodyCompositionForm',
                    'blood_test': 'bloodTestForm',
                    'custom': 'customForm'
                };

                if (formMap[selectedType]) {
                    document.getElementById(formMap[selectedType]).classList.remove('hidden');
                }

                // Update history when type changes
                if (allExams.length > 0) {
                    displayExamHistory(allExams);
                }
            });

            let customFieldCount = 0;
            let customItemSuggestions = [];

            async function loadCustomItemSuggestions() {
                try {
                    const userResponse = await axios.get('/api/auth/me');
                    if (userResponse.data.success) {
                        const userId = userResponse.data.user.id;
                        const response = await axios.get(\`/api/custom-items/\${userId}\`);
                        if (response.data.success) {
                            customItemSuggestions = response.data.items;
                        }
                    }
                } catch (error) {
                    console.error('Error loading custom item suggestions:', error);
                }
            }

            function addCustomField() {
                customFieldCount++;
                const suggestionsDatalist = customItemSuggestions.map(item => 
                    \`<option value="\${item.measurement_key}" data-unit="\${item.measurement_unit}">\`
                ).join('');
                
                const fieldHTML = \`
                    <div class="grid md:grid-cols-3 gap-2 items-end" id="customField\${customFieldCount}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">項目名</label>
                            <input type="text" list="customItemsList" class="w-full px-4 py-2 border rounded-lg custom-key" placeholder="例: ビタミンD" 
                                   onchange="autofillUnit(this, \${customFieldCount})">
                            <datalist id="customItemsList">
                                \${suggestionsDatalist}
                            </datalist>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">測定値</label>
                            <input type="text" class="w-full px-4 py-2 border rounded-lg custom-value" placeholder="例: 25">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">単位</label>
                            <input type="text" class="w-full px-4 py-2 border rounded-lg custom-unit" id="unit\${customFieldCount}" placeholder="例: ng/mL">
                        </div>
                        <button onclick="removeCustomField(\${customFieldCount})" class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                \`;
                document.getElementById('customFields').insertAdjacentHTML('beforeend', fieldHTML);
            }

            function autofillUnit(input, fieldId) {
                const selectedKey = input.value;
                const item = customItemSuggestions.find(i => i.measurement_key === selectedKey);
                if (item) {
                    document.getElementById('unit' + fieldId).value = item.measurement_unit;
                }
            }

            function removeCustomField(id) {
                document.getElementById('customField' + id).remove();
            }

            async function saveExamData() {
                try {
                    // Get current user
                    const userResponse = await axios.get('/api/auth/me');
                    if (!userResponse.data.success) {
                        showError('ログインが必要です');
                        setTimeout(() => window.location.href = '/auth/login', 1500);
                        return;
                    }
                    const currentUserId = userResponse.data.user.id;

                    const examDate = document.getElementById('examDate').value;
                    const examType = document.getElementById('examType').value;

                    if (!examDate) {
                        showError('検査日を入力してください');
                        return;
                    }

                    const measurements = [];

                    // Collect measurements based on exam type
                    if (examType === 'blood_pressure') {
                        const systolic = document.getElementById('systolic_bp').value;
                        const diastolic = document.getElementById('diastolic_bp').value;
                        const pulse = document.getElementById('pulse').value;

                        if (systolic) measurements.push({ key: 'systolic_bp', value: systolic, unit: 'mmHg' });
                        if (diastolic) measurements.push({ key: 'diastolic_bp', value: diastolic, unit: 'mmHg' });
                        if (pulse) measurements.push({ key: 'pulse', value: pulse, unit: 'bpm' });
                    } else if (examType === 'body_composition') {
                        const weight = document.getElementById('weight').value;
                        const bodyFat = document.getElementById('body_fat').value;
                        const muscleMass = document.getElementById('muscle_mass').value;
                        const bmi = document.getElementById('bmi').value;

                        if (weight) measurements.push({ key: 'weight', value: weight, unit: 'kg' });
                        if (bodyFat) measurements.push({ key: 'body_fat', value: bodyFat, unit: '%' });
                        if (muscleMass) measurements.push({ key: 'muscle_mass', value: muscleMass, unit: 'kg' });
                        if (bmi) measurements.push({ key: 'bmi', value: bmi, unit: '' });
                    } else if (examType === 'blood_test') {
                        const fields = ['blood_sugar', 'hba1c', 'total_cholesterol', 'ldl_cholesterol', 
                                       'hdl_cholesterol', 'triglycerides', 'ast', 'alt'];
                        const units = {
                            'blood_sugar': 'mg/dL', 'hba1c': '%', 'total_cholesterol': 'mg/dL',
                            'ldl_cholesterol': 'mg/dL', 'hdl_cholesterol': 'mg/dL', 
                            'triglycerides': 'mg/dL', 'ast': 'U/L', 'alt': 'U/L'
                        };

                        fields.forEach(field => {
                            const value = document.getElementById(field).value;
                            if (value) measurements.push({ key: field, value: value, unit: units[field] });
                        });
                    } else if (examType === 'custom') {
                        const keys = document.querySelectorAll('.custom-key');
                        const values = document.querySelectorAll('.custom-value');
                        const units = document.querySelectorAll('.custom-unit');

                        keys.forEach((keyInput, index) => {
                            if (keyInput.value && values[index].value) {
                                measurements.push({
                                    key: keyInput.value,
                                    value: values[index].value,
                                    unit: units[index].value || ''
                                });
                            }
                        });
                    }

                    if (measurements.length === 0) {
                        showError('少なくとも1つの測定値を入力してください');
                        return;
                    }

                    // Check if editing or creating new
                    let response;
                    if (window.currentExamId) {
                        // Update existing exam
                        response = await axios.put(\`/api/exam/\${window.currentExamId}\`, {
                            exam_date: examDate,
                            exam_type: examType,
                            measurements: measurements
                        });
                        window.currentExamId = null;
                        document.querySelector('button[onclick="saveExamData()"]').innerHTML = '<i class="fas fa-save mr-2"></i>保存する';
                    } else {
                        // Create new exam (always manual for this page)
                        response = await axios.post('/api/exam', {
                            user_id: currentUserId,
                            exam_date: examDate,
                            exam_type: examType,
                            measurements: measurements,
                            data_source: 'manual'
                        });
                    }

                    if (response.data.success) {
                        showSuccess();
                        // Reload history after save
                        loadExamHistory();
                        // Reset form
                        document.getElementById('examDate').valueAsDate = new Date();
                        clearFormInputs();
                    } else {
                        showError(response.data.error || '保存に失敗しました');
                    }
                } catch (error) {
                    console.error('Error saving exam data:', error);
                    showError('保存中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            }

            function showSuccess() {
                document.getElementById('successMessage').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('successMessage').classList.add('hidden');
                }, 3000);
            }

            function showError(message) {
                document.getElementById('errorText').textContent = message;
                document.getElementById('errorMessage').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('errorMessage').classList.add('hidden');
                }, 5000);
            }

            function clearFormInputs() {
                // Clear all input fields
                document.querySelectorAll('input[type="number"]').forEach(input => {
                    input.value = '';
                });
                // Reset custom fields
                document.getElementById('customFields').innerHTML = '';
                customFieldCount = 0;
                addCustomField();
                // Reset edit mode
                window.currentExamId = null;
                document.querySelector('button[onclick="saveExamData()"]').innerHTML = '<i class="fas fa-save mr-2"></i>保存する';
            }

            // Load exam history
            async function loadExamHistory() {
                try {
                    const userResponse = await axios.get('/api/auth/me');
                    if (!userResponse.data.success) {
                        document.getElementById('examHistoryList').innerHTML = '<p class="text-gray-500 text-center py-4">ログインしてください</p>';
                        return;
                    }
                    const userId = userResponse.data.user.id;

                    const response = await axios.get(\`/api/history/\${userId}?start_date=2022-01-01\`);
                    if (response.data.success && response.data.exams.length > 0) {
                        allExams = response.data.exams; // Store globally
                        displayExamHistory(allExams);
                    } else {
                        allExams = [];
                        document.getElementById('examHistoryList').innerHTML = '<p class="text-gray-500 text-center py-4">まだ検査データがありません</p>';
                    }
                } catch (error) {
                    console.error('Error loading exam history:', error);
                    allExams = [];
                    document.getElementById('examHistoryList').innerHTML = '<p class="text-red-500 text-center py-4">履歴の読み込みに失敗しました</p>';
                }
            }

            function displayExamHistory(exams) {
                const container = document.getElementById('examHistoryList');
                const currentType = document.getElementById('examType').value;
                const typeNames = {
                    'blood_pressure': '血圧測定',
                    'body_composition': '体組成',
                    'blood_test': '血液検査',
                    'custom': 'カスタム検査'
                };

                // Filter exams by current type
                const filteredExams = exams.filter(exam => exam.exam_type === currentType);

                if (filteredExams.length === 0) {
                    container.innerHTML = \`
                        <p class="text-gray-500 text-center py-4">
                            \${typeNames[currentType]}の履歴がまだありません
                        </p>
                    \`;
                    return;
                }

                // Separate OCR and manual data
                const ocrExams = filteredExams.filter(exam => exam.data_source === 'ocr');
                const manualExams = filteredExams.filter(exam => exam.data_source !== 'ocr');

                let html = '';

                // Display OCR data section
                if (ocrExams.length > 0) {
                    html += \`
                        <div class="mb-6">
                            <h3 class="text-lg font-bold text-purple-700 mb-3 flex items-center">
                                <i class="fas fa-camera mr-2"></i>
                                📸 OCRで読み取ったデータ (\${ocrExams.length}件)
                            </h3>
                            <div class="space-y-3">
                                \${ocrExams.slice(0, 10).map(exam => \`
                                    <div class="border-2 border-purple-200 rounded-lg p-4 hover:bg-purple-50 transition bg-gradient-to-r from-purple-50 to-pink-50">
                                        <div class="flex justify-between items-start">
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-3 mb-2">
                                                    <span class="font-bold text-lg text-gray-800">\${exam.exam_date}</span>
                                                    <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                                                        <i class="fas fa-camera mr-1"></i>画像読み取り
                                                    </span>
                                                </div>
                                                <div class="text-sm text-gray-600 space-y-1">
                                                    \${exam.measurements.map(m => \`
                                                        <div class="flex justify-between">
                                                            <span>\${formatMeasurementKey(m.measurement_key)}:</span>
                                                            <span class="font-semibold">\${m.measurement_value} \${m.measurement_unit}</span>
                                                        </div>
                                                    \`).join('')}
                                                </div>
                                            </div>
                                            <div class="flex space-x-2 ml-4">
                                                <button onclick="editExam(\${exam.id})" class="text-purple-600 hover:text-purple-800 px-3 py-1 rounded border border-purple-600 hover:bg-purple-100">
                                                    <i class="fas fa-edit mr-1"></i>編集
                                                </button>
                                                <button onclick="deleteExam(\${exam.id})" class="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50">
                                                    <i class="fas fa-trash mr-1"></i>削除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                }

                // Display manual data section
                if (manualExams.length > 0) {
                    html += \`
                        <div class="mb-6">
                            <h3 class="text-lg font-bold text-blue-700 mb-3 flex items-center">
                                <i class="fas fa-keyboard mr-2"></i>
                                ✍️ 手入力データ (\${manualExams.length}件)
                            </h3>
                            <div class="space-y-3">
                                \${manualExams.slice(0, 10).map(exam => \`
                                    <div class="border rounded-lg p-4 hover:bg-gray-50 transition">
                                        <div class="flex justify-between items-start">
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-3 mb-2">
                                                    <span class="font-bold text-lg text-gray-800">\${exam.exam_date}</span>
                                                    <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                                                        <i class="fas fa-pen mr-1"></i>手入力
                                                    </span>
                                                </div>
                                                <div class="text-sm text-gray-600 space-y-1">
                                                    \${exam.measurements.map(m => \`
                                                        <div class="flex justify-between">
                                                            <span>\${formatMeasurementKey(m.measurement_key)}:</span>
                                                            <span class="font-semibold">\${m.measurement_value} \${m.measurement_unit}</span>
                                                        </div>
                                                    \`).join('')}
                                                </div>
                                            </div>
                                            <div class="flex space-x-2 ml-4">
                                                <button onclick="editExam(\${exam.id})" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50">
                                                    <i class="fas fa-edit mr-1"></i>編集
                                                </button>
                                                <button onclick="deleteExam(\${exam.id})" class="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50">
                                                    <i class="fas fa-trash mr-1"></i>削除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                }

                container.innerHTML = html;

                if (filteredExams.length > 10) {
                    container.innerHTML += \`
                        <div class="text-center mt-4">
                            <a href="/history" class="text-blue-600 hover:text-blue-700 font-bold">
                                すべての履歴を見る（\${filteredExams.length}件）
                            </a>
                        </div>
                    \`;
                }
            }

            function formatMeasurementKey(key) {
                const keyMap = {
                    'systolic_bp': '収縮期血圧',
                    'diastolic_bp': '拡張期血圧',
                    'pulse': '脈拍',
                    'weight': '体重',
                    'body_fat': '体脂肪率',
                    'muscle_mass': '筋肉量',
                    'bmi': 'BMI',
                    'blood_sugar': '血糖値',
                    'hba1c': 'HbA1c',
                    'total_cholesterol': '総コレステロール',
                    'ldl_cholesterol': 'LDLコレステロール',
                    'hdl_cholesterol': 'HDLコレステロール',
                    'triglycerides': '中性脂肪',
                    'ast': 'AST',
                    'alt': 'ALT'
                };
                return keyMap[key] || key;
            }

            async function editExam(examId) {
                try {
                    const response = await axios.get(\`/api/history/detail/\${examId}\`);
                    if (!response.data.success) {
                        alert('データの読み込みに失敗しました');
                        return;
                    }

                    const exam = response.data.exam;
                    
                    // Set exam date and type
                    document.getElementById('examDate').value = exam.exam_date;
                    document.getElementById('examType').value = exam.exam_type;
                    
                    // Trigger exam type change to show correct form
                    document.getElementById('examType').dispatchEvent(new Event('change'));
                    
                    // Fill in measurements
                    exam.measurements.forEach(m => {
                        const input = document.getElementById(m.measurement_key);
                        if (input) {
                            input.value = m.measurement_value;
                        }
                    });

                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    
                    // Store exam ID for update
                    window.currentExamId = examId;
                    document.querySelector('button[onclick="saveExamData()"]').innerHTML = '<i class="fas fa-save mr-2"></i>更新する';
                } catch (error) {
                    console.error('Error loading exam for edit:', error);
                    alert('データの読み込みに失敗しました');
                }
            }

            async function deleteExam(examId) {
                if (!confirm('この検査データを削除してもよろしいですか？\\nこの操作は取り消せません。')) {
                    return;
                }

                try {
                    const response = await axios.delete(\`/api/exam/\${examId}\`);
                    if (response.data.success) {
                        alert('検査データを削除しました');
                        loadExamHistory();
                    } else {
                        alert('削除に失敗しました: ' + response.data.error);
                    }
                } catch (error) {
                    console.error('Error deleting exam:', error);
                    alert('削除中にエラーが発生しました');
                }
            }

            // Load history and custom item suggestions on page load
            loadExamHistory();
            loadCustomItemSuggestions().then(() => {
                // Add initial custom field after suggestions are loaded
                addCustomField();
            });
        </script>
    </body>
    </html>
  `)
})

// ======================
// API Routes
// ======================

// Upload image to R2
app.post('/api/upload-ocr-image', async (c) => {
  try {
    // Check if R2 is available
    if (!c.env.OCR_IMAGES) {
      return c.json({ 
        success: false, 
        error: 'R2ストレージが有効化されていません。Cloudflareダッシュボードで有効化してください。' 
      }, 503)
    }

    const formData = await c.req.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return c.json({ success: false, error: '画像ファイルが必要です' }, 400)
    }

    const bucket = c.env.OCR_IMAGES
    const fileName = `ocr-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer()
    await bucket.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/jpeg'
      }
    })

    // Return R2 URL (public URL will be configured separately)
    const imageUrl = `/api/ocr-image/${fileName}`
    
    return c.json({ 
      success: true, 
      image_url: imageUrl,
      file_name: fileName
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get OCR image from R2
app.get('/api/ocr-image/:fileName', async (c) => {
  try {
    // Check if R2 is available
    if (!c.env.OCR_IMAGES) {
      return c.json({ 
        success: false, 
        error: 'R2ストレージが有効化されていません' 
      }, 503)
    }

    const fileName = c.req.param('fileName')
    const bucket = c.env.OCR_IMAGES
    
    const object = await bucket.get(fileName)
    
    if (!object) {
      return c.notFound()
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('Error fetching image:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Save exam data
app.post('/api/exam', async (c) => {
  try {
    const { user_id, exam_date, exam_type, measurements, data_source, ocr_raw_text, ocr_image_url } = await c.req.json()

    if (!user_id || !exam_date || !exam_type || !measurements) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const db = c.env.DB
    
    // Set data_source to 'manual_input' if not provided
    const source = data_source || 'manual_input'

    // Insert exam_data record with data_source, ocr_raw_text, and ocr_image_url
    const examResult = await db.prepare(
      'INSERT INTO exam_data (user_id, exam_date, exam_type, data_source, ocr_raw_text, ocr_image_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user_id, exam_date, exam_type, source, ocr_raw_text || null, ocr_image_url || null).run()

    const examDataId = examResult.meta.last_row_id

    // Convert measurements to array format if it's an object
    let measurementsArray = []
    if (Array.isArray(measurements)) {
      // Already array format: [{ key: 'rbc', value: 450, unit: '×10⁴/µL' }, ...]
      measurementsArray = measurements
    } else if (typeof measurements === 'object') {
      // Object format: { rbc: { value: 450, unit: '×10⁴/µL' }, ... }
      measurementsArray = Object.entries(measurements).map(([key, data]) => ({
        key: key,
        value: data.value,
        unit: data.unit || ''
      }))
    }

    if (measurementsArray.length === 0) {
      return c.json({ success: false, error: '測定値が空です' }, 400)
    }

    // Insert measurements
    for (const measurement of measurementsArray) {
      await db.prepare(
        'INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) VALUES (?, ?, ?, ?)'
      ).bind(examDataId, measurement.key, measurement.value.toString(), measurement.unit || '').run()
    }

    return c.json({ 
      success: true, 
      exam_data_id: examDataId,
      message: '検査データが保存されました'
    })
  } catch (error) {
    console.error('Error saving exam data:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get all exam data for user
app.get('/api/exam/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const { results } = await db.prepare(
      'SELECT * FROM exam_data WHERE user_id = ? ORDER BY exam_date DESC'
    ).bind(userId).all()

    return c.json({ success: true, exams: results })
  } catch (error) {
    console.error('Error fetching exam data:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get custom exam items for user
app.get('/api/custom-items/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const { results } = await db.prepare(`
      SELECT DISTINCT em.measurement_key, em.measurement_unit
      FROM exam_measurements em
      JOIN exam_data ed ON em.exam_data_id = ed.id
      WHERE ed.user_id = ? AND ed.exam_type = 'custom'
      ORDER BY em.measurement_key
    `).bind(userId).all()

    return c.json({ success: true, items: results })
  } catch (error) {
    console.error('Error fetching custom items:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Analyze exam image with OCR (Gemini 2.0 Flash Vision)
app.post('/api/analyze-exam-image', async (c) => {
  try {
    const geminiApiKey = c.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return c.json({ success: false, error: 'Gemini APIキーが設定されていません' }, 500)
    }

    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return c.json({ success: false, error: 'ファイルが必要です' }, 400)
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (imageFile.size > maxSize) {
      return c.json({ 
        success: false, 
        error: 'ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。' 
      }, 400)
    }

    // Convert file to base64 (handle large files without stack overflow)
    const arrayBuffer = await imageFile.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    // Convert to base64 in chunks to avoid stack overflow
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    const base64Image = btoa(binary)
    const mimeType = imageFile.type || 'image/jpeg'

    // Call Gemini 2.0 Flash Vision API (supports both images and PDFs)
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `あなたは医療検査結果を読み取る専門AIです。この画像またはPDFから検査データを正確に抽出してください。

【重要な指示】
1. すべての検査項目と数値を抽出してください
2. 日本語の検査名も英語キーに変換してください
3. 基準値範囲があれば抽出してください
4. 検査日を必ず確認してください
5. 表形式のデータも見逃さないでください

【対応する検査タイプ】
- 血圧測定（blood_pressure）: 収縮期血圧、拡張期血圧、脈拍
- 体組成（body_composition）: 体重、体脂肪率、筋肉量、BMI、内臓脂肪
- 血液検査（blood_test）: 下記の全項目
- 自律神経測定（autonomic_nervous）: 交感神経、副交感神経活動
- その他（custom）: 上記以外の検査

【血液検査項目（可能な限りすべて抽出）】
糖代謝: 空腹時血糖(FBS), HbA1c, インスリン(IRI), グルコース
脂質: 総コレステロール(TC), LDLコレステロール, HDLコレステロール, 中性脂肪(TG), non-HDL
肝機能: AST(GOT), ALT(GPT), γ-GTP, ALP, LDH, ビリルビン, アルブミン
腎機能: クレアチニン(Cr), 尿素窒素(BUN), 尿酸(UA), eGFR
電解質: ナトリウム(Na), カリウム(K), クロール(Cl), カルシウム(Ca), マグネシウム(Mg)
血球: 白血球(WBC), 赤血球(RBC), ヘモグロビン(Hb), ヘマトクリット(Ht), 血小板(PLT)
炎症: CRP, 血沈(ESR)
甲状腺: TSH, FT3, FT4
その他: フェリチン, 葉酸, ビタミンB12, ビタミンD

【出力JSON形式】
{
  "exam_date": "YYYY-MM-DD形式の検査日（画像から抽出、不明なら今日）",
  "exam_type": "blood_pressure | body_composition | blood_test | autonomic_nervous | custom",
  "measurements": [
    {
      "key": "検査項目の英語キー（例: systolic_bp, fbs, hba1c）",
      "value": "数値のみ（例: 135）",
      "unit": "単位（例: mmHg, mg/dL, %）",
      "normal_range_min": 基準値下限（あれば数値、なければnull）,
      "normal_range_max": 基準値上限（あれば数値、なければnull）
    }
  ]
}

【日本語検査名の変換例】
- 収縮期血圧 → systolic_bp
- 拡張期血圧 → diastolic_bp
- 空腹時血糖 → fbs
- HbA1c → hba1c
- 総コレステロール → total_cholesterol
- 中性脂肪 → triglycerides
- AST(GOT) → ast
- ALT(GPT) → alt
- γ-GTP → ggt
- クレアチニン → creatinine
- 尿酸 → uric_acid
- 白血球 → wbc
- 赤血球 → rbc
- ヘモグロビン → hemoglobin

【注意事項】
- 数値のみを抽出し、単位は必ず分けてください
- 基準値範囲（例: 3.5-5.5）があれば、min/maxに分けて格納
- 表の中の全データを見逃さないでください
- 複数ページある場合は全ページから抽出してください
- JSONのみを返してください（マークダウン記法不要）`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      console.error('Gemini API error:', errorData)
      return c.json({ 
        success: false, 
        error: `AI解析に失敗しました: ${errorData.error?.message || 'Unknown error'}`
      }, 500)
    }

    const aiData = await aiResponse.json()
    
    // Extract text from all parts (Gemini 2.5 may have multiple parts including thinking)
    const parts = aiData.candidates?.[0]?.content?.parts || []
    let resultText = ''
    
    // Concatenate all text parts
    for (const part of parts) {
      if (part.text) {
        resultText += part.text
      }
    }
    
    if (!resultText) {
      console.error('No text in Gemini response:', aiData)
      return c.json({ 
        success: false, 
        error: 'AI応答が空です。ファイルの内容を確認してください。'
      }, 500)
    }
    
    // Parse JSON from response
    let result
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = resultText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/) || 
                       resultText.match(/\`\`\`\n([\s\S]*?)\n\`\`\`/) ||
                       [null, resultText]
      result = JSON.parse(jsonMatch[1] || resultText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', resultText)
      return c.json({ 
        success: false, 
        error: '解析結果の形式が不正です。ファイルの内容を確認してください。'
      }, 500)
    }

    // Add raw OCR text to result for storage
    result.ocr_raw_text = resultText
    
    return c.json({ success: true, result })
  } catch (error) {
    console.error('Error analyzing exam image:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Save questionnaire responses (with history support)
app.post('/api/questionnaire', async (c) => {
  try {
    const { user_id, responses } = await c.req.json()

    if (!user_id || !responses || responses.length === 0) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const db = c.env.DB

    // Generate session_id for this submission (timestamp + random)
    const session_id = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Insert new responses with session_id (keep all history, don't delete)
    for (const response of responses) {
      await db.prepare(
        'INSERT INTO questionnaire_responses (user_id, question_number, question_text, answer_value, category, is_descriptive, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(user_id, response.question_number, response.question_text, response.answer_value, response.category, response.is_descriptive || 0, session_id).run()
    }

    return c.json({ 
      success: true,
      message: 'ヒアリングが保存されました',
      session_id: session_id
    })
  } catch (error) {
    console.error('Error saving questionnaire:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get latest questionnaire responses for user
app.get('/api/questionnaire/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // Get the latest session_id for this user
    const latestSession = await db.prepare(
      'SELECT session_id FROM questionnaire_responses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    if (!latestSession) {
      return c.json({ success: true, responses: [] })
    }

    // Get all responses from the latest session
    const { results } = await db.prepare(
      'SELECT * FROM questionnaire_responses WHERE user_id = ? AND session_id = ? ORDER BY question_number'
    ).bind(userId, latestSession.session_id).all()

    return c.json({ success: true, responses: results })
  } catch (error) {
    console.error('Error fetching questionnaire responses:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Note: History feature has been removed. 
// Questionnaire now auto-saves to localStorage and can be resumed anytime.
// Database still stores responses with session_id for AI analysis purposes.

// Disabled: Get questionnaire history (list of all sessions)
// app.get('/api/questionnaire/:userId/history', async (c) => { ... })

// Disabled: Get specific session responses  
// app.get('/api/questionnaire/:userId/session/:sessionId', async (c) => { ... })

// Perform AI analysis
async function performAnalysis(c: any) {
  try {
    // Support both GET (query param) and POST (body) requests
    let user_id
    if (c.req.method === 'GET') {
      user_id = c.req.query('user_id')
    } else {
      const body = await c.req.json()
      user_id = body.user_id
    }

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    const db = c.env.DB
    const geminiApiKey = c.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return c.json({ success: false, error: 'Gemini APIキーが設定されていません。.dev.varsファイルを確認してください。' }, 500)
    }

    // Fetch exam data
    const examData = await db.prepare(
      `SELECT ed.*, GROUP_CONCAT(em.measurement_key || ':' || em.measurement_value || em.measurement_unit) as measurements
       FROM exam_data ed
       LEFT JOIN exam_measurements em ON ed.id = em.exam_data_id
       WHERE ed.user_id = ?
       GROUP BY ed.id
       ORDER BY ed.exam_date DESC`
    ).bind(user_id).all()

    // Fetch latest questionnaire responses (最新のsession_idのみ)
    const latestSession = await db.prepare(
      'SELECT session_id FROM questionnaire_responses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(user_id).first()
    
    let questionnaireData = { results: [] }
    if (latestSession?.session_id) {
      questionnaireData = await db.prepare(
        'SELECT * FROM questionnaire_responses WHERE user_id = ? AND session_id = ? ORDER BY question_number'
      ).bind(user_id, latestSession.session_id).all()
    }

    if ((!examData.results || examData.results.length === 0) && (!questionnaireData.results || questionnaireData.results.length === 0)) {
      return c.json({ 
        success: false, 
        error: '解析するデータがありません。検査データまたは問診を先に入力してください。' 
      }, 400)
    }

    // Prepare data for AI analysis
    const examSummary = examData.results?.map(exam => 
      `${exam.exam_type}: ${exam.measurements}`
    ).join('\n') || 'なし'

    // Collect OCR raw texts for additional context
    const ocrTexts = examData.results
      ?.filter(exam => exam.ocr_raw_text)
      .map(exam => `【${exam.exam_date} ${exam.exam_type}のOCR読取データ】\n${exam.ocr_raw_text}`)
      .join('\n\n') || ''

    const questionnaireSummary = questionnaireData.results?.map(q => 
      `Q${q.question_number}. ${q.question_text} → ${q.answer_value}`
    ).join('\n') || 'なし'

    // Fetch available supplements from master database
    const supplementsMaster = await db.prepare(
      'SELECT * FROM supplements_master WHERE is_active = 1 ORDER BY priority ASC, category'
    ).all()

    const supplementsCatalog = supplementsMaster.results?.map(s => 
      `【${s.product_code}】${s.product_name}（${s.category}）\n` +
      `・形状: ${s.form}、内容量: ${s.content_amount}\n` +
      `・成分: ${s.ingredients || '記載なし'}\n` +
      `・説明: ${s.description || '記載なし'}\n` +
      `・推奨用途: ${s.recommended_for || '記載なし'}\n` +
      `・優先度: ${s.priority === 1 ? '高' : s.priority === 2 ? '中' : '低'}`
    ).join('\n\n') || 'サプリマスターデータなし'

    // Call Gemini API
    const systemPrompt = `あなたは医療機関監修の健康アドバイザー兼栄養療法士です。

【あなたの役割】
・検査データと問診結果を総合的に分析
・エビデンスに基づいた健康アドバイスを提供
・具体的で実践可能な栄養指導を実施
・健康リスクを科学的に評価
・個別化されたサプリメント療法を提案

【重要な分析視点】
1. 検査値の相互関係を分析（例：血糖値とHbA1cの関連性）
2. 生活習慣と検査値の因果関係を特定
3. 潜在的な健康リスクを早期発見
4. 予防医学の観点から包括的に評価
5. 具体的な数値目標と改善計画を提示

【アドバイスの品質基準】
・詳細で具体的（「野菜を食べる」ではなく「1日350g以上の緑黄色野菜を3食に分けて摂取」）
・実践可能（日常生活に取り入れやすい）
・科学的根拠に基づく（栄養学・医学の知見を活用）
・段階的（優先順位を明確に）
・測定可能（数値目標を設定）`

    const userPrompt = `以下のデータを分析して、総合的な健康アドバイスを提供してください。

【検査データ（構造化）】
${examSummary}

${ocrTexts ? `【OCRで読み取った検査結果の詳細テキスト】
${ocrTexts}

※上記のOCRテキストには、構造化データに含まれない追加の検査項目や詳細情報が含まれている場合があります。これらも解析に活用してください。
` : ''}
【ヒアリング結果（45問）】
${questionnaireSummary}

【利用可能なサプリメント製品カタログ】
以下の製品から、ユーザーの健康状態に最適なものを選択して推奨してください。
製品コードと正確な製品名を使用してください。

${supplementsCatalog}

以下の形式で「詳細かつ具体的に」回答してください（各セクション500-1000文字程度）：

1. 総合健康スコア（0-100の数値）
   ・スコアの根拠を3-5つのポイントで説明
   ・前回との比較（初回の場合は標準値との比較）

2. 健康アドバイス
   以下の内容を1000文字以上で詳細に記載してください：
   
   ・現在の健康状態の総合評価
     検査値から見た良い点（具体的な数値を明記）
     改善が必要な点（具体的な数値を明記）
   
   ・優先的に取り組むべき改善項目（3つ）
     【改善項目1】
     現状分析：検査値○○が△△、問診で「□□」と回答
     改善方法：具体的な方法と数値目標
     期待効果：○週間〜○ヶ月で期待される変化
     実践のコツ：日常生活での具体的な取り入れ方
     
     【改善項目2】（同様の形式で記載）
     【改善項目3】（同様の形式で記載）
   
   ・生活習慣の改善提案
     睡眠：就寝時刻、睡眠時間、環境改善
     運動：種類、頻度、強度、時間帯
     ストレス管理：具体的な方法

3. 栄養指導
   以下の内容を1000文字以上で詳細に記載してください：
   
   ・現在の栄養状態の評価
     検査値から見た栄養バランス（具体的な項目名と数値）
     問診から見た食生活の課題
   
   ・推奨される食事パターン
     基本方針（地中海食、和食など）
     その理由
   
   ・重点的に摂取すべき栄養素TOP5
     【栄養素1】ビタミンD（例）
     目標摂取量：1日○○μg
     多く含む食品：サケ、マグロ、きのこ類
     調理方法：油と一緒に摂取で吸収率UP
     期待効果：骨の健康、免疫機能向上
     
     （栄養素2-5も同様の形式で記載）
   
   ・控えるべき食品と理由
   ・1日の食事例（朝・昼・夕・間食）
   ・水分摂取量の目安
   ・外食時の注意点

4. 健康リスク評価
   以下の内容を800文字以上で詳細に記載してください：
   
   ・短期的リスク（今後3ヶ月）
     リスク項目：○○症
     発生確率：中程度（根拠：検査値△△が基準値の110%）
     予防策：①具体策1、②具体策2、③具体策3
   
   ・中期的リスク（今後1年）
     （同様の形式で記載）
   
   ・長期的リスク（今後5-10年）
     （同様の形式で記載）
   
   ・定期的なモニタリング推奨項目
     検査項目、推奨頻度、目標値

5. レーダーチャート用データ
   ・睡眠、栄養、運動、ストレス、生活習慣、検査値の6項目を0-100で評価
   ・各項目の評価根拠を簡潔に記載

6. 推奨サプリメント（5-8種類、優先順位付き）
   【重要】上記の「利用可能なサプリメント製品カタログ」から、必ず具体的な製品コードと製品名を使用してください。
   
   各サプリメントについて以下の形式で記載してください：
   
   【サプリ1】製品コード：SUP001、製品名：○○○
   カテゴリー：ビタミン
   推奨理由：検査値で△△が□□mg/dL（基準値より○%高い）であり、問診で「◇◇」と回答していることから、この製品に含まれる成分AAが効果的です。期待される効果は、○○の改善と△△のサポートです。
   用量：1日○錠（○○mg相当）
   摂取タイミング：朝食後
   優先度：1（最優先）
   注意事項：○○との相互作用があるため注意。妊娠中は医師に相談。
   
   【サプリ2】（同様の形式で5-8製品を記載）

【重要な書式ルール】
- アスタリスク（*）、ハッシュタグ（#）、箇条書き記号（- や • ）などのマークダウン記号を使用しないでください
- 見出しは「1. 」「2. 」のような番号形式を使用してください
- 項目を区切る際は改行のみを使用してください
- 強調したい部分は「」（かぎかっこ）で囲んでください
- 箇条書きは「・」（中黒）を使用してください
- 読みやすく、自然な日本語で記述してください`

    const fullPrompt = systemPrompt + '\n\n' + userPrompt

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 8000
        }
      })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      console.error('Gemini API error:', errorData)
      return c.json({ 
        success: false, 
        error: `AI解析に失敗しました: ${errorData.error?.message || 'Unknown error'}` 
      }, 500)
    }

    const aiData = await aiResponse.json()
    const analysisText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!analysisText) {
      return c.json({ 
        success: false, 
        error: 'AI解析の結果が空です',
        debug: { aiData: JSON.stringify(aiData).substring(0, 500) }
      }, 500)
    }

    // DEBUG: Log full AI response text (first 2000 chars to see structure)
    console.log('🤖 AI Response (first 2000 chars):', analysisText.substring(0, 2000))
    console.log('📝 AI Response total length:', analysisText.length)

    // Parse AI response (simple parsing - in production, use structured output)
    const overallScore = parseScore(analysisText)
    const healthAdvice = extractSection(analysisText, '健康アドバイス') || analysisText
    const nutritionGuidance = extractSection(analysisText, '栄養指導') || analysisText
    const riskAssessment = extractSection(analysisText, 'リスク評価') || analysisText
    
    // DEBUG: Log extracted sections
    console.log('📊 Extracted - Score:', overallScore)
    console.log('💡 Extracted - Health Advice length:', healthAdvice.length)
    console.log('💡 Health Advice preview:', healthAdvice.substring(0, 200))
    console.log('🍎 Extracted - Nutrition length:', nutritionGuidance.length)
    console.log('🍎 Nutrition preview:', nutritionGuidance.substring(0, 200))
    console.log('⚠️  Extracted - Risk length:', riskAssessment.length)
    console.log('⚠️  Risk preview:', riskAssessment.substring(0, 200))
    const radarChartData = {
      labels: ['睡眠', '栄養', '運動', 'ストレス', '生活習慣', '検査値'],
      values: [70, 65, 60, 55, 75, 70] // Default values - in production, parse from AI response
    }
    const supplements = parseSupplements(analysisText)

    // Save analysis results to database
    const analysisResult = await db.prepare(
      `INSERT INTO analysis_results (user_id, overall_score, health_advice, nutrition_guidance, risk_assessment, radar_chart_data)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      user_id,
      overallScore,
      healthAdvice,
      nutritionGuidance,
      riskAssessment,
      JSON.stringify(radarChartData)
    ).run()

    const analysisId = analysisResult.meta.last_row_id

    // Save supplement recommendations
    for (const supplement of supplements) {
      await db.prepare(
        'INSERT INTO supplement_recommendations (analysis_result_id, supplement_name, supplement_type, dosage, frequency, reason, priority) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        analysisId,
        supplement.name,
        supplement.type,
        supplement.dosage,
        supplement.frequency,
        supplement.reason,
        supplement.priority
      ).run()
    }

    return c.json({
      success: true,
      analysis: {
        overall_score: overallScore,
        health_advice: healthAdvice,
        nutrition_guidance: nutritionGuidance,
        risk_assessment: riskAssessment,
        radar_chart_data: radarChartData,
        supplements: supplements
      }
    })
  } catch (error) {
    console.error('Error performing analysis:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
}

app.get('/api/analysis', performAnalysis)
app.post('/api/analysis', performAnalysis)

// Helper functions for parsing AI response
function parseScore(text: string): number {
  const match = text.match(/スコア[：:]?\s*(\d+)/i) || text.match(/(\d+)\s*[/／]\s*100/)
  return match ? parseInt(match[1]) : 70 // Default score
}

function extractSection(text: string, sectionName: string): string {
  // Map section names to expected numbers in AI response
  const sectionNumber = sectionName === '健康アドバイス' ? '2' : 
                       sectionName === '栄養指導' ? '3' : 
                       sectionName === 'リスク評価' || sectionName === '健康リスク評価' ? '4' : ''
  
  console.log(`🔍 Extracting section: "${sectionName}" (Number: ${sectionNumber})`)
  
  // Strategy 1: Extract by section number (most reliable)
  if (sectionNumber) {
    // Pattern: "2. 健康アドバイス" followed by content until next numbered section
    const pattern = new RegExp(`${sectionNumber}\\.\\s*${sectionName}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\d+\\.\\s|$)`, 'i')
    const match = text.match(pattern)
    if (match && match[1]) {
      let content = match[1].trim()
      console.log(`✅ Found by section number (${sectionNumber}). Length: ${content.length}`)
      
      // Clean up content
      content = content.replace(/^以下.*?：\n/gm, '') // Remove instruction lines
      content = content.replace(/^\d+文字以上.*?\n/gm, '') // Remove char count instructions
      
      if (content.length > 50) { // Minimum meaningful length
        return content
      }
    }
  }
  
  // Strategy 2: Extract by section name pattern
  const patterns = [
    // Pattern: "健康アドバイス：" or "健康アドバイス\n"
    new RegExp(`${sectionName}[：:]?\\s*\\n([\\s\\S]*?)(?=\\n\\d+\\.\\s|\\n【|$)`, 'i'),
    // Pattern: "2. 健康アドバイス（〜字以上）" style
    new RegExp(`\\d+\\.\\s*${sectionName}.*?\\n([\\s\\S]*?)(?=\\n\\d+\\.\\s|$)`, 'i')
  ]
  
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i])
    if (match && match[1]) {
      let content = match[1].trim()
      console.log(`✅ Found by pattern ${i+1}. Length: ${content.length}`)
      
      // Clean up content
      content = content.replace(/^以下.*?：\n/gm, '')
      content = content.replace(/^\d+文字以上.*?\n/gm, '')
      
      if (content.length > 50) {
        return content
      }
    }
  }
  
  console.warn(`❌ Section "${sectionName}" not found or too short`)
  return '該当するセクションが見つかりませんでした'
}

function parseSupplements(text: string): Array<{name: string, type: string, dosage: string, frequency: string, reason: string, priority: number}> {
  const supplements: Array<{name: string, type: string, dosage: string, frequency: string, reason: string, priority: number}> = []
  
  // Try to find supplement sections (【サプリ1】, 【サプリ2】, etc.)
  const supplementPattern = /【サプリ\d+】[\s\S]*?(?=【サプリ\d+】|$)/g
  const matches = text.match(supplementPattern)
  
  if (matches && matches.length > 0) {
    for (const match of matches) {
      try {
        // Extract product name (製品名：xxxx)
        const nameMatch = match.match(/製品名[：:](.*?)(?:\n|カテゴリー|、)/)
        // Extract category (カテゴリー：xxxx)
        const typeMatch = match.match(/カテゴリー[：:](.*?)(?:\n|推奨理由)/)
        // Extract dosage (用量：xxxx)
        const dosageMatch = match.match(/用量[：:](.*?)(?:\n|摂取タイミング)/)
        // Extract timing (摂取タイミング：xxxx)
        const timingMatch = match.match(/摂取タイミング[：:](.*?)(?:\n|優先度)/)
        // Extract reason (推奨理由：xxxx)
        const reasonMatch = match.match(/推奨理由[：:]([\s\S]*?)(?:\n用量|\n優先度)/)
        // Extract priority (優先度：x)
        const priorityMatch = match.match(/優先度[：:](\d+)/)
        
        if (nameMatch) {
          supplements.push({
            name: nameMatch[1].trim(),
            type: typeMatch ? typeMatch[1].trim() : '',
            dosage: dosageMatch ? dosageMatch[1].trim() : '',
            frequency: timingMatch ? timingMatch[1].trim() : '1日1回',
            reason: reasonMatch ? reasonMatch[1].trim().substring(0, 200) : '',
            priority: priorityMatch ? parseInt(priorityMatch[1]) : 2
          })
        }
      } catch (e) {
        console.error('Error parsing supplement:', e)
      }
    }
  }
  
  // If parsing failed, return default supplements
  if (supplements.length === 0) {
    return [
      {
        name: 'ビタミンミックス11種類',
        type: 'ビタミン',
        dosage: '1錠',
        frequency: '1日1回',
        reason: '全般的な栄養バランスをサポート',
        priority: 1
      },
      {
        name: 'クリルオイル',
        type: '脂質',
        dosage: '250mg',
        frequency: '1日1回',
        reason: '心血管健康と抗炎症作用をサポート',
        priority: 1
      },
      {
        name: 'ミネラルミックス7種類',
        type: 'ミネラル',
        dosage: '1錠',
        frequency: '1日1回',
        reason: 'ミネラルバランスの最適化',
        priority: 2
      }
    ]
  }
  
  return supplements
}

// Get analysis history for user
app.get('/api/analysis-history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const { results } = await db.prepare(
      'SELECT * FROM analysis_results WHERE user_id = ? ORDER BY analysis_date DESC LIMIT 20'
    ).bind(userId).all()

    return c.json({ success: true, analyses: results })
  } catch (error) {
    console.error('Error fetching analysis history:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete analysis result
app.delete('/api/analysis/:analysisId', async (c) => {
  try {
    const analysisId = c.req.param('analysisId')
    const db = c.env.DB

    // Delete supplement recommendations first (foreign key constraint)
    await db.prepare(
      'DELETE FROM supplement_recommendations WHERE analysis_result_id = ?'
    ).bind(analysisId).run()

    // Delete the analysis result
    await db.prepare(
      'DELETE FROM analysis_results WHERE id = ?'
    ).bind(analysisId).run()

    return c.json({ success: true, message: '解析結果を削除しました' })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get exam history with measurements (for history charts)
app.get('/api/history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const startDate = c.req.query('start_date') || '2022-01-01'
    const db = c.env.DB

    // Get exam data with date filter
    const examData = await db.prepare(
      'SELECT * FROM exam_data WHERE user_id = ? AND exam_date >= ? ORDER BY exam_date DESC'
    ).bind(userId, startDate).all()

    if (!examData.results || examData.results.length === 0) {
      return c.json({ success: true, exams: [] })
    }

    // Get measurements for each exam
    const examsWithMeasurements = await Promise.all(
      examData.results.map(async (exam) => {
        const measurements = await db.prepare(
          'SELECT * FROM exam_measurements WHERE exam_data_id = ?'
        ).bind(exam.id).all()

        return {
          ...exam,
          measurements: measurements.results || []
        }
      })
    )

    return c.json({ success: true, exams: examsWithMeasurements })
  } catch (error) {
    console.error('Error fetching exam history:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get exam detail for editing
app.get('/api/history/detail/:examId', async (c) => {
  try {
    const examId = c.req.param('examId')
    const db = c.env.DB

    const exam = await db.prepare('SELECT * FROM exam_data WHERE id = ?').bind(examId).first()
    if (!exam) {
      return c.json({ success: false, error: '検査データが見つかりません' }, 404)
    }

    const measurements = await db.prepare(
      'SELECT * FROM exam_measurements WHERE exam_data_id = ?'
    ).bind(examId).all()

    return c.json({ 
      success: true, 
      exam: {
        ...exam,
        measurements: measurements.results || []
      }
    })
  } catch (error) {
    console.error('Error fetching exam detail:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update exam data
app.put('/api/exam/:examId', async (c) => {
  try {
    const examId = c.req.param('examId')
    const { exam_date, exam_type, measurements } = await c.req.json()

    const db = c.env.DB

    // Update exam_data
    await db.prepare(
      'UPDATE exam_data SET exam_date = ?, exam_type = ? WHERE id = ?'
    ).bind(exam_date, exam_type, examId).run()

    // Delete old measurements
    await db.prepare('DELETE FROM exam_measurements WHERE exam_data_id = ?').bind(examId).run()

    // Insert new measurements
    for (const measurement of measurements) {
      await db.prepare(
        'INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) VALUES (?, ?, ?, ?)'
      ).bind(examId, measurement.key, measurement.value, measurement.unit || '').run()
    }

    return c.json({ 
      success: true,
      message: '検査データが更新されました'
    })
  } catch (error) {
    console.error('Error updating exam data:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete exam data
app.delete('/api/exam/:examId', async (c) => {
  try {
    const examId = c.req.param('examId')
    const db = c.env.DB

    // Delete measurements first
    await db.prepare('DELETE FROM exam_measurements WHERE exam_data_id = ?').bind(examId).run()

    // Delete exam data
    await db.prepare('DELETE FROM exam_data WHERE id = ?').bind(examId).run()

    return c.json({ 
      success: true,
      message: '検査データが削除されました'
    })
  } catch (error) {
    console.error('Error deleting exam data:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Authentication API endpoints
// Helper functions
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Register API
app.post('/api/auth/register', async (c) => {
  try {
    const { name, email, password, birthdate, age, gender } = await c.req.json()

    if (!name || !email || !password || !birthdate) {
      return c.json({ success: false, error: '必須項目が不足しています（名前、メールアドレス、パスワード、生年月日）' }, 400)
    }

    const db = c.env.DB

    // Check if email already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existingUser) {
      return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Insert user with birthdate and plain password
    const result = await db.prepare(
      'INSERT INTO users (name, email, password_hash, plain_password, birthdate, age, gender) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, email, passwordHash, password, birthdate, age, gender).run()

    return c.json({
      success: true,
      user_id: result.meta.last_row_id,
      message: 'ユーザー登録が完了しました'
    })
  } catch (error) {
    console.error('Error registering user:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Login API
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ success: false, error: 'メールアドレスとパスワードを入力してください' }, 400)
    }

    const db = c.env.DB

    // Find user
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
    if (!user) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    // Verify password
    const passwordHash = await hashPassword(password)
    if (passwordHash !== user.password_hash) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.prepare(
      'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, sessionToken, expiresAt.toISOString()).run()

    // Update last login
    await db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id).run()

    // Set cookie
    c.header('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Logout API
app.post('/api/auth/logout', async (c) => {
  try {
    const cookies = c.req.header('cookie') || ''
    const sessionToken = cookies.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1]

    if (sessionToken) {
      const db = c.env.DB
      await db.prepare('DELETE FROM sessions WHERE session_token = ?').bind(sessionToken).run()
    }

    c.header('Set-Cookie', 'session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

    return c.json({ success: true, message: 'ログアウトしました' })
  } catch (error) {
    console.error('Error logging out:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get current user
// Debug endpoint
app.get('/api/debug/user/:id', async (c) => {
  const userId = c.req.param('id')
  const db = c.env.DB
  
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  
  return c.json({
    raw_user: user,
    membership_type_exists: 'membership_type' in user,
    membership_type_value: user.membership_type,
    all_keys: Object.keys(user)
  })
})

// Password Reset API endpoints
// Request password reset token
app.post('/api/password-reset/request', async (c) => {
  try {
    const { email } = await c.req.json()

    if (!email) {
      return c.json({ success: false, error: 'メールアドレスを入力してください' }, 400)
    }

    const db = c.env.DB

    // Find user
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (!user) {
      // セキュリティ上、ユーザーが存在しない場合でも成功レスポンスを返す（実運用）
      // 開発環境では実際のエラーを返す
      return c.json({ success: false, error: 'このメールアドレスは登録されていません' }, 404)
    }

    // Generate reset token
    const resetToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token
    await db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, resetToken, expiresAt.toISOString()).run()

    return c.json({
      success: true,
      token: resetToken,
      message: 'リセットトークンを発行しました'
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Reset password with token
app.post('/api/password-reset/reset', async (c) => {
  try {
    const { token, new_password } = await c.req.json()

    if (!token || !new_password) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    if (new_password.length < 6) {
      return c.json({ success: false, error: 'パスワードは6文字以上にしてください' }, 400)
    }

    const db = c.env.DB

    // Find valid reset token
    const resetToken = await db.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ? AND used = 0'
    ).bind(token, new Date().toISOString()).first()

    if (!resetToken) {
      return c.json({ success: false, error: 'トークンが無効または期限切れです' }, 400)
    }

    // Hash new password
    const passwordHash = await hashPassword(new_password)

    // Update password
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(passwordHash, resetToken.user_id).run()

    // Mark token as used
    await db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?')
      .bind(resetToken.id).run()

    // Invalidate all sessions for this user (force re-login)
    await db.prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(resetToken.user_id).run()

    return c.json({
      success: true,
      message: 'パスワードが変更されました'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Admin API endpoints
// Admin login
app.post('/api/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ success: false, error: 'ユーザー名とパスワードを入力してください' }, 400)
    }

    const db = c.env.DB

    // Find admin user
    const admin = await db.prepare('SELECT * FROM admin_users WHERE username = ?').bind(username).first()
    if (!admin) {
      return c.json({ success: false, error: 'ユーザー名またはパスワードが正しくありません' }, 401)
    }

    // Verify password
    const passwordHash = await hashPassword(password)
    if (passwordHash !== admin.password_hash) {
      return c.json({ success: false, error: 'ユーザー名またはパスワードが正しくありません' }, 401)
    }

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.prepare(
      'INSERT INTO admin_sessions (admin_user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(admin.id, sessionToken, expiresAt.toISOString()).run()

    // Update last login
    await db.prepare('UPDATE admin_users SET last_login = ? WHERE id = ?')
      .bind(new Date().toISOString(), admin.id).run()

    // Set cookie
    c.header('Set-Cookie', `admin_session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`)

    return c.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name
      }
    })
  } catch (error) {
    console.error('Error logging in admin:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Admin logout
app.post('/api/admin/logout', async (c) => {
  try {
    const cookies = c.req.header('cookie') || ''
    const sessionToken = cookies.split(';').find(c => c.trim().startsWith('admin_session_token='))?.split('=')[1]

    if (sessionToken) {
      const db = c.env.DB
      await db.prepare('DELETE FROM admin_sessions WHERE session_token = ?').bind(sessionToken).run()
    }

    c.header('Set-Cookie', 'admin_session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

    return c.json({ success: true, message: 'ログアウトしました' })
  } catch (error) {
    console.error('Error logging out admin:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get current admin user
app.get('/api/admin/me', async (c) => {
  try {
    const cookies = c.req.header('cookie') || ''
    const sessionToken = cookies.split(';').find(c => c.trim().startsWith('admin_session_token='))?.split('=')[1]

    if (!sessionToken) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const db = c.env.DB

    // Find session
    const session = await db.prepare(
      'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > ?'
    ).bind(sessionToken, new Date().toISOString()).first()

    if (!session) {
      return c.json({ success: false, error: 'セッションが無効です' }, 401)
    }

    // Get admin user
    const admin = await db.prepare('SELECT id, username, full_name FROM admin_users WHERE id = ?')
      .bind(session.admin_user_id).first()

    if (!admin) {
      return c.json({ success: false, error: '管理者が見つかりません' }, 404)
    }

    return c.json({
      success: true,
      admin: admin
    })
  } catch (error) {
    console.error('Error getting current admin:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get all users with statistics
app.get('/api/admin/users', async (c) => {
  try {
    const db = c.env.DB

    // Get all users
    const { results: users } = await db.prepare(
      'SELECT id, name, email, age, gender, created_at, last_login FROM users ORDER BY created_at DESC'
    ).all()

    // Get statistics
    const { results: examStats } = await db.prepare('SELECT COUNT(*) as count FROM exam_data').all()
    const { results: questionnaireStats } = await db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM questionnaire_responses').all()
    const { results: analysisStats } = await db.prepare('SELECT COUNT(*) as count FROM analysis_results').all()

    return c.json({
      success: true,
      users: users || [],
      statistics: {
        total_exams: examStats?.[0]?.count || 0,
        total_questionnaires: questionnaireStats?.[0]?.count || 0,
        total_analyses: analysisStats?.[0]?.count || 0
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get specific user details
app.get('/api/admin/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const user = await db.prepare(
      'SELECT id, name, email, age, gender, created_at, last_login, plain_password, membership_type FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    return c.json({ success: true, user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update user membership type (admin only)
app.put('/api/admin/user/:userId/membership', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const membershipType = body.membership_type
    const db = c.env.DB

    // Validate membership type
    if (!['free', 'premium'].includes(membershipType)) {
      return c.json({ success: false, error: '無効な会員タイプです' }, 400)
    }

    // Check if user exists
    const user = await db.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // Update membership type
    await db.prepare(
      'UPDATE users SET membership_type = ? WHERE id = ?'
    ).bind(membershipType, userId).run()

    return c.json({ 
      success: true, 
      message: '会員タイプを更新しました',
      membership_type: membershipType
    })
  } catch (error) {
    console.error('Error updating membership:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// CSV Export: User list
app.get('/api/admin/export/users', async (c) => {
  try {
    const db = c.env.DB
    
    // Get all users with detailed information
    const { results: users } = await db.prepare(
      'SELECT id, name, email, age, gender, membership_type, created_at, last_login FROM users ORDER BY id ASC'
    ).all()
    
    // Create CSV header
    const header = ['ID', '名前', 'メールアドレス', '年齢', '性別', '会員タイプ', '登録日', '最終ログイン']
    
    // Create CSV rows
    const rows = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.age || '',
      user.gender === 'male' ? '男性' : user.gender === 'female' ? '女性' : user.gender === 'other' ? 'その他' : '',
      user.membership_type === 'premium' ? '有料会員' : '無料会員',
      user.created_at || '',
      user.last_login || ''
    ])
    
    // Combine header and rows
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // Add BOM for Excel compatibility with Japanese characters
    const bom = '\uFEFF'
    
    return c.text(bom + csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`
    })
  } catch (error) {
    console.error('Error exporting users CSV:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// CSV Export: Detailed data (exam + questionnaire)
app.get('/api/admin/export/detailed/:userId?', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')
    
    let userCondition = ''
    if (userId) {
      userCondition = ` WHERE id = ${userId}`
    }
    
    // Get all users
    const { results: users } = await db.prepare(
      `SELECT id, name, email, age, gender, membership_type FROM users${userCondition} ORDER BY id ASC`
    ).all()
    
    const detailedData = []
    
    for (const user of users) {
      // Get exam data
      const { results: exams } = await db.prepare(
        'SELECT * FROM exam_data WHERE user_id = ? ORDER BY exam_date DESC'
      ).bind(user.id).all()
      
      // Get questionnaire responses
      const { results: questionnaires } = await db.prepare(
        'SELECT question_number, question_text, answer_value FROM questionnaire_responses WHERE user_id = ? ORDER BY question_number ASC'
      ).bind(user.id).all()
      
      // Convert questionnaire to key-value
      const questionnaireMap = {}
      questionnaires.forEach(q => {
        questionnaireMap[`Q${q.question_number}_${q.question_text}`] = q.answer_value
      })
      
      // Get exam measurements
      for (const exam of exams) {
        const { results: measurements } = await db.prepare(
          'SELECT measurement_key, measurement_value, measurement_unit FROM exam_measurements WHERE exam_data_id = ?'
        ).bind(exam.id).all()
        
        const measurementMap = {}
        measurements.forEach(m => {
          measurementMap[m.measurement_key] = `${m.measurement_value} ${m.measurement_unit || ''}`
        })
        
        detailedData.push({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_age: user.age,
          user_gender: user.gender,
          membership_type: user.membership_type,
          exam_date: exam.exam_date,
          exam_type: exam.exam_type,
          ...measurementMap,
          ...questionnaireMap
        })
      }
      
      // If no exam data, include user info with questionnaire only
      if (exams.length === 0 && questionnaires.length > 0) {
        detailedData.push({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_age: user.age,
          user_gender: user.gender,
          membership_type: user.membership_type,
          exam_date: '',
          exam_type: '',
          ...questionnaireMap
        })
      }
    }
    
    if (detailedData.length === 0) {
      return c.json({ success: false, error: 'エクスポートするデータがありません' }, 404)
    }
    
    // Get all unique keys for CSV header
    const allKeys = new Set()
    detailedData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key))
    })
    
    const header = Array.from(allKeys)
    
    // Create CSV rows
    const rows = detailedData.map(row => 
      header.map(key => row[key] || '')
    )
    
    // Combine header and rows
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // Add BOM for Excel compatibility
    const bom = '\uFEFF'
    
    const filename = userId 
      ? `user_${userId}_detailed_${new Date().toISOString().split('T')[0]}.csv`
      : `all_users_detailed_${new Date().toISOString().split('T')[0]}.csv`
    
    return c.text(bom + csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    })
  } catch (error) {
    console.error('Error exporting detailed CSV:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Reset user password (admin only)
app.post('/api/admin/user/:userId/reset-password', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const newPassword = body.password
    const db = c.env.DB

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return c.json({ success: false, error: 'パスワードは6文字以上で入力してください' }, 400)
    }

    // Check if user exists
    const user = await db.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // Hash password
    const encoder = new TextEncoder()
    const data = encoder.encode(newPassword)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Update password (both hashed and plain text)
    await db.prepare(
      'UPDATE users SET password_hash = ?, plain_password = ? WHERE id = ?'
    ).bind(hashedPassword, newPassword, userId).run()

    return c.json({ 
      success: true, 
      message: 'パスワードをリセットしました',
      newPassword: newPassword // Return plain password for display
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get all supplements (admin only - includes inactive)
app.get('/api/admin/supplements', async (c) => {
  try {
    const db = c.env.DB

    // Get all supplements including inactive ones
    const result = await db.prepare(
      'SELECT * FROM supplements_master ORDER BY priority ASC, category, product_code'
    ).all()

    return c.json({
      success: true,
      supplements: result.results || []
    })
  } catch (error) {
    console.error('Error fetching supplements:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get specific supplement (admin only)
app.get('/api/admin/supplements/:id', async (c) => {
  try {
    const supplementId = c.req.param('id')
    const db = c.env.DB

    const supplement = await db.prepare(
      'SELECT * FROM supplements_master WHERE id = ?'
    ).bind(supplementId).first()

    if (!supplement) {
      return c.json({ success: false, error: 'サプリメントが見つかりません' }, 404)
    }

    return c.json({ success: true, supplement })
  } catch (error) {
    console.error('Error fetching supplement:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update supplement (admin only)
app.put('/api/admin/supplements/:id', async (c) => {
  try {
    const supplementId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()

    // Update supplement
    await db.prepare(`
      UPDATE supplements_master 
      SET product_name = ?, 
          category = ?, 
          form = ?, 
          content_amount = ?, 
          price = ?,
          supplement_category = ?,
          is_active = ?, 
          ingredients = ?, 
          description = ?, 
          recommended_for = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.product_name,
      body.category,
      body.form || null,
      body.content_amount || null,
      body.price || 0,
      body.supplement_category || '健康サポート',
      body.is_active,
      body.ingredients || null,
      body.description || null,
      body.recommended_for || null,
      supplementId
    ).run()

    return c.json({ success: true, message: '更新しました' })
  } catch (error) {
    console.error('Error updating supplement:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ======================
// Supplements Master API
// ======================

// Get all supplements from master catalog
app.get('/api/supplements/master', async (c) => {
  try {
    const category = c.req.query('category')
    const db = c.env.DB

    let query = 'SELECT * FROM supplements_master WHERE is_active = 1'
    let params: any[] = []

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    query += ' ORDER BY priority ASC, category, product_code'

    const result = await db.prepare(query).bind(...params).all()

    return c.json({
      success: true,
      supplements: result.results || [],
      count: result.results?.length || 0
    })
  } catch (error) {
    console.error('Error fetching supplements master:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get supplement categories
app.get('/api/supplements/categories', async (c) => {
  try {
    const db = c.env.DB

    const result = await db.prepare(
      'SELECT DISTINCT category FROM supplements_master WHERE is_active = 1 ORDER BY category'
    ).all()

    return c.json({
      success: true,
      categories: result.results || []
    })
  } catch (error) {
    console.error('Error fetching supplement categories:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get supplement by product code
app.get('/api/supplements/master/:code', async (c) => {
  try {
    const productCode = c.req.param('code')
    const db = c.env.DB

    const result = await db.prepare(
      'SELECT * FROM supplements_master WHERE product_code = ? AND is_active = 1'
    ).bind(productCode).first()

    if (!result) {
      return c.json({ success: false, error: 'サプリメントが見つかりません' }, 404)
    }

    return c.json({
      success: true,
      supplement: result
    })
  } catch (error) {
    console.error('Error fetching supplement:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ======================
// CSV Export API (Admin)
// ======================

// Export all users data to CSV
app.get('/api/admin/export/users', async (c) => {
  try {
    const db = c.env.DB

    // Get all users with detailed information
    const { results: users } = await db.prepare(`
      SELECT 
        id,
        name,
        email,
        birthdate,
        age,
        gender,
        membership_type,
        created_at,
        last_login
      FROM users 
      ORDER BY created_at DESC
    `).all()

    // Create CSV content
    const headers = ['ID', '名前', 'メールアドレス', '生年月日', '年齢', '性別', '会員タイプ', '登録日', '最終ログイン']
    const csvRows = [headers.join(',')]

    for (const user of users || []) {
      const row = [
        user.id,
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        user.birthdate || '',
        user.age || '',
        `"${user.gender || ''}"`,
        user.membership_type || 'free',
        user.created_at || '',
        user.last_login || ''
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    // Set headers for CSV download
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Export user's exam data to CSV
app.get('/api/admin/export/exams/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // Get user info
    const user = await db.prepare('SELECT name, email FROM users WHERE id = ?').bind(userId).first()
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // Get exam data
    const { results: exams } = await db.prepare(`
      SELECT 
        ed.id,
        ed.exam_date,
        ed.exam_type,
        em.measurement_key,
        em.measurement_value,
        em.measurement_unit,
        em.normal_range_min,
        em.normal_range_max
      FROM exam_data ed
      LEFT JOIN exam_measurements em ON ed.id = em.exam_data_id
      WHERE ed.user_id = ?
      ORDER BY ed.exam_date DESC, em.measurement_key
    `).bind(userId).all()

    // Create CSV content
    const headers = ['検査ID', '検査日', '検査タイプ', '測定項目', '測定値', '単位', '基準値(最小)', '基準値(最大)']
    const csvRows = [
      `ユーザー: ${user.name} (${user.email})`,
      '',
      headers.join(',')
    ]

    for (const exam of exams || []) {
      const row = [
        exam.id,
        exam.exam_date || '',
        `"${exam.exam_type || ''}"`,
        `"${exam.measurement_key || ''}"`,
        exam.measurement_value || '',
        exam.measurement_unit || '',
        exam.normal_range_min || '',
        exam.normal_range_max || ''
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="exams_user${userId}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting exams:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Export user's questionnaire responses to CSV
app.get('/api/admin/export/questionnaire/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // Get user info
    const user = await db.prepare('SELECT name, email FROM users WHERE id = ?').bind(userId).first()
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // Get questionnaire responses
    const { results: responses } = await db.prepare(`
      SELECT 
        question_id,
        category,
        response,
        created_at
      FROM questionnaire_responses
      WHERE user_id = ?
      ORDER BY question_id
    `).bind(userId).all()

    // Create CSV content
    const headers = ['質問ID', 'カテゴリ', '回答', '回答日時']
    const csvRows = [
      `ユーザー: ${user.name} (${user.email})`,
      '',
      headers.join(',')
    ]

    for (const resp of responses || []) {
      const row = [
        resp.question_id,
        `"${resp.category || ''}"`,
        `"${resp.response || ''}"`,
        resp.created_at || ''
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="questionnaire_user${userId}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting questionnaire:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
