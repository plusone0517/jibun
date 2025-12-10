-- Add session_id to questionnaire_responses for better history tracking
-- This allows grouping responses by session

ALTER TABLE questionnaire_responses ADD COLUMN session_id TEXT;

-- Create index for faster session lookups
CREATE INDEX idx_questionnaire_responses_session_id ON questionnaire_responses(session_id);

-- Create index for user_id + created_at for history queries
CREATE INDEX idx_questionnaire_responses_user_created ON questionnaire_responses(user_id, created_at DESC);
