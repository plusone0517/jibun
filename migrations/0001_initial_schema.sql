-- Users table (for future multi-user support)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  gender TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medical exam data table
CREATE TABLE IF NOT EXISTS exam_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exam_date DATE NOT NULL,
  exam_type TEXT NOT NULL, -- 'blood_pressure', 'body_composition', 'blood_test', 'custom'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Exam measurements table (flexible key-value storage for various test items)
CREATE TABLE IF NOT EXISTS exam_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_data_id INTEGER NOT NULL,
  measurement_key TEXT NOT NULL, -- e.g., 'systolic_bp', 'diastolic_bp', 'blood_sugar', 'hba1c'
  measurement_value TEXT NOT NULL,
  measurement_unit TEXT, -- e.g., 'mmHg', 'mg/dL', '%'
  normal_range_min REAL,
  normal_range_max REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_data_id) REFERENCES exam_data(id)
);

-- Questionnaire responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  category TEXT, -- e.g., 'lifestyle', 'diet', 'exercise', 'sleep', 'stress'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exam_data_id INTEGER,
  analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  overall_score REAL, -- 0-100
  health_advice TEXT, -- AI-generated health advice
  nutrition_guidance TEXT, -- AI-generated nutrition guidance
  risk_assessment TEXT, -- AI-generated risk assessment
  radar_chart_data TEXT, -- JSON format for radar chart
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_data_id) REFERENCES exam_data(id)
);

-- Supplement recommendations table
CREATE TABLE IF NOT EXISTS supplement_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_result_id INTEGER NOT NULL,
  supplement_name TEXT NOT NULL,
  supplement_type TEXT, -- e.g., 'vitamin', 'mineral', 'protein', 'omega3'
  dosage TEXT,
  frequency TEXT,
  reason TEXT, -- Why this supplement is recommended
  priority INTEGER, -- 1=high, 2=medium, 3=low
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_result_id) REFERENCES analysis_results(id)
);

-- Prescription order sheets table
CREATE TABLE IF NOT EXISTS prescription_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_result_id INTEGER NOT NULL,
  pdf_url TEXT, -- URL to generated PDF
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_result_id) REFERENCES analysis_results(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_data_user_id ON exam_data(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_measurements_exam_data_id ON exam_measurements(exam_data_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_recommendations_analysis_id ON supplement_recommendations(analysis_result_id);
CREATE INDEX IF NOT EXISTS idx_prescription_orders_analysis_id ON prescription_orders(analysis_result_id);
