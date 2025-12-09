import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const analysisRoutes = new Hono<{ Bindings: Bindings }>()

// Analysis page with radar chart and PDF generation
analysisRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI解析結果 - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg mb-8">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-600">
                        <a href="/" class="hover:text-blue-700">
                            <i class="fas fa-heartbeat mr-2"></i>
                            じぶんサプリ育成
                        </a>
                    </h1>
                    <a href="/" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-home mr-1"></i>ホーム
                    </a>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 pb-12">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-robot text-indigo-600 mr-3"></i>
                    AI健康解析
                </h2>
                <p class="text-gray-600">解析に使用する検査データを選択してください</p>
            </div>

            <!-- Exam Data Selection -->
            <div id="examSelectionSection" class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-vial text-blue-600 mr-3"></i>
                    検査データを選択
                </h3>
                <div id="examListContainer" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        検査データを読み込み中...
                    </p>
                </div>
            </div>

            <!-- Questionnaire Selection -->
            <div id="questionnaireSelectionSection" class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-clipboard-list text-green-600 mr-3"></i>
                    問診結果を選択
                </h3>
                <div id="questionnaireContainer">
                    <p class="text-gray-500 text-center py-4">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        問診データを読み込み中...
                    </p>
                </div>
            </div>

            <!-- Analysis Button -->
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-lg p-8 mb-6">
                <div class="text-center">
                    <p class="text-gray-700 mb-4">選択したデータを使用してAI解析を実行します</p>
                    <button onclick="startAnalysis()" id="analyzeButton" class="btn-3d bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        <i class="fas fa-robot mr-2"></i>🤖 AI解析を実行する
                    </button>
                    <p id="selectionSummary" class="text-sm text-gray-600 mt-3"></p>
                </div>
            </div>

            <!-- Loading state (initially hidden) -->
            <div id="loadingState" class="hidden bg-white rounded-lg shadow-lg p-8 text-center">
                <div class="flex flex-col items-center">
                    <!-- Pulsing brain animation instead of spinning -->
                    <div class="relative mb-6">
                        <div class="text-6xl animate-pulse">🧠</div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin opacity-30"></div>
                        </div>
                    </div>
                    <p class="text-xl font-bold text-gray-800 mb-2">AI解析を実行中...</p>
                    <p class="text-sm text-gray-600">健康データを分析しています</p>
                    <div class="mt-4 flex space-x-1">
                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
            </div>

            <!-- Results container (initially hidden) -->
            <div id="resultsContainer" class="hidden">
                <!-- Overall Score -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h3 class="text-2xl font-bold mb-4 text-center">総合健康スコア</h3>
                    <div class="flex justify-center items-center">
                        <div class="relative">
                            <svg class="transform -rotate-90 w-48 h-48">
                                <circle cx="96" cy="96" r="80" stroke="#e5e7eb" stroke-width="16" fill="transparent"/>
                                <circle id="scoreCircle" cx="96" cy="96" r="80" stroke="#3b82f6" stroke-width="16" 
                                        fill="transparent" stroke-dasharray="502.4" stroke-dashoffset="502.4"
                                        class="transition-all duration-1000 ease-out"/>
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="text-center">
                                    <div id="scoreValue" class="text-5xl font-bold text-blue-600">--</div>
                                    <div class="text-gray-500 text-sm">/ 100</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="scoreAssessment" class="text-center mt-4 text-lg font-medium text-gray-700"></div>
                </div>

                <!-- Data Completeness Score -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6" id="dataCompletenessSection">
                    <h3 class="text-2xl font-bold mb-6 text-center flex items-center justify-center">
                        <i class="fas fa-clipboard-check text-blue-600 mr-3"></i>
                        データ完全性スコア
                    </h3>
                    <div class="max-w-3xl mx-auto">
                        <div class="flex justify-center mb-6">
                            <div class="relative w-48 h-48">
                                <svg class="transform -rotate-90 w-full h-full">
                                    <circle cx="96" cy="96" r="80" stroke="#e5e7eb" stroke-width="16" fill="transparent"/>
                                    <circle id="completenessCircle" cx="96" cy="96" r="80" stroke="#10b981" stroke-width="16" 
                                            fill="transparent" stroke-dasharray="502.4" stroke-dashoffset="502.4"
                                            class="transition-all duration-1000 ease-out"/>
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="text-center">
                                        <div id="completenessValue" class="text-4xl font-bold text-green-600">--</div>
                                        <div class="text-gray-500 text-xs">/ 100</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="completenessDetails" class="space-y-3"></div>
                        <div id="missingDataSuggestions" class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 hidden">
                            <h4 class="font-bold text-yellow-800 mb-2">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                推奨される追加検査
                            </h4>
                            <ul id="suggestionsList" class="list-disc list-inside text-sm text-yellow-700"></ul>
                        </div>
                    </div>
                </div>

                <!-- Health Advice -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h3 class="text-2xl font-bold mb-4 flex items-center">
                        <i class="fas fa-lightbulb text-yellow-500 mr-3"></i>
                        健康アドバイス
                    </h3>
                    <div id="healthAdvice" class="prose max-w-none text-gray-700 whitespace-pre-wrap"></div>
                </div>

                <!-- Nutrition Guidance -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h3 class="text-2xl font-bold mb-4 flex items-center">
                        <i class="fas fa-apple-alt text-green-500 mr-3"></i>
                        栄養指導
                    </h3>
                    <div id="nutritionGuidance" class="prose max-w-none text-gray-700 whitespace-pre-wrap"></div>
                </div>

                <!-- Risk Assessment -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h3 class="text-2xl font-bold mb-4 flex items-center">
                        <i class="fas fa-exclamation-triangle text-orange-500 mr-3"></i>
                        健康リスク評価
                    </h3>
                    <div id="riskAssessment" class="prose max-w-none text-gray-700 whitespace-pre-wrap"></div>
                </div>

                <!-- Supplement Recommendations -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h3 class="text-2xl font-bold mb-4 flex items-center">
                        <i class="fas fa-pills text-purple-500 mr-3"></i>
                        推奨サプリメント
                    </h3>
                    <div class="mb-4 bg-blue-50 border border-blue-300 rounded-lg p-4">
                        <p class="text-sm text-gray-700">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            お好きなサプリメントを選択してください。選択したサプリの合計金額が表示されます。
                        </p>
                    </div>
                    <div id="supplementRecommendations" class="space-y-3"></div>
                    <div id="totalPrice" class="hidden mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-bold text-gray-800">選択したサプリの合計金額:</span>
                            <span class="text-2xl font-bold text-purple-600" id="totalPriceValue">¥0</span>
                        </div>
                        <div class="mt-2 text-sm text-gray-600">
                            <span id="selectedCount">0</span>個のサプリメントを選択中
                        </div>
                    </div>
                </div>

                <!-- PDF Download Button -->
                <div class="bg-white rounded-lg shadow-lg p-8 text-center">
                    <h3 class="text-2xl font-bold mb-4">サプリ処方オーダーシート</h3>
                    <p class="text-gray-600 mb-6">解析結果とサプリメント推奨をPDFでダウンロードできます</p>
                    <button onclick="generatePDF()" class="btn-3d bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition font-bold text-lg">
                        <i class="fas fa-file-pdf mr-2"></i>PDFをダウンロード
                    </button>
                </div>
            </div>

            <!-- Error message -->
            <div id="errorMessage" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong class="font-bold">エラー！</strong>
                <span class="block sm:inline" id="errorText"></span>
            </div>
        </main>

        <script>
            let analysisData = null;

            let selectedExamIds = [];
            let allExamData = [];
            let questionnaireData = [];
            let useQuestionnaire = false;
            let currentUser = null;

            async function loadExamData() {
                try {
                    // Check authentication
                    const authResponse = await axios.get('/api/auth/me');
                    if (!authResponse.data.success || !authResponse.data.user) {
                        window.location.href = '/auth/login';
                        return;
                    }
                    currentUser = authResponse.data.user;

                    // Load exam data
                    const examResponse = await axios.get(\`/api/history/\${currentUser.id}\`);
                    if (examResponse.data.success) {
                        allExamData = examResponse.data.exams || [];
                        displayExamList(allExamData);
                    } else {
                        document.getElementById('examListContainer').innerHTML = \`
                            <p class="text-gray-500 text-center py-4">
                                <i class="fas fa-info-circle mr-2"></i>
                                検査データがありません。<a href="/exam" class="text-blue-600 hover:underline">検査データを入力する</a>
                            </p>
                        \`;
                    }

                    // Load questionnaire data
                    try {
                        const questionnaireResponse = await axios.get(\`/questionnaire/api/\${currentUser.id}\`);
                        if (questionnaireResponse.data.success) {
                            questionnaireData = questionnaireResponse.data.responses || [];
                            displayQuestionnaireOption(questionnaireData);
                        } else {
                            displayQuestionnaireOption([]);
                        }
                    } catch (qError) {
                        console.log('No questionnaire data available');
                        displayQuestionnaireOption([]);
                    }
                } catch (error) {
                    console.error('Error loading exam data:', error);
                    // If auth error, redirect to login
                    if (error.response && error.response.status === 401) {
                        window.location.href = '/auth/login';
                        return;
                    }
                    document.getElementById('examListContainer').innerHTML = \`
                        <p class="text-red-500 text-center py-4">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            データの読み込みに失敗しました: \${error.message}
                        </p>
                    \`;
                    document.getElementById('questionnaireContainer').innerHTML = \`
                        <p class="text-red-500 text-center py-4">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            データの読み込みに失敗しました
                        </p>
                    \`;
                }
            }

            function displayExamList(exams) {
                const container = document.getElementById('examListContainer');
                
                if (!exams || exams.length === 0) {
                    container.innerHTML = \`
                        <p class="text-gray-500 text-center py-4">
                            <i class="fas fa-info-circle mr-2"></i>
                            検査データがありません。<a href="/exam" class="text-blue-600 hover:underline">検査データを入力する</a>
                        </p>
                    \`;
                    return;
                }

                const examTypeNames = {
                    'blood_pressure': '血圧測定',
                    'body_composition': '体組成測定',
                    'blood_test': '血液検査',
                    'custom': 'カスタム検査'
                };

                container.innerHTML = exams.map(exam => {
                    const isOcr = exam.data_source === 'ocr';
                    const borderClass = isOcr ? 'border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50' : 'border';
                    
                    return \`
                    <div class="\${borderClass} rounded-lg p-4 hover:shadow-md transition">
                        <label class="flex items-start cursor-pointer">
                            <input type="checkbox" 
                                   class="exam-checkbox mt-1 mr-3 w-5 h-5 text-blue-600"
                                   data-exam-id="\${exam.id}"
                                   onchange="toggleExamSelection(\${exam.id})"
                                   checked>
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2 flex-wrap">
                                    <span class="font-bold text-gray-800">\${exam.exam_date}</span>
                                    <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        \${examTypeNames[exam.exam_type] || exam.exam_type}
                                    </span>
                                    \${isOcr ? '<span class="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-bold">🪄 AI解析</span>' : '<span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">✏️ 手入力</span>'}
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
                        </label>
                    </div>
                    \`;
                }).join('');

                // Initially select all exams
                selectedExamIds = exams.map(e => e.id);
                updateAnalysisButton();
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

            function toggleExamSelection(examId) {
                const index = selectedExamIds.indexOf(examId);
                if (index > -1) {
                    selectedExamIds.splice(index, 1);
                } else {
                    selectedExamIds.push(examId);
                }
                updateAnalysisButton();
            }

            function displayQuestionnaireOption(responses) {
                const container = document.getElementById('questionnaireContainer');
                
                if (!responses || responses.length === 0) {
                    container.innerHTML = \`
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <i class="fas fa-clipboard-list text-gray-400 text-3xl mb-3"></i>
                            <p class="text-gray-500 mb-3">まだ問診を完了していません</p>
                            <a href="/questionnaire" class="text-blue-600 hover:underline">
                                <i class="fas fa-arrow-right mr-1"></i>問診を始める
                            </a>
                        </div>
                    \`;
                    return;
                }

                const questionCount = responses.length;
                const completionRate = Math.round((questionCount / 50) * 100);
                
                container.innerHTML = \`
                    <div class="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                        <label class="flex items-start cursor-pointer">
                            <input type="checkbox" 
                                   id="questionnaireCheckbox"
                                   class="mt-1 mr-3 w-5 h-5 text-green-600"
                                   onchange="toggleQuestionnaireSelection()"
                                   checked>
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <span class="font-bold text-gray-800">健康問診（50問）</span>
                                    <span class="text-sm bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                                        \${completionRate}% 完了
                                    </span>
                                </div>
                                <div class="text-sm text-gray-600">
                                    <p><i class="fas fa-check-circle text-green-600 mr-1"></i>\${questionCount}問 / 50問 回答済み</p>
                                    <p class="text-xs text-gray-500 mt-1">最終更新: \${new Date(responses[0].created_at).toLocaleString('ja-JP')}</p>
                                </div>
                            </div>
                        </label>
                    </div>
                \`;
                
                // Initially selected
                useQuestionnaire = true;
                updateAnalysisButton();
            }

            function toggleQuestionnaireSelection() {
                useQuestionnaire = document.getElementById('questionnaireCheckbox').checked;
                updateAnalysisButton();
            }

            function updateAnalysisButton() {
                const button = document.getElementById('analyzeButton');
                const summary = document.getElementById('selectionSummary');
                
                const hasData = selectedExamIds.length > 0 || useQuestionnaire;
                button.disabled = !hasData;
                
                if (!hasData) {
                    button.innerHTML = '<i class="fas fa-robot mr-2"></i>🤖 データを選択してください';
                    summary.textContent = '';
                } else {
                    button.innerHTML = '<i class="fas fa-robot mr-2"></i>🤖 AI解析を実行する';
                    
                    const parts = [];
                    if (selectedExamIds.length > 0) {
                        parts.push(\`検査データ: \${selectedExamIds.length}件\`);
                    }
                    if (useQuestionnaire) {
                        parts.push(\`問診: \${questionnaireData.length}問\`);
                    }
                    summary.textContent = '選択中: ' + parts.join(' + ');
                }
            }

            async function startAnalysis() {
                // Hide selection sections
                document.getElementById('examSelectionSection').style.display = 'none';
                document.getElementById('questionnaireSelectionSection').style.display = 'none';
                document.getElementById('loadingState').classList.remove('hidden');

                try {
                    // Perform AI analysis with selected data
                    const requestData = {
                        user_id: currentUser.id,
                        selected_exam_ids: selectedExamIds,
                        use_questionnaire: useQuestionnaire
                    };
                    
                    const response = await axios.post('/api/analysis', requestData);

                    if (response.data.success) {
                        analysisData = response.data.analysis;
                        displayResults(analysisData);
                    } else {
                        showError(response.data.error || '解析に失敗しました');
                    }
                } catch (error) {
                    console.error('Error loading analysis:', error);
                    showError('解析中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            }

            function displayResults(data) {
                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('resultsContainer').classList.remove('hidden');

                // Calculate and display data completeness
                const completeness = calculateDataCompleteness();
                displayDataCompleteness(completeness);

                // Display overall score (clamp to 0-100 range)
                const score = Math.min(100, Math.max(0, Math.round(data.overall_score)));
                displayScore(score);

                // Display health advice
                document.getElementById('healthAdvice').textContent = data.health_advice;
                document.getElementById('nutritionGuidance').textContent = data.nutrition_guidance;
                document.getElementById('riskAssessment').textContent = data.risk_assessment;

                // Display supplements
                console.log('Full analysis data:', data);
                console.log('Received supplements:', data.supplements);
                console.log('Supplements type:', typeof data.supplements);
                console.log('Is array?:', Array.isArray(data.supplements));
                
                if (data.supplements && data.supplements.length > 0) {
                    console.log('Displaying', data.supplements.length, 'supplements');
                    displaySupplements(data.supplements);
                } else {
                    console.warn('No supplements received from API');
                    console.warn('Data structure:', JSON.stringify(data, null, 2));
                    const container = document.getElementById('supplementRecommendations');
                    const debugInfo = JSON.stringify(data.supplements);
                    container.innerHTML = '<div class="bg-yellow-50 border border-yellow-200 rounded p-4">' +
                        '<p class="text-yellow-800 font-semibold">⚠️ サプリメント情報が取得できませんでした</p>' +
                        '<p class="text-sm text-yellow-700 mt-2">デバッグ情報: supplements=' + debugInfo + '</p>' +
                        '</div>';
                }
            }

            function calculateDataCompleteness() {
                // Get selected exams
                const selectedExams = allExamData.filter(exam => selectedExamIds.includes(exam.id));
                
                // Define required exam types and their measurement counts
                const requiredTypes = {
                    'blood_pressure': { name: '血圧測定', minMeasurements: 2, weight: 20 },
                    'body_composition': { name: '体組成測定', minMeasurements: 3, weight: 25 },
                    'blood_test': { name: '血液検査', minMeasurements: 5, weight: 35 }
                };
                
                const questionnaire_weight = 20; // 20% for questionnaire
                
                let totalScore = 0;
                let details = [];
                let missing = [];
                
                // Check each required exam type
                Object.keys(requiredTypes).forEach(type => {
                    const typeExams = selectedExams.filter(e => e.exam_type === type);
                    const config = requiredTypes[type];
                    
                    if (typeExams.length > 0) {
                        // Calculate average measurement count
                        const avgMeasurements = typeExams.reduce((sum, exam) => 
                            sum + exam.measurements.length, 0) / typeExams.length;
                        
                        // Score based on measurement completeness
                        const completenessRatio = Math.min(1, avgMeasurements / config.minMeasurements);
                        const typeScore = config.weight * completenessRatio;
                        totalScore += typeScore;
                        
                        details.push({
                            name: config.name,
                            count: typeExams.length,
                            avgMeasurements: Math.round(avgMeasurements),
                            score: Math.round(completenessRatio * 100),
                            color: completenessRatio >= 0.8 ? 'green' : completenessRatio >= 0.5 ? 'yellow' : 'red'
                        });
                    } else {
                        missing.push(config.name);
                        details.push({
                            name: config.name,
                            count: 0,
                            avgMeasurements: 0,
                            score: 0,
                            color: 'red'
                        });
                    }
                });
                
                // Check questionnaire completeness
                const expectedQuestions = 50;
                const actualQuestions = questionnaireData.length;
                const questionnaireRatio = Math.min(1, actualQuestions / expectedQuestions);
                const questionnaireScore = questionnaire_weight * questionnaireRatio;
                totalScore += questionnaireScore;
                
                // Add questionnaire details
                details.push({
                    name: '健康問診',
                    count: actualQuestions > 0 ? 1 : 0,
                    avgMeasurements: actualQuestions,
                    score: Math.round(questionnaireRatio * 100),
                    color: questionnaireRatio >= 0.8 ? 'green' : questionnaireRatio >= 0.5 ? 'yellow' : 'red',
                    isQuestionnaire: true
                });
                
                if (actualQuestions === 0) {
                    missing.push('健康問診（50問）');
                }
                
                return {
                    score: Math.round(totalScore),
                    details: details,
                    missing: missing
                };
            }

            function displayDataCompleteness(completeness) {
                const circle = document.getElementById('completenessCircle');
                const valueEl = document.getElementById('completenessValue');
                const detailsEl = document.getElementById('completenessDetails');
                const suggestionsEl = document.getElementById('missingDataSuggestions');
                const suggestionsListEl = document.getElementById('suggestionsList');
                
                // Animate completeness score
                const score = completeness.score;
                let current = 0;
                const duration = 1000;
                const steps = 50;
                const increment = score / steps;
                const stepDuration = duration / steps;
                
                const animate = setInterval(() => {
                    current += increment;
                    if (current >= score) {
                        current = score;
                        clearInterval(animate);
                    }
                    valueEl.textContent = Math.round(current);
                    
                    const circumference = 502.4;
                    const offset = circumference - (current / 100 * circumference);
                    circle.style.strokeDashoffset = offset;
                    
                    if (current >= 80) {
                        circle.style.stroke = '#10b981'; // green
                    } else if (current >= 50) {
                        circle.style.stroke = '#f59e0b'; // orange
                    } else {
                        circle.style.stroke = '#ef4444'; // red
                    }
                }, stepDuration);
                
                // Display details
                detailsEl.innerHTML = completeness.details.map(detail => {
                    const colorClass = {
                        'green': 'bg-green-100 border-green-500',
                        'yellow': 'bg-yellow-100 border-yellow-500',
                        'red': 'bg-red-100 border-red-500'
                    }[detail.color];
                    
                    const detailText = detail.isQuestionnaire 
                        ? \`(\${detail.avgMeasurements}/50問回答済み)\`
                        : \`(\${detail.count}件、平均\${detail.avgMeasurements}項目)\`;
                    
                    return \`
                        <div class="flex items-center justify-between p-3 border-l-4 \${colorClass} rounded">
                            <div>
                                <span class="font-semibold">\${detail.name}</span>
                                <span class="text-sm text-gray-600 ml-2">
                                    \${detailText}
                                </span>
                            </div>
                            <span class="font-bold text-lg">\${detail.score}%</span>
                        </div>
                    \`;
                }).join('');
                
                // Display missing data suggestions
                if (completeness.missing.length > 0) {
                    suggestionsEl.classList.remove('hidden');
                    suggestionsListEl.innerHTML = completeness.missing.map(item => 
                        \`<li>\${item}のデータを追加することで、より精度の高い解析が可能になります</li>\`
                    ).join('');
                } else {
                    suggestionsEl.classList.add('hidden');
                }
            }

            function displayScore(score) {
                const scoreCircle = document.getElementById('scoreCircle');
                const scoreValue = document.getElementById('scoreValue');
                const scoreAssessment = document.getElementById('scoreAssessment');

                // Animate score
                let current = 0;
                const duration = 1000;
                const steps = 50;
                const increment = score / steps;
                const stepDuration = duration / steps;

                const animate = setInterval(() => {
                    current += increment;
                    if (current >= score) {
                        current = score;
                        clearInterval(animate);
                    }
                    scoreValue.textContent = Math.round(current);
                    
                    // Update circle
                    const circumference = 502.4;
                    const offset = circumference - (current / 100 * circumference);
                    scoreCircle.style.strokeDashoffset = offset;
                    
                    // Update color based on score
                    if (current >= 80) {
                        scoreCircle.style.stroke = '#10b981'; // green
                    } else if (current >= 60) {
                        scoreCircle.style.stroke = '#3b82f6'; // blue
                    } else if (current >= 40) {
                        scoreCircle.style.stroke = '#f59e0b'; // orange
                    } else {
                        scoreCircle.style.stroke = '#ef4444'; // red
                    }
                }, stepDuration);

                // Display assessment
                if (score >= 80) {
                    scoreAssessment.textContent = '素晴らしい健康状態です！';
                    scoreAssessment.classList.add('text-green-600');
                } else if (score >= 60) {
                    scoreAssessment.textContent = '良好な健康状態です';
                    scoreAssessment.classList.add('text-blue-600');
                } else if (score >= 40) {
                    scoreAssessment.textContent = '改善の余地があります';
                    scoreAssessment.classList.add('text-orange-600');
                } else {
                    scoreAssessment.textContent = '注意が必要です';
                    scoreAssessment.classList.add('text-red-600');
                }
            }

            let selectedSupplements = [];

            async function displaySupplements(supplements) {
                const container = document.getElementById('supplementRecommendations');
                
                // Load master data for supplements
                try {
                    const masterResponse = await axios.get('/api/supplements/master');
                    const masterData = masterResponse.data.supplements || [];
                    
                    // Create a map of master data by product name for quick lookup
                    const masterMap = {};
                    masterData.forEach(item => {
                        masterMap[item.product_name] = item;
                    });
                    
                    // Display supplements with enhanced information from master data
                    container.innerHTML = supplements.map((supp, index) => {
                        // CRITICAL FIX: Handle both 'name' and 'supplement_name' for compatibility
                        const suppName = supp.supplement_name || supp.name
                        const suppType = supp.supplement_type || supp.type
                        const masterInfo = masterMap[suppName] || {};
                        const price = masterInfo.price || 0;
                        const categoryColor = {
                            '糖質': 'bg-amber-50 border-amber-300',
                            '脂質': 'bg-blue-50 border-blue-300',
                            'アミノ酸': 'bg-red-50 border-red-300',
                            'ビタミン': 'bg-yellow-50 border-yellow-300',
                            'ミネラル': 'bg-green-50 border-green-300',
                            '食物繊維': 'bg-teal-50 border-teal-300',
                            'フィトケミカル': 'bg-purple-50 border-purple-300',
                            'プレバイオ': 'bg-pink-50 border-pink-300'
                        }[masterInfo.category] || 'bg-gray-50 border-gray-300';
                        
                        return \`
                            <div class="border-2 \${categoryColor} rounded-lg p-4 hover:shadow-md transition relative">
                                <div class="flex items-start gap-3">
                                    <div class="flex items-center pt-1">
                                        <input type="checkbox" 
                                            id="supp_\${index}" 
                                            data-name="\${suppName}"
                                            data-price="\${price}"
                                            onchange="toggleSupplement(this)"
                                            class="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                    </div>
                                    <label for="supp_\${index}" class="flex-1 cursor-pointer">
                                        <div class="flex justify-between items-start mb-2">
                                            <div class="flex-1">
                                                <h4 class="font-bold text-lg text-gray-800">\${suppName}</h4>
                                                \${masterInfo.product_code ? \`<span class="text-xs text-gray-500">[\${masterInfo.product_code}]</span>\` : ''}
                                            </div>
                                            <div class="flex flex-col items-end gap-1 ml-3">
                                                <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                                                    \${getPriorityLabel(supp.priority)}
                                                </span>
                                                <span class="text-lg font-bold text-green-600">
                                                    ¥\${price.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        \${masterInfo.category ? \`
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="text-xs bg-white px-2 py-1 rounded border font-semibold">
                                                    \${masterInfo.category}
                                                </span>
                                                <span class="text-xs text-gray-600">
                                                    \${masterInfo.form || ''} | \${masterInfo.content_amount || ''}
                                                </span>
                                            </div>
                                        \` : ''}
                                        
                                        \${masterInfo.description ? \`
                                            <p class="text-sm text-gray-700 mb-2 italic">\${masterInfo.description}</p>
                                        \` : ''}
                                        
                                        <p class="text-sm mb-1"><strong>用量:</strong> \${supp.dosage || masterInfo.content_amount || '-'}</p>
                                        <p class="text-sm mb-2"><strong>頻度:</strong> \${supp.frequency || '-'}</p>
                                        <p class="text-sm text-gray-700 bg-white p-2 rounded">
                                            <strong>推奨理由:</strong> \${supp.reason || masterInfo.recommended_for || '-'}
                                        </p>
                                    </label>
                                </div>
                            </div>
                        \`;
                    }).join('');
                    
                    // Show total price section
                    document.getElementById('totalPrice').classList.remove('hidden');
                } catch (error) {
                    console.error('Error loading supplement master data:', error);
                    // Fallback to basic display
                    container.innerHTML = supplements.map((supp, index) => \`
                        <div class="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition">
                            <div class="flex items-start gap-3">
                                <input type="checkbox" 
                                    id="supp_\${index}" 
                                    data-name="\${supp.supplement_name}"
                                    data-price="0"
                                    onchange="toggleSupplement(this)"
                                    class="w-5 h-5 text-purple-600 rounded">
                                <label for="supp_\${index}" class="flex-1 cursor-pointer">
                                    <div class="flex justify-between items-start mb-2">
                                        <h4 class="font-bold text-lg text-purple-700">\${supp.supplement_name}</h4>
                                        <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">\${getPriorityLabel(supp.priority)}</span>
                                    </div>
                                    <p class="text-sm text-gray-600 mb-2">\${supp.supplement_type || ''}</p>
                                    <p class="text-sm mb-2"><strong>用量:</strong> \${supp.dosage || '-'}</p>
                                    <p class="text-sm mb-2"><strong>頻度:</strong> \${supp.frequency || '-'}</p>
                                    <p class="text-sm text-gray-700"><strong>推奨理由:</strong> \${supp.reason || '-'}</p>
                                </label>
                            </div>
                        </div>
                    \`).join('');
                }
            }

            function toggleSupplement(checkbox) {
                const name = checkbox.dataset.name;
                const price = parseInt(checkbox.dataset.price) || 0;
                
                if (checkbox.checked) {
                    selectedSupplements.push({ name, price });
                } else {
                    selectedSupplements = selectedSupplements.filter(s => s.name !== name);
                }
                
                updateTotalPrice();
            }

            function updateTotalPrice() {
                const total = selectedSupplements.reduce((sum, supp) => sum + supp.price, 0);
                document.getElementById('totalPriceValue').textContent = '¥' + total.toLocaleString();
                document.getElementById('selectedCount').textContent = selectedSupplements.length;
            }

            function getPriorityLabel(priority) {
                const labels = {
                    1: '高優先度',
                    2: '中優先度',
                    3: '低優先度'
                };
                return labels[priority] || '中優先度';
            }

            async function generatePDF() {
                try {
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    
                    // PDF header
                    pdf.setFontSize(20);
                    pdf.text('じぶんサプリ育成', 105, 20, { align: 'center' });
                    pdf.setFontSize(16);
                    pdf.text('サプリメント処方オーダーシート', 105, 30, { align: 'center' });
                    pdf.setFontSize(10);
                    pdf.text('医療機関監修', 105, 36, { align: 'center' });
                    
                    const today = new Date().toLocaleDateString('ja-JP');
                    pdf.text('発行日: ' + today, 15, 50);
                    
                    // Overall score
                    pdf.setFontSize(14);
                    pdf.text('総合健康スコア', 15, 60);
                    pdf.setFontSize(24);
                    pdf.text(analysisData.overall_score.toFixed(0) + ' / 100', 15, 70);
                    
                    // Supplements section
                    pdf.setFontSize(14);
                    pdf.text('推奨サプリメント', 15, 85);
                    
                    let yPos = 95;
                    pdf.setFontSize(10);
                    
                    if (analysisData.supplements && analysisData.supplements.length > 0) {
                        analysisData.supplements.forEach((supp, index) => {
                            if (yPos > 270) {
                                pdf.addPage();
                                yPos = 20;
                            }
                            
                            pdf.setFont(undefined, 'bold');
                            pdf.text(\`\${index + 1}. \${supp.supplement_name}\`, 15, yPos);
                            yPos += 6;
                            
                            pdf.setFont(undefined, 'normal');
                            pdf.text(\`   用量: \${supp.dosage || '-'}\`, 15, yPos);
                            yPos += 5;
                            pdf.text(\`   頻度: \${supp.frequency || '-'}\`, 15, yPos);
                            yPos += 5;
                            
                            const reasonLines = pdf.splitTextToSize(\`   推奨理由: \${supp.reason || '-'}\`, 170);
                            pdf.text(reasonLines, 15, yPos);
                            yPos += (reasonLines.length * 5) + 5;
                        });
                    }
                    
                    // Add new page for advice
                    pdf.addPage();
                    yPos = 20;
                    
                    // Health advice
                    pdf.setFontSize(14);
                    pdf.text('健康アドバイス', 15, yPos);
                    yPos += 8;
                    pdf.setFontSize(10);
                    const adviceLines = pdf.splitTextToSize(analysisData.health_advice || '', 180);
                    pdf.text(adviceLines, 15, yPos);
                    
                    // Footer
                    const pageCount = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(8);
                        pdf.text('本資料は医学的アドバイスの代替ではありません。医師にご相談ください。', 105, 285, { align: 'center' });
                        pdf.text(\`ページ \${i} / \${pageCount}\`, 105, 290, { align: 'center' });
                    }
                    
                    // Save PDF
                    pdf.save('じぶんサプリ処方シート_' + today + '.pdf');
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    alert('PDF生成中にエラーが発生しました');
                }
            }

            function showError(message) {
                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('errorText').textContent = message;
                document.getElementById('errorMessage').classList.remove('hidden');
            }

            // Load exam data on page load
            window.addEventListener('load', loadExamData);
        </script>
    </body>
    </html>
  `)
})

// Perform AI analysis
analysisRoutes.post('/api', async (c) => {
  try {
    const { user_id, selected_exam_ids, use_questionnaire } = await c.req.json()

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    const db = c.env.DB
    const openaiApiKey = c.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return c.json({ success: false, error: 'OpenAI APIキーが設定されていません。.dev.varsファイルを確認してください。' }, 500)
    }

    // Fetch exam data - either selected exams or all exams
    let examData;
    if (selected_exam_ids && selected_exam_ids.length > 0) {
      // Use selected exams only
      const placeholders = selected_exam_ids.map(() => '?').join(',')
      examData = await db.prepare(
        `SELECT ed.*, GROUP_CONCAT(em.measurement_key || ':' || em.measurement_value || em.measurement_unit) as measurements
         FROM exam_data ed
         LEFT JOIN exam_measurements em ON ed.id = em.exam_data_id
         WHERE ed.user_id = ? AND ed.id IN (${placeholders})
         GROUP BY ed.id
         ORDER BY ed.exam_date DESC`
      ).bind(user_id, ...selected_exam_ids).all()
    } else {
      // Use all exams if no selection
      examData = await db.prepare(
        `SELECT ed.*, GROUP_CONCAT(em.measurement_key || ':' || em.measurement_value || em.measurement_unit) as measurements
         FROM exam_data ed
         LEFT JOIN exam_measurements em ON ed.id = em.exam_data_id
         WHERE ed.user_id = ?
         GROUP BY ed.id
         ORDER BY ed.exam_date DESC`
      ).bind(user_id).all()
    }

    // Fetch questionnaire responses if requested
    let questionnaireData = { results: [] };
    if (use_questionnaire !== false) {
      questionnaireData = await db.prepare(
        'SELECT * FROM questionnaire_responses WHERE user_id = ? ORDER BY question_number'
      ).bind(user_id).all()
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

    const questionnaireSummary = (use_questionnaire && questionnaireData.results && questionnaireData.results.length > 0)
      ? questionnaireData.results.map(q => 
          `Q${q.question_number}. ${q.question_text} → ${q.answer_value}`
        ).join('\n')
      : 'なし'

    // Get all supplements from master catalog for AI to select
    const supplementsMaster = await db.prepare(
      'SELECT product_code, product_name, category, supplement_category, content_amount, recommended_for, description, price FROM supplements_master WHERE is_active = 1 ORDER BY supplement_category, product_name'
    ).all()

    const supplementsList = supplementsMaster.results?.map((s: any) => 
      `[${s.product_code}] ${s.product_name} (${s.supplement_category}/${s.category}) - ${s.content_amount} - ¥${s.price}\n推奨用途: ${s.recommended_for || s.description}`
    ).join('\n\n') || '利用可能なサプリメントがありません'

    // Call OpenAI API
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '【重要】あなたは医療機関監修の健康アドバイザーです。提供された検査データと問診結果を詳細に分析し、**必ず具体的な項目名・数値・回答内容を明記しながら**、客観的で一貫性のある健康アドバイス、栄養指導、リスク評価を行ってください。検査データが提供されている場合、health_advice、nutrition_guidance、risk_assessmentのすべてで具体的な数値を引用することが必須です。サプリメントは3-5個を推奨してください。必ず有効なJSON形式で回答してください。'
          },
          {
            role: 'user',
            content: `以下のデータを分析して、総合的な健康アドバイスとサプリメント推奨を提供してください。

【検査データ】
${examSummary}

【問診結果（50問）】
${questionnaireSummary}

【利用可能なサプリメント一覧】
${supplementsList}

【スコア算出基準】
- 検査値が正常範囲内: 80-100点
- 軽度の異常: 60-79点
- 中等度の異常: 40-59点
- 重度の異常: 0-39点
※同じデータには常に同じスコアを付けてください

【サプリメント選択基準】
- 必須栄養素カテゴリーから2-3個選択
- 検査データや問診結果から判明した健康課題に対応するサプリメントを選択
- 合計で必ず6個選択してください
- 必ず[商品コード]を使用してください

**重要: 必ずJSON形式で回答してください。supplementsは必ず6個含めること:**

{
  "overall_score": 70,
  "health_advice": "【重要】必ず以下のフォーマットで記載してください:\n\n■検査データ分析\n提供された検査データから、具体的な項目名と数値を明記してください（例：HbA1c 5.5%、血糖値 95mg/dL など）。各数値が正常範囲内かどうか、懸念される点があれば具体的に指摘してください。\n\n■問診結果分析\n提供された問診データから、具体的な回答内容を引用してください（例：「睡眠時間：4-5時間」「ストレスレベル：中程度」など）。生活習慣の良い点、改善が必要な点を具体的に指摘してください。\n\n■総合アドバイス\n上記の検査データと問診結果を踏まえた、今後取り組むべき具体的なアクションプランを提示してください（500文字以上）。",
  "nutrition_guidance": "提供された検査データ（例：コレステロール値、血糖値など）と問診結果（例：食事習慣、外食頻度など）を必ず引用しながら、食事や栄養に関する具体的なアドバイスを詳しく記載してください（400文字以上）。不足している栄養素、摂取を控えるべき成分、推奨される食材や調理法などを具体的に提案してください。",
  "risk_assessment": "提供された検査値（項目名と数値を明記）や問診結果（具体的な回答内容を引用）から判明した健康リスクについて詳細に記載してください（400文字以上）。将来的に発症する可能性のある疾患、その予防方法、定期的にチェックすべき項目などを具体的に提示してください。",
  "supplements": [
    {"product_code": "S001", "name": "サプリメント1", "dosage": "用量", "frequency": "1日1回", "reason": "このサプリメントを推奨する詳細な理由を記載してください。検査データのどの項目に対応しているか、どのような健康効果が期待できるか、なぜこの時期に必要なのかを150文字以上で具体的に説明してください。"},
    {"product_code": "S002", "name": "サプリメント2", "dosage": "用量", "frequency": "1日1回", "reason": "このサプリメントを推奨する詳細な理由を記載してください。検査データのどの項目に対応しているか、どのような健康効果が期待できるか、なぜこの時期に必要なのかを150文字以上で具体的に説明してください。"},
    {"product_code": "S003", "name": "サプリメント3", "dosage": "用量", "frequency": "1日1回", "reason": "このサプリメントを推奨する詳細な理由を記載してください。検査データのどの項目に対応しているか、どのような健康効果が期待できるか、なぜこの時期に必要なのかを150文字以上で具体的に説明してください。"},
    {"product_code": "S004", "name": "サプリメント4", "dosage": "用量", "frequency": "1日1回", "reason": "このサプリメントを推奨する詳細な理由を記載してください。検査データのどの項目に対応しているか、どのような健康効果が期待できるか、なぜこの時期に必要なのかを150文字以上で具体的に説明してください。"},
    {"product_code": "S005", "name": "サプリメント5", "dosage": "用量", "frequency": "1日1回", "reason": "このサプリメントを推奨する詳細な理由を記載してください。検査データのどの項目に対応しているか、どのような健康効果が期待できるか、なぜこの時期に必要なのかを150文字以上で具体的に説明してください。"},
    {"product_code": "S006", "name": "サプリメント6", "dosage": "用量", "frequency": "1日1回", "reason": "このサプリメントを推奨する詳細な理由を記載してください。検査データのどの項目に対応しているか、どのような健康効果が期待できるか、なぜこの時期に必要なのかを150文字以上で具体的に説明してください。"}
  ]
}

**必須要件:**
1. supplements配列には3-5個のサプリメントを含めてください（最大5個まで）
2. 各サプリメントの推奨理由(reason)は、**提供された検査データまたは問診結果を具体的に引用して**150文字以上で記載してください
3. health_adviceでは、提供された検査データの項目名と数値、問診結果の具体的な回答を必ず明記してください（500文字以上）
4. nutrition_guidanceとrisk_assessmentでも、具体的なデータを引用しながら記載してください（各400文字以上）
5. 上記の【利用可能なサプリメント一覧】から適切なサプリメントを選択してください`
          }
        ],
        temperature: 0.5,  // Slightly increased for more detailed responses
        max_tokens: 6000,  // Increased to allow detailed data citations
        response_format: { type: "json_object" }
      })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      console.error('OpenAI API error:', errorData)
      return c.json({ 
        success: false, 
        error: `AI解析に失敗しました: ${errorData.error?.message || 'Unknown error'}` 
      }, 500)
    }

    const aiData = await aiResponse.json()
    const aiContent = aiData.choices[0].message.content

    // Parse JSON response
    let aiResult
    try {
      aiResult = JSON.parse(aiContent)
      
      // DEBUG: Log AI response structure - ALWAYS return this for debugging
      const aiDebug = {
        hasSupplements: !!aiResult.supplements,
        supplementsLength: aiResult.supplements?.length || 0,
        supplements: aiResult.supplements || [],
        masterSupplementsCount: supplementsMaster.results?.length || 0
      }
      
      // Temporarily bypass error and include debug info in response
      if (!aiResult.supplements || aiResult.supplements.length === 0) {
        // Don't return error, use defaults but log the issue
        aiResult.supplements = []
      }
    } catch (parseError) {
      // If JSON parsing fails, return error with AI response for debugging
      return c.json({ 
        success: false, 
        error: 'AI応答のJSON解析に失敗しました',
        debug: {
          parseError: parseError.message,
          aiContent: aiContent.substring(0, 1000)
        }
      }, 500)
    }

    // Extract data from JSON
    const overallScore = aiResult.overall_score || 70
    const healthAdvice = aiResult.health_advice || '健康アドバイスを取得できませんでした'
    const nutritionGuidance = aiResult.nutrition_guidance || '栄養指導を取得できませんでした'
    const riskAssessment = aiResult.risk_assessment || 'リスク評価を取得できませんでした'
    
    // Parse supplements from AI JSON response
    const supplements = parseSupplementsFromJSON(aiResult.supplements || [], supplementsMaster.results)
    
    // DEBUG: Include AI supplements info in health advice to verify what AI returned
    const aiSupplementsDebug = JSON.stringify(aiResult.supplements || [])
    const debugInfo = `\n\n[🐛 DEBUG INFO]\n` +
      `AI返却サプリ数: ${aiResult.supplements?.length || 0}\n` +
      `AI返却サプリ内容:\n${aiSupplementsDebug.substring(0, 800)}\n` +
      `利用可能なマスタ数: ${supplementsMaster.results?.length || 0}\n` +
      `パース後サプリ数: ${supplements.length}\n` +
      `パース後サプリ名: ${supplements.map(s => s.supplement_name).join(', ')}`
    
    // Add debug info to health advice for both DB and API response
    const healthAdviceWithDebug = healthAdvice + debugInfo
    
    console.log('=== SUPPLEMENT RECOMMENDATION DEBUG ===')
    console.log('Recommended supplements count:', supplements.length)
    console.log('Supplements:', supplements.map(s => s.supplement_name))
    console.log('Full supplement data:', JSON.stringify(supplements, null, 2))
    console.log('=========================================')

    // Calculate data completeness score including questionnaire
    const dataCompletenessScore = calculateDataCompletenessScore(examData.results, questionnaireData.results)
    
    // Save analysis results to database
    const analysisResult = await db.prepare(
      `INSERT INTO analysis_results (user_id, overall_score, health_advice, nutrition_guidance, risk_assessment, radar_chart_data, selected_exam_ids, data_completeness_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user_id,
      overallScore,
      healthAdviceWithDebug,
      nutritionGuidance,
      riskAssessment,
      null,  // radar_chart_data removed
      JSON.stringify(selected_exam_ids || []),
      dataCompletenessScore
    ).run()

    const analysisId = analysisResult.meta.last_row_id

    // Save supplement recommendations
    for (const supplement of supplements) {
      await db.prepare(
        'INSERT INTO supplement_recommendations (analysis_result_id, supplement_name, supplement_type, dosage, frequency, reason, priority) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        analysisId,
        supplement.supplement_name,
        supplement.supplement_type,
        supplement.dosage,
        supplement.frequency,
        supplement.reason,
        supplement.priority
      ).run()
    }

    // Map supplements to ensure correct field names for frontend
    // CRITICAL: Use explicit field names to prevent minification issues
    const supplementsFormatted = supplements.map(s => {
      return {
        'supplement_name': s.supplement_name,
        'supplement_type': s.supplement_type,
        'dosage': s.dosage,
        'frequency': s.frequency,
        'reason': s.reason,
        'priority': s.priority
      }
    })

    return c.json({
      success: true,
      analysis: {
        overall_score: overallScore,
        health_advice: healthAdviceWithDebug,  // Include debug info in API response
        nutrition_guidance: nutritionGuidance,
        risk_assessment: riskAssessment,
        // radar_chart_data removed - no longer needed
        supplements: supplementsFormatted
      },
      debug: {
        ai_supplements_count: aiResult.supplements?.length || 0,
        ai_supplements: aiResult.supplements || [],
        parsed_supplements_count: supplements.length,
        parsed_supplements_names: supplements.map(s => s.supplement_name),
        master_supplements_count: supplementsMaster.results?.length || 0
      }
    })
  } catch (error) {
    console.error('Error performing analysis:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Helper functions for parsing AI response
function parseScore(text: string): number {
  const match = text.match(/スコア[：:]?\s*(\d+)/i) || text.match(/(\d+)\s*[/／]\s*100/)
  return match ? parseInt(match[1]) : 70 // Default score
}

function extractSection(text: string, sectionName: string): string {
  const patterns = [
    new RegExp(`${sectionName}[：:]?\\s*([\\s\\S]*?)(?=\\n\\n|\\n[0-9]\\.|$)`, 'i'),
    new RegExp(`${sectionName}[：:]?\\s*([\\s\\S]*?)(?=【|\\d+\\.|$)`, 'i')
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return '解析結果を取得できませんでした'
}

// New JSON-based supplement parser
function parseSupplementsFromJSON(aiSupplements: any[], masterSupplements: any[]): Array<{supplement_name: string, supplement_type: string, dosage: string, frequency: string, reason: string, priority: number}> {
  try {
    console.log('Parsing supplements from AI JSON response...')
    console.log('AI provided supplements:', aiSupplements.length)
    
    if (!aiSupplements || aiSupplements.length === 0) {
      console.log('No supplements in AI response, using defaults')
      return getDefaultSupplements()
    }
    
    const supplements: any[] = []
    
    for (const aiSupp of aiSupplements) {
      if (!aiSupp.product_code) {
        console.log('Missing product_code in AI supplement, skipping')
        continue
      }
      
      // Find supplement in master data
      const masterSupp = masterSupplements.find((s: any) => s.product_code === aiSupp.product_code)
      
      if (!masterSupp) {
        console.log(`Supplement not found in master: ${aiSupp.product_code}`)
        continue
      }
      
      console.log(`✅ Matched supplement: [${aiSupp.product_code}] ${masterSupp.product_name}`)
      
      supplements.push({
        supplement_name: masterSupp.product_name,
        supplement_type: masterSupp.category,
        dosage: aiSupp.dosage || masterSupp.content_amount,
        frequency: aiSupp.frequency || '1日1回',
        reason: aiSupp.reason || masterSupp.recommended_for || masterSupp.description,
        priority: masterSupp.supplement_category === '必須栄養素' ? 1 : 2
      })
    }
    
    console.log(`Parsed ${supplements.length} valid supplements from AI`)
    
    // If we got less than 6, fill with defaults
    if (supplements.length < 6) {
      console.log(`Only ${supplements.length} supplements found, filling with defaults`)
      const defaultSupps = getDefaultSupplements()
      while (supplements.length < 6 && defaultSupps.length > 0) {
        supplements.push(defaultSupps.shift()!)
      }
    }
    
    // Return exactly 6 supplements
    return supplements.slice(0, 6)
    
  } catch (error) {
    console.error('Error parsing supplements from AI JSON:', error)
    return getDefaultSupplements()
  }
}

// Legacy text-based parser (kept for backward compatibility)
async function parseSupplementsFromAI(aiText: string, masterSupplements: any[], db: D1Database): Promise<Array<{supplement_name: string, supplement_type: string, dosage: string, frequency: string, reason: string, priority: number}>> {
  try {
    console.log('[LEGACY] Parsing supplements from AI text response...')
    
    // Extract supplement section from AI response
    const supplementSection = extractSection(aiText, '推奨サプリメント')
    
    if (!supplementSection || supplementSection === '解析結果を取得できませんでした') {
      console.log('No supplement section found, using fallback')
      return getDefaultSupplements()
    }
    
    console.log('Supplement section found, length:', supplementSection.length)
    
    // Parse each supplement entry (format: [CODE] Name\n用量: ...\n頻度: ...\n推奨理由: ...)
    const supplements: any[] = []
    const supplementBlocks = supplementSection.split('---').filter(block => block.trim().length > 0)
    
    console.log('Found supplement blocks:', supplementBlocks.length)
    
    for (const block of supplementBlocks) {
      // Extract product code [SXXX]
      const codeMatch = block.match(/\[([A-Z0-9]+)\]/)
      if (!codeMatch) continue
      
      const productCode = codeMatch[1]
      console.log('Parsing supplement with code:', productCode)
      
      // Find supplement in master data
      const masterSupp = masterSupplements.find((s: any) => s.product_code === productCode)
      if (!masterSupp) {
        console.log('Supplement not found in master:', productCode)
        continue
      }
      
      // Extract dosage, frequency, and reason
      const dosageMatch = block.match(/用量[：:]\s*(.+)/i)
      const frequencyMatch = block.match(/頻度[：:]\s*(.+)/i)
      const reasonMatch = block.match(/推奨理由[：:]\s*(.+)/i)
      
      supplements.push({
        supplement_name: masterSupp.product_name,
        supplement_type: masterSupp.category,
        dosage: dosageMatch ? dosageMatch[1].trim() : masterSupp.content_amount,
        frequency: frequencyMatch ? frequencyMatch[1].trim() : '1日1回',
        reason: reasonMatch ? reasonMatch[1].trim() : masterSupp.recommended_for || masterSupp.description,
        priority: masterSupp.supplement_category === '必須栄養素' ? 1 : 2
      })
    }
    
    console.log('Parsed supplements count:', supplements.length)
    
    // If we got less than 6, fill with defaults
    if (supplements.length < 6) {
      console.log('Less than 6 supplements found, filling with defaults')
      const defaultSupps = getDefaultSupplements()
      while (supplements.length < 6 && defaultSupps.length > 0) {
        supplements.push(defaultSupps.shift()!)
      }
    }
    
    // Return exactly 6 supplements
    return supplements.slice(0, 6)
    
  } catch (error) {
    console.error('Error parsing supplements from AI:', error)
    return getDefaultSupplements()
  }
}

async function getRecommendedSupplements(db: D1Database, healthAdvice: string, riskAssessment: string): Promise<Array<{supplement_name: string, supplement_type: string, dosage: string, frequency: string, reason: string, priority: number}>> {
  try {
    console.log('=== getRecommendedSupplements START ===')
    console.log('healthAdvice length:', healthAdvice?.length || 0)
    console.log('riskAssessment length:', riskAssessment?.length || 0)
    
    // Get all supplements from master catalog
    const supplements = await db.prepare(
      'SELECT * FROM supplements_master WHERE is_active = 1 ORDER BY supplement_category ASC, category'
    ).all()

    console.log('Query result:', supplements.results?.length || 0, 'supplements found')
    
    if (!supplements.results || supplements.results.length === 0) {
      console.log('No supplements in master, using defaults')
      return getDefaultSupplements()
    }

    // Analyze health advice and risk assessment to select appropriate supplements
    const selectedSupplements: any[] = []
    const adviceText = (healthAdvice + ' ' + riskAssessment).toLowerCase()

    // Step 1: Select 2-3 essential nutrients based on user's specific needs
    const essentials = supplements.results.filter((s: any) => s.supplement_category === '必須栄養素')
    
    // Prioritize essentials based on health needs
    const essentialPriority = []
    for (const supp of essentials) {
      let score = 10 // Base score for all essentials
      const suppName = supp.product_name.toLowerCase()
      const suppDesc = (supp.recommended_for || supp.description || '').toLowerCase()
      
      // Increase score if matches health concerns
      if (adviceText.includes('ビタミン') && suppName.includes('ビタミン')) score += 5
      if (adviceText.includes('ミネラル') && suppName.includes('ミネラル')) score += 5
      if (adviceText.includes('オメガ') || adviceText.includes('脂質')) {
        if (suppName.includes('オイル') || suppName.includes('クリル')) score += 5
      }
      
      essentialPriority.push({ supp, score })
    }
    
    // Sort by score and take top 2-3
    essentialPriority.sort((a, b) => b.score - a.score)
    const topEssentials = essentialPriority.slice(0, 3)
    
    topEssentials.forEach(({ supp }) => {
      selectedSupplements.push({
        supplement_name: supp.product_name,
        supplement_type: supp.category,
        dosage: supp.content_amount,
        frequency: '1日1回',
        reason: '必須栄養素: ' + (supp.recommended_for || supp.description),
        priority: 1
      })
    })

    // Add condition-specific supplements based on health analysis
    const conditionMap = {
      '血圧': ['クリルオイル', '第三リン酸Mg'],
      '血糖': ['菊芋イヌリン', 'イヌリン'],
      '疲労': ['アミノ酸ブレンド', 'EAA原末', 'B群ミックス7種類'],
      '免疫': ['リポソーム型ビタミンC', 'ビタミンD3+グルコン酸亜鉛+シクロデキストリン', 'スピルリナ'],
      '腸': ['アカシアパウダー', 'イヌリン', '菊芋イヌリン'],
      '抗酸化': ['ザクロペースト', 'スピルリナ', 'リポソーム型ビタミンC'],
      '脳': ['マインドリバイブ', 'クリルオイル'],
      '炎症': ['クリルオイル', 'リポソーム型βカリオフィレン'],
      'コレステロール': ['クリルオイル', '第三リン酸Mg'],
      '中性脂肪': ['クリルオイル', '菊芋イヌリン'],
      'ストレス': ['マインドリバイブ', 'B群ミックス7種類', 'リポソーム型ビタミンC'],
      '睡眠': ['マインドリバイブ', '第三リン酸Mg'],
      '肝臓': ['リポソーム型βカリオフィレン', 'ザクロペースト'],
      '骨': ['第三リン酸Mg', 'ビタミンD3+グルコン酸亜鉛+シクロデキストリン'],
      '筋肉': ['アミノ酸ブレンド', 'EAA原末', 'クリルオイル'],
      '貧血': ['ミネラルミックス7種類', 'スピルリナ'],
      '肌': ['ザクロペースト', 'リポソーム型ビタミンC', 'スピルリナ']
    }

    // Step 2: Find condition-specific supplements based on AI analysis
    const conditionMatches: Array<{supp: any, condition: string, score: number}> = []
    
    Object.entries(conditionMap).forEach(([condition, productNames]) => {
      if (adviceText.includes(condition)) {
        productNames.forEach((name) => {
          const supp = supplements.results.find((s: any) => s.product_name === name)
          if (supp && !selectedSupplements.find((ss: any) => ss.supplement_name === supp.product_name)) {
            // Calculate relevance score
            let score = 5 // Base score for condition match
            
            // Boost score if supplement is in 機能性食品 category
            if (supp.supplement_category === '機能性食品') score += 3
            
            // Boost if supplement description mentions the condition
            const suppDesc = (supp.recommended_for || supp.description || '').toLowerCase()
            if (suppDesc.includes(condition)) score += 2
            
            conditionMatches.push({ supp, condition, score })
          }
        })
      }
    })
    
    // Sort by score and add top 3 condition-specific supplements
    conditionMatches.sort((a, b) => b.score - a.score)
    const topConditionSupps = conditionMatches.slice(0, 3)
    
    topConditionSupps.forEach(({ supp, condition }) => {
      if (selectedSupplements.length < 6) {
        selectedSupplements.push({
          supplement_name: supp.product_name,
          supplement_type: supp.category,
          dosage: supp.content_amount,
          frequency: '1日1〜2回',
          reason: condition + '対策: ' + (supp.recommended_for || supp.description),
          priority: 2
        })
      }
    })
    
    // Step 3: Fill remaining slots with highly-rated supplements
    console.log('Step 3: Current supplement count:', selectedSupplements.length)
    
    if (selectedSupplements.length < 6) {
      // Get all remaining supplements (not yet selected)
      const remainingSupps = supplements.results.filter((s: any) => 
        !selectedSupplements.find((ss: any) => ss.supplement_name === s.product_name)
      )
      
      console.log('Remaining supplements available:', remainingSupps.length)
      
      // Prioritize by category: 必須栄養素 > 機能性食品 > 健康サポート
      remainingSupps.sort((a: any, b: any) => {
        const categoryOrder: any = {
          '必須栄養素': 1,
          '機能性食品': 2,
          '健康サポート': 3
        }
        return (categoryOrder[a.supplement_category] || 4) - (categoryOrder[b.supplement_category] || 4)
      })
      
      // Add supplements until we reach 6
      for (const supp of remainingSupps) {
        if (selectedSupplements.length >= 6) break
        
        selectedSupplements.push({
          supplement_name: supp.product_name,
          supplement_type: supp.category,
          dosage: supp.content_amount,
          frequency: '1日1回',
          reason: '総合的な健康維持: ' + (supp.recommended_for || supp.description || '健康サポート'),
          priority: 3
        })
      }
    }

    console.log('Final supplement count:', selectedSupplements.length)
    console.log('Selected supplements:', selectedSupplements.map(s => s.supplement_name))
    
    // Return exactly 6 supplements (or all available if less than 6)
    return selectedSupplements.slice(0, 6)
  } catch (error) {
    console.error('!!! ERROR in getRecommendedSupplements !!!')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    console.log('Falling back to default supplements')
    return getDefaultSupplements()
  }
}

function getDefaultSupplements(): Array<{supplement_name: string, supplement_type: string, dosage: string, frequency: string, reason: string, priority: number}> {
  console.log('Using default supplements fallback')
  return [
    {
      supplement_name: 'ビタミンミックス11種類',
      supplement_type: 'ビタミン',
      dosage: '360mg',
      frequency: '1日1回',
      reason: '全般的な健康維持、エネルギー代謝',
      priority: 1
    },
    {
      supplement_name: 'ミネラルミックス7種類',
      supplement_type: 'ミネラル',
      dosage: '1日分',
      frequency: '1日1回',
      reason: '基本的なミネラル補給',
      priority: 1
    },
    {
      supplement_name: 'クリルオイル',
      supplement_type: '脂質',
      dosage: '250mg',
      frequency: '1日1回',
      reason: '心血管健康、脳機能、抗炎症',
      priority: 1
    },
    {
      supplement_name: 'ビタミンD3+グルコン酸亜鉛+シクロデキストリン',
      supplement_type: 'ビタミン',
      dosage: '1カプセル',
      frequency: '1日1回',
      reason: '骨の健康、免疫力向上',
      priority: 1
    },
    {
      supplement_name: 'リポソーム型ビタミンC',
      supplement_type: 'ビタミン',
      dosage: '1包',
      frequency: '1日1回',
      reason: '免疫力サポート、抗酸化',
      priority: 2
    },
    {
      supplement_name: 'アミノ酸ブレンド',
      supplement_type: 'アミノ酸',
      dosage: '5g',
      frequency: '1日1回',
      reason: '疲労回復、筋肉維持',
      priority: 2
    }
  ]
}

function calculateDataCompletenessScore(exams: any[], questionnaireResponses: any[]): number {
  const requiredTypes = {
    'blood_pressure': { minMeasurements: 2, weight: 20 },
    'body_composition': { minMeasurements: 3, weight: 25 },
    'blood_test': { minMeasurements: 5, weight: 35 }
  }
  
  let totalScore = 0
  
  // Calculate exam data score (up to 80 points)
  if (exams && exams.length > 0) {
    Object.keys(requiredTypes).forEach(type => {
      const typeExams = exams.filter((e: any) => e.exam_type === type)
      const config = requiredTypes[type as keyof typeof requiredTypes]
      
      if (typeExams.length > 0) {
        // Count measurements from exam data
        const totalMeasurements = typeExams.reduce((sum: number, exam: any) => {
          const measurements = exam.measurements?.split(',').length || 0
          return sum + measurements
        }, 0)
        
        const avgMeasurements = totalMeasurements / typeExams.length
        const completenessRatio = Math.min(1, avgMeasurements / config.minMeasurements)
        totalScore += config.weight * completenessRatio
      }
    })
  }
  
  // Calculate questionnaire score (20 points if complete)
  const questionnaireWeight = 20
  if (questionnaireResponses && questionnaireResponses.length > 0) {
    const expectedQuestions = 50
    const actualQuestions = questionnaireResponses.length
    const questionnaireRatio = Math.min(1, actualQuestions / expectedQuestions)
    totalScore += questionnaireWeight * questionnaireRatio
  }
  
  return Math.round(totalScore)
}
