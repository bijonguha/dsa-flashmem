-- Quick Fix: Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor to quickly test if RLS is the issue

BEGIN;

-- Disable RLS on all tables temporarily
ALTER TABLE IF EXISTS flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions for testing
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

COMMIT;

SELECT 'RLS temporarily disabled - test your app now' as status;

-- IMPORTANT: After testing, re-enable RLS with proper policies for security:
-- ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;