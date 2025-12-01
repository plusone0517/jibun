import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const adminRoutes = new Hono<{ Bindings: Bindings }>()

// Helper function for admin password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Admin login page
adminRoutes.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理者ログイン - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-gray-800 to-gray-900 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-user-shield mr-2"></i>
                        管理者ログイン
                    </h1>
                    <p class="text-gray-600">じぶんサプリ育成アプリ</p>
                </div>

                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">ユーザー名</label>
                        <input type="text" id="username" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500" placeholder="admin">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">パスワード</label>
                        <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500" placeholder="パスワード">
                    </div>

                    <button type="submit" class="w-full bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition font-bold">
                        <i class="fas fa-sign-in-alt mr-2"></i>ログイン
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <a href="/" class="text-sm text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-1"></i>トップページへ
                    </a>
                </div>

                <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>
                    デフォルト: admin / admin123
                </div>

                <div id="errorMessage" class="hidden mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">エラー！</strong>
                    <span class="block sm:inline" id="errorText"></span>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await axios.post('/api/admin/login', {
                        username,
                        password
                    });

                    if (response.data.success) {
                        window.location.href = '/admin/dashboard';
                    } else {
                        showError(response.data.error || 'ログインに失敗しました');
                    }
                } catch (error) {
                    console.error('Error logging in:', error);
                    showError('ログイン中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            });

            function showError(message) {
                document.getElementById('errorText').textContent = message;
                document.getElementById('errorMessage').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('errorMessage').classList.add('hidden');
                }, 5000);
            }
        </script>
    </body>
    </html>
  `)
})

// Admin dashboard
adminRoutes.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理者ダッシュボード - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <nav class="bg-gray-800 text-white shadow-lg mb-8">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-user-shield mr-2"></i>
                        管理者ダッシュボード
                    </h1>
                    <button onclick="logout()" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                        <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                    </button>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 pb-12">
            <div id="loadingMessage" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-spinner fa-spin mr-2"></i>データを読み込み中...
            </div>

            <!-- Statistics Cards -->
            <div class="grid md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">総ユーザー数</p>
                            <p id="totalUsers" class="text-3xl font-bold text-blue-600">0</p>
                        </div>
                        <i class="fas fa-users text-4xl text-blue-600"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">検査データ件数</p>
                            <p id="totalExams" class="text-3xl font-bold text-green-600">0</p>
                        </div>
                        <i class="fas fa-vial text-4xl text-green-600"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">問診回答数</p>
                            <p id="totalQuestionnaires" class="text-3xl font-bold text-purple-600">0</p>
                        </div>
                        <i class="fas fa-clipboard-list text-4xl text-purple-600"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">AI解析回数</p>
                            <p id="totalAnalyses" class="text-3xl font-bold text-orange-600">0</p>
                        </div>
                        <i class="fas fa-brain text-4xl text-orange-600"></i>
                    </div>
                </div>
            </div>

            <!-- Users Table -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4">
                    <i class="fas fa-users mr-2"></i>顧客データ一覧
                </h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年齢</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">性別</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <script>
            async function checkAuth() {
                try {
                    const response = await axios.get('/api/admin/me');
                    if (!response.data.success) {
                        window.location.href = '/admin/login';
                        return false;
                    }
                    return true;
                } catch (error) {
                    window.location.href = '/admin/login';
                    return false;
                }
            }

            async function loadData() {
                const authenticated = await checkAuth();
                if (!authenticated) return;

                try {
                    const response = await axios.get('/api/admin/users');
                    
                    document.getElementById('loadingMessage').classList.add('hidden');

                    if (response.data.success) {
                        const data = response.data;
                        
                        // Update statistics
                        document.getElementById('totalUsers').textContent = data.users.length;
                        document.getElementById('totalExams').textContent = data.statistics.total_exams || 0;
                        document.getElementById('totalQuestionnaires').textContent = data.statistics.total_questionnaires || 0;
                        document.getElementById('totalAnalyses').textContent = data.statistics.total_analyses || 0;

                        // Populate users table
                        const tbody = document.getElementById('usersTableBody');
                        tbody.innerHTML = '';

                        data.users.forEach(user => {
                            const row = document.createElement('tr');
                            row.innerHTML = \`
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.id}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${user.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.email}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.age || '-'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.gender || '-'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${new Date(user.created_at).toLocaleDateString('ja-JP')}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <a href="/admin/user/\${user.id}" class="text-blue-600 hover:text-blue-800">
                                        <i class="fas fa-eye mr-1"></i>詳細
                                    </a>
                                </td>
                            \`;
                            tbody.appendChild(row);
                        });
                    }
                } catch (error) {
                    console.error('Error loading data:', error);
                    document.getElementById('loadingMessage').innerHTML = \`
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        データの読み込みに失敗しました
                    \`;
                    document.getElementById('loadingMessage').className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6';
                }
            }

            async function logout() {
                try {
                    await axios.post('/api/admin/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                }
                window.location.href = '/admin/login';
            }

            // Load data on page load
            loadData();
        </script>
    </body>
    </html>
  `)
})

// User detail page
adminRoutes.get('/user/:userId', (c) => {
  const userId = c.req.param('userId')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>顧客詳細 - 管理者ダッシュボード</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <nav class="bg-gray-800 text-white shadow-lg mb-8">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-user mr-2"></i>
                        顧客詳細
                    </h1>
                    <div class="flex space-x-4">
                        <a href="/admin/dashboard" class="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
                            <i class="fas fa-arrow-left mr-1"></i>戻る
                        </a>
                        <button onclick="logout()" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 pb-12">
            <div id="loadingMessage" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-spinner fa-spin mr-2"></i>データを読み込み中...
            </div>

            <!-- User Info Card -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">
                    <i class="fas fa-id-card mr-2"></i>基本情報
                </h2>
                <div id="userInfo" class="grid md:grid-cols-2 gap-4">
                    <!-- Will be populated -->
                </div>
            </div>

            <!-- Exam History -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">
                    <i class="fas fa-chart-line mr-2"></i>検査履歴
                </h2>
                <canvas id="examChart"></canvas>
                <div id="examTable" class="mt-6 overflow-x-auto">
                    <!-- Will be populated -->
                </div>
            </div>

            <!-- Analysis History -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4">
                    <i class="fas fa-brain mr-2"></i>AI解析履歴
                </h2>
                <div id="analysisHistory">
                    <!-- Will be populated -->
                </div>
            </div>
        </main>

        <script>
            const userId = ${userId};

            async function checkAuth() {
                try {
                    const response = await axios.get('/api/admin/me');
                    if (!response.data.success) {
                        window.location.href = '/admin/login';
                        return false;
                    }
                    return true;
                } catch (error) {
                    window.location.href = '/admin/login';
                    return false;
                }
            }

            async function loadUserDetail() {
                const authenticated = await checkAuth();
                if (!authenticated) return;

                try {
                    // Load user info
                    const userResponse = await axios.get(\`/api/admin/user/\${userId}\`);
                    
                    if (!userResponse.data.success) {
                        throw new Error('User not found');
                    }

                    const user = userResponse.data.user;
                    const userInfoDiv = document.getElementById('userInfo');
                    userInfoDiv.innerHTML = \`
                        <div><strong>ID:</strong> \${user.id}</div>
                        <div><strong>名前:</strong> \${user.name}</div>
                        <div><strong>メール:</strong> \${user.email}</div>
                        <div><strong>年齢:</strong> \${user.age || '-'}</div>
                        <div><strong>性別:</strong> \${user.gender || '-'}</div>
                        <div><strong>登録日:</strong> \${new Date(user.created_at).toLocaleString('ja-JP')}</div>
                        <div><strong>最終ログイン:</strong> \${user.last_login ? new Date(user.last_login).toLocaleString('ja-JP') : '-'}</div>
                    \`;

                    // Load exam history
                    const historyResponse = await axios.get(\`/api/history/\${userId}?start_date=2022-01-01\`);
                    
                    if (historyResponse.data.success && historyResponse.data.exams.length > 0) {
                        renderExamChart(historyResponse.data.exams);
                        renderExamTable(historyResponse.data.exams);
                    } else {
                        document.getElementById('examChart').parentElement.innerHTML = '<p class="text-gray-600">検査データがありません</p>';
                    }

                    // Load analysis history
                    const analysisResponse = await axios.get(\`/api/analysis-history/\${userId}\`);
                    
                    if (analysisResponse.data.success && analysisResponse.data.analyses.length > 0) {
                        renderAnalysisHistory(analysisResponse.data.analyses);
                    } else {
                        document.getElementById('analysisHistory').innerHTML = '<p class="text-gray-600">解析履歴がありません</p>';
                    }

                    document.getElementById('loadingMessage').classList.add('hidden');
                } catch (error) {
                    console.error('Error loading user detail:', error);
                    document.getElementById('loadingMessage').innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>データの読み込みに失敗しました';
                    document.getElementById('loadingMessage').className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6';
                }
            }

            function renderExamChart(exams) {
                const bpData = exams.filter(e => e.exam_type === 'blood_pressure');
                if (bpData.length === 0) return;

                const dates = bpData.map(d => d.exam_date);
                const systolic = bpData.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'systolic_bp');
                    return m ? parseFloat(m.measurement_value) : null;
                });

                const ctx = document.getElementById('examChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [{
                            label: '収縮期血圧 (mmHg)',
                            data: systolic,
                            borderColor: 'rgb(239, 68, 68)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: true }
                        }
                    }
                });
            }

            function renderExamTable(exams) {
                const tableDiv = document.getElementById('examTable');
                tableDiv.innerHTML = \`
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">測定値</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            \${exams.map(exam => \`
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">\${exam.exam_date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">\${exam.exam_type}</td>
                                    <td class="px-6 py-4 text-sm">\${exam.measurements.map(m => \`\${m.measurement_key}:\${m.measurement_value}\${m.measurement_unit}\`).join(', ')}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            }

            function renderAnalysisHistory(analyses) {
                const historyDiv = document.getElementById('analysisHistory');
                historyDiv.innerHTML = analyses.map(analysis => \`
                    <div class="border-b pb-4 mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <div class="text-lg font-bold">総合スコア: \${analysis.overall_score}/100</div>
                            <div class="text-sm text-gray-600">\${new Date(analysis.analysis_date).toLocaleString('ja-JP')}</div>
                        </div>
                        <div class="text-sm text-gray-700">
                            <strong>健康アドバイス:</strong> \${analysis.health_advice ? analysis.health_advice.substring(0, 200) + '...' : 'なし'}
                        </div>
                    </div>
                \`).join('');
            }

            async function logout() {
                try {
                    await axios.post('/api/admin/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                }
                window.location.href = '/admin/login';
            }

            loadUserDetail();
        </script>
    </body>
    </html>
  `)
})
