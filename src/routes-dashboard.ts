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
            <div class="grid md:grid-cols-3 gap-6 mb-12">
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🩺</div>
                        <h3 class="text-xl font-bold mb-3">検査データ入力</h3>
                        <p class="text-gray-600 mb-4">血圧、体組成、血液検査など</p>
                        <a href="/exam" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            データ入力
                        </a>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">📋</div>
                        <h3 class="text-xl font-bold mb-3">健康問診</h3>
                        <p class="text-gray-600 mb-4">50問の詳細な問診</p>
                        <a href="/questionnaire" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                            問診開始
                        </a>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🎯</div>
                        <h3 class="text-xl font-bold mb-3">AI解析結果</h3>
                        <p class="text-gray-600 mb-4">健康アドバイスとサプリ提案</p>
                        <a href="/analysis" class="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                            結果を見る
                        </a>
                    </div>
                </div>
            </div>

            <!-- History Chart Button -->
            <div class="mb-8">
                <a href="/history" class="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg text-lg font-bold">
                    <i class="fas fa-chart-line mr-2"></i>
                    3年間の検査履歴グラフを表示
                </a>
            </div>

            <!-- Data History -->
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Exam History -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-history text-blue-600 mr-2"></i>
                        検査データ履歴
                    </h3>
                    <div id="examHistory" class="space-y-3">
                        <p class="text-gray-500 text-center py-4">データを読み込み中...</p>
                    </div>
                </div>

                <!-- Analysis History -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                        解析結果履歴
                    </h3>
                    <div id="analysisHistory" class="space-y-3">
                        <p class="text-gray-500 text-center py-4">データを読み込み中...</p>
                    </div>
                </div>
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
                // Load exam history
                try {
                    const examResponse = await axios.get(\`/api/exam/\${currentUser.id}\`);
                    if (examResponse.data.success && examResponse.data.exams.length > 0) {
                        displayExamHistory(examResponse.data.exams);
                    } else {
                        document.getElementById('examHistory').innerHTML = '<p class="text-gray-500 text-center py-4">まだ検査データがありません</p>';
                    }
                } catch (error) {
                    console.error('Error loading exam history:', error);
                }

                // Load analysis history
                try {
                    const analysisResponse = await axios.get(\`/api/analysis-history/\${currentUser.id}\`);
                    if (analysisResponse.data.success && analysisResponse.data.analyses.length > 0) {
                        displayAnalysisHistory(analysisResponse.data.analyses);
                    } else {
                        document.getElementById('analysisHistory').innerHTML = '<p class="text-gray-500 text-center py-4">まだ解析結果がありません</p>';
                    }
                } catch (error) {
                    console.error('Error loading analysis history:', error);
                }

                // Display profile
                displayProfile();
            }

            function displayExamHistory(exams) {
                const container = document.getElementById('examHistory');
                const limitedExams = exams.slice(0, 5);
                
                container.innerHTML = limitedExams.map(exam => \`
                    <div class="border-l-4 border-blue-500 pl-4 py-2">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-bold">\${getExamTypeName(exam.exam_type)}</p>
                                <p class="text-sm text-gray-600">\${exam.exam_date}</p>
                            </div>
                            <a href="/exam/view/\${exam.id}" class="text-blue-600 hover:text-blue-700">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                \`).join('');

                if (exams.length > 5) {
                    container.innerHTML += '<p class="text-sm text-gray-500 text-center mt-3">他 ' + (exams.length - 5) + ' 件</p>';
                }
            }

            function displayAnalysisHistory(analyses) {
                const container = document.getElementById('analysisHistory');
                const limitedAnalyses = analyses.slice(0, 5);
                
                container.innerHTML = limitedAnalyses.map(analysis => \`
                    <div class="border-l-4 border-purple-500 pl-4 py-2">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-bold">健康スコア: \${analysis.overall_score.toFixed(0)}</p>
                                <p class="text-sm text-gray-600">\${new Date(analysis.analysis_date).toLocaleDateString('ja-JP')}</p>
                            </div>
                            <a href="/analysis/view/\${analysis.id}" class="text-purple-600 hover:text-purple-700">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                \`).join('');

                if (analyses.length > 5) {
                    container.innerHTML += '<p class="text-sm text-gray-500 text-center mt-3">他 ' + (analyses.length - 5) + ' 件</p>';
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

            function getExamTypeName(type) {
                const names = {
                    'blood_pressure': '血圧測定',
                    'body_composition': '体組成計',
                    'blood_test': '血液検査',
                    'custom': 'カスタム検査'
                };
                return names[type] || type;
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
