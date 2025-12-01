-- Insert sample user
INSERT OR IGNORE INTO users (id, name, email, age, gender) VALUES 
  (1, 'テストユーザー', 'test@example.com', 35, '男性');

-- Insert sample blood pressure data
INSERT INTO exam_data (id, user_id, exam_date, exam_type) VALUES 
  (1, 1, '2024-12-01', 'blood_pressure');

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit, normal_range_min, normal_range_max) VALUES
  (1, 'systolic_bp', '135', 'mmHg', 90, 130),
  (1, 'diastolic_bp', '88', 'mmHg', 60, 85),
  (1, 'pulse', '75', 'bpm', 60, 100);

-- Insert sample body composition data
INSERT INTO exam_data (id, user_id, exam_date, exam_type) VALUES 
  (2, 1, '2024-12-01', 'body_composition');

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit, normal_range_min, normal_range_max) VALUES
  (2, 'weight', '75.5', 'kg', 60, 80),
  (2, 'body_fat', '24.5', '%', 10, 20),
  (2, 'muscle_mass', '55.2', 'kg', 50, 70),
  (2, 'bmi', '24.8', '', 18.5, 25);

-- Insert sample blood test data
INSERT INTO exam_data (id, user_id, exam_date, exam_type) VALUES 
  (3, 1, '2024-11-20', 'blood_test');

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit, normal_range_min, normal_range_max) VALUES
  (3, 'blood_sugar', '115', 'mg/dL', 70, 110),
  (3, 'hba1c', '6.2', '%', 4.0, 5.6),
  (3, 'total_cholesterol', '220', 'mg/dL', 0, 200),
  (3, 'ldl_cholesterol', '140', 'mg/dL', 0, 120),
  (3, 'hdl_cholesterol', '45', 'mg/dL', 40, 100),
  (3, 'triglycerides', '175', 'mg/dL', 0, 150),
  (3, 'ast', '28', 'U/L', 0, 40),
  (3, 'alt', '35', 'U/L', 0, 40);

-- Insert sample questionnaire responses (first 10 questions as example)
INSERT INTO questionnaire_responses (user_id, question_number, question_text, answer_value, category) VALUES
  (1, 1, '1日の睡眠時間は何時間ですか？', '6時間', 'sleep'),
  (1, 2, '朝食を毎日食べていますか？', 'いいえ', 'diet'),
  (1, 3, '1週間に何回運動しますか？', '1-2回', 'exercise'),
  (1, 4, 'ストレスを感じることがありますか？', 'よくある', 'stress'),
  (1, 5, '1日の野菜摂取量は十分ですか？', 'あまり食べない', 'diet'),
  (1, 6, '喫煙していますか？', 'いいえ', 'lifestyle'),
  (1, 7, 'お酒を飲む頻度は？', '週3-4回', 'lifestyle'),
  (1, 8, '間食する習慣がありますか？', 'よくする', 'diet'),
  (1, 9, '健康診断で指摘されたことがありますか？', 'ある', 'medical_history'),
  (1, 10, '家族に生活習慣病の人はいますか？', 'いる', 'medical_history');
