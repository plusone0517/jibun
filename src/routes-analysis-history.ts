import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const analysisHistoryRoutes = new Hono<{ Bindings: Bindings }>()

// AI analysis history page
analysisHistoryRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI解析履歴 - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg mb-8">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-600">
                        <a href="/dashboard" class="hover:text-blue-700">
                            <i class="fas fa-heartbeat mr-2"></i>
                            じぶんサプリ育成
                        </a>
                    </h1>
                    <div class="flex space-x-4">
                        <a href="/dashboard" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <a href="/analysis" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-robot mr-1"></i>新規解析
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 pb-12">
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-history mr-2"></i>AI解析履歴
                </h2>
                <p class="text-gray-600">過去のAI解析結果を確認できます</p>
            </div>

            <div id="loadingMessage" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-spinner fa-spin mr-2"></i>履歴を読み込み中...
            </div>

            <div id="noDataMessage" class="hidden bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-exclamation-triangle mr-2"></i>AI解析履歴がありません。
                <a href="/analysis" class="underline font-bold">AI解析を実行</a>
            </div>

            <div id="historyContainer" class="hidden space-y-6">
                <!-- Analysis history items will be populated here -->
            </div>
        </main>

        <script>
            let currentUser = null;

            async function loadAnalysisHistory() {
                try {
                    // Get current user
                    const authResponse = await axios.get('/api/auth/me');
                    if (!authResponse.data.success) {
                        window.location.href = '/auth/login';
                        return;
                    }
                    currentUser = authResponse.data.user;

                    // Fetch analysis history
                    const response = await axios.get(\`/api/analysis-history/\${currentUser.id}\`);
                    
                    document.getElementById('loadingMessage').classList.add('hidden');

                    if (!response.data.success || !response.data.analyses || response.data.analyses.length === 0) {
                        document.getElementById('noDataMessage').classList.remove('hidden');
                        return;
                    }

                    const analyses = response.data.analyses;
                    displayAnalysisHistory(analyses);

                } catch (error) {
                    console.error('Error loading analysis history:', error);
                    document.getElementById('loadingMessage').classList.add('hidden');
                    alert('履歴の読み込みに失敗しました: ' + error.message);
                }
            }

            function displayAnalysisHistory(analyses) {
                const container = document.getElementById('historyContainer');
                container.classList.remove('hidden');

                container.innerHTML = analyses.map((analysis, index) => {
                    const date = new Date(analysis.analysis_date);
                    const formattedDate = date.toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // Score color based on value
                    let scoreColor = 'text-green-600';
                    let scoreBg = 'bg-green-100';
                    if (analysis.overall_score < 50) {
                        scoreColor = 'text-red-600';
                        scoreBg = 'bg-red-100';
                    } else if (analysis.overall_score < 70) {
                        scoreColor = 'text-yellow-600';
                        scoreBg = 'bg-yellow-100';
                    }

                    return \`
                        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="flex items-center mb-2">
                                            <i class="fas fa-calendar-alt text-gray-600 mr-2"></i>
                                            <span class="text-gray-700 font-medium">\${formattedDate}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-sm text-gray-600 mr-2">総合スコア:</span>
                                            <span class="text-3xl font-bold \${scoreColor} \${scoreBg} px-4 py-1 rounded-lg">
                                                \${analysis.overall_score}
                                            </span>
                                            <span class="text-gray-500 ml-2">/ 100</span>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button onclick="viewAnalysisDetail(\${analysis.id})" 
                                                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                            <i class="fas fa-eye mr-1"></i>詳細表示
                                        </button>
                                        <button onclick="deleteAnalysis(\${analysis.id})" 
                                                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                                            <i class="fas fa-trash mr-1"></i>削除
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-6">
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 class="font-bold text-gray-800 mb-2 flex items-center">
                                            <i class="fas fa-notes-medical text-blue-600 mr-2"></i>
                                            健康アドバイス
                                        </h4>
                                        <p class="text-gray-700 text-sm line-clamp-3">\${analysis.health_advice || 'なし'}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-gray-800 mb-2 flex items-center">
                                            <i class="fas fa-apple-alt text-green-600 mr-2"></i>
                                            栄養指導
                                        </h4>
                                        <p class="text-gray-700 text-sm line-clamp-3">\${analysis.nutrition_guidance || 'なし'}</p>
                                    </div>
                                </div>
                                
                                <div class="mt-4">
                                    <h4 class="font-bold text-gray-800 mb-2 flex items-center">
                                        <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                                        リスク評価
                                    </h4>
                                    <p class="text-gray-700 text-sm line-clamp-2">\${analysis.risk_assessment || 'なし'}</p>
                                </div>
                            </div>
                        </div>
                    \`;
                }).join('');
            }

            async function viewAnalysisDetail(analysisId) {
                // TODO: Implement detail view in modal or new page
                alert('詳細表示機能は実装中です。分析ID: ' + analysisId);
            }

            async function deleteAnalysis(analysisId) {
                if (!confirm('この解析結果を削除してもよろしいですか？\\nこの操作は取り消せません。')) {
                    return;
                }

                try {
                    const response = await axios.delete(\`/api/analysis/\${analysisId}\`);
                    if (response.data.success) {
                        alert('解析結果を削除しました');
                        loadAnalysisHistory(); // Reload history
                    } else {
                        alert('削除に失敗しました: ' + response.data.error);
                    }
                } catch (error) {
                    console.error('Error deleting analysis:', error);
                    alert('削除中にエラーが発生しました');
                }
            }

            // Load history on page load
            loadAnalysisHistory();
        </script>
    </body>
    </html>
  `)
})
