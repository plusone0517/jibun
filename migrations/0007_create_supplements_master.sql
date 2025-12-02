-- Create supplements master table for official product catalog
CREATE TABLE IF NOT EXISTS supplements_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 糖質、脂質、アミノ酸、ビタミン、ミネラル、食物繊維、フィトケミカル、プレバイオ
  form TEXT NOT NULL, -- シロップ、ペースト、ソフトカプセル、ハードカプセル、粉末、スティック
  content_amount TEXT NOT NULL, -- 内容量（例: 200g, 250mg, 8g）
  ingredients TEXT, -- 主要成分の詳細
  description TEXT, -- 製品説明
  recommended_for TEXT, -- 推奨される健康状態・目的
  priority INTEGER DEFAULT 2, -- 1=高優先度, 2=中優先度, 3=低優先度
  is_active INTEGER DEFAULT 1, -- 1=有効, 0=無効
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial supplement data from オーダーメイド一覧.pdf
-- 糖質カテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S001', '菊芋イヌリン', '糖質', 'シロップ', '200g', '菊芋由来イヌリン', '天然の水溶性食物繊維。血糖値の上昇を穏やかにし、腸内環境を整える', '血糖値管理、腸内環境改善', 1),
('S002', 'デーツシロップ', '糖質', 'シロップ', '200g', 'デーツエキス', '天然の甘味料。ミネラルやビタミンが豊富', 'エネルギー補給、ミネラル補給', 2),
('S003', 'ザクロペースト', '糖質', 'ペースト', '200g', 'ザクロエキス', 'ポリフェノール豊富。抗酸化作用と女性の健康サポート', '抗酸化、女性の健康', 2);

-- 脂質カテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S004', 'クリルオイル', '脂質', 'ソフトカプセル', '250mg', 'EPA、DHA、アスタキサンチン', '南極オキアミ由来のオメガ3脂肪酸。吸収率が高く、抗酸化作用も', '心血管健康、脳機能、抗炎症', 1);

-- アミノ酸カテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S005', 'アミノ酸ブレンド', 'アミノ酸', '粉末', '8g', '必須アミノ酸配合', 'バランスの取れたアミノ酸ブレンド。筋肉の合成と回復をサポート', '筋力維持、運動サポート、疲労回復', 1),
('S006', 'EAA原末', 'アミノ酸', '粉末', '10g', '必須アミノ酸9種', '必須アミノ酸全9種類を配合。体内で合成できない重要なアミノ酸', '筋肉合成、運動パフォーマンス向上', 1);

-- ビタミンカテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S007', 'リポソーム型ビタミンC', 'ビタミン', 'スティック', '1.36g', 'リポソーム化ビタミンC', '高吸収型ビタミンC。吸収率が通常の約3倍', '免疫強化、美肌、抗酸化', 1),
('S008', 'ビタミンミックス11種類', 'ビタミン', 'ハードカプセル', '360mg', 'ビタミンA、D、E、B1、B2、B3、B5、B6、B12、葉酸', '主要ビタミン11種を配合。総合的なビタミン補給', '全般的な健康維持、エネルギー代謝', 1),
('S009', 'ビタミンD3+グルコン酸亜鉛+シクロデキストリン', 'ビタミン', 'ハードカプセル', '未定', 'ビタミンD3、亜鉛、シクロデキストリン', '骨の健康と免疫機能をサポート。吸収促進成分配合', '骨の健康、免疫力向上', 1),
('S010', 'B群ミックス7種類', 'ビタミン', 'ハードカプセル', '360mg', 'ビタミンB1、B2、B3、B5、B6、B12、C', 'エネルギー代謝をサポートするB群ビタミン', 'エネルギー産生、疲労回復、神経機能', 1);

-- ミネラルカテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S011', 'ミネラルミックス7種類', 'ミネラル', 'ハードカプセル', '390mg', 'マンガン、亜鉛、銅、モリブデン、ヨウ素、セレン、クロム', '必須微量ミネラル7種を配合', '代謝サポート、酵素機能、免疫', 1),
('S012', '第三リン酸Mg', 'ミネラル', 'ハードカプセル', '1g', 'マグネシウム（第三リン酸塩）', '高吸収型マグネシウム。筋肉と神経の機能をサポート', '筋肉機能、神経伝達、エネルギー産生', 1);

-- 食物繊維カテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S013', 'アカシアパウダー', '食物繊維', 'ハードカプセル', '260mg', 'アカシア食物繊維', '水溶性食物繊維。腸内環境を整え、善玉菌を増やす', '腸内環境改善、便通改善', 2),
('S014', 'イカキトサン', '食物繊維', 'ハードカプセル', '300mg', 'キトサン（イカ由来）', '脂質の吸収を抑制。コレステロール管理に', 'コレステロール管理、体重管理', 2),
('S015', 'リポソーム型βカリオフィレン', '食物繊維', 'スティック', '2.25g', 'β-カリオフィレン（リポソーム化）', 'カンナビノイド受容体に作用。抗炎症作用', '抗炎症、痛み緩和', 2);

-- フィトケミカルカテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S016', 'スピルリナ', 'フィトケミカル', 'ハードカプセル', '未定', 'スピルリナ粉末', 'スーパーフード。タンパク質、ビタミン、ミネラル、抗酸化物質を豊富に含む', '栄養補給、抗酸化、デトックス', 1),
('S017', 'マインドリバイブ', 'フィトケミカル', 'ハードカプセル', '320mg', '脳機能サポート成分配合', '認知機能と集中力をサポート', '記憶力、集中力、脳の健康', 2);

-- プレバイオカテゴリー
INSERT INTO supplements_master (product_code, product_name, category, form, content_amount, ingredients, description, recommended_for, priority) VALUES
('S018', 'イヌリン', 'プレバイオ', 'スティック', '未定', 'イヌリン（水溶性食物繊維）', '善玉菌のエサとなり、腸内環境を改善するプレバイオティクス', '腸内環境改善、免疫力向上', 1);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_supplements_master_category ON supplements_master(category);
CREATE INDEX IF NOT EXISTS idx_supplements_master_priority ON supplements_master(priority);
CREATE INDEX IF NOT EXISTS idx_supplements_master_active ON supplements_master(is_active);
CREATE INDEX IF NOT EXISTS idx_supplements_master_code ON supplements_master(product_code);
