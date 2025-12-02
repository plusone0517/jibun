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

-- Insert supplements master data with prices
INSERT OR REPLACE INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, price, supplement_category, is_active) VALUES
  ('S001', 'リポソーム型ビタミンC', 'ビタミン', 'リキッド', '1包(10ml)', 'ビタミンC、リン脂質、グリセリン', '吸収率の高いリポソーム技術を使用したビタミンC', '免疫力サポート、美肌、抗酸化', 4280, '必須栄養素', 1),
  ('S002', 'ビタミンミックス11種類', 'ビタミン', 'タブレット', '360mg', 'ビタミンA、B群、C、D、E、K', '11種類のビタミンを配合したマルチビタミン', '全般的な健康維持、エネルギー代謝', 2980, '必須栄養素', 1),
  ('S003', 'ビタミンD3+グルコン酸亜鉛+シクロデキストリン', 'ビタミン', 'カプセル', '1カプセル', 'ビタミンD3、グルコン酸亜鉛、シクロデキストリン', 'ビタミンDと亜鉛を高吸収技術で配合', '骨の健康、免疫力向上', 2480, '必須栄養素', 1),
  ('S004', 'B群ミックス7種類', 'ビタミン', 'タブレット', '1錠', 'ビタミンB1、B2、B6、B12、ナイアシン、葉酸、パントテン酸', 'エネルギー代謝に必要なビタミンB群', 'エネルギー代謝、疲労回復', 1980, '必須栄養素', 1),
  ('S005', 'スピルリナ', 'アミノ酸', 'タブレット', '500mg', 'スピルリナ、アミノ酸、ビタミン、ミネラル', '栄養豊富なスーパーフード', '栄養補給、免疫力向上', 2180, '必須栄養素', 1),
  ('S006', 'イヌリン', '食物繊維', 'パウダー', '5g', '水溶性食物繊維(イヌリン)', '腸内環境を整える水溶性食物繊維', '腸内環境改善、血糖値サポート', 1680, '必須栄養素', 1),
  ('S007', '菊芋イヌリン', '糖質', 'パウダー', '200g', '菊芋由来イヌリン', '天然の菊芋から抽出したイヌリン', '血糖値管理、腸内環境', 2380, '健康サポート', 1),
  ('S008', 'デーツシロップ', '糖質', 'シロップ', '200g', 'デーツ果実', '天然の甘味料、ミネラル豊富', 'エネルギー補給、鉄分補給', 1480, '機能性食品', 1),
  ('S009', 'ザクロペースト', 'フィトケミカル', 'ペースト', '200g', 'ザクロ果実', 'ポリフェノール豊富な果実ペースト', '抗酸化、美容サポート', 2680, '機能性食品', 1),
  ('S010', 'クリルオイル', '脂質', 'カプセル', '250mg', 'クリルオイル、EPA、DHA、アスタキサンチン', '南極オキアミ由来のオメガ3脂肪酸', '心血管健康、脳機能、抗炎症', 3980, '必須栄養素', 1),
  ('S011', 'アミノ酸ブレンド', 'アミノ酸', 'パウダー', '5g', '必須アミノ酸、BCAA', '運動前後のアミノ酸補給', '疲労回復、筋肉維持', 2880, '機能性食品', 1),
  ('S012', 'EAA原末', 'アミノ酸', 'パウダー', '5g', '必須アミノ酸9種', '9種類の必須アミノ酸を配合', '筋肉合成、運動パフォーマンス', 3280, '機能性食品', 1),
  ('S013', 'アカシアパウダー', '食物繊維', 'パウダー', '5g', 'アカシア食物繊維', '水溶性食物繊維でプレバイオティクス', '腸内環境改善、便通サポート', 1880, '機能性食品', 1),
  ('S014', 'イカキトサン', 'アミノ酸', 'パウダー', '3g', 'イカ由来キトサン', '血圧サポート、コレステロール管理', '血圧管理、脂質代謝', 2580, '機能性食品', 1),
  ('S015', 'マインドリバイブ', 'アミノ酸', 'カプセル', '1カプセル', 'GABA、テアニン、トリプトファン', 'メンタルサポート成分配合', 'ストレス軽減、リラックス', 3180, '機能性食品', 1),
  ('S016', 'リポソーム型βカリオフィレン', 'フィトケミカル', 'リキッド', '1包', 'βカリオフィレン、リン脂質', '吸収率を高めた植物由来成分', '抗炎症、ストレス対応', 3680, '機能性食品', 1),
  ('S017', '第三リン酸Mg', 'ミネラル', 'タブレット', '1錠', '第三リン酸マグネシウム', '吸収率の高いマグネシウム', '血圧サポート、筋肉・神経機能', 1780, '必須栄養素', 1),
  ('S018', 'ミネラルミックス7種類', 'ミネラル', 'タブレット', '1日分', 'カルシウム、マグネシウム、鉄、亜鉛、銅、マンガン、セレン', '7種類の必須ミネラル配合', '基本的なミネラル補給', 2180, '必須栄養素', 1);
