-- Production seed data
-- This file is executed on every container startup to ensure essential data exists

-- Insert default admin user (password: admin123)
-- Uses INSERT OR IGNORE to avoid duplicate key errors
INSERT OR IGNORE INTO admin_users (username, password_hash, created_at) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', datetime('now'));

-- Insert demo user for testing (email: demo@example.com, password: demo123)
INSERT OR IGNORE INTO users (id, email, name, password_hash, birthdate, gender, created_at, plain_password) 
VALUES (1, 'demo@example.com', 'デモユーザー', '$2a$10$K3qLZxjE6yQJ1kKZGJ0h0uYxYZNQX6K5qZ8qZ8qZ8qZ8qZ8qZ8qZ8', '1990-01-01', 'male', datetime('now'), 'demo123');

-- Insert test user 2 (email: test@example.com, password: test123)
INSERT OR IGNORE INTO users (id, email, name, password_hash, birthdate, gender, created_at, plain_password) 
VALUES (2, 'test@example.com', 'テストユーザー', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1985-03-15', 'female', datetime('now'), 'test123');
