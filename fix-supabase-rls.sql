-- Fix Supabase RLS Policies - Simple & Permissive
-- Run this in your Supabase SQL Editor

BEGIN;

-- First, ensure all tables exist
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT
);

CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT,
  title TEXT,
  question TEXT,
  hint TEXT,
  expected_points TEXT[],
  solution JSONB,
  neetcode_url TEXT,
  difficulty TEXT,
  tags TEXT[]
);

CREATE TABLE IF NOT EXISTS progress (
  flashcard_id TEXT,
  user_id TEXT,
  next_review_date TIMESTAMPTZ,
  last_review_date TIMESTAMPTZ,
  interval_days NUMERIC,
  ease_factor NUMERIC,
  total_reviews INTEGER,
  correct_streak INTEGER,
  average_response_time INTEGER,
  PRIMARY KEY (flashcard_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  flashcard_id TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  user_answer TEXT,
  ai_evaluation JSONB,
  self_rating TEXT,
  input_method TEXT,
  time_taken INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY,
  timer_duration INTEGER,
  input_preference TEXT,
  auto_advance BOOLEAN,
  show_hints BOOLEAN,
  theme TEXT,
  openai_api_key TEXT
);

CREATE TABLE IF NOT EXISTS analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  event_type TEXT,
  payload JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can manage their own progress" ON progress;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can manage their own settings" ON settings;
DROP POLICY IF EXISTS "Users can manage their own analytics" ON analytics;

-- SIMPLE & PERMISSIVE POLICIES
-- These policies allow authenticated users to do everything with their own data

-- Profiles: Users can manage their own profile
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid()::text = id);

-- Flashcards: Users can manage their own flashcards
CREATE POLICY "Users can manage their own flashcards" ON flashcards
  FOR ALL USING (auth.uid()::text = user_id);

-- Progress: Users can manage their own progress
CREATE POLICY "Users can manage their own progress" ON progress
  FOR ALL USING (auth.uid()::text = user_id);

-- Sessions: Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions" ON sessions
  FOR ALL USING (auth.uid()::text = user_id);

-- Settings: Users can manage their own settings
CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL USING (auth.uid()::text = user_id);

-- Analytics: Users can manage their own analytics
CREATE POLICY "Users can manage their own analytics" ON analytics
  FOR ALL USING (auth.uid()::text = user_id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- Success message
SELECT 'RLS policies created successfully! Your app should now work.' AS status;