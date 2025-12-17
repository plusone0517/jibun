-- Add plain_password column to users table for admin viewing
-- WARNING: Storing plain passwords is a security risk. Use with caution.
ALTER TABLE users ADD COLUMN plain_password TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_plain_password ON users(plain_password);
