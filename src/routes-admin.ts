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
        <title>管理者ログイン - じぶんを知ることから</title>
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
                    <p class="text-gray-600">じぶんを知ることから</p>
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

                    <button type="submit" class="w-full btn-3d bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition font-bold">
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
        <title>管理者ダッシュボード - じぶんを知ることから</title>
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

            <!-- Management Links -->
            <div class="grid md:grid-cols-2 gap-6 mb-8">
                <a href="/admin/supplements" class="block">
                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 hover:shadow-xl transition text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-xl font-bold mb-2">
                                    <i class="fas fa-pills mr-2"></i>
                                    サプリマスター管理
                                </h3>
                                <p class="text-sm opacity-90">登録サプリの確認・編集・追加</p>
                            </div>
                            <i class="fas fa-chevron-right text-3xl"></i>
                        </div>
                    </div>
                </a>
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

            <!-- Questionnaire History -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">
                    <i class="fas fa-clipboard-list mr-2"></i>ヒアリングデータ
                </h2>
                <div id="questionnaireData">
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

                    // Load questionnaire data
                    const questionnaireResponse = await axios.get(\`/api/questionnaire/\${userId}\`);
                    
                    if (questionnaireResponse.data.success && questionnaireResponse.data.responses.length > 0) {
                        renderQuestionnaireData(questionnaireResponse.data.responses);
                    } else {
                        document.getElementById('questionnaireData').innerHTML = '<p class="text-gray-600">ヒアリングデータがありません</p>';
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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">データソース</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OCR画像</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OCRテキスト</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            \${exams.map(exam => \`
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">\${exam.exam_date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">\${exam.exam_type}</td>
                                    <td class="px-6 py-4 text-sm">\${exam.measurements.map(m => \`\${m.measurement_key}:\${m.measurement_value}\${m.measurement_unit}\`).join(', ')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        <span class="px-2 py-1 rounded text-xs \${exam.data_source === 'ocr' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                                            \${exam.data_source === 'ocr' ? '📸 OCR' : '✍️ 手動'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        \${exam.ocr_image_url ? \`
                                            <details class="cursor-pointer">
                                                <summary class="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                    <i class="fas fa-image"></i>
                                                    画像を表示
                                                </summary>
                                                <div class="mt-2 p-2 bg-gray-50 rounded">
                                                    <img src="\${exam.ocr_image_url}" alt="OCR画像" class="max-w-md max-h-96 object-contain border rounded" />
                                                </div>
                                            </details>
                                        \` : '<span class="text-gray-400">-</span>'}
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        \${exam.ocr_raw_text ? \`
                                            <details class="cursor-pointer">
                                                <summary class="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                    <i class="fas fa-file-alt"></i>
                                                    テキストを表示
                                                </summary>
                                                <pre class="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">\${exam.ocr_raw_text}</pre>
                                            </details>
                                        \` : '<span class="text-gray-400">-</span>'}
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            }

            function renderQuestionnaireData(responses) {
                const dataDiv = document.getElementById('questionnaireData');
                
                // Group by category
                const categories = {};
                responses.forEach(r => {
                    if (!categories[r.category]) {
                        categories[r.category] = [];
                    }
                    categories[r.category].push(r);
                });

                dataDiv.innerHTML = Object.keys(categories).map(category => \`
                    <details class="mb-4 border rounded-lg">
                        <summary class="cursor-pointer bg-gray-50 px-4 py-3 font-bold hover:bg-gray-100 rounded-lg">
                            📋 \${category} (\${categories[category].length}問)
                        </summary>
                        <div class="p-4">
                            \${categories[category].map(q => \`
                                <div class="mb-3 pb-3 border-b last:border-b-0">
                                    <div class="font-medium text-sm text-gray-700">Q\${q.question_number}. \${q.question_text}</div>
                                    <div class="text-sm text-blue-600 mt-1">→ \${q.answer_value}</div>
                                </div>
                            \`).join('')}
                        </div>
                    </details>
                \`).join('');
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

// Supplement master management page
adminRoutes.get('/supplements', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>サプリマスター管理 - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <nav class="bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-pills mr-2"></i>
                        サプリマスター管理
                    </h1>
                    <div class="space-x-4">
                        <a href="/admin/dashboard" class="hover:text-purple-200">
                            <i class="fas fa-arrow-left mr-1"></i>ダッシュボードに戻る
                        </a>
                        <button onclick="logout()" class="hover:text-purple-200">
                            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto p-6">
            <!-- Loading Message -->
            <div id="loadingMessage" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-spinner fa-spin mr-2"></i>データを読み込み中...
            </div>

            <!-- Error Message -->
            <div id="errorMessage" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-exclamation-triangle mr-2"></i><span id="errorText"></span>
            </div>

            <!-- Statistics -->
            <div class="grid md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">総サプリ数</p>
                            <p id="totalSupplements" class="text-3xl font-bold text-purple-600">0</p>
                        </div>
                        <i class="fas fa-pills text-4xl text-purple-600"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">有効サプリ</p>
                            <p id="activeSupplements" class="text-3xl font-bold text-green-600">0</p>
                        </div>
                        <i class="fas fa-check-circle text-4xl text-green-600"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">無効サプリ</p>
                            <p id="inactiveSupplements" class="text-3xl font-bold text-gray-600">0</p>
                        </div>
                        <i class="fas fa-times-circle text-4xl text-gray-600"></i>
                    </div>
                </div>
            </div>

            <!-- Filter and Actions -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">
                        <i class="fas fa-filter mr-2"></i>フィルター
                    </h2>
                </div>
                <div class="grid md:grid-cols-3 gap-4">
                    <select id="categoryFilter" class="border rounded-lg px-4 py-2" onchange="filterSupplements()">
                        <option value="">すべてのカテゴリ</option>
                        <option value="ビタミン">ビタミン</option>
                        <option value="ミネラル">ミネラル</option>
                        <option value="アミノ酸">アミノ酸</option>
                        <option value="脂質">脂質</option>
                        <option value="糖質">糖質</option>
                        <option value="その他">その他</option>
                    </select>

                    <select id="supplementCategoryFilter" class="border rounded-lg px-4 py-2" onchange="filterSupplements()">
                        <option value="">すべてのサプリカテゴリー</option>
                        <option value="必須栄養素">🌟 必須栄養素</option>
                        <option value="機能性食品">⚡ 機能性食品</option>
                        <option value="健康サポート">💚 健康サポート</option>
                    </select>

                    <select id="activeFilter" class="border rounded-lg px-4 py-2" onchange="filterSupplements()">
                        <option value="">すべて</option>
                        <option value="1">有効のみ</option>
                        <option value="0">無効のみ</option>
                    </select>
                </div>
            </div>

            <!-- Supplements Table -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4">
                    <i class="fas fa-list mr-2"></i>サプリメント一覧
                </h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品コード</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">形状</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">内容量</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">価格</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">サプリカテゴリー</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">推奨理由</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody id="supplementsTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <script>
            let allSupplements = [];

            async function checkAuth() {
                try {
                    const response = await axios.get('/api/admin/me');
                    if (!response.data.success || !response.data.admin) {
                        window.location.href = '/admin/login';
                    }
                } catch (error) {
                    window.location.href = '/admin/login';
                }
            }

            async function loadSupplements() {
                try {
                    const response = await axios.get('/api/admin/supplements');
                    
                    if (response.data.success) {
                        allSupplements = response.data.supplements || [];
                        updateStatistics();
                        displaySupplements(allSupplements);
                        document.getElementById('loadingMessage').classList.add('hidden');
                    } else {
                        throw new Error('サプリメントデータの取得に失敗しました');
                    }
                } catch (error) {
                    console.error('Error loading supplements:', error);
                    document.getElementById('loadingMessage').classList.add('hidden');
                    document.getElementById('errorMessage').classList.remove('hidden');
                    document.getElementById('errorText').textContent = 'サプリメントデータの読み込みに失敗しました: ' + error.message;
                }
            }

            function updateStatistics() {
                const total = allSupplements.length;
                const active = allSupplements.filter(s => s.is_active === 1).length;
                const inactive = total - active;

                document.getElementById('totalSupplements').textContent = total;
                document.getElementById('activeSupplements').textContent = active;
                document.getElementById('inactiveSupplements').textContent = inactive;
            }

            function displaySupplements(supplements) {
                const tbody = document.getElementById('supplementsTableBody');
                
                if (supplements.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500">サプリメントが登録されていません</td></tr>';
                    return;
                }

                tbody.innerHTML = supplements.map(supp => {
                    const statusBadge = supp.is_active === 1
                        ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">有効</span>'
                        : '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">無効</span>';
                    
                    const categoryBadgeConfig = {
                        '必須栄養素': { color: 'bg-red-100 text-red-800', icon: '🌟' },
                        '機能性食品': { color: 'bg-blue-100 text-blue-800', icon: '⚡' },
                        '健康サポート': { color: 'bg-green-100 text-green-800', icon: '💚' }
                    };
                    const badgeConfig = categoryBadgeConfig[supp.supplement_category] || { color: 'bg-gray-100 text-gray-800', icon: '📦' };
                    const categoryBadge = \`<span class="px-2 py-1 \${badgeConfig.color} rounded-full text-xs font-bold">\${badgeConfig.icon} \${supp.supplement_category || '健康サポート'}</span>\`;

                    const priceDisplay = supp.price ? '¥' + supp.price.toLocaleString() : '¥0';

                    return \`
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm">\${supp.product_code}</td>
                            <td class="px-4 py-3 text-sm font-medium">\${supp.product_name}</td>
                            <td class="px-4 py-3 text-sm">\${supp.category}</td>
                            <td class="px-4 py-3 text-sm">\${supp.form || '-'}</td>
                            <td class="px-4 py-3 text-sm">\${supp.content_amount || '-'}</td>
                            <td class="px-4 py-3 text-sm font-bold text-green-600">\${priceDisplay}</td>
                            <td class="px-4 py-3 text-sm">\${categoryBadge}</td>
                            <td class="px-4 py-3 text-sm">\${statusBadge}</td>
                            <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="\${supp.recommended_for || '-'}">
                                \${supp.recommended_for || '-'}
                            </td>
                            <td class="px-4 py-3 text-sm">
                                <button onclick="window.location.href='/admin/supplements/\${supp.id}/edit'" 
                                    class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i> 編集
                                </button>
                            </td>
                        </tr>
                    \`;
                }).join('');
            }

            function filterSupplements() {
                const category = document.getElementById('categoryFilter').value;
                const supplementCategory = document.getElementById('supplementCategoryFilter').value;
                const active = document.getElementById('activeFilter').value;

                let filtered = allSupplements;

                if (category) {
                    filtered = filtered.filter(s => s.category === category);
                }

                if (supplementCategory) {
                    filtered = filtered.filter(s => s.supplement_category === supplementCategory);
                }

                if (active !== '') {
                    filtered = filtered.filter(s => s.is_active === parseInt(active));
                }

                displaySupplements(filtered);
            }

            async function logout() {
                try {
                    await axios.post('/api/admin/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                }
                window.location.href = '/admin/login';
            }

            // Initialize
            checkAuth();
            loadSupplements();
        </script>
    </body>
    </html>
  `)
})

// Supplement edit page
adminRoutes.get('/supplements/:id/edit', (c) => {
  const supplementId = c.req.param('id')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>サプリ編集 - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <nav class="bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
            <div class="max-w-4xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-edit mr-2"></i>
                        サプリ編集
                    </h1>
                    <a href="/admin/supplements" class="hover:text-purple-200">
                        <i class="fas fa-arrow-left mr-1"></i>一覧に戻る
                    </a>
                </div>
            </div>
        </nav>

        <main class="max-w-4xl mx-auto p-6">
            <div id="loadingMessage" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-spinner fa-spin mr-2"></i>データを読み込み中...
            </div>

            <div id="errorMessage" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-exclamation-triangle mr-2"></i><span id="errorText"></span>
            </div>

            <div id="successMessage" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-check-circle mr-2"></i><span id="successText"></span>
            </div>

            <div id="editForm" class="hidden bg-white rounded-lg shadow-lg p-6">
                <form id="supplementForm">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">商品コード</label>
                            <input type="text" id="product_code" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" readonly>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">商品名 *</label>
                            <input type="text" id="product_name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">カテゴリ *</label>
                            <select id="category" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="">選択してください</option>
                                <option value="ビタミン">ビタミン</option>
                                <option value="ミネラル">ミネラル</option>
                                <option value="アミノ酸">アミノ酸</option>
                                <option value="脂質">脂質</option>
                                <option value="糖質">糖質</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">形状</label>
                            <input type="text" id="form" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="例: カプセル、パウダー">
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">内容量</label>
                            <input type="text" id="content_amount" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="例: 60カプセル">
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">価格(円) *</label>
                            <input type="number" id="price" required min="0" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="2980">
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">サプリカテゴリー *</label>
                            <select id="supplement_category" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="必須栄養素">必須栄養素</option>
                                <option value="機能性食品">機能性食品</option>
                                <option value="健康サポート">健康サポート</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">状態 *</label>
                            <select id="is_active" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="1">有効</option>
                                <option value="0">無効</option>
                            </select>
                        </div>
                    </div>

                    <div class="mt-6">
                        <label class="block text-sm font-bold text-gray-700 mb-2">成分</label>
                        <textarea id="ingredients" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="主要成分を入力"></textarea>
                    </div>

                    <div class="mt-6">
                        <label class="block text-sm font-bold text-gray-700 mb-2">説明</label>
                        <textarea id="description" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="商品説明を入力"></textarea>
                    </div>

                    <div class="mt-6">
                        <label class="block text-sm font-bold text-gray-700 mb-2">推奨理由</label>
                        <textarea id="recommended_for" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="推奨理由を入力"></textarea>
                    </div>

                    <div class="mt-8 flex gap-4">
                        <button type="submit" class="flex-1 btn-3d bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-bold">
                            <i class="fas fa-save mr-2"></i>保存
                        </button>
                        <button type="button" onclick="window.location.href='/admin/supplements'" class="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition font-bold">
                            <i class="fas fa-times mr-2"></i>キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </main>

        <script>
            const supplementId = ${supplementId};

            async function checkAuth() {
                try {
                    const response = await axios.get('/api/admin/me');
                    if (!response.data.success || !response.data.admin) {
                        window.location.href = '/admin/login';
                    }
                } catch (error) {
                    window.location.href = '/admin/login';
                }
            }

            async function loadSupplement() {
                try {
                    const response = await axios.get(\`/api/admin/supplements/\${supplementId}\`);
                    
                    if (response.data.success && response.data.supplement) {
                        const supp = response.data.supplement;
                        
                        document.getElementById('product_code').value = supp.product_code || '';
                        document.getElementById('product_name').value = supp.product_name || '';
                        document.getElementById('category').value = supp.category || '';
                        document.getElementById('form').value = supp.form || '';
                        document.getElementById('content_amount').value = supp.content_amount || '';
                        document.getElementById('price').value = supp.price || 0;
                        document.getElementById('supplement_category').value = supp.supplement_category || '健康サポート';
                        document.getElementById('is_active').value = supp.is_active || 1;
                        document.getElementById('ingredients').value = supp.ingredients || '';
                        document.getElementById('description').value = supp.description || '';
                        document.getElementById('recommended_for').value = supp.recommended_for || '';
                        
                        document.getElementById('loadingMessage').classList.add('hidden');
                        document.getElementById('editForm').classList.remove('hidden');
                    } else {
                        throw new Error('サプリメントが見つかりません');
                    }
                } catch (error) {
                    console.error('Error loading supplement:', error);
                    document.getElementById('loadingMessage').classList.add('hidden');
                    document.getElementById('errorMessage').classList.remove('hidden');
                    document.getElementById('errorText').textContent = 'サプリメントデータの読み込みに失敗しました: ' + error.message;
                }
            }

            document.getElementById('supplementForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const data = {
                    product_name: document.getElementById('product_name').value,
                    category: document.getElementById('category').value,
                    form: document.getElementById('form').value,
                    content_amount: document.getElementById('content_amount').value,
                    price: parseInt(document.getElementById('price').value) || 0,
                    supplement_category: document.getElementById('supplement_category').value,
                    is_active: parseInt(document.getElementById('is_active').value),
                    ingredients: document.getElementById('ingredients').value,
                    description: document.getElementById('description').value,
                    recommended_for: document.getElementById('recommended_for').value
                };

                try {
                    const response = await axios.put(\`/api/admin/supplements/\${supplementId}\`, data);
                    
                    if (response.data.success) {
                        document.getElementById('successMessage').classList.remove('hidden');
                        document.getElementById('successText').textContent = '保存しました!';
                        
                        setTimeout(() => {
                            window.location.href = '/admin/supplements';
                        }, 1500);
                    } else {
                        throw new Error(response.data.error || '保存に失敗しました');
                    }
                } catch (error) {
                    console.error('Error saving supplement:', error);
                    document.getElementById('errorMessage').classList.remove('hidden');
                    document.getElementById('errorText').textContent = '保存に失敗しました: ' + (error.response?.data?.error || error.message);
                }
            });

            // Initialize
            checkAuth();
            loadSupplement();
        </script>
    </body>
    </html>
  `)
})
