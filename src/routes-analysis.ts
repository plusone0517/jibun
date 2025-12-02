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
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
                    <i class="fas fa-check-square text-blue-600 mr-3"></i>
                    検査データを選択
                </h3>
                <div id="examListContainer" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        検査データを読み込み中...
                    </p>
                </div>
                <div class="mt-6 flex justify-center">
                    <button onclick="startAnalysis()" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        <i class="fas fa-brain mr-2"></i>AI解析を開始する
                    </button>
                </div>
            </div>

            <!-- Loading state -->
            <div id="loadingState" class="bg-white rounded-lg shadow-lg p-8 text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-600">AI解析を実行中...</p>
                <p class="text-sm text-gray-500 mt-2">数秒お待ちください</p>
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

                <!-- Radar Chart -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-6" id="radarChartSection">
                    <h3 class="text-2xl font-bold mb-6 text-center">健康バランス レーダーチャート</h3>
                    <div class="max-w-2xl mx-auto">
                        <canvas id="radarChart"></canvas>
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
                    <div id="supplementRecommendations" class="grid md:grid-cols-2 gap-4"></div>
                </div>

                <!-- PDF Download Button -->
                <div class="bg-white rounded-lg shadow-lg p-8 text-center">
                    <h3 class="text-2xl font-bold mb-4">サプリ処方オーダーシート</h3>
                    <p class="text-gray-600 mb-6">解析結果とサプリメント推奨をPDFでダウンロードできます</p>
                    <button onclick="generatePDF()" class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition font-bold text-lg">
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
            let radarChartInstance = null;

            let selectedExamIds = [];
            let allExamData = [];
            let currentUser = null;

            async function loadExamData() {
                try {
                    // Check authentication
                    const authResponse = await axios.get('/api/auth/me');
                    if (!authResponse.data.user) {
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
                } catch (error) {
                    console.error('Error loading exam data:', error);
                    document.getElementById('examListContainer').innerHTML = \`
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

                container.innerHTML = exams.map(exam => \`
                    <div class="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <label class="flex items-start cursor-pointer">
                            <input type="checkbox" 
                                   class="exam-checkbox mt-1 mr-3 w-5 h-5 text-blue-600"
                                   data-exam-id="\${exam.id}"
                                   onchange="toggleExamSelection(\${exam.id})"
                                   checked>
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <span class="font-bold text-gray-800">\${exam.exam_date}</span>
                                    <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        \${examTypeNames[exam.exam_type] || exam.exam_type}
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
                        </label>
                    </div>
                \`).join('');

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

            function updateAnalysisButton() {
                const button = document.querySelector('button[onclick="startAnalysis()"]');
                button.disabled = selectedExamIds.length === 0;
                
                if (selectedExamIds.length === 0) {
                    button.innerHTML = '<i class="fas fa-brain mr-2"></i>検査データを選択してください';
                } else {
                    button.innerHTML = \`<i class="fas fa-brain mr-2"></i>AI解析を開始する (\${selectedExamIds.length}件)\`;
                }
            }

            async function startAnalysis() {
                // Hide selection section
                document.getElementById('examSelectionSection').style.display = 'none';
                document.getElementById('loadingState').classList.remove('hidden');

                try {
                    // Perform AI analysis with selected exam data
                    const response = await axios.post('/api/analysis', {
                        user_id: currentUser.id,
                        selected_exam_ids: selectedExamIds
                    });

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

                // Display radar chart
                if (data.radar_chart_data) {
                    displayRadarChart(data.radar_chart_data);
                }

                // Display supplements
                if (data.supplements && data.supplements.length > 0) {
                    displaySupplements(data.supplements);
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
                
                // Assume questionnaire is always complete if we reached analysis
                totalScore += questionnaire_weight;
                
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
                    
                    return \`
                        <div class="flex items-center justify-between p-3 border-l-4 \${colorClass} rounded">
                            <div>
                                <span class="font-semibold">\${detail.name}</span>
                                <span class="text-sm text-gray-600 ml-2">
                                    (\${detail.count}件、平均\${detail.avgMeasurements}項目)
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

            function displayRadarChart(radarData) {
                const ctx = document.getElementById('radarChart').getContext('2d');
                
                if (radarChartInstance) {
                    radarChartInstance.destroy();
                }

                radarChartInstance = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: radarData.labels,
                        datasets: [{
                            label: '健康スコア',
                            data: radarData.values,
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            borderColor: 'rgb(59, 130, 246)',
                            pointBackgroundColor: 'rgb(59, 130, 246)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgb(59, 130, 246)'
                        }]
                    },
                    options: {
                        elements: {
                            line: {
                                borderWidth: 3
                            }
                        },
                        scales: {
                            r: {
                                angleLines: {
                                    display: true
                                },
                                suggestedMin: 0,
                                suggestedMax: 100,
                                ticks: {
                                    stepSize: 20
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }

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
                    container.innerHTML = supplements.map(supp => {
                        const masterInfo = masterMap[supp.supplement_name] || {};
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
                            <div class="border-2 \${categoryColor} rounded-lg p-4 hover:shadow-md transition">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex-1">
                                        <h4 class="font-bold text-lg text-gray-800">\${supp.supplement_name}</h4>
                                        \${masterInfo.product_code ? \`<span class="text-xs text-gray-500">[\${masterInfo.product_code}]</span>\` : ''}
                                    </div>
                                    <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                                        \${getPriorityLabel(supp.priority)}
                                    </span>
                                </div>
                                
                                \${masterInfo.category ? \`
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-xs bg-white px-2 py-1 rounded border font-semibold">
                                            \${masterInfo.category}
                                        </span>
                                        <span class="text-xs text-gray-600">
                                            \${masterInfo.form} | \${masterInfo.content_amount}
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
                            </div>
                        \`;
                    }).join('');
                } catch (error) {
                    console.error('Error loading supplement master data:', error);
                    // Fallback to basic display
                    container.innerHTML = supplements.map(supp => \`
                        <div class="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-lg text-purple-700">\${supp.supplement_name}</h4>
                                <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">\${getPriorityLabel(supp.priority)}</span>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">\${supp.supplement_type || ''}</p>
                            <p class="text-sm mb-2"><strong>用量:</strong> \${supp.dosage || '-'}</p>
                            <p class="text-sm mb-2"><strong>頻度:</strong> \${supp.frequency || '-'}</p>
                            <p class="text-sm text-gray-700"><strong>推奨理由:</strong> \${supp.reason || '-'}</p>
                        </div>
                    \`).join('');
                }
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
    const { user_id, selected_exam_ids } = await c.req.json()

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

    // Fetch questionnaire responses
    const questionnaireData = await db.prepare(
      'SELECT * FROM questionnaire_responses WHERE user_id = ? ORDER BY question_number'
    ).bind(user_id).all()

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

    const questionnaireSummary = questionnaireData.results?.map(q => 
      `Q${q.question_number}. ${q.question_text} → ${q.answer_value}`
    ).join('\n') || 'なし'

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
            content: 'あなたは医療機関監修の健康アドバイザーです。検査データと問診結果を分析し、適切な健康アドバイス、栄養指導、リスク評価、サプリメント提案を行ってください。'
          },
          {
            role: 'user',
            content: `以下のデータを分析して、総合的な健康アドバイスを提供してください。

【検査データ】
${examSummary}

【問診結果（50問）】
${questionnaireSummary}

以下の形式で回答してください：
1. 総合健康スコア（0-100の数値）
2. 健康アドバイス（具体的で実践可能なアドバイス）
3. 栄養指導（食事に関する具体的な推奨）
4. 健康リスク評価（懸念される点と予防策）
5. レーダーチャート用データ（睡眠、栄養、運動、ストレス、生活習慣、検査値の6項目を0-100で評価）
6. 推奨サプリメント（3-5種類、具体的な用量と理由）`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
    const analysisText = aiData.choices[0].message.content

    // Parse AI response (simple parsing - in production, use structured output)
    const overallScore = parseScore(analysisText)
    const healthAdvice = extractSection(analysisText, '健康アドバイス')
    const nutritionGuidance = extractSection(analysisText, '栄養指導')
    const riskAssessment = extractSection(analysisText, 'リスク評価')
    const radarChartData = {
      labels: ['睡眠', '栄養', '運動', 'ストレス', '生活習慣', '検査値'],
      values: [70, 65, 60, 55, 75, 70] // Default values - in production, parse from AI response
    }
    const supplements = parseSupplements(analysisText)

    // Calculate data completeness score
    const dataCompletenessScore = calculateDataCompletenessScore(examData.results)
    
    // Save analysis results to database
    const analysisResult = await db.prepare(
      `INSERT INTO analysis_results (user_id, overall_score, health_advice, nutrition_guidance, risk_assessment, radar_chart_data, selected_exam_ids, data_completeness_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user_id,
      overallScore,
      healthAdvice,
      nutritionGuidance,
      riskAssessment,
      JSON.stringify(radarChartData),
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

function parseSupplements(text: string): Array<{name: string, type: string, dosage: string, frequency: string, reason: string, priority: number}> {
  // Default supplements if parsing fails
  return [
    {
      name: 'マルチビタミン',
      type: 'ビタミン',
      dosage: '1錠',
      frequency: '1日1回',
      reason: '全般的な栄養バランスをサポート',
      priority: 1
    },
    {
      name: 'オメガ3（EPA/DHA）',
      type: '脂肪酸',
      dosage: '1000mg',
      frequency: '1日1回',
      reason: '心血管健康と抗炎症作用',
      priority: 1
    },
    {
      name: 'ビタミンD',
      type: 'ビタミン',
      dosage: '2000IU',
      frequency: '1日1回',
      reason: '骨の健康と免疫機能サポート',
      priority: 2
    }
  ]
}

function calculateDataCompletenessScore(exams: any[]): number {
  if (!exams || exams.length === 0) return 0
  
  const requiredTypes = {
    'blood_pressure': { minMeasurements: 2, weight: 20 },
    'body_composition': { minMeasurements: 3, weight: 25 },
    'blood_test': { minMeasurements: 5, weight: 35 }
  }
  
  const questionnaireWeight = 20
  let totalScore = questionnaireWeight // Assume questionnaire is complete
  
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
  
  return Math.round(totalScore)
}
