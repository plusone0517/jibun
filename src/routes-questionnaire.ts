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
        <title>健康ヒアリング - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
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
            <!-- Category Progress Cards -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" id="categoryCards">
                <!-- Cards will be dynamically inserted here -->
            </div>

            <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">健康ヒアリング（45問）</h2>
                <p class="text-gray-600 mb-6">あなたの生活習慣や健康状態について教えてください。<br>
                <span class="text-green-600 font-semibold">✅ 回答は自動保存されます。途中で離れても、いつでも続きから再開できます。</span></p>
                
                <!-- Progress bar -->
                <div class="mb-8">
                    <div class="flex justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">総合進捗</span>
                        <span class="text-sm font-medium text-gray-700"><span id="progressText">0</span>/45</span>
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
                <div class="flex justify-between items-center">
                    <button id="prevBtn" onclick="prevQuestion()" class="btn-3d bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-bold disabled:opacity-50" disabled>
                        <i class="fas fa-arrow-left mr-2"></i>前へ
                    </button>
                    
                    <!-- Submit Anytime Button (always visible) -->
                    <button id="submitAnytimeBtn" onclick="submitQuestionnaire()" class="btn-3d bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400">
                        <i class="fas fa-paper-plane mr-2"></i>途中送信してAI解析へ
                    </button>
                    
                    <button id="nextBtn" onclick="nextQuestion()" class="btn-3d bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400">
                        次へ<i class="fas fa-arrow-right ml-2"></i>
                    </button>
                    <button id="submitBtn" onclick="submitQuestionnaire()" class="hidden btn-3d bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400">
                        <i class="fas fa-check mr-2"></i>完了して送信
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
            
            // Category information
            const categories = [
                { name: '食事・栄養習慣', count: 7, icon: '🍎', color: 'green' },
                { name: 'ストレス・メンタル・睡眠', count: 8, icon: '😴', color: 'blue' },
                { name: '腸内環境・消化', count: 6, icon: '🦠', color: 'purple' },
                { name: 'ホルモン・代謝・慢性症状', count: 10, icon: '⚖️', color: 'orange' },
                { name: '検査経験・希望・意識', count: 8, icon: '🔬', color: 'indigo' },
                { name: '記述式追加', count: 6, icon: '✍️', color: 'pink' }
            ];

            // Display category progress cards
            function displayCategoryCards() {
                const container = document.getElementById('categoryCards');
                container.innerHTML = '';
                
                categories.forEach(cat => {
                    const categoryQuestions = questions.filter(q => q.category === cat.name);
                    const answeredCount = categoryQuestions.filter(q => answers[q.number] !== undefined).length;
                    const progress = categoryQuestions.length > 0 ? Math.round((answeredCount / categoryQuestions.length) * 100) : 0;
                    
                    const card = document.createElement('div');
                    card.className = \`bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer border-l-4 border-\${cat.color}-500\`;
                    card.onclick = () => {
                        // Jump to first question of this category
                        const firstQ = questions.findIndex(q => q.category === cat.name);
                        if (firstQ >= 0) {
                            currentQuestion = firstQ;
                            displayQuestion(currentQuestion);
                        }
                    };
                    
                    card.innerHTML = \`
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-2xl">\${cat.icon}</span>
                            <span class="text-sm font-bold text-\${cat.color}-600">\${answeredCount}/\${cat.count}</span>
                        </div>
                        <h3 class="text-sm font-bold text-gray-800 mb-2">\${cat.name}</h3>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-\${cat.color}-500 h-2 rounded-full transition-all duration-300" style="width: \${progress}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">\${progress}% 完了</p>
                    \`;
                    
                    container.appendChild(card);
                });
            }

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

            function displayQuestion(index, keepScrollPosition = false) {
                const question = questions[index];
                const container = document.getElementById('questionContainer');
                
                // Save current scroll position
                const scrollY = keepScrollPosition ? window.scrollY : 0;
                
                // Get category icon
                const categoryInfo = categories.find(c => c.name === question.category);
                const icon = categoryInfo ? categoryInfo.icon : '📝';
                
                let inputHTML = '';
                
                if (question.isDescriptive) {
                    // Descriptive question (textarea)
                    inputHTML = \`
                        <textarea 
                            id="descriptive_\${question.number}"
                            class="w-full p-4 border-2 rounded-lg focus:border-blue-600 focus:outline-none min-h-32"
                            placeholder="ご自由にお書きください..."
                            onchange="selectAnswer(\${question.number}, this.value)"
                        >\${answers[question.number] || ''}</textarea>
                    \`;
                } else {
                    // Multiple choice question
                    inputHTML = question.options.map((option, i) => \`
                        <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition \${answers[question.number] === option ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}">
                            <input type="radio" name="q\${question.number}" value="\${option}" class="mr-3 w-5 h-5" 
                                \${answers[question.number] === option ? 'checked' : ''}
                                onchange="selectAnswer(\${question.number}, this.value)">
                            <span class="text-lg">\${option}</span>
                        </label>
                    \`).join('');
                }

                container.innerHTML = \`
                    <div class="mb-6">
                        <div class="flex items-center mb-4">
                            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4">
                                \${question.number}
                            </div>
                            <div class="flex-1">
                                <p class="text-sm text-gray-500 font-medium">\${icon} \${question.category}</p>
                                <h3 class="text-xl font-bold text-gray-800">\${question.text}</h3>
                            </div>
                        </div>
                        <div class="space-y-3">
                            \${inputHTML}
                        </div>
                    </div>
                \`;

                updateProgress();
                updateButtons();
                displayCategoryCards(); // Update category cards
                
                // Restore scroll position if needed
                if (keepScrollPosition) {
                    setTimeout(() => window.scrollTo(0, scrollY), 0);
                }
            }

            function selectAnswer(questionNumber, answer) {
                answers[questionNumber] = answer;
                updateProgress();
                updateButtons(); // Update button states after answering
                saveAnswersToLocalStorage(); // Auto-save on every answer
                displayCategoryCards(); // Update category cards without scrolling
            }

            function updateProgress() {
                const answered = Object.keys(answers).length;
                const totalQuestions = questions.filter(q => !q.isDescriptive).length; // Only count non-descriptive
                const percentage = (answered / questions.length) * 100;
                document.getElementById('progressBar').style.width = percentage + '%';
                document.getElementById('progressText').textContent = answered;
                displayCategoryCards(); // Update category cards on progress change
            }

            function updateButtons() {
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');
                const submitBtn = document.getElementById('submitBtn');
                const submitAnytimeBtn = document.getElementById('submitAnytimeBtn');

                // Always enable prev button (except on first question)
                prevBtn.disabled = currentQuestion === 0;

                // Check if current question is answered
                const currentQuestionNumber = questions[currentQuestion].number;
                const isAnswered = !!answers[currentQuestionNumber];

                // Enable "Submit Anytime" button if at least one question is answered
                const answeredCount = Object.keys(answers).length;
                submitAnytimeBtn.disabled = answeredCount === 0;

                if (currentQuestion === questions.length - 1) {
                    // Last question: hide "next" and "submit anytime", show final "submit"
                    nextBtn.classList.add('hidden');
                    submitAnytimeBtn.classList.add('hidden');
                    submitBtn.classList.remove('hidden');
                    // Enable submit button if at least one question is answered
                    submitBtn.disabled = answeredCount === 0;
                } else {
                    // Not last question: show "next" and "submit anytime", hide final "submit"
                    nextBtn.classList.remove('hidden');
                    submitAnytimeBtn.classList.remove('hidden');
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
                    // Scroll to questionnaire section instead of top
                    scrollToQuestionnaire();
                }
            }

            function prevQuestion() {
                if (currentQuestion > 0) {
                    currentQuestion--;
                    displayQuestion(currentQuestion);
                    // Scroll to questionnaire section instead of top
                    scrollToQuestionnaire();
                }
            }

            function scrollToQuestionnaire() {
                const questionContainer = document.getElementById('questionContainer');
                if (questionContainer) {
                    questionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

            async function submitQuestionnaire() {
                try {
                    // Get current user
                    const userResponse = await axios.get('/api/auth/me');
                    if (!userResponse.data.success) {
                        showError('ログインが必要です');
                        return;
                    }
                    const userId = userResponse.data.user.id;

                    // Create responses array with only answered questions
                    const responses = questions
                        .filter(q => answers[q.number] !== undefined && answers[q.number] !== '')
                        .map(q => ({
                            question_number: q.number,
                            question_text: q.text,
                            answer_value: answers[q.number],
                            category: q.category,
                            is_descriptive: q.isDescriptive ? 1 : 0
                        }));

                    if (responses.length === 0) {
                        showError('少なくとも1つの質問に回答してください');
                        return;
                    }

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
            displayCategoryCards(); // Display category cards
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

// Questionnaire history page (disabled - redirect to questionnaire)
questionnaireRoutes.get('/history', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ヒアリング - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center">
        <div class="max-w-2xl mx-auto px-4">
            <div class="bg-white rounded-lg shadow-xl p-8 text-center">
                <div class="text-6xl mb-4">🎤</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-4">ヒアリング機能について</h1>
                <p class="text-gray-600 mb-6">
                    ヒアリングは<strong class="text-green-600">自動保存機能</strong>に変更されました。<br>
                    回答途中でも自動的に保存され、いつでも続きから再開できます。
                </p>
                <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                    <p class="text-green-800 font-semibold mb-2">✅ 新しい仕様</p>
                    <ul class="text-left text-sm text-gray-700 space-y-1">
                        <li>• 回答は自動保存されます</li>
                        <li>• ブラウザを閉じても続きから再開可能</li>
                        <li>• 履歴機能は廃止されました</li>
                    </ul>
                </div>
                <a href="/questionnaire" class="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-bold">
                    <i class="fas fa-microphone mr-2"></i>ヒアリングを始める
                </a>
                <br>
                <a href="/" class="inline-block mt-4 text-gray-600 hover:text-gray-800">
                    <i class="fas fa-home mr-1"></i>ホームに戻る
                </a>
            </div>
        </div>
    </body>
    </html>
  `)
})
