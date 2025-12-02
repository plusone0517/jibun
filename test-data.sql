-- Add test exam data
INSERT INTO exam_data (user_id, exam_type, exam_date) VALUES (2, 'blood_test', '2024-11-01');

-- Get the last inserted exam_data_id (for user_id=2)
INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'glucose', '95', 'mg/dL' FROM exam_data WHERE user_id=2 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'cholesterol', '180', 'mg/dL' FROM exam_data WHERE user_id=2 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'HDL', '55', 'mg/dL' FROM exam_data WHERE user_id=2 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'LDL', '110', 'mg/dL' FROM exam_data WHERE user_id=2 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'triglycerides', '120', 'mg/dL' FROM exam_data WHERE user_id=2 AND exam_type='blood_test' LIMIT 1;

-- Add some questionnaire responses
INSERT INTO questionnaire_responses (user_id, question_number, question_text, answer_value) VALUES
(2, 1, '睡眠の質はどうですか？', '良い'),
(2, 2, '運動習慣はありますか？', '週2-3回'),
(2, 3, '食事のバランスは？', 'バランスが取れている');
