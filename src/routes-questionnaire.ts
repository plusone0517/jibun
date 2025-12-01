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
                    <button id="nextBtn" onclick="nextQuestion()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                        次へ<i class="fas fa-arrow-right ml-2"></i>
                    </button>
                    <button id="submitBtn" onclick="submitQuestionnaire()" class="hidden bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold">
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
            const answers = {};

            function displayQuestion(index) {
                const question = questions[index];
                const container = document.getElementById('questionContainer');
                
                const optionsHTML = question.options.map((option, i) => \`
                    <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition \${answers[question.number] === option ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}">
                        <input type="radio" name="q\${question.number}" value="\${option}" class="mr-3 w-5 h-5" 
                            \${answers[question.number] === option ? 'checked' : ''}
                            onchange="selectAnswer(\${question.number}, '\${option.replace(/'/g, "\\\\'")}')">
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

                if (currentQuestion === questions.length - 1) {
                    nextBtn.classList.add('hidden');
                    submitBtn.classList.remove('hidden');
                } else {
                    nextBtn.classList.remove('hidden');
                    submitBtn.classList.add('hidden');
                }
            }

            function nextQuestion() {
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

                    const responses = questions.map(q => ({
                        question_number: q.number,
                        question_text: q.text,
                        answer_value: answers[q.number],
                        category: q.category
                    }));

                    const response = await axios.post('/api/questionnaire', {
                        user_id: 1,
                        responses: responses
                    });

                    if (response.data.success) {
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
