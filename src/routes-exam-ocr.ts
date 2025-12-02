import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const examOcrRoutes = new Hono<{ Bindings: Bindings }>()

// OCR Exam Input Page
examOcrRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>画像読み取り - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
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
            <h2 class="text-3xl font-bold text-purple-800 mb-8 flex items-center">
                <i class="fas fa-camera mr-3"></i>
                画像読み取り（OCR）
            </h2>

            <!-- OCR Input Section -->
            <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">
                    📸 検査結果を撮影して自動入力
                </h3>
                <p class="text-gray-700 mb-6">
                    病院や健康診断の検査結果用紙を撮影すると、AIが自動で読み取って保存します
                </p>
                
                <div class="flex flex-col gap-4">
                    <div class="grid md:grid-cols-2 gap-4">
                        <label class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition cursor-pointer text-center font-bold shadow-lg">
                            <i class="fas fa-camera mr-2 text-xl"></i>
                            <span class="text-lg">カメラで撮影</span>
                            <input type="file" id="examImageCamera" accept="image/*" capture="camera" class="hidden" onchange="handleImageUpload(this)">
                        </label>
                        <label class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer text-center font-bold shadow-lg">
                            <i class="fas fa-folder-open mr-2 text-xl"></i>
                            <span class="text-lg">ファイルを選択</span>
                            <input type="file" id="examImageFile" accept="image/*" class="hidden" onchange="handleImageUpload(this)">
                        </label>
                    </div>
                    
                    <div id="imagePreviewContainer" class="hidden">
                        <div class="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                            <img id="imagePreview" class="w-full max-h-96 object-contain rounded-lg mb-4">
                            <button onclick="analyzeImage()" id="analyzeBtn" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-bold text-lg shadow-lg">
                                <i class="fas fa-magic mr-2"></i>🪄 AIで解析する
                            </button>
                            <div id="analyzeProgress" class="hidden mt-4 text-center">
                                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
                                <p class="text-gray-600 mt-3 font-semibold">AI解析中...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- OCR Data Preview Form -->
            <div id="ocrDataForm" class="hidden bg-white rounded-lg shadow-lg p-8 mb-6">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">
                    📋 読み取り結果を確認
                </h3>
                <p class="text-gray-600 mb-6">AIが読み取ったデータを確認し、必要に応じて修正してください</p>

                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">検査日</label>
                    <input type="date" id="examDate" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" required>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">検査タイプ</label>
                    <select id="examType" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" onchange="switchExamType()">
                        <option value="blood_pressure">血圧測定</option>
                        <option value="body_composition">体組成計</option>
                        <option value="blood_test">血液検査</option>
                        <option value="custom">カスタム検査</option>
                    </select>
                </div>

                <!-- Blood Pressure Form -->
                <div id="bloodPressureForm" class="exam-form">
                    <h4 class="text-xl font-bold mb-4 text-blue-600">血圧測定データ</h4>
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
                    <h4 class="text-xl font-bold mb-4 text-green-600">体組成測定データ</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">体重 (kg)</label>
                            <input type="number" step="0.1" id="weight" class="w-full px-4 py-2 border rounded-lg" placeholder="60.0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">体脂肪率 (%)</label>
                            <input type="number" step="0.1" id="body_fat" class="w-full px-4 py-2 border rounded-lg" placeholder="20.0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">筋肉量 (kg)</label>
                            <input type="number" step="0.1" id="muscle_mass" class="w-full px-4 py-2 border rounded-lg" placeholder="45.0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">BMI</label>
                            <input type="number" step="0.1" id="bmi" class="w-full px-4 py-2 border rounded-lg" placeholder="22.0">
                        </div>
                    </div>
                </div>

                <!-- Blood Test Form -->
                <div id="bloodTestForm" class="exam-form hidden">
                    <h4 class="text-xl font-bold mb-4 text-red-600">血液検査データ</h4>
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
                            <input type="number" id="hdl_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="50">
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
                    <h4 class="text-xl font-bold mb-4 text-purple-600">カスタム検査データ</h4>
                    <div id="customItemsContainer" class="space-y-4">
                        <!-- Custom items will be added here -->
                    </div>
                    <button onclick="addCustomItem()" class="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                        <i class="fas fa-plus mr-2"></i>項目を追加
                    </button>
                </div>

                <div class="mt-8 flex gap-4">
                    <button onclick="saveOcrData()" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-bold text-lg shadow-lg">
                        <i class="fas fa-save mr-2"></i>💾 保存する
                    </button>
                    <button onclick="cancelOcr()" class="bg-gray-300 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-400 transition font-bold">
                        <i class="fas fa-times mr-2"></i>キャンセル
                    </button>
                </div>
            </div>

            <!-- OCR History Section -->
            <div class="bg-white rounded-lg shadow-lg p-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-history text-purple-600 mr-3"></i>
                    📸 OCRで読み取ったデータ
                </h3>
                <div id="ocrHistoryContainer">
                    <p class="text-gray-500 text-center py-4">データを読み込み中...</p>
                </div>
            </div>

            <!-- Success/Error Messages -->
            <div id="successMessage" class="hidden fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg" role="alert">
                <strong class="font-bold">成功！</strong>
                <span class="block sm:inline" id="successText"></span>
            </div>

            <div id="errorMessage" class="hidden fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg" role="alert">
                <strong class="font-bold">エラー！</strong>
                <span class="block sm:inline" id="errorText"></span>
            </div>
        </main>

        <script>
            let currentUser = null;
            let selectedImage = null;
            let customItemCounter = 0;

            // Check authentication on page load
            async function checkAuth() {
                try {
                    const response = await axios.get('/api/auth/me');
                    if (!response.data.success) {
                        window.location.href = '/auth/login';
                        return false;
                    }
                    currentUser = response.data.user;
                    return true;
                } catch (error) {
                    window.location.href = '/auth/login';
                    return false;
                }
            }

            // Handle image upload
            function handleImageUpload(input) {
                const file = input.files[0];
                if (!file) return;

                selectedImage = file;
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('imagePreview').src = e.target.result;
                    document.getElementById('imagePreviewContainer').classList.remove('hidden');
                    document.getElementById('analyzeBtn').disabled = false;
                };
                reader.readAsDataURL(file);
            }

            // Analyze image with OCR
            async function analyzeImage() {
                if (!selectedImage) {
                    showError('画像を選択してください');
                    return;
                }

                const analyzeBtn = document.getElementById('analyzeBtn');
                const analyzeProgress = document.getElementById('analyzeProgress');
                
                analyzeBtn.disabled = true;
                analyzeProgress.classList.remove('hidden');

                try {
                    const formData = new FormData();
                    formData.append('image', selectedImage);

                    const response = await axios.post('/api/analyze-exam-image', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (response.data.success) {
                        // Fill form with OCR results
                        const data = response.data.result;
                        document.getElementById('examDate').value = data.exam_date || new Date().toISOString().split('T')[0];
                        document.getElementById('examType').value = data.exam_type || 'blood_pressure';
                        
                        // Switch to correct form
                        switchExamType();
                        
                        // Fill measurements
                        if (data.measurements && data.measurements.length > 0) {
                            data.measurements.forEach(m => {
                                const field = document.getElementById(m.key);
                                if (field) {
                                    field.value = m.value;
                                }
                            });
                        }

                        // Show form
                        document.getElementById('ocrDataForm').classList.remove('hidden');
                        document.getElementById('ocrDataForm').scrollIntoView({ behavior: 'smooth' });
                        
                        showSuccess('検査結果を読み取りました！内容を確認してください。');
                    } else {
                        showError(response.data.error || 'OCR解析に失敗しました');
                    }
                } catch (error) {
                    console.error('OCR Error:', error);
                    showError('OCR解析中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                } finally {
                    analyzeBtn.disabled = false;
                    analyzeProgress.classList.add('hidden');
                }
            }

            // Switch exam type form
            function switchExamType() {
                const examType = document.getElementById('examType').value;
                document.querySelectorAll('.exam-form').forEach(form => form.classList.add('hidden'));
                
                switch(examType) {
                    case 'blood_pressure':
                        document.getElementById('bloodPressureForm').classList.remove('hidden');
                        break;
                    case 'body_composition':
                        document.getElementById('bodyCompositionForm').classList.remove('hidden');
                        break;
                    case 'blood_test':
                        document.getElementById('bloodTestForm').classList.remove('hidden');
                        break;
                    case 'custom':
                        document.getElementById('customForm').classList.remove('hidden');
                        break;
                }
            }

            // Add custom item
            function addCustomItem() {
                customItemCounter++;
                const container = document.getElementById('customItemsContainer');
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex gap-2';
                itemDiv.innerHTML = \`
                    <input type="text" class="flex-1 px-4 py-2 border rounded-lg custom-item-key" placeholder="項目名（例：尿酸値）">
                    <input type="number" step="0.1" class="flex-1 px-4 py-2 border rounded-lg custom-item-value" placeholder="値">
                    <input type="text" class="w-24 px-4 py-2 border rounded-lg custom-item-unit" placeholder="単位">
                    <button onclick="this.parentElement.remove()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                \`;
                container.appendChild(itemDiv);
            }

            // Save OCR data
            async function saveOcrData() {
                if (!currentUser) {
                    await checkAuth();
                    if (!currentUser) return;
                }

                const examDate = document.getElementById('examDate').value;
                const examType = document.getElementById('examType').value;

                if (!examDate) {
                    showError('検査日を入力してください');
                    return;
                }

                let measurements = [];

                // Collect measurements based on exam type
                if (examType === 'blood_pressure') {
                    const systolic = document.getElementById('systolic_bp').value;
                    const diastolic = document.getElementById('diastolic_bp').value;
                    const pulse = document.getElementById('pulse').value;
                    if (systolic) measurements.push({ key: 'systolic_bp', value: systolic, unit: 'mmHg' });
                    if (diastolic) measurements.push({ key: 'diastolic_bp', value: diastolic, unit: 'mmHg' });
                    if (pulse) measurements.push({ key: 'pulse', value: pulse, unit: 'bpm' });
                } else if (examType === 'body_composition') {
                    const fields = ['weight', 'body_fat', 'muscle_mass', 'bmi'];
                    const units = { weight: 'kg', body_fat: '%', muscle_mass: 'kg', bmi: '' };
                    fields.forEach(field => {
                        const value = document.getElementById(field).value;
                        if (value) measurements.push({ key: field, value: value, unit: units[field] });
                    });
                } else if (examType === 'blood_test') {
                    const fields = ['blood_sugar', 'hba1c', 'total_cholesterol', 'ldl_cholesterol', 'hdl_cholesterol', 'triglycerides', 'ast', 'alt'];
                    const units = { blood_sugar: 'mg/dL', hba1c: '%', total_cholesterol: 'mg/dL', ldl_cholesterol: 'mg/dL', hdl_cholesterol: 'mg/dL', triglycerides: 'mg/dL', ast: 'U/L', alt: 'U/L' };
                    fields.forEach(field => {
                        const value = document.getElementById(field).value;
                        if (value) measurements.push({ key: field, value: value, unit: units[field] });
                    });
                } else if (examType === 'custom') {
                    const keys = document.querySelectorAll('.custom-item-key');
                    const values = document.querySelectorAll('.custom-item-value');
                    const units = document.querySelectorAll('.custom-item-unit');
                    for (let i = 0; i < keys.length; i++) {
                        if (keys[i].value && values[i].value) {
                            measurements.push({
                                key: keys[i].value,
                                value: values[i].value,
                                unit: units[i].value || ''
                            });
                        }
                    }
                }

                if (measurements.length === 0) {
                    showError('測定値を少なくとも1つ入力してください');
                    return;
                }

                try {
                    const response = await axios.post('/api/exam', {
                        user_id: currentUser.id,
                        exam_date: examDate,
                        exam_type: examType,
                        measurements: measurements,
                        data_source: 'ocr'  // Mark as OCR data
                    });

                    if (response.data.success) {
                        showSuccess('OCRデータを保存しました！');
                        
                        // Reset form
                        document.getElementById('ocrDataForm').classList.add('hidden');
                        document.getElementById('imagePreviewContainer').classList.add('hidden');
                        selectedImage = null;
                        
                        // Clear inputs
                        document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
                        document.getElementById('examDate').value = '';
                        
                        // Reload history
                        loadOcrHistory();
                    } else {
                        showError(response.data.error || '保存に失敗しました');
                    }
                } catch (error) {
                    console.error('Save Error:', error);
                    showError('保存中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            }

            // Cancel OCR
            function cancelOcr() {
                document.getElementById('ocrDataForm').classList.add('hidden');
                document.getElementById('imagePreviewContainer').classList.add('hidden');
                selectedImage = null;
                document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
            }

            // Load OCR history
            async function loadOcrHistory() {
                if (!currentUser) return;

                try {
                    const response = await axios.get(\`/api/history/\${currentUser.id}\`);
                    if (response.data.success && response.data.exams) {
                        // Filter OCR data only
                        const ocrData = response.data.exams.filter(exam => exam.data_source === 'ocr');
                        displayOcrHistory(ocrData);
                    } else {
                        document.getElementById('ocrHistoryContainer').innerHTML = \`
                            <p class="text-gray-500 text-center py-4">
                                <i class="fas fa-info-circle mr-2"></i>
                                まだOCRデータがありません
                            </p>
                        \`;
                    }
                } catch (error) {
                    console.error('Load History Error:', error);
                    document.getElementById('ocrHistoryContainer').innerHTML = \`
                        <p class="text-red-500 text-center py-4">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            データの読み込みに失敗しました
                        </p>
                    \`;
                }
            }

            // Display OCR history
            function displayOcrHistory(exams) {
                const container = document.getElementById('ocrHistoryContainer');
                
                if (!exams || exams.length === 0) {
                    container.innerHTML = \`
                        <p class="text-gray-500 text-center py-4">
                            <i class="fas fa-info-circle mr-2"></i>
                            まだOCRデータがありません
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

                let html = '<div class="space-y-4">';
                exams.forEach(exam => {
                    const measurements = exam.measurements || [];
                    html += \`
                        <div class="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <span class="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold mr-2">
                                        🪄 AI解析
                                    </span>
                                    <span class="text-sm text-gray-600">\${new Date(exam.exam_date).toLocaleDateString('ja-JP')}</span>
                                </div>
                                <span class="font-bold text-purple-700">\${examTypeNames[exam.exam_type] || exam.exam_type}</span>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    \`;
                    
                    measurements.forEach(m => {
                        html += \`
                            <div class="bg-white rounded p-2 text-sm">
                                <span class="text-gray-600">\${formatMeasurementKey(m.measurement_key)}:</span>
                                <span class="font-bold text-gray-800">\${m.measurement_value}\${m.measurement_unit}</span>
                            </div>
                        \`;
                    });

                    html += \`
                            </div>
                            <div class="mt-3 flex gap-2 justify-end">
                                <button onclick="deleteExam(\${exam.id})" class="text-red-600 hover:text-red-800 text-sm">
                                    <i class="fas fa-trash mr-1"></i>削除
                                </button>
                            </div>
                        </div>
                    \`;
                });
                html += '</div>';
                
                container.innerHTML = html;
            }

            // Format measurement key
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
                    'ldl_cholesterol': 'LDL',
                    'hdl_cholesterol': 'HDL',
                    'triglycerides': '中性脂肪',
                    'ast': 'AST',
                    'alt': 'ALT'
                };
                return keyMap[key] || key;
            }

            // Delete exam
            async function deleteExam(examId) {
                if (!confirm('このデータを削除しますか？')) return;

                try {
                    const response = await axios.delete(\`/api/exam/\${examId}\`);
                    if (response.data.success) {
                        showSuccess('削除しました');
                        loadOcrHistory();
                    } else {
                        showError('削除に失敗しました');
                    }
                } catch (error) {
                    console.error('Delete Error:', error);
                    showError('削除中にエラーが発生しました');
                }
            }

            // Show success message
            function showSuccess(message) {
                const el = document.getElementById('successMessage');
                document.getElementById('successText').textContent = message;
                el.classList.remove('hidden');
                setTimeout(() => el.classList.add('hidden'), 5000);
            }

            // Show error message
            function showError(message) {
                const el = document.getElementById('errorMessage');
                document.getElementById('errorText').textContent = message;
                el.classList.remove('hidden');
                setTimeout(() => el.classList.add('hidden'), 5000);
            }

            // Initialize
            async function init() {
                const authenticated = await checkAuth();
                if (authenticated) {
                    loadOcrHistory();
                    // Set today's date as default
                    document.getElementById('examDate').value = new Date().toISOString().split('T')[0];
                }
            }

            init();
        </script>
    </body>
    </html>
  `)
})
