import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const passwordResetRoutes = new Hono<{ Bindings: Bindings }>()

// Password reset request page
passwordResetRoutes.get('/forgot', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>パスワードリセット - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-blue-600 mb-2">
                        <i class="fas fa-heartbeat mr-2"></i>
                        じぶんサプリ育成
                    </h1>
                    <p class="text-gray-600">パスワードリセット</p>
                </div>

                <div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-sm text-gray-700">
                        <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
                        登録されているメールアドレスを入力してください。リセット用のトークンが発行されます。
                    </p>
                </div>

                <form id="forgotForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">メールアドレス</label>
                        <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="example@example.com">
                    </div>

                    <button type="submit" class="w-full btn-3d bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                        <i class="fas fa-key mr-2"></i>リセットトークンを発行
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <a href="/auth/login" class="text-blue-600 hover:text-blue-700 text-sm">
                        <i class="fas fa-arrow-left mr-1"></i>ログインページに戻る
                    </a>
                </div>

                <div id="successMessage" class="hidden mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">トークン発行完了！</strong>
                    <div class="mt-2">
                        <p class="text-sm mb-2">以下のトークンをコピーしてください：</p>
                        <div class="bg-white p-3 rounded border border-green-300">
                            <code id="resetToken" class="text-sm break-all"></code>
                        </div>
                        <a href="/password-reset/reset" class="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                            パスワードをリセットする
                        </a>
                    </div>
                </div>

                <div id="errorMessage" class="hidden mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">エラー！</strong>
                    <span class="block sm:inline" id="errorText"></span>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('forgotForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value;

                try {
                    const response = await axios.post('/api/password-reset/request', {
                        email
                    });

                    if (response.data.success) {
                        document.getElementById('resetToken').textContent = response.data.token;
                        document.getElementById('successMessage').classList.remove('hidden');
                        document.getElementById('forgotForm').classList.add('hidden');
                    } else {
                        showError(response.data.error || 'リセットトークンの発行に失敗しました');
                    }
                } catch (error) {
                    console.error('Error requesting password reset:', error);
                    showError('エラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            });

            function showError(message) {
                document.getElementById('errorText').textContent = message;
                document.getElementById('errorMessage').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('errorMessage').classList.add('hidden');
                }, 5000);
            }
        </script>
    </body>
    </html>
  `)
})

// Password reset form page
passwordResetRoutes.get('/reset', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新しいパスワード設定 - じぶんサプリ育成</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-blue-600 mb-2">
                        <i class="fas fa-heartbeat mr-2"></i>
                        じぶんサプリ育成
                    </h1>
                    <p class="text-gray-600">新しいパスワード設定</p>
                </div>

                <form id="resetForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">リセットトークン</label>
                        <input type="text" id="token" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="トークンを貼り付けてください">
                        <p class="text-xs text-gray-500 mt-1">※ リセット画面で発行されたトークンを入力してください</p>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">新しいパスワード</label>
                        <input type="password" id="password" required minlength="6" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="6文字以上">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">パスワード確認</label>
                        <input type="password" id="passwordConfirm" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="パスワードを再入力">
                    </div>

                    <button type="submit" class="w-full btn-3d bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                        <i class="fas fa-lock mr-2"></i>パスワードを変更する
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <a href="/password-reset/forgot" class="text-blue-600 hover:text-blue-700 text-sm">
                        <i class="fas fa-arrow-left mr-1"></i>トークン発行ページに戻る
                    </a>
                </div>

                <div id="successMessage" class="hidden mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">パスワード変更完了！</strong>
                    <span class="block sm:inline">ログインページへ移動します...</span>
                </div>

                <div id="errorMessage" class="hidden mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">エラー！</strong>
                    <span class="block sm:inline" id="errorText"></span>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('resetForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const token = document.getElementById('token').value.trim();
                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('passwordConfirm').value;

                if (password !== passwordConfirm) {
                    showError('パスワードが一致しません');
                    return;
                }

                try {
                    const response = await axios.post('/api/password-reset/reset', {
                        token,
                        new_password: password
                    });

                    if (response.data.success) {
                        document.getElementById('successMessage').classList.remove('hidden');
                        setTimeout(() => {
                            window.location.href = '/auth/login';
                        }, 2000);
                    } else {
                        showError(response.data.error || 'パスワードのリセットに失敗しました');
                    }
                } catch (error) {
                    console.error('Error resetting password:', error);
                    showError('エラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            });

            function showError(message) {
                document.getElementById('errorText').textContent = message;
                document.getElementById('errorMessage').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('errorMessage').classList.add('hidden');
                }, 5000);
            }
        </script>
    </body>
    </html>
  `)
})
