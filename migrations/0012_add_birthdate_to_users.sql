-- Add birthdate column to users table for authentication
-- This allows users to log in using birthdate instead of email

ALTER TABLE users ADD COLUMN birthdate TEXT;

-- Create index on birthdate for faster lookups
CREATE INDEX idx_users_birthdate ON users(birthdate);
