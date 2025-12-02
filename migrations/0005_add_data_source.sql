-- Add data_source column to exam_data table to distinguish OCR vs manual entry
-- data_source values: 'ocr' (from image recognition) or 'manual' (hand-entered)

ALTER TABLE exam_data ADD COLUMN data_source TEXT DEFAULT 'manual';

-- Create index for efficient filtering by data source
CREATE INDEX IF NOT EXISTS idx_exam_data_source ON exam_data(data_source);

-- Update existing records to 'manual' (default for historical data)
UPDATE exam_data SET data_source = 'manual' WHERE data_source IS NULL;
