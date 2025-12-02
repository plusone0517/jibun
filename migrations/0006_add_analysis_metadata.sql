-- Add metadata fields to analysis_results table
-- selected_exam_ids: JSON array of exam IDs used in analysis
-- data_completeness_score: 0-100 score indicating data completeness

ALTER TABLE analysis_results ADD COLUMN selected_exam_ids TEXT;
ALTER TABLE analysis_results ADD COLUMN data_completeness_score INTEGER;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_analysis_results_date ON analysis_results(analysis_date DESC);
