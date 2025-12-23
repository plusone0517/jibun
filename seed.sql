-- Insert test user (plusone0517@gmail.com)
INSERT OR IGNORE INTO users (id, name, email, age, gender, birthdate, password_hash, plain_password, membership_type) 
VALUES (5, 'Plusone', 'plusone0517@gmail.com', 39, 'male', '1985-05-17', 
        'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 
        'yourpassword', 'premium');

-- Create session for user 5
INSERT OR REPLACE INTO sessions (session_token, user_id, expires_at) 
VALUES ('9a51e3f08e75393fd9e368aa809ebc5414365a37521b53eb40688157b33f7302', 
        5, '2026-01-22T12:45:19.410Z');

-- Insert test exam data
INSERT OR REPLACE INTO exam_data (id, user_id, exam_date, exam_type, data_source) 
VALUES (1, 5, '2025-12-23', 'blood_pressure', 'manual');

INSERT OR REPLACE INTO exam_measurements (exam_data_id, measurement_key, measurement_value, measurement_unit) VALUES
(1, 'systolic_bp', '150', 'mmHg'),
(1, 'diastolic_bp', '110', 'mmHg'),
(1, 'pulse', '80', 'bpm');

-- Insert questionnaire data
INSERT OR REPLACE INTO questionnaire_responses (id, user_id, question_number, question_text, answer_value, category)
VALUES (1, 5, 1, '食事は1日何食食べますか？', '3食きちんと食べる', '生活習慣');
