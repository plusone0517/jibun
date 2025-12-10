import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const dashboardRoutes = new Hono<{ Bindings: Bindings }>()

// Dashboard page
dashboardRoutes.get('/', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ダッシュボード - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-600">
                        <i class="fas fa-heartbeat mr-2"></i>
                        じぶんサプリ育成
                    </h1>
                    <div class="flex items-center space-x-4">
                        <span id="userName" class="text-gray-700"></span>
                        <button onclick="logout()" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">ダッシュボード</h2>
                <p class="text-gray-600">あなたの健康管理データの一覧です</p>
            </div>

            <!-- Action Cards -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <!-- 1. 健康ヒアリング -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🎤</div>
                        <h3 class="text-xl font-bold mb-3">健康ヒアリング</h3>
                        <p class="text-gray-600 mb-4 text-sm">45問の詳細なヒアリング</p>
                        <div class="flex flex-col gap-2">
                            <a href="/questionnaire" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                                ヒアリング開始
                            </a>
                            <a href="/questionnaire/history" class="inline-block bg-white border-2 border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition text-sm">
                                <i class="fas fa-history mr-1"></i>履歴を見る
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 2. OCR画像読み取り -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition bg-gradient-to-br from-purple-50 to-pink-50">
                    <div class="text-center">
                        <div class="text-5xl mb-4">📸</div>
                        <h3 class="text-xl font-bold mb-3 text-purple-700">画像読み取り</h3>
                        <p class="text-gray-600 mb-4 text-sm">OCRで検査結果を読取</p>
                        <a href="/exam/ocr" class="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
                            OCR入力
                        </a>
                    </div>
                </div>

                <!-- 3. 血液検査52項目 NEW! -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🩸</div>
                        <h3 class="text-xl font-bold mb-3 text-red-700">血液検査52項目</h3>
                        <p class="text-gray-600 mb-4 text-sm">詳細な血液検査データ</p>
                        <div class="flex flex-col gap-2">
                            <a href="/exam/blood-test" class="inline-block bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-orange-700 transition">
                                <i class="fas fa-flask mr-1"></i>52項目入力
                            </a>
                            <span class="text-xs text-red-600 font-bold">
                                <i class="fas fa-star mr-1"></i>NEW
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 4. 手動入力 -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">✍️</div>
                        <h3 class="text-xl font-bold mb-3">手動入力</h3>
                        <p class="text-gray-600 mb-4 text-sm">血圧、体組成など</p>
                        <a href="/exam" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            データ入力
                        </a>
                    </div>
                </div>

                <!-- 5. AI解析 -->
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🤖</div>
                        <h3 class="text-xl font-bold mb-3 text-indigo-700">AI解析</h3>
                        <p class="text-gray-600 mb-4 text-sm">健康アドバイスとサプリ</p>
                        <a href="/analysis" class="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition">
                            AI解析実行
                        </a>
                    </div>
                </div>
            </div>

            <!-- History Buttons -->
            <div class="mb-8 grid md:grid-cols-2 gap-4">
                <a href="/history" class="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg text-lg font-bold text-center">
                    <i class="fas fa-chart-line mr-2"></i>
                    検査履歴グラフ
                </a>
                <a href="/analysis-history" class="inline-block bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:from-indigo-700 hover:to-pink-700 transition shadow-lg text-lg font-bold text-center">
                    <i class="fas fa-history mr-2"></i>
                    AI解析履歴
                </a>
            </div>

            <!-- Profile Section -->
            <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-user-circle text-gray-600 mr-2"></i>
                    プロフィール
                </h3>
                <div id="profileInfo" class="grid md:grid-cols-2 gap-4">
                    <p class="text-gray-500">読み込み中...</p>
                </div>
            </div>
        </main>

        <footer class="bg-gray-800 text-white mt-16 py-8">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-sm">© 2024 じぶんサプリ育成アプリ - 医療機関監修</p>
            </div>
        </footer>

        <script>
            let currentUser = null;

            async function checkAuth() {
                try {
                    const response = await axios.get('/api/auth/me');
                    if (response.data.success) {
                        currentUser = response.data.user;
                        document.getElementById('userName').textContent = currentUser.name + ' さん';
                        loadDashboardData();
                    } else {
                        window.location.href = '/auth/login';
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    window.location.href = '/auth/login';
                }
            }

            async function loadDashboardData() {
                // Display profile
                displayProfile();
            }

            // Analysis history display removed - use /analysis-history page instead
            
            function displayAnalysisHistoryPlaceholder(analyses) {
                // Removed function - redirected to /analysis-history page
                if (analyses.length > 5) {
                    container.innerHTML += '<div class="text-center mt-4"><a href="/analysis" class="text-blue-600 hover:text-blue-700 font-bold">すべての解析結果を見る（' + analyses.length + '件）</a></div>';
                }
            }

            async function deleteAnalysis(analysisId) {
                if (!confirm('この解析結果を削除しますか？')) {
                    return;
                }

                try {
                    const response = await axios.delete(\`/api/analysis/\${analysisId}\`);
                    if (response.data.success) {
                        alert('解析結果を削除しました');
                        loadDashboardData(); // Reload dashboard data
                    } else {
                        alert('削除に失敗しました: ' + (response.data.error || '不明なエラー'));
                    }
                } catch (error) {
                    console.error('Error deleting analysis:', error);
                    alert('削除中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            }

            function displayProfile() {
                const container = document.getElementById('profileInfo');
                container.innerHTML = \`
                    <div>
                        <p class="text-sm text-gray-600">お名前</p>
                        <p class="font-bold">\${currentUser.name}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">メールアドレス</p>
                        <p class="font-bold">\${currentUser.email}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">年齢</p>
                        <p class="font-bold">\${currentUser.age || '未設定'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">性別</p>
                        <p class="font-bold">\${currentUser.gender || '未設定'}</p>
                    </div>
                \`;
            }

            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/auth/login';
                } catch (error) {
                    console.error('Error logging out:', error);
                }
            }

            // Check authentication on page load
            window.addEventListener('load', checkAuth);
        </script>
    </body>
    </html>
  `)
})
