import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const bloodTestRoutes = new Hono<{ Bindings: Bindings }>()

// 血液検査データ入力ページ（52項目）
bloodTestRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>血液検査データ入力（52項目） - じぶんサプリ育成アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/dashboard" class="text-2xl font-bold text-blue-600">
                            <i class="fas fa-capsules mr-2"></i>じぶんサプリ
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard" class="text-gray-700 hover:text-blue-600">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <button id="logout-btn" class="text-gray-700 hover:text-red-600">
                            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-5xl mx-auto px-4 py-8">
            <!-- Page Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-flask mr-2 text-blue-600"></i>血液検査データ入力（52項目）
                </h1>
                <p class="text-gray-600">健康診断や人間ドックの血液検査結果を入力してください。入力したデータはAI解析に使用されます。</p>
            </div>

            <!-- Input Form -->
            <form id="blood-test-form" class="space-y-6">
                <!-- Exam Date -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-calendar-alt mr-2 text-blue-600"></i>検査日
                    </h2>
                    <input type="date" id="exam_date" required 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>

                <!-- CBC (Complete Blood Count) - 14 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-tint mr-2 text-red-600"></i>血球算定（CBC） - 14項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">赤血球数 (RBC)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="rbc" placeholder="例: 450" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">×10⁴/µL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">白血球数 (WBC)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="wbc" placeholder="例: 6000" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">/µL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">ヘモグロビン (Hb)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="hb" placeholder="例: 14.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">g/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">ヘマトクリット (Ht)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="ht" placeholder="例: 42.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">平均赤血球容積 (MCV)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="mcv" placeholder="例: 90.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">fL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">平均赤血球ヘモグロビン量 (MCH)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="mch" placeholder="例: 30.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">pg</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">平均赤血球ヘモグロビン濃度 (MCHC)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="mchc" placeholder="例: 33.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">血小板数 (PLT)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="plt" placeholder="例: 25.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">×10⁴/µL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">好中球 (Neutrophil)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="neutrophil" placeholder="例: 60.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">リンパ球 (Lymphocyte)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="lymphocyte" placeholder="例: 30.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">単球 (Monocyte)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="monocyte" placeholder="例: 5.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">好酸球 (Eosinophil)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="eosinophil" placeholder="例: 3.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">好塩基球 (Basophil)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="basophil" placeholder="例: 0.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">網状赤血球 (Reticulocyte)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="reticulocyte" placeholder="例: 1.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Liver Function - 10 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-lungs mr-2 text-orange-600"></i>肝機能 - 10項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">AST (GOT)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="ast" placeholder="例: 22" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">U/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">ALT (GPT)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="alt" placeholder="例: 18" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">U/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">γ-GTP (γ-GT)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="ggt" placeholder="例: 25" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">U/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">ALP (アルカリホスファターゼ)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="alp" placeholder="例: 200" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">U/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">LDH (乳酸脱水素酵素)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="ldh" placeholder="例: 180" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">U/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">総ビリルビン</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="total_bilirubin" placeholder="例: 0.8" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">直接ビリルビン</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="direct_bilirubin" placeholder="例: 0.2" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">総タンパク (TP)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="total_protein" placeholder="例: 7.2" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">g/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">アルブミン (Alb)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="albumin" placeholder="例: 4.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">g/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">A/G比</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="ag_ratio" placeholder="例: 1.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">比</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kidney Function - 4 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-kidneys mr-2 text-purple-600"></i>腎機能 - 4項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">尿素窒素 (BUN)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="bun" placeholder="例: 15" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">クレアチニン (Cr)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="creatinine" placeholder="例: 0.9" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">eGFR (推算糸球体濾過量)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="egfr" placeholder="例: 90" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mL/min/1.73m²</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">尿酸 (UA)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="uric_acid" placeholder="例: 5.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Electrolytes & Minerals - 6 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-atom mr-2 text-green-600"></i>電解質・ミネラル - 6項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">ナトリウム (Na)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="sodium" placeholder="例: 140" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mEq/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">カリウム (K)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="potassium" placeholder="例: 4.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mEq/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">クロール (Cl)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="chloride" placeholder="例: 105" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mEq/L</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">カルシウム (Ca)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="calcium" placeholder="例: 9.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">リン (P)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="phosphorus" placeholder="例: 3.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">マグネシウム (Mg)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="magnesium" placeholder="例: 2.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lipids - 5 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-oil-can mr-2 text-yellow-600"></i>脂質 - 5項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">総コレステロール (TC)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="total_cholesterol" placeholder="例: 200" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">LDLコレステロール</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="ldl_cholesterol" placeholder="例: 120" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">HDLコレステロール</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="hdl_cholesterol" placeholder="例: 55" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">中性脂肪 (TG)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="triglycerides" placeholder="例: 110" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Non-HDLコレステロール</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="non_hdl_cholesterol" placeholder="例: 145" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Glucose Metabolism - 4 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-candy-cane mr-2 text-pink-600"></i>糖代謝 - 4項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">空腹時血糖 (FBS)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="blood_sugar" placeholder="例: 95" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">HbA1c (NGSP)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="hba1c" placeholder="例: 5.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">インスリン (IRI)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="insulin" placeholder="例: 8.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">µU/mL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">HOMA-IR</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="homa_ir" placeholder="例: 1.8" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">指数</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Inflammation & Immunity - 6 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-shield-virus mr-2 text-indigo-600"></i>炎症・免疫 - 6項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">CRP (C反応性タンパク)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="crp" placeholder="例: 0.05" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">赤血球沈降速度 (ESR)</label>
                            <div class="flex gap-2">
                                <input type="number" step="1" name="esr" placeholder="例: 8" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mm/h</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">IgG (免疫グロブリンG)</label>
                            <div class="flex gap-2">
                                <input type="number" step="1" name="igg" placeholder="例: 1200" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">IgA (免疫グロブリンA)</label>
                            <div class="flex gap-2">
                                <input type="number" step="1" name="iga" placeholder="例: 250" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">IgM (免疫グロブリンM)</label>
                            <div class="flex gap-2">
                                <input type="number" step="1" name="igm" placeholder="例: 100" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">mg/dL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">リウマチ因子 (RF)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.1" name="rf" placeholder="例: 8" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">IU/mL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Thyroid - 3 items -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-thyroid mr-2 text-teal-600"></i>甲状腺 - 3項目
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">TSH (甲状腺刺激ホルモン)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="tsh" placeholder="例: 2.5" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">µIU/mL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">FT3 (遊離トリヨードサイロニン)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="ft3" placeholder="例: 3.0" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">pg/mL</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">FT4 (遊離サイロキシン)</label>
                            <div class="flex gap-2">
                                <input type="number" step="0.01" name="ft4" placeholder="例: 1.2" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                                <span class="px-3 py-2 bg-gray-100 rounded-lg text-sm">ng/dL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="flex justify-center">
                    <button type="submit" 
                            class="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-save mr-2"></i>保存してAI解析へ
                    </button>
                </div>
            </form>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentUser = null;

            // Check authentication
            async function checkAuth() {
                try {
                    const response = await axios.get('/api/auth/me');
                    if (response.data.success) {
                        currentUser = response.data.user;
                        console.log('Authenticated user:', currentUser);
                    } else {
                        window.location.href = '/auth/login';
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    window.location.href = '/auth/login';
                }
            }

            // Call checkAuth on page load
            window.addEventListener('load', checkAuth);

            // Logout handler
            document.getElementById('logout-btn').addEventListener('click', async () => {
                try {
                    await axios.post('/api/auth/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                }
                window.location.href = '/auth/login';
            })

            // Form submission
            document.getElementById('blood-test-form').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const examDate = document.getElementById('exam_date').value
                if (!examDate) {
                    alert('検査日を入力してください')
                    return
                }

                // Collect all measurements
                const measurements = {}
                const inputs = document.querySelectorAll('input[name]')
                inputs.forEach(input => {
                    if (input.value) {
                        const name = input.getAttribute('name')
                        measurements[name] = {
                            value: parseFloat(input.value),
                            unit: input.nextElementSibling?.textContent || ''
                        }
                    }
                })

                if (Object.keys(measurements).length === 0) {
                    alert('少なくとも1つの検査値を入力してください')
                    return
                }

                try {
                    if (!currentUser || !currentUser.id) {
                        alert('ユーザー情報が取得できませんでした。再度ログインしてください。');
                        window.location.href = '/auth/login';
                        return;
                    }

                    const response = await axios.post('/api/exam', {
                        user_id: currentUser.id,
                        exam_date: examDate,
                        exam_type: 'blood_test',
                        data_source: 'manual_input',
                        measurements: measurements
                    })

                    if (response.data.success) {
                        alert('検査データが保存されました！AI解析ページに移動します。')
                        window.location.href = '/analysis'
                    }
                } catch (error) {
                    console.error('Error saving exam data:', error)
                    alert('データの保存に失敗しました: ' + (error.response?.data?.error || error.message))
                }
            })

            // Set today's date as default
            document.getElementById('exam_date').valueAsDate = new Date()
        </script>
    </body>
    </html>
  `)
})

export default bloodTestRoutes
