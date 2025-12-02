-- Add price column to supplements_master table
ALTER TABLE supplements_master ADD COLUMN price INTEGER DEFAULT 0;

-- Update existing supplements with sample prices
UPDATE supplements_master SET price = 2980 WHERE product_code = 'VM11';
UPDATE supplements_master SET price = 3480 WHERE product_code = 'KO';
UPDATE supplements_master SET price = 2780 WHERE product_code = 'AB';
UPDATE supplements_master SET price = 3980 WHERE product_code = 'EAA';
UPDATE supplements_master SET price = 4280 WHERE product_code = 'LVC';
UPDATE supplements_master SET price = 2480 WHERE product_code = 'VD3ZN';
UPDATE supplements_master SET price = 1980 WHERE product_code = 'BM7';
UPDATE supplements_master SET price = 2280 WHERE product_code = 'MM7';
UPDATE supplements_master SET price = 1680 WHERE product_code = 'MG3';
UPDATE supplements_master SET price = 2680 WHERE product_code = 'KI';
UPDATE supplements_master SET price = 1480 WHERE product_code = 'AP';
UPDATE supplements_master SET price = 3280 WHERE product_code = 'ZP';
UPDATE supplements_master SET price = 2880 WHERE product_code = 'MR';
UPDATE supplements_master SET price = 3680 WHERE product_code = 'LBC';
UPDATE supplements_master SET price = 2180 WHERE product_code = 'SP';
UPDATE supplements_master SET price = 1780 WHERE product_code = 'INL';
