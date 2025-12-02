import { Hono } from 'hono'
import { questionnaireData } from './questionnaire-data'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const questionnaireRoutes = new Hono<{ Bindings: Bindings }>()

// Questionnaire page
questionnaireRoutes.get('/', (c) => {
  const questionsJSON = JSON.stringify(questionnaireData)
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>健康問診 - じぶんサプリ育成</title>
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
            <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">健康問診（50問）</h2>
                <p class="text-gray-600 mb-6">あなたの生活習慣や健康状態について教えてください。より正確なアドバイスのため、正直にお答えください。</p>
                
                <!-- Progress bar -->
                <div class="mb-8">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">進捗状況</span>
                        <span class="text-sm font-medium text-gray-700"><span id="progressText">0</span>/50</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div id="progressBar" class="bg-green-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Question container -->
                <div id="questionContainer" class="mb-8">
                    <!-- Questions will be dynamically inserted here -->
                </div>

                <!-- Navigation buttons -->
                <div class="flex justify-between">
                    <button id="prevBtn" onclick="prevQuestion()" class="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-bold disabled:opacity-50" disabled>
                        <i class="fas fa-arrow-left mr-2"></i>前へ
                    </button>
                    <button id="nextBtn" onclick="nextQuestion()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400">
                        次へ<i class="fas fa-arrow-right ml-2"></i>
                    </button>
                    <button id="submitBtn" onclick="submitQuestionnaire()" class="hidden bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400">
                        <i class="fas fa-check mr-2"></i>送信する
                    </button>
                </div>
            </div>

            <div id="successMessage" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong class="font-bold">送信完了！</strong>
                <span class="block sm:inline">問診が完了しました。AI解析ページで結果を確認できます。</span>
            </div>

            <div id="errorMessage" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong class="font-bold">エラー！</strong>
                <span class="block sm:inline" id="errorText"></span>
            </div>
        </main>

        <script>
            const questions = ${questionsJSON};
            let currentQuestion = 0;
            let answers = {};

            // Load saved answers from localStorage
            function loadSavedAnswers() {
                try {
                    const saved = localStorage.getItem('questionnaire_answers');
                    if (saved) {
                        answers = JSON.parse(saved);
                        console.log('Loaded saved answers:', Object.keys(answers).length, 'questions');
                        
                        // Show notification if there are saved answers
                        if (Object.keys(answers).length > 0) {
                            const notification = document.createElement('div');
                            notification.className = 'bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4';
                            notification.innerHTML = \`
                                <div class="flex justify-between items-center">
                                    <span><i class="fas fa-info-circle mr-2"></i>前回の回答（\${Object.keys(answers).length}問）を復元しました</span>
                                    <button onclick="clearSavedAnswers()" class="text-blue-700 hover:text-blue-900 font-bold">
                                        <i class="fas fa-trash mr-1"></i>クリア
                                    </button>
                                </div>
                            \`;
                            document.querySelector('main > div').insertBefore(notification, document.querySelector('main > div').firstChild);
                        }
                    }
                } catch (error) {
                    console.error('Error loading saved answers:', error);
                }
            }

            // Save answers to localStorage
            function saveAnswersToLocalStorage() {
                try {
                    localStorage.setItem('questionnaire_answers', JSON.stringify(answers));
                } catch (error) {
                    console.error('Error saving answers:', error);
                }
            }

            // Clear saved answers
            function clearSavedAnswers() {
                if (confirm('保存された回答をすべてクリアしますか？')) {
                    localStorage.removeItem('questionnaire_answers');
                    answers = {};
                    currentQuestion = 0;
                    displayQuestion(0);
                    location.reload();
                }
            }

            function displayQuestion(index) {
                const question = questions[index];
                const container = document.getElementById('questionContainer');
                
                const optionsHTML = question.options.map((option, i) => \`
                    <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition \${answers[question.number] === option ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}">
                        <input type="radio" name="q\${question.number}" value="\${option}" class="mr-3 w-5 h-5" 
                            \${answers[question.number] === option ? 'checked' : ''}
                            onchange="selectAnswer(\${question.number}, this.value)">
                        <span class="text-lg">\${option}</span>
                    </label>
                \`).join('');

                container.innerHTML = \`
                    <div class="mb-6">
                        <div class="flex items-center mb-4">
                            <div class="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4">
                                \${question.number}
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 uppercase">\${getCategoryName(question.category)}</p>
                                <h3 class="text-xl font-bold text-gray-800">\${question.text}</h3>
                            </div>
                        </div>
                        <div class="space-y-3">
                            \${optionsHTML}
                        </div>
                    </div>
                \`;

                updateProgress();
                updateButtons();
            }

            function getCategoryName(category) {
                const categoryNames = {
                    'sleep': '睡眠・休養',
                    'diet': '食事・栄養',
                    'exercise': '運動・活動',
                    'stress': 'ストレス・メンタル',
                    'lifestyle': '生活習慣',
                    'work': '仕事・日常',
                    'symptoms': '身体症状',
                    'medical': '既往歴',
                    'family': '家族歴'
                };
                return categoryNames[category] || category;
            }

            function selectAnswer(questionNumber, answer) {
                answers[questionNumber] = answer;
                updateProgress();
                updateButtons(); // Update button states after answering
                saveAnswersToLocalStorage(); // Auto-save on every answer
            }

            function updateProgress() {
                const answered = Object.keys(answers).length;
                const percentage = (answered / questions.length) * 100;
                document.getElementById('progressBar').style.width = percentage + '%';
                document.getElementById('progressText').textContent = answered;
            }

            function updateButtons() {
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');
                const submitBtn = document.getElementById('submitBtn');

                prevBtn.disabled = currentQuestion === 0;

                // Check if current question is answered
                const currentQuestionNumber = questions[currentQuestion].number;
                const isAnswered = !!answers[currentQuestionNumber];

                if (currentQuestion === questions.length - 1) {
                    nextBtn.classList.add('hidden');
                    submitBtn.classList.remove('hidden');
                    // Disable submit button if not all questions are answered
                    submitBtn.disabled = Object.keys(answers).length < questions.length;
                } else {
                    nextBtn.classList.remove('hidden');
                    submitBtn.classList.add('hidden');
                    // Disable next button if current question is not answered
                    nextBtn.disabled = !isAnswered;
                }
            }

            function nextQuestion() {
                // Check if current question is answered
                const currentQuestionNumber = questions[currentQuestion].number;
                if (!answers[currentQuestionNumber]) {
                    showError('この質問に回答してから次へ進んでください');
                    return;
                }
                
                if (currentQuestion < questions.length - 1) {
                    currentQuestion++;
                    displayQuestion(currentQuestion);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }

            function prevQuestion() {
                if (currentQuestion > 0) {
                    currentQuestion--;
                    displayQuestion(currentQuestion);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }

            async function submitQuestionnaire() {
                try {
                    const answeredCount = Object.keys(answers).length;
                    if (answeredCount < questions.length) {
                        showError(\`全ての質問に回答してください（現在 \${answeredCount}/50）\`);
                        return;
                    }

                    // Get current user
                    const userResponse = await axios.get('/api/auth/me');
                    if (!userResponse.data.success) {
                        showError('ログインが必要です');
                        return;
                    }
                    const userId = userResponse.data.user.id;

                    const responses = questions.map(q => ({
                        question_number: q.number,
                        question_text: q.text,
                        answer_value: answers[q.number],
                        category: q.category
                    }));

                    const response = await axios.post('/api/questionnaire', {
                        user_id: userId,
                        responses: responses
                    });

                    if (response.data.success) {
                        // Clear saved answers on successful submission
                        localStorage.removeItem('questionnaire_answers');
                        showSuccess();
                        setTimeout(() => {
                            window.location.href = '/analysis';
                        }, 2000);
                    } else {
                        showError(response.data.error || '送信に失敗しました');
                    }
                } catch (error) {
                    console.error('Error submitting questionnaire:', error);
                    showError('送信中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            }

            function showSuccess() {
                document.getElementById('successMessage').classList.remove('hidden');
            }

            function showError(message) {
                document.getElementById('errorText').textContent = message;
                document.getElementById('errorMessage').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('errorMessage').classList.add('hidden');
                }, 5000);
            }

            // Initialize
            loadSavedAnswers(); // Load saved answers first
            displayQuestion(0);
        </script>
    </body>
    </html>
  `)
})

// Save questionnaire responses
questionnaireRoutes.post('/api', async (c) => {
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
questionnaireRoutes.get('/api/:userId', async (c) => {
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

// Questionnaire history page
questionnaireRoutes.get('/history', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>問診履歴 - じぶんサプリ育成</title>
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

        <main class="max-w-6xl mx-auto px-4 pb-12">
            <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-clipboard-list mr-3"></i>問診履歴
                    </h2>
                    <a href="/questionnaire" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold">
                        <i class="fas fa-plus mr-2"></i>新規問診
                    </a>
                </div>

                <div id="loadingState" class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p class="text-gray-600">問診履歴を読み込み中...</p>
                </div>

                <div id="historyContainer" class="hidden">
                    <!-- History will be displayed here -->
                </div>

                <div id="noDataState" class="hidden text-center py-8">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600 mb-4">まだ問診履歴がありません</p>
                    <a href="/questionnaire" class="text-blue-600 hover:underline">
                        <i class="fas fa-arrow-right mr-2"></i>問診を始める
                    </a>
                </div>
            </div>
        </main>

        <script>
            let currentUser = null;

            async function loadHistory() {
                try {
                    // Get current user
                    const userResponse = await axios.get('/api/auth/me');
                    if (!userResponse.data.success) {
                        window.location.href = '/auth/login';
                        return;
                    }
                    currentUser = userResponse.data.user;

                    // Get questionnaire responses
                    const response = await axios.get(\`/questionnaire/api/\${currentUser.id}\`);
                    
                    if (response.data.success && response.data.responses && response.data.responses.length > 0) {
                        displayHistory(response.data.responses);
                    } else {
                        document.getElementById('loadingState').classList.add('hidden');
                        document.getElementById('noDataState').classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Error loading history:', error);
                    document.getElementById('loadingState').innerHTML = \`
                        <div class="text-red-600">
                            <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                            <p>エラーが発生しました: \${error.message}</p>
                        </div>
                    \`;
                }
            }

            function displayHistory(responses) {
                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('historyContainer').classList.remove('hidden');

                // Group by category
                const categories = {};
                responses.forEach(r => {
                    if (!categories[r.category]) {
                        categories[r.category] = [];
                    }
                    categories[r.category].push(r);
                });

                let html = \`
                    <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm text-gray-600">回答完了数</p>
                                <p class="text-3xl font-bold text-blue-600">\${responses.length}<span class="text-lg text-gray-500"> / 50問</span></p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600">最終更新</p>
                                <p class="text-lg font-semibold text-gray-800">\${new Date(responses[0].created_at).toLocaleString('ja-JP', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                        </div>
                    </div>
                \`;

                // Display by category
                Object.entries(categories).forEach(([category, items]) => {
                    const categoryName = getCategoryName(category);
                    const categoryIcon = getCategoryIcon(category);
                    const categoryColor = getCategoryColor(category);
                    
                    html += \`
                        <div class="mb-6">
                            <div class="bg-gradient-to-r \${categoryColor} text-white p-4 rounded-t-lg flex items-center">
                                <i class="fas \${categoryIcon} text-2xl mr-3"></i>
                                <h3 class="text-xl font-bold">\${categoryName}</h3>
                                <span class="ml-auto bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">\${items.length}問</span>
                            </div>
                            <div class="bg-white border border-gray-200 rounded-b-lg p-4 space-y-3">
                    \`;

                    items.forEach((item, index) => {
                        html += \`
                            <div class="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                <div class="bg-\${categoryColor.includes('blue') ? 'blue' : categoryColor.includes('green') ? 'green' : categoryColor.includes('orange') ? 'orange' : categoryColor.includes('red') ? 'red' : categoryColor.includes('purple') ? 'purple' : categoryColor.includes('pink') ? 'pink' : categoryColor.includes('indigo') ? 'indigo' : 'yellow'}-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mr-3">
                                    \${item.question_number}
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800 mb-1">\${item.question_text}</p>
                                    <p class="text-blue-600 font-medium"><i class="fas fa-check-circle mr-1"></i>\${item.answer_value}</p>
                                </div>
                            </div>
                        \`;
                    });

                    html += \`
                            </div>
                        </div>
                    \`;
                });

                document.getElementById('historyContainer').innerHTML = html;
            }

            function getCategoryName(category) {
                const categoryNames = {
                    'sleep': '睡眠・休養',
                    'diet': '食事・栄養',
                    'exercise': '運動・活動',
                    'stress': 'ストレス・メンタル',
                    'lifestyle': '生活習慣',
                    'work': '仕事・日常',
                    'symptoms': '身体症状',
                    'medical': '既往歴',
                    'family': '家族歴'
                };
                return categoryNames[category] || category;
            }

            function getCategoryIcon(category) {
                const icons = {
                    'sleep': 'fa-bed',
                    'diet': 'fa-utensils',
                    'exercise': 'fa-running',
                    'stress': 'fa-brain',
                    'lifestyle': 'fa-home',
                    'work': 'fa-briefcase',
                    'symptoms': 'fa-notes-medical',
                    'medical': 'fa-hospital',
                    'family': 'fa-users'
                };
                return icons[category] || 'fa-question-circle';
            }

            function getCategoryColor(category) {
                const colors = {
                    'sleep': 'from-blue-500 to-blue-600',
                    'diet': 'from-green-500 to-green-600',
                    'exercise': 'from-orange-500 to-orange-600',
                    'stress': 'from-red-500 to-red-600',
                    'lifestyle': 'from-purple-500 to-purple-600',
                    'work': 'from-pink-500 to-pink-600',
                    'symptoms': 'from-indigo-500 to-indigo-600',
                    'medical': 'from-yellow-500 to-yellow-600',
                    'family': 'from-teal-500 to-teal-600'
                };
                return colors[category] || 'from-gray-500 to-gray-600';
            }

            // Initialize
            loadHistory();
        </script>
    </body>
    </html>
  `)
})
