-- DSA FlashMem RLS policies: policies.sql
-- Run after schema.sql. Requires admin/service role privileges to create policies and functions.

BEGIN;

-- Enable RLS for tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics ENABLE ROW LEVEL SECURITY;

-- Create helper function to return current user id (wraps auth.uid())
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.uid()::text, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: allow authenticated users to access their own rows (and to insert)
CREATE POLICY profiles_select_authenticated ON profiles
  FOR SELECT TO authenticated USING (id = get_current_user_id());

CREATE POLICY profiles_insert_authenticated ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = get_current_user_id());

CREATE POLICY flashcards_select_owner ON flashcards
  FOR SELECT TO authenticated USING (user_id = get_current_user_id());

CREATE POLICY flashcards_insert_owner ON flashcards
  FOR INSERT TO authenticated WITH CHECK (user_id = get_current_user_id());

CREATE POLICY flashcards_update_owner ON flashcards
  FOR UPDATE TO authenticated USING (user_id = get_current_user_id()) WITH CHECK (user_id = get_current_user_id());

CREATE POLICY progress_owner ON progress
  FOR ALL TO authenticated USING (user_id = get_current_user_id()) WITH CHECK (user_id = get_current_user_id());

CREATE POLICY sessions_owner ON sessions
  FOR ALL TO authenticated USING (user_id = get_current_user_id()) WITH CHECK (user_id = get_current_user_id());

CREATE POLICY settings_owner ON settings
  FOR ALL TO authenticated USING (user_id = get_current_user_id()) WITH CHECK (user_id = get_current_user_id());

-- Analytics: allow inserts (tracking events) from authenticated users but restrict selects
CREATE POLICY analytics_insert_authenticated ON analytics
  FOR INSERT TO authenticated WITH CHECK (user_id = get_current_user_id());

CREATE POLICY analytics_select_admin ON analytics
  FOR SELECT TO postgres USING (true); -- superuser only; anon/authenticated cannot select by default

COMMIT;

-- Quick verification queries:
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles','flashcards','progress','sessions','settings','analytics');