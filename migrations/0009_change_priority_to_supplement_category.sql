-- Add new supplement_category column
ALTER TABLE supplements_master ADD COLUMN supplement_category TEXT DEFAULT '健康サポート';

-- Map existing priority values to new categories
-- Priority 1 (必須) -> 必須栄養素
-- Priority 2 -> 機能性食品
-- Priority 3 -> 健康サポート

UPDATE supplements_master SET supplement_category = '必須栄養素' WHERE priority = 1;
UPDATE supplements_master SET supplement_category = '機能性食品' WHERE priority = 2;
UPDATE supplements_master SET supplement_category = '健康サポート' WHERE priority = 3;

-- Keep priority column for now (backward compatibility)
-- We'll update the code to use supplement_category instead
