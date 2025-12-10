-- Add OCR image URL column to exam_data table
-- This stores the uploaded image/PDF for display in admin panel
ALTER TABLE exam_data ADD COLUMN ocr_image_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_data_ocr_image_url ON exam_data(ocr_image_url);
