-- Fix PostgreSQL column types in progress table
-- Change INTEGER columns that need to store decimal values to NUMERIC

BEGIN;

-- Fix interval_days to allow decimal values (e.g., 0.1, 1.5, 44.5)
ALTER TABLE progress ALTER COLUMN interval_days TYPE NUMERIC;

-- Fix ease_factor to allow decimal values (e.g., 2.5, 1.3, 2.8)
ALTER TABLE progress ALTER COLUMN ease_factor TYPE NUMERIC;

-- Fix average_response_time to allow decimal values (e.g., 46.75, 123.45)
ALTER TABLE progress ALTER COLUMN average_response_time TYPE NUMERIC;

COMMIT;

-- Verify the changes
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'progress' 
AND column_name IN ('interval_days', 'ease_factor', 'average_response_time');