-- Add membership_type column to users table
-- Default is 'free', premium members can access AI analysis
ALTER TABLE users ADD COLUMN membership_type TEXT DEFAULT 'free' CHECK(membership_type IN ('free', 'premium'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);

-- Update existing users to free (can be changed manually in admin panel)
UPDATE users SET membership_type = 'free' WHERE membership_type IS NULL;
