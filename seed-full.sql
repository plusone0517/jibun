-- Insert test users
INSERT OR IGNORE INTO users (id, name, email, age, gender, birthdate, password_hash, plain_password, membership_type) VALUES
(5, 'Plusone', 'plusone0517@gmail.com', 39, 'male', '1985-05-17', 
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 
 'yourpassword', 'premium'),
(4, 'デモユーザー', 'demo@example.com', 34, 'male', '1990-01-01',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'yourpassword', 'free'),
(3, 'テストユーザー3', 'test3@example.com', 32, 'male', '1992-05-15',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'yourpassword', 'free');

-- Create sessions for users
INSERT OR REPLACE INTO sessions (session_token, user_id, expires_at) VALUES
('9a51e3f08e75393fd9e368aa809ebc5414365a37521b53eb40688157b33f7302', 5, '2026-01-22T12:45:19.410Z'),
('demo-session-token-123456789', 4, '2026-01-22T12:45:19.410Z'),
('test3-session-token-987654321', 3, '2026-01-22T12:45:19.410Z');

-- Insert admin user
INSERT OR IGNORE INTO admin_users (username, password_hash, full_name) VALUES
('admin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Administrator');
