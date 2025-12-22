import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export const authRoutes = new Hono<{ Bindings: Bindings }>()

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Register page
authRoutes.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ユーザー登録 - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <div class="text-center mb-8">
                    <div class="relative inline-block">
                        <h1 class="text-3xl font-bold text-blue-600 mb-2">
                            <i class="fas fa-heartbeat mr-2"></i>
                            じぶんを知ることから
                        </h1>
                        <span class="absolute -top-2 -right-12 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">β版</span>
                    </div>
                    <p class="text-gray-600 mt-4">新規ユーザー登録</p>
                </div>

                <form id="registerForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">お名前 *</label>
                        <input type="text" id="name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="山田太郎">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">生年月日 *</label>
                        <input type="date" id="birthdate" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" max="2024-12-31">
                        <p class="text-xs text-gray-500 mt-1">※ 健康アドバイスに使用されます</p>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">パスワード *</label>
                        <input type="password" id="password" required minlength="6" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="6文字以上">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">パスワード確認 *</label>
                        <input type="password" id="passwordConfirm" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="パスワードを再入力">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">性別</label>
                        <select id="gender" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">選択してください</option>
                            <option value="男性">男性</option>
                            <option value="女性">女性</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">メールアドレス *</label>
                        <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="example@example.com">
                        <p class="text-xs text-gray-500 mt-1">※ ログインIDとして使用されます</p>
                    </div>

                    <div class="border-t border-gray-200 pt-4">
                        <div class="flex items-start">
                            <input type="checkbox" id="agreeTerms" required class="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label for="agreeTerms" class="text-sm text-gray-700">
                                <a href="/terms.html" target="_blank" class="text-blue-600 hover:text-blue-700 font-bold underline">利用規約およびプライバシーポリシー</a>に同意します *
                            </label>
                        </div>
                        <p class="text-xs text-red-600 mt-2 ml-8">※ 登録には利用規約への同意が必須です</p>
                    </div>

                    <button type="submit" class="w-full btn-3d bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                        <i class="fas fa-user-plus mr-2"></i>登録する
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-600">
                        すでにアカウントをお持ちですか？
                        <a href="/auth/login" class="text-blue-600 hover:text-blue-700 font-bold">ログイン</a>
                    </p>
                </div>

                <div id="successMessage" class="hidden mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">登録成功！</strong>
                    <span class="block sm:inline">ログインページへ移動します...</span>
                </div>

                <div id="errorMessage" class="hidden mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">エラー！</strong>
                    <span class="block sm:inline" id="errorText"></span>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('name').value;
                const birthdate = document.getElementById('birthdate').value;
                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('passwordConfirm').value;
                const gender = document.getElementById('gender').value;
                const email = document.getElementById('email').value;
                const agreeTerms = document.getElementById('agreeTerms').checked;

                if (!agreeTerms) {
                    showError('利用規約およびプライバシーポリシーに同意してください');
                    return;
                }

                if (password !== passwordConfirm) {
                    showError('パスワードが一致しません');
                    return;
                }

                if (!birthdate) {
                    showError('生年月日を入力してください');
                    return;
                }

                if (!email) {
                    showError('メールアドレスを入力してください');
                    return;
                }

                // Calculate age from birthdate
                const birthDate = new Date(birthdate);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                try {
                    const response = await axios.post('/api/auth/register', {
                        name,
                        birthdate,
                        password,
                        age,
                        gender: gender || null,
                        email: email
                    });

                    if (response.data.success) {
                        showSuccess();
                        setTimeout(() => {
                            window.location.href = '/auth/login';
                        }, 1500);
                    } else {
                        showError(response.data.error || '登録に失敗しました');
                    }
                } catch (error) {
                    console.error('Error registering:', error);
                    showError('登録中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                }
            });

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
        </script>
    </body>
    </html>
  `)
})

// Login page
authRoutes.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ログイン - じぶんを知ることから</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <div class="text-center mb-8">
                    <div class="relative inline-block">
                        <h1 class="text-3xl font-bold text-blue-600 mb-2">
                            <i class="fas fa-heartbeat mr-2"></i>
                            じぶんを知ることから
                        </h1>
                        <span class="absolute -top-2 -right-12 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">β版</span>
                    </div>
                    <p class="text-gray-600 mt-4">ログイン</p>
                </div>

                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">メールアドレス</label>
                        <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="example@example.com">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">パスワード</label>
                        <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="パスワード">
                    </div>

                    <button type="submit" class="w-full btn-3d bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                        <i class="fas fa-sign-in-alt mr-2"></i>ログイン
                    </button>
                </form>

                <div class="mt-4 text-center">
                    <a href="/password-reset/forgot" class="text-sm text-gray-600 hover:text-blue-600">
                        <i class="fas fa-key mr-1"></i>パスワードを忘れた方
                    </a>
                </div>

                <div class="mt-4 text-center">
                    <p class="text-sm text-gray-600">
                        アカウントをお持ちでない方は
                        <a href="/auth/register" class="text-blue-600 hover:text-blue-700 font-bold">新規登録</a>
                    </p>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-200 text-center">
                    <a href="/admin/login" class="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center">
                        <i class="fas fa-user-shield mr-2"></i>管理者の方はこちら
                    </a>
                </div>

                <div id="errorMessage" class="hidden mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <strong class="font-bold">エラー！</strong>
                    <span class="block sm:inline" id="errorText"></span>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await axios.post('/api/auth/login', {
                        email,
                        password
                    });

                    if (response.data.success) {
                        window.location.href = '/dashboard';
                    } else {
                        showError(response.data.error || 'ログインに失敗しました');
                    }
                } catch (error) {
                    console.error('Error logging in:', error);
                    showError('ログイン中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
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

// Note: Register API is now handled by /api/auth/register in index.tsx
// This old route is kept for backwards compatibility but should not be used
authRoutes.post('/register', async (c) => {
  try {
    const { name, birthdate, password, age, gender, email } = await c.req.json()

    if (!name || !email || !password || !birthdate) {
      return c.json({ success: false, error: '必須項目が不足しています（名前、メールアドレス、パスワード、生年月日）' }, 400)
    }

    const db = c.env.DB

    // Check if email already exists (changed from birthdate)
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existingUser) {
      return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Insert user
    const result = await db.prepare(
      'INSERT INTO users (name, email, password_hash, birthdate, age, gender) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, passwordHash, birthdate, age, gender).run()

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

// Note: Login API is now handled by /api/auth/login in index.tsx
// This old route is kept for backwards compatibility but should not be used
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ success: false, error: 'メールアドレスとパスワードを入力してください' }, 400)
    }

    const db = c.env.DB

    // Find user by email (changed from birthdate)
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
    setCookie(c, 'session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate,
        age: user.age
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Logout API
authRoutes.post('/logout', async (c) => {
  try {
    const sessionToken = getCookie(c, 'session_token')

    if (sessionToken) {
      const db = c.env.DB
      await db.prepare('DELETE FROM sessions WHERE session_token = ?').bind(sessionToken).run()
    }

    deleteCookie(c, 'session_token')

    return c.json({ success: true, message: 'ログアウトしました' })
  } catch (error) {
    console.error('Error logging out:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get current user
authRoutes.get('/me', async (c) => {
  try {
    const sessionToken = getCookie(c, 'session_token')

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
    const user = await db.prepare('SELECT id, name, email, birthdate, age, gender FROM users WHERE id = ?')
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
