-- ユーザー監査ログテーブル
CREATE TABLE IF NOT EXISTS user_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'login'
  admin_id INTEGER,
  changes TEXT,  -- JSON形式で変更内容を記録
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ユーザー削除フラグ（論理削除）
ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN deleted_at DATETIME;
ALTER TABLE users ADD COLUMN deleted_by INTEGER;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action ON user_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON user_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
