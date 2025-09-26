-- Debug Supabase 406 Error - Check table structure and fix issues
-- Run this in your Supabase SQL Editor

-- First, let's check if the settings table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any settings records
SELECT COUNT(*) as settings_count FROM settings;

-- Check RLS policies on settings table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'settings';

-- Check table permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'settings' 
AND table_schema = 'public';

-- If the table doesn't exist or has issues, recreate it with proper structure
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE settings (
    user_id TEXT PRIMARY KEY,
    timer_duration INTEGER DEFAULT 300,
    input_preference TEXT DEFAULT 'both',
    auto_advance BOOLEAN DEFAULT FALSE,
    show_hints BOOLEAN DEFAULT TRUE,
    theme TEXT DEFAULT 'auto',
    openai_api_key TEXT
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create the policy
CREATE POLICY "Users can manage their own settings" ON settings
    FOR ALL 
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Grant permissions
GRANT ALL ON settings TO authenticated;
GRANT ALL ON settings TO anon;

-- Test insert a default settings record for the current user (if authenticated)
-- Note: This will only work if you're authenticated in the SQL editor
-- INSERT INTO settings (user_id) VALUES (auth.uid()::text) ON CONFLICT DO NOTHING;

SELECT 'Settings table recreated with proper structure and RLS policy' as status;