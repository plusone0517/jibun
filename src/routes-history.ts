import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const historyRoutes = new Hono<{ Bindings: Bindings }>()

// Exam history page with charts
historyRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>検査履歴 - じぶんを知ることからアプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        <nav class="bg-white shadow-lg mb-8">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-600">
                        <a href="/dashboard" class="hover:text-blue-700">
                            <i class="fas fa-heartbeat mr-2"></i>
                            じぶんを知ることからアプリ
                        </a>
                    </h1>
                    <div class="flex space-x-4">
                        <a href="/dashboard" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 pb-12">
            <h2 class="text-3xl font-bold text-gray-800 mb-8">
                <i class="fas fa-chart-line mr-2"></i>検査履歴（3年間）
            </h2>

            <div id="loadingMessage" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-spinner fa-spin mr-2"></i>データを読み込み中...
            </div>

            <div id="noDataMessage" class="hidden bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                <i class="fas fa-exclamation-triangle mr-2"></i>検査データがありません。
                <a href="/exam" class="underline font-bold">検査データを入力</a>
            </div>

            <!-- Blood Pressure Chart -->
            <div id="bpChartContainer" class="hidden bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-bold mb-4 text-red-600">
                    <i class="fas fa-heartbeat mr-2"></i>血圧の推移
                </h3>
                <canvas id="bpChart"></canvas>
            </div>

            <!-- Body Composition Chart -->
            <div id="bodyChartContainer" class="hidden bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-bold mb-4 text-green-600">
                    <i class="fas fa-weight mr-2"></i>体組成の推移
                </h3>
                <canvas id="bodyChart"></canvas>
            </div>

            <!-- Blood Test Chart -->
            <div id="bloodTestChartContainer" class="hidden bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-bold mb-4 text-purple-600">
                    <i class="fas fa-vial mr-2"></i>血液検査の推移
                </h3>
                <canvas id="bloodTestChart"></canvas>
            </div>

            <!-- Data Table -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-table mr-2"></i>検査データ一覧
                </h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">検査タイプ</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">測定値</th>
                            </tr>
                        </thead>
                        <tbody id="dataTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <script>
            let bpChart, bodyChart, bloodTestChart;

            async function loadHistory() {
                try {
                    // Get current user
                    const userResponse = await axios.get('/api/auth/me');
                    if (!userResponse.data.success) {
                        window.location.href = '/auth/login';
                        return;
                    }
                    const userId = userResponse.data.user.id;

                    // Get exam history (3 years)
                    const threeYearsAgo = new Date();
                    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
                    const startDate = threeYearsAgo.toISOString().split('T')[0];

                    const response = await axios.get(\`/api/history/\${userId}?start_date=\${startDate}\`);
                    
                    document.getElementById('loadingMessage').classList.add('hidden');

                    if (!response.data.success || response.data.exams.length === 0) {
                        document.getElementById('noDataMessage').classList.remove('hidden');
                        return;
                    }

                    const exams = response.data.exams;
                    renderCharts(exams);
                    renderTable(exams);
                } catch (error) {
                    console.error('Error loading history:', error);
                    document.getElementById('loadingMessage').classList.add('hidden');
                    alert('データの読み込みに失敗しました');
                }
            }

            function renderCharts(exams) {
                const bpData = exams.filter(e => e.exam_type === 'blood_pressure');
                const bodyData = exams.filter(e => e.exam_type === 'body_composition');
                const bloodTestData = exams.filter(e => e.exam_type === 'blood_test');

                if (bpData.length > 0) {
                    document.getElementById('bpChartContainer').classList.remove('hidden');
                    renderBPChart(bpData);
                }

                if (bodyData.length > 0) {
                    document.getElementById('bodyChartContainer').classList.remove('hidden');
                    renderBodyChart(bodyData);
                }

                if (bloodTestData.length > 0) {
                    document.getElementById('bloodTestChartContainer').classList.remove('hidden');
                    renderBloodTestChart(bloodTestData);
                }
            }

            function renderBPChart(data) {
                const dates = data.map(d => d.exam_date);
                const systolic = data.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'systolic_bp');
                    return m ? parseFloat(m.measurement_value) : null;
                });
                const diastolic = data.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'diastolic_bp');
                    return m ? parseFloat(m.measurement_value) : null;
                });

                const ctx = document.getElementById('bpChart').getContext('2d');
                bpChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [
                            {
                                label: '収縮期血圧 (mmHg)',
                                data: systolic,
                                borderColor: 'rgb(239, 68, 68)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.4
                            },
                            {
                                label: '拡張期血圧 (mmHg)',
                                data: diastolic,
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                title: {
                                    display: true,
                                    text: '血圧 (mmHg)'
                                }
                            }
                        }
                    }
                });
            }

            function renderBodyChart(data) {
                const dates = data.map(d => d.exam_date);
                const weight = data.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'weight');
                    return m ? parseFloat(m.measurement_value) : null;
                });
                const bodyFat = data.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'body_fat');
                    return m ? parseFloat(m.measurement_value) : null;
                });

                const ctx = document.getElementById('bodyChart').getContext('2d');
                bodyChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [
                            {
                                label: '体重 (kg)',
                                data: weight,
                                borderColor: 'rgb(16, 185, 129)',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.4,
                                yAxisID: 'y'
                            },
                            {
                                label: '体脂肪率 (%)',
                                data: bodyFat,
                                borderColor: 'rgb(245, 158, 11)',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                tension: 0.4,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: '体重 (kg)'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: '体脂肪率 (%)'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        }
                    }
                });
            }

            function renderBloodTestChart(data) {
                const dates = data.map(d => d.exam_date);
                const bloodSugar = data.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'blood_sugar');
                    return m ? parseFloat(m.measurement_value) : null;
                });
                const totalCholesterol = data.map(d => {
                    const m = d.measurements.find(m => m.measurement_key === 'total_cholesterol');
                    return m ? parseFloat(m.measurement_value) : null;
                });

                const ctx = document.getElementById('bloodTestChart').getContext('2d');
                bloodTestChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [
                            {
                                label: '血糖値 (mg/dL)',
                                data: bloodSugar,
                                borderColor: 'rgb(139, 92, 246)',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                tension: 0.4
                            },
                            {
                                label: '総コレステロール (mg/dL)',
                                data: totalCholesterol,
                                borderColor: 'rgb(236, 72, 153)',
                                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                title: {
                                    display: true,
                                    text: '測定値 (mg/dL)'
                                }
                            }
                        }
                    }
                });
            }

            function renderTable(exams) {
                const tbody = document.getElementById('dataTableBody');
                tbody.innerHTML = '';

                exams.forEach(exam => {
                    const row = document.createElement('tr');
                    
                    const dateCell = document.createElement('td');
                    dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                    dateCell.textContent = exam.exam_date;
                    
                    const typeCell = document.createElement('td');
                    typeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                    const typeNames = {
                        'blood_pressure': '血圧測定',
                        'body_composition': '体組成',
                        'blood_test': '血液検査',
                        'custom': 'カスタム検査'
                    };
                    typeCell.textContent = typeNames[exam.exam_type] || exam.exam_type;
                    
                    const measureCell = document.createElement('td');
                    measureCell.className = 'px-6 py-4 text-sm text-gray-900';
                    const measurements = exam.measurements.map(m => 
                        \`\${m.measurement_key}: \${m.measurement_value}\${m.measurement_unit}\`
                    ).join(', ');
                    measureCell.textContent = measurements;
                    
                    row.appendChild(dateCell);
                    row.appendChild(typeCell);
                    row.appendChild(measureCell);
                    tbody.appendChild(row);
                });
            }

            // Load data on page load
            loadHistory();
        </script>
    </body>
    </html>
  `)
})
