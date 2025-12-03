-- Add OCR raw text column to exam_data table
-- This stores the original OCR text for AI analysis reference

ALTER TABLE exam_data ADD COLUMN ocr_raw_text TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_data_data_source ON exam_data(data_source);
