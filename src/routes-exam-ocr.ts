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
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
        <meta http-equiv="Pragma" content="no-cache">
        <meta http-equiv="Expires" content="0">
        <title>画像読み取り - じぶんを知ることから v2.0</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
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
                    <label class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer text-center font-bold shadow-lg">
                        <i class="fas fa-file-medical mr-2 text-2xl"></i>
                        <span class="text-xl">画像・PDFを選択</span>
                        <p class="text-sm mt-2 opacity-90">画像ファイル（JPG/PNG）またはPDFファイル</p>
                        <p class="text-xs mt-1 opacity-75">⚠️ ファイルサイズ: 5MB以下</p>
                        <input type="file" id="imageUpload" accept="image/*,application/pdf" class="hidden" onchange="handleFileUpload(this)">
                    </label>
                    
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
            <!-- OCR Results Display (text format) -->
            <div id="ocrResults" class="hidden bg-white rounded-lg shadow-lg p-8 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-bold text-gray-800">
                        ✅ OCR読み取り結果
                    </h3>
                    <span class="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <i class="fas fa-robot mr-1"></i>AI解析完了
                    </span>
                </div>
                <p class="text-green-600 mb-6">
                    <i class="fas fa-check-circle mr-2"></i>
                    データを自動保存しました。AI健康解析ですぐに使用できます。
                </p>
                
                <div id="ocrResultContent" class="bg-gray-50 rounded-lg p-6 space-y-4">
                    <!-- Results will be populated here -->
                </div>
                
                <div class="mt-6 flex gap-4">
                    <a href="/analysis" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition text-center font-bold">
                        <i class="fas fa-robot mr-2"></i>AI解析を実行
                    </a>
                    <button onclick="resetOCR()" class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-bold">
                        <i class="fas fa-redo mr-2"></i>別の画像を解析
                    </button>
                </div>
            </div>
            
            <!-- Keep old form hidden for compatibility -->
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
                    <h4 class="text-xl font-bold mb-4 text-red-600">血液検査データ（52項目）</h4>
                    
                    <!-- CBC: 血球系 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-red-700 border-b-2 border-red-200 pb-2">① 血球系（CBC：血算）</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">赤血球数 (×10⁴/µL)</label><input type="number" step="0.01" id="rbc" class="w-full px-4 py-2 border rounded-lg" placeholder="450"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">白血球数 (/µL)</label><input type="number" id="wbc" class="w-full px-4 py-2 border rounded-lg" placeholder="6000"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">血小板数 (×10⁴/µL)</label><input type="number" step="0.1" id="plt" class="w-full px-4 py-2 border rounded-lg" placeholder="25"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">ヘモグロビン (g/dL)</label><input type="number" step="0.1" id="hb" class="w-full px-4 py-2 border rounded-lg" placeholder="14.0"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">ヘマトクリット (%)</label><input type="number" step="0.1" id="hct" class="w-full px-4 py-2 border rounded-lg" placeholder="42"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">MCV (fL)</label><input type="number" step="0.1" id="mcv" class="w-full px-4 py-2 border rounded-lg" placeholder="90"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">MCH (pg)</label><input type="number" step="0.1" id="mch" class="w-full px-4 py-2 border rounded-lg" placeholder="30"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">MCHC (%)</label><input type="number" step="0.1" id="mchc" class="w-full px-4 py-2 border rounded-lg" placeholder="33"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">網赤血球 (%)</label><input type="number" step="0.1" id="ret" class="w-full px-4 py-2 border rounded-lg" placeholder="1.0"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">好中球 (%)</label><input type="number" step="0.1" id="neutrophil" class="w-full px-4 py-2 border rounded-lg" placeholder="55"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">リンパ球 (%)</label><input type="number" step="0.1" id="lymphocyte" class="w-full px-4 py-2 border rounded-lg" placeholder="35"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">単球 (%)</label><input type="number" step="0.1" id="monocyte" class="w-full px-4 py-2 border rounded-lg" placeholder="5"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">好酸球 (%)</label><input type="number" step="0.1" id="eosinophil" class="w-full px-4 py-2 border rounded-lg" placeholder="2"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">好塩基球 (%)</label><input type="number" step="0.1" id="basophil" class="w-full px-4 py-2 border rounded-lg" placeholder="0.5"></div>
                        </div>
                    </div>

                    <!-- 肝機能 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-orange-700 border-b-2 border-orange-200 pb-2">② 肝機能</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">AST (U/L)</label><input type="number" id="ast" class="w-full px-4 py-2 border rounded-lg" placeholder="25"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">ALT (U/L)</label><input type="number" id="alt" class="w-full px-4 py-2 border rounded-lg" placeholder="25"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">γ-GTP (U/L)</label><input type="number" id="ggt" class="w-full px-4 py-2 border rounded-lg" placeholder="30"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">ALP (U/L)</label><input type="number" id="alp" class="w-full px-4 py-2 border rounded-lg" placeholder="200"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">LDH (U/L)</label><input type="number" id="ldh" class="w-full px-4 py-2 border rounded-lg" placeholder="180"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">総ビリルビン (mg/dL)</label><input type="number" step="0.1" id="total_bilirubin" class="w-full px-4 py-2 border rounded-lg" placeholder="0.8"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">直接ビリルビン (mg/dL)</label><input type="number" step="0.1" id="direct_bilirubin" class="w-full px-4 py-2 border rounded-lg" placeholder="0.2"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">総蛋白 (g/dL)</label><input type="number" step="0.1" id="tp" class="w-full px-4 py-2 border rounded-lg" placeholder="7.0"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">アルブミン (g/dL)</label><input type="number" step="0.1" id="alb" class="w-full px-4 py-2 border rounded-lg" placeholder="4.5"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">A/G比</label><input type="number" step="0.1" id="ag_ratio" class="w-full px-4 py-2 border rounded-lg" placeholder="1.5"></div>
                        </div>
                    </div>

                    <!-- 腎機能 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-blue-700 border-b-2 border-blue-200 pb-2">③ 腎機能</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">BUN (mg/dL)</label><input type="number" step="0.1" id="bun" class="w-full px-4 py-2 border rounded-lg" placeholder="15"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">クレアチニン (mg/dL)</label><input type="number" step="0.01" id="creatinine" class="w-full px-4 py-2 border rounded-lg" placeholder="0.9"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">eGFR (mL/min/1.73㎡)</label><input type="number" step="0.1" id="egfr" class="w-full px-4 py-2 border rounded-lg" placeholder="90"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">尿酸 (mg/dL)</label><input type="number" step="0.1" id="uric_acid" class="w-full px-4 py-2 border rounded-lg" placeholder="5.5"></div>
                        </div>
                    </div>

                    <!-- 電解質・ミネラル -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-green-700 border-b-2 border-green-200 pb-2">④ 電解質・ミネラル</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">ナトリウム (mEq/L)</label><input type="number" step="0.1" id="sodium" class="w-full px-4 py-2 border rounded-lg" placeholder="140"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">カリウム (mEq/L)</label><input type="number" step="0.1" id="potassium" class="w-full px-4 py-2 border rounded-lg" placeholder="4.0"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">クロール (mEq/L)</label><input type="number" step="0.1" id="chloride" class="w-full px-4 py-2 border rounded-lg" placeholder="103"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">カルシウム (mg/dL)</label><input type="number" step="0.1" id="calcium" class="w-full px-4 py-2 border rounded-lg" placeholder="9.5"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">無機リン (mg/dL)</label><input type="number" step="0.1" id="phosphorus" class="w-full px-4 py-2 border rounded-lg" placeholder="3.5"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">マグネシウム (mg/dL)</label><input type="number" step="0.1" id="magnesium" class="w-full px-4 py-2 border rounded-lg" placeholder="2.2"></div>
                        </div>
                    </div>

                    <!-- 脂質 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-purple-700 border-b-2 border-purple-200 pb-2">⑤ 脂質（Lipid Profile）</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">総コレステロール (mg/dL)</label><input type="number" id="total_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="180"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">LDLコレステロール (mg/dL)</label><input type="number" id="ldl_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="100"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">HDLコレステロール (mg/dL)</label><input type="number" id="hdl_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="60"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">中性脂肪 (mg/dL)</label><input type="number" id="triglycerides" class="w-full px-4 py-2 border rounded-lg" placeholder="100"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">Non-HDLコレステロール (mg/dL)</label><input type="number" id="non_hdl_cholesterol" class="w-full px-4 py-2 border rounded-lg" placeholder="120"></div>
                        </div>
                    </div>

                    <!-- 糖代謝 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-pink-700 border-b-2 border-pink-200 pb-2">⑥ 糖代謝</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">空腹時血糖 (mg/dL)</label><input type="number" id="blood_sugar" class="w-full px-4 py-2 border rounded-lg" placeholder="90"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">HbA1c (%)</label><input type="number" step="0.1" id="hba1c" class="w-full px-4 py-2 border rounded-lg" placeholder="5.5"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">インスリン (µU/mL)</label><input type="number" step="0.1" id="insulin" class="w-full px-4 py-2 border rounded-lg" placeholder="8"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">HOMA-IR</label><input type="number" step="0.1" id="homa_ir" class="w-full px-4 py-2 border rounded-lg" placeholder="1.5"></div>
                        </div>
                    </div>

                    <!-- 炎症・免疫 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-indigo-700 border-b-2 border-indigo-200 pb-2">⑦ 炎症・免疫</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">CRP (mg/dL)</label><input type="number" step="0.01" id="crp" class="w-full px-4 py-2 border rounded-lg" placeholder="0.1"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">ESR (mm/hr)</label><input type="number" id="esr" class="w-full px-4 py-2 border rounded-lg" placeholder="5"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">フェリチン (ng/mL)</label><input type="number" step="0.1" id="ferritin" class="w-full px-4 py-2 border rounded-lg" placeholder="100"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">IgG (mg/dL)</label><input type="number" id="igg" class="w-full px-4 py-2 border rounded-lg" placeholder="1200"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">IgA (mg/dL)</label><input type="number" id="iga" class="w-full px-4 py-2 border rounded-lg" placeholder="250"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">IgM (mg/dL)</label><input type="number" id="igm" class="w-full px-4 py-2 border rounded-lg" placeholder="100"></div>
                        </div>
                    </div>

                    <!-- 甲状腺 -->
                    <div class="mb-6">
                        <h5 class="text-lg font-bold mb-3 text-teal-700 border-b-2 border-teal-200 pb-2">⑧ 甲状腺</h5>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">TSH (µIU/mL)</label><input type="number" step="0.01" id="tsh" class="w-full px-4 py-2 border rounded-lg" placeholder="2.0"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">FT3 (pg/mL)</label><input type="number" step="0.1" id="ft3" class="w-full px-4 py-2 border rounded-lg" placeholder="3.0"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">FT4 (ng/dL)</label><input type="number" step="0.1" id="ft4" class="w-full px-4 py-2 border rounded-lg" placeholder="1.2"></div>
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

            // Handle file upload (image or PDF)
            function handleFileUpload(input) {
                const file = input.files[0];
                if (!file) return;

                // Check file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    showError('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
                    input.value = ''; // Reset input
                    return;
                }

                selectedImage = file;
                
                // Check if it's a PDF or image
                if (file.type === 'application/pdf') {
                    // For PDF, show a PDF icon with filename
                    const previewContainer = document.getElementById('imagePreviewContainer');
                    const previewImg = document.getElementById('imagePreview');
                    
                    // Set PDF icon as preview
                    previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iI2VmNDQ0NCIgcng9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2IiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiPlBERjwvdGV4dD48L3N2Zz4=';
                    previewImg.style.maxHeight = '150px';
                    previewContainer.classList.remove('hidden');
                    
                    // Add PDF filename label
                    let fileLabel = previewContainer.querySelector('.pdf-filename');
                    if (!fileLabel) {
                        fileLabel = document.createElement('p');
                        fileLabel.className = 'pdf-filename text-center text-gray-700 font-bold mt-2 mb-4';
                        previewImg.parentElement.insertBefore(fileLabel, previewImg.nextSibling);
                    }
                    fileLabel.innerHTML = '<i class="fas fa-file-pdf text-red-600 mr-2"></i>' + file.name;
                } else {
                    // For images, show preview as before
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const previewImg = document.getElementById('imagePreview');
                        previewImg.src = e.target.result;
                        previewImg.style.maxHeight = '384px';
                        document.getElementById('imagePreviewContainer').classList.remove('hidden');
                        
                        // Remove PDF label if exists
                        const fileLabel = document.querySelector('.pdf-filename');
                        if (fileLabel) fileLabel.remove();
                        
                        document.getElementById('analyzeBtn').disabled = false;
                    };
                    reader.readAsDataURL(file);
                }
                
                document.getElementById('analyzeBtn').disabled = false;
            }

            // Analyze image/PDF with OCR
            async function analyzeImage() {
                if (!selectedImage) {
                    showError('ファイルを選択してください');
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
                        const data = response.data.result;
                        
                        // Get image as Data URL for storage
                        const reader = new FileReader();
                        reader.onload = async function(e) {
                            const imageDataUrl = e.target.result;
                            
                            // Automatically save to database with image URL
                            try {
                                const saveResponse = await axios.post('/api/exam', {
                                    user_id: currentUser.id,
                                    exam_date: data.exam_date || new Date().toISOString().split('T')[0],
                                    exam_type: data.exam_type || 'blood_test',
                                    measurements: data.measurements || [],
                                    data_source: 'ocr',
                                    ocr_raw_text: data.ocr_raw_text || null,
                                    ocr_image_url: imageDataUrl
                                });

                                if (saveResponse.data.success) {
                                    // Display OCR results as text
                                    displayOCRResults(data);
                                    showSuccess('✅ OCRで検査結果を読み取り、画像と共に自動保存しました！AI解析ですぐに使用できます。');
                                } else {
                                    showError('データの保存に失敗しました: ' + saveResponse.data.error);
                                }
                            } catch (saveError) {
                                console.error('Save error:', saveError);
                                showError('データの保存中にエラーが発生しました');
                            }
                        };
                        reader.readAsDataURL(selectedImage);
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
                    // 52項目の血液検査データを収集
                    const bloodTestFields = {
                        // CBC: 血球系
                        'rbc': '×10⁴/µL', 'wbc': '/µL', 'plt': '×10⁴/µL', 'hb': 'g/dL', 'hct': '%',
                        'mcv': 'fL', 'mch': 'pg', 'mchc': '%', 'ret': '%',
                        'neutrophil': '%', 'lymphocyte': '%', 'monocyte': '%', 'eosinophil': '%', 'basophil': '%',
                        // 肝機能
                        'ast': 'U/L', 'alt': 'U/L', 'ggt': 'U/L', 'alp': 'U/L', 'ldh': 'U/L',
                        'total_bilirubin': 'mg/dL', 'direct_bilirubin': 'mg/dL', 'tp': 'g/dL', 'alb': 'g/dL', 'ag_ratio': '',
                        // 腎機能
                        'bun': 'mg/dL', 'creatinine': 'mg/dL', 'egfr': 'mL/min/1.73㎡', 'uric_acid': 'mg/dL',
                        // 電解質・ミネラル
                        'sodium': 'mEq/L', 'potassium': 'mEq/L', 'chloride': 'mEq/L', 'calcium': 'mg/dL', 'phosphorus': 'mg/dL', 'magnesium': 'mg/dL',
                        // 脂質
                        'total_cholesterol': 'mg/dL', 'ldl_cholesterol': 'mg/dL', 'hdl_cholesterol': 'mg/dL', 'triglycerides': 'mg/dL', 'non_hdl_cholesterol': 'mg/dL',
                        // 糖代謝
                        'blood_sugar': 'mg/dL', 'hba1c': '%', 'insulin': 'µU/mL', 'homa_ir': '',
                        // 炎症・免疫
                        'crp': 'mg/dL', 'esr': 'mm/hr', 'ferritin': 'ng/mL', 'igg': 'mg/dL', 'iga': 'mg/dL', 'igm': 'mg/dL',
                        // 甲状腺
                        'tsh': 'µIU/mL', 'ft3': 'pg/mL', 'ft4': 'ng/dL'
                    };
                    
                    Object.entries(bloodTestFields).forEach(([field, unit]) => {
                        const value = document.getElementById(field)?.value;
                        if (value) {
                            measurements.push({ key: field, value: value, unit: unit });
                        }
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

            // Format measurement key (52項目対応)
            function formatMeasurementKey(key) {
                const keyMap = {
                    // 血圧
                    'systolic_bp': '収縮期血圧', 'diastolic_bp': '拡張期血圧', 'pulse': '脈拍',
                    // 体組成
                    'weight': '体重', 'body_fat': '体脂肪率', 'muscle_mass': '筋肉量', 'bmi': 'BMI',
                    // CBC: 血球系
                    'rbc': '赤血球数', 'wbc': '白血球数', 'plt': '血小板数', 'hb': 'ヘモグロビン', 'hct': 'ヘマトクリット',
                    'mcv': 'MCV', 'mch': 'MCH', 'mchc': 'MCHC', 'ret': '網赤血球',
                    'neutrophil': '好中球', 'lymphocyte': 'リンパ球', 'monocyte': '単球', 'eosinophil': '好酸球', 'basophil': '好塩基球',
                    // 肝機能
                    'ast': 'AST', 'alt': 'ALT', 'ggt': 'γ-GTP', 'alp': 'ALP', 'ldh': 'LDH',
                    'total_bilirubin': '総ビリルビン', 'direct_bilirubin': '直接ビリルビン', 'tp': '総蛋白', 'alb': 'アルブミン', 'ag_ratio': 'A/G比',
                    // 腎機能
                    'bun': 'BUN', 'creatinine': 'クレアチニン', 'egfr': 'eGFR', 'uric_acid': '尿酸',
                    // 電解質・ミネラル
                    'sodium': 'ナトリウム', 'potassium': 'カリウム', 'chloride': 'クロール', 'calcium': 'カルシウム', 'phosphorus': '無機リン', 'magnesium': 'マグネシウム',
                    // 脂質
                    'total_cholesterol': '総コレステロール', 'ldl_cholesterol': 'LDL', 'hdl_cholesterol': 'HDL', 'triglycerides': '中性脂肪', 'non_hdl_cholesterol': 'Non-HDL',
                    // 糖代謝
                    'blood_sugar': '空腹時血糖', 'hba1c': 'HbA1c', 'insulin': 'インスリン', 'homa_ir': 'HOMA-IR',
                    // 炎症・免疫
                    'crp': 'CRP', 'esr': 'ESR', 'ferritin': 'フェリチン', 'igg': 'IgG', 'iga': 'IgA', 'igm': 'IgM',
                    // 甲状腺
                    'tsh': 'TSH', 'ft3': 'FT3', 'ft4': 'FT4'
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

            // Display OCR results as text
            function displayOCRResults(data) {
                const container = document.getElementById('ocrResultContent');
                const examTypeNames = {
                    'blood_pressure': '血圧測定',
                    'body_composition': '体組成測定',
                    'blood_test': '血液検査',
                    'autonomic_nervous': '自律神経測定',
                    'custom': 'カスタム検査'
                };
                
                const measurementNames = {
                    // 血圧・脈拍
                    'systolic_bp': '収縮期血圧',
                    'diastolic_bp': '拡張期血圧',
                    'pulse': '脈拍',
                    'heart_rate': '心拍数',
                    
                    // 体組成
                    'weight': '体重',
                    'body_fat': '体脂肪率',
                    'muscle_mass': '筋肉量',
                    'bmi': 'BMI',
                    'visceral_fat': '内臓脂肪',
                    'body_age': '体内年齢',
                    'basal_metabolism': '基礎代謝',
                    
                    // 糖代謝
                    'blood_sugar': '血糖値',
                    'fbs': '空腹時血糖',
                    'glucose': 'グルコース',
                    'hba1c': 'HbA1c',
                    'insulin': 'インスリン',
                    'iri': 'IRI',
                    
                    // 脂質
                    'total_cholesterol': '総コレステロール',
                    'tc': '総コレステロール',
                    'ldl_cholesterol': 'LDLコレステロール',
                    'ldl': 'LDL',
                    'hdl_cholesterol': 'HDLコレステロール',
                    'hdl': 'HDL',
                    'triglycerides': '中性脂肪',
                    'tg': '中性脂肪',
                    'non_hdl': 'non-HDL',
                    
                    // 肝機能
                    'ast': 'AST(GOT)',
                    'got': 'AST(GOT)',
                    'alt': 'ALT(GPT)',
                    'gpt': 'ALT(GPT)',
                    'ggt': 'γ-GTP',
                    'alp': 'ALP',
                    'ldh': 'LDH',
                    'bilirubin': 'ビリルビン',
                    'albumin': 'アルブミン',
                    'total_protein': '総タンパク',
                    'tp': '総タンパク',
                    
                    // 腎機能
                    'creatinine': 'クレアチニン',
                    'cr': 'クレアチニン',
                    'bun': '尿素窒素',
                    'uric_acid': '尿酸',
                    'ua': '尿酸',
                    'egfr': 'eGFR',
                    
                    // 電解質
                    'sodium': 'ナトリウム',
                    'na': 'Na',
                    'potassium': 'カリウム',
                    'k': 'K',
                    'chloride': 'クロール',
                    'cl': 'Cl',
                    'calcium': 'カルシウム',
                    'ca': 'Ca',
                    'magnesium': 'マグネシウム',
                    'mg': 'Mg',
                    
                    // 血球
                    'wbc': '白血球',
                    'rbc': '赤血球',
                    'hemoglobin': 'ヘモグロビン',
                    'hb': 'Hb',
                    'hematocrit': 'ヘマトクリット',
                    'ht': 'Ht',
                    'platelet': '血小板',
                    'plt': '血小板',
                    'mcv': 'MCV',
                    'mch': 'MCH',
                    'mchc': 'MCHC',
                    
                    // 炎症マーカー
                    'crp': 'CRP',
                    'esr': '血沈',
                    
                    // 甲状腺
                    'tsh': 'TSH',
                    'ft3': 'FT3',
                    'ft4': 'FT4',
                    
                    // ビタミン・その他
                    'ferritin': 'フェリチン',
                    'folic_acid': '葉酸',
                    'vitamin_b12': 'ビタミンB12',
                    'vitamin_d': 'ビタミンD',
                    
                    // 自律神経
                    'sympathetic': '交感神経活動',
                    'parasympathetic': '副交感神経活動',
                    'autonomic_balance': '自律神経バランス',
                    'vascular_age': '血管年齢'
                };

                let html = \`
                    <div class="mb-4">
                        <div class="text-sm text-gray-600 mb-1">検査日</div>
                        <div class="text-lg font-bold text-gray-800">\${data.exam_date || '不明'}</div>
                    </div>
                    <div class="mb-4">
                        <div class="text-sm text-gray-600 mb-1">検査タイプ</div>
                        <div class="text-lg font-bold text-blue-600">\${examTypeNames[data.exam_type] || data.exam_type}</div>
                    </div>
                \`;

                // Display structured measurements if available
                if (data.measurements && data.measurements.length > 0) {
                    html += \`
                        <div class="border-t pt-4 mb-4">
                            <div class="text-sm text-gray-600 mb-3">主な測定値</div>
                            <div class="grid md:grid-cols-2 gap-3">
                    \`;
                    
                    data.measurements.forEach(m => {
                        const name = measurementNames[m.key] || m.key;
                        const hasRange = m.normal_range_min !== null && m.normal_range_max !== null;
                        const rangeText = hasRange ? \`（基準値: \${m.normal_range_min}-\${m.normal_range_max}）\` : '';
                        
                        // Check if value is within normal range
                        let statusClass = 'text-gray-800';
                        let statusIcon = '';
                        if (hasRange) {
                            const value = parseFloat(m.value);
                            if (value < m.normal_range_min || value > m.normal_range_max) {
                                statusClass = 'text-red-600';
                                statusIcon = '<i class="fas fa-exclamation-triangle text-red-500 ml-2"></i>';
                            } else {
                                statusClass = 'text-green-600';
                                statusIcon = '<i class="fas fa-check-circle text-green-500 ml-2"></i>';
                            }
                        }
                        
                        html += \`
                            <div class="bg-white p-3 rounded border border-gray-200">
                                <div class="text-xs text-gray-500">\${name} \${rangeText}</div>
                                <div class="text-xl font-bold \${statusClass}">
                                    \${m.value} <span class="text-sm text-gray-500">\${m.unit || ''}</span>
                                    \${statusIcon}
                                </div>
                            </div>
                        \`;
                    });
                    
                    html += \`
                            </div>
                        </div>
                    \`;
                }

                // Display OCR raw text if available
                if (data.ocr_raw_text) {
                    html += \`
                        <div class="border-t pt-4">
                            <div class="text-sm text-gray-600 mb-3">📝 OCRで読み取った全テキスト（AI解析で活用）</div>
                            <div class="bg-gray-50 p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
                                <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">\${data.ocr_raw_text}</pre>
                            </div>
                        </div>
                    \`;
                }

                container.innerHTML = html;
                document.getElementById('ocrResults').classList.remove('hidden');
                document.getElementById('imagePreviewContainer').classList.add('hidden');
                document.getElementById('ocrResults').scrollIntoView({ behavior: 'smooth' });
            }

            // Reset OCR form
            function resetOCR() {
                document.getElementById('ocrResults').classList.add('hidden');
                document.getElementById('imagePreviewContainer').classList.add('hidden');
                selectedImage = null;
                const fileInput = document.getElementById('imageUpload');
                if (fileInput) fileInput.value = '';
                loadOcrHistory();
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

// New route with 52 blood test items (cache bypass)
examOcrRoutes.get('/v2', (c) => {
  return c.redirect('/exam/ocr')
})
