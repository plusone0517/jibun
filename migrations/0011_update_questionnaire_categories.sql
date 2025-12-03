-- Update questionnaire table to support new 50 questions with categories
-- Add is_descriptive column to differentiate between choice and descriptive questions

ALTER TABLE questionnaire_responses ADD COLUMN is_descriptive INTEGER DEFAULT 0;

-- Create index for faster category queries  
CREATE INDEX IF NOT EXISTS idx_questionnaire_category ON questionnaire_responses(user_id, category);
