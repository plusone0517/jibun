-- Add test exam data for user_id=3
INSERT INTO exam_data (user_id, exam_type, exam_date) VALUES (3, 'blood_test', '2024-12-01');

-- Add measurements
INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'glucose', '98', 'mg/dL' FROM exam_data WHERE user_id=3 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'cholesterol', '190', 'mg/dL' FROM exam_data WHERE user_id=3 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'HDL', '60', 'mg/dL' FROM exam_data WHERE user_id=3 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'LDL', '115', 'mg/dL' FROM exam_data WHERE user_id=3 AND exam_type='blood_test' LIMIT 1;

INSERT INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) 
SELECT id, 'triglycerides', '125', 'mg/dL' FROM exam_data WHERE user_id=3 AND exam_type='blood_test' LIMIT 1;

-- Add questionnaire responses
INSERT INTO questionnaire_responses (user_id, question_number, question_text, answer_value) VALUES
(3, 1, '睡眠の質はどうですか？', '良い'),
(3, 2, '運動習慣はありますか？', '週2-3回'),
(3, 3, '食事のバランスは？', 'バランスが取れている'),
(3, 4, 'ストレスを感じますか？', '時々'),
(3, 5, '疲れやすいですか？', 'あまり感じない');
