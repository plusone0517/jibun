import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { questionnaireRoutes } from './routes-questionnaire'
import { analysisRoutes } from './routes-analysis'
import { authRoutes } from './routes-auth'
import { dashboardRoutes } from './routes-dashboard'
import { passwordResetRoutes } from './routes-password-reset'
import { historyRoutes } from './routes-history'
import { adminRoutes } from './routes-admin'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Mount sub-routes
app.route('/auth', authRoutes)
app.route('/password-reset', passwordResetRoutes)
app.route('/dashboard', dashboardRoutes)
app.route('/questionnaire', questionnaireRoutes)
app.route('/analysis', analysisRoutes)
app.route('/history', historyRoutes)
app.route('/admin', adminRoutes)

// ======================
// HTML Pages Routes
// ======================

// Home page - redirect to dashboard or login
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>じぶんサプリ育成アプリ</title>
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
        <title>じぶんサプリ育成アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-600">
                        <i class="fas fa-heartbeat mr-2"></i>
                        じぶんサプリ育成
                    </h1>
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
                        <div class="text-5xl mb-4">📋</div>
                        <h3 class="text-xl font-bold mb-3">健康問診</h3>
                        <p class="text-gray-600 mb-4">50問の詳細な問診で生活習慣を分析</p>
                        <a href="/questionnaire" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                            問診開始
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
                            <h4 class="font-bold mb-1">サプリ処方シート自動生成</h4>
                            <p class="text-gray-600 text-sm">医療機関監修の処方オーダーシートをPDFで出力</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="bg-gray-800 text-white mt-16 py-8">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <p class="text-sm">© 2024 じぶんサプリ育成アプリ - 医療機関監修</p>
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
        <title>検査データ入力 - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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

        <main class="max-w-4xl mx-auto px-4 pb-12">
            <h2 class="text-3xl font-bold text-gray-800 mb-8">検査データ入力</h2>

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
                    <button onclick="addCustomField()" class="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                        <i class="fas fa-plus mr-2"></i>検査項目を追加
                    </button>
                </div>

                <div class="mt-8 flex gap-4">
                    <button onclick="saveExamData()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
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
            function addCustomField() {
                customFieldCount++;
                const fieldHTML = \`
                    <div class="grid md:grid-cols-3 gap-2 items-end" id="customField\${customFieldCount}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">項目名</label>
                            <input type="text" class="w-full px-4 py-2 border rounded-lg custom-key" placeholder="例: ビタミンD">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">測定値</label>
                            <input type="text" class="w-full px-4 py-2 border rounded-lg custom-value" placeholder="例: 25">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">単位</label>
                            <input type="text" class="w-full px-4 py-2 border rounded-lg custom-unit" placeholder="例: ng/mL">
                        </div>
                        <button onclick="removeCustomField(\${customFieldCount})" class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                \`;
                document.getElementById('customFields').insertAdjacentHTML('beforeend', fieldHTML);
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
                        // Create new exam
                        response = await axios.post('/api/exam', {
                            user_id: currentUserId,
                            exam_date: examDate,
                            exam_type: examType,
                            measurements: measurements
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
                        displayExamHistory(response.data.exams);
                    } else {
                        document.getElementById('examHistoryList').innerHTML = '<p class="text-gray-500 text-center py-4">まだ検査データがありません</p>';
                    }
                } catch (error) {
                    console.error('Error loading exam history:', error);
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

                container.innerHTML = filteredExams.slice(0, 10).map(exam => \`
                    <div class="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <span class="font-bold text-lg text-gray-800">\${exam.exam_date}</span>
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
                \`).join('');

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

            // Load history on page load
            loadExamHistory();
        </script>
    </body>
    </html>
  `)
})

// ======================
// API Routes
// ======================

// Save exam data
app.post('/api/exam', async (c) => {
  try {
    const { user_id, exam_date, exam_type, measurements } = await c.req.json()

    if (!user_id || !exam_date || !exam_type || !measurements || measurements.length === 0) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const db = c.env.DB

    // Insert exam_data record
    const examResult = await db.prepare(
      'INSERT INTO exam_data (user_id, exam_date, exam_type) VALUES (?, ?, ?)'
    ).bind(user_id, exam_date, exam_type).run()

    const examDataId = examResult.meta.last_row_id

    // Insert measurements
    for (const measurement of measurements) {
      await db.prepare(
        'INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) VALUES (?, ?, ?, ?)'
      ).bind(examDataId, measurement.key, measurement.value, measurement.unit || '').run()
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

// Save questionnaire responses
app.post('/api/questionnaire', async (c) => {
  try {
    const { user_id, responses } = await c.req.json()

    if (!user_id || !responses || responses.length === 0) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const db = c.env.DB

    // Delete existing responses for this user
    await db.prepare('DELETE FROM questionnaire_responses WHERE user_id = ?').bind(user_id).run()

    // Insert new responses
    for (const response of responses) {
      await db.prepare(
        'INSERT INTO questionnaire_responses (user_id, question_number, question_text, answer_value, category) VALUES (?, ?, ?, ?, ?)'
      ).bind(user_id, response.question_number, response.question_text, response.answer_value, response.category).run()
    }

    return c.json({ 
      success: true,
      message: '問診が保存されました'
    })
  } catch (error) {
    console.error('Error saving questionnaire:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get questionnaire responses for user
app.get('/api/questionnaire/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const { results } = await db.prepare(
      'SELECT * FROM questionnaire_responses WHERE user_id = ? ORDER BY question_number'
    ).bind(userId).all()

    return c.json({ success: true, responses: results })
  } catch (error) {
    console.error('Error fetching questionnaire responses:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Perform AI analysis
app.post('/api/analysis', async (c) => {
  try {
    const { user_id } = await c.req.json()

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    const db = c.env.DB
    const openaiApiKey = c.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return c.json({ success: false, error: 'OpenAI APIキーが設定されていません。.dev.varsファイルを確認してください。' }, 500)
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
    const { name, email, password, age, gender } = await c.req.json()

    if (!name || !email || !password) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const db = c.env.DB

    // Check if email already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existingUser) {
      return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Insert user
    const result = await db.prepare(
      'INSERT INTO users (name, email, password_hash, age, gender) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, email, passwordHash, age, gender).run()

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
app.get('/api/auth/me', async (c) => {
  try {
    const cookies = c.req.header('cookie') || ''
    const sessionToken = cookies.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1]

    if (!sessionToken) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const db = c.env.DB

    // Find session
    const session = await db.prepare(
      'SELECT * FROM sessions WHERE session_token = ? AND expires_at > ?'
    ).bind(sessionToken, new Date().toISOString()).first()

    if (!session) {
      return c.json({ success: false, error: 'セッションが無効です' }, 401)
    }

    // Get user
    const user = await db.prepare('SELECT id, name, email, age, gender FROM users WHERE id = ?')
      .bind(session.user_id).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    return c.json({
      success: true,
      user: user
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
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
      'SELECT id, name, email, age, gender, created_at, last_login FROM users WHERE id = ?'
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

export default app
