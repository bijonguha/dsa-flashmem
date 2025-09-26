-- Migration: Fix Settings User ID Data Type
-- This script fixes the data type mismatch between settings.user_id and auth.users.id

-- Convert settings.user_id from text to uuid
ALTER TABLE settings
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Verify data type conversion
SELECT
    'Data Types After Conversion' as section,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'settings' AND column_name = 'user_id';
