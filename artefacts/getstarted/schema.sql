-- DSA FlashMem schema: schema.sql
-- Idempotent script to drop and recreate application tables
-- Run in Supabase SQL Editor or via psql with a service role / DB-admin connection

BEGIN;

-- Drop existing tables (safe for reinitialization)
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  username TEXT
);

-- Flashcards
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  hint TEXT,
  expected_points TEXT[] DEFAULT '{}',
  solution JSONB NOT NULL DEFAULT '{}',
  neetcode_url TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  tags TEXT[] DEFAULT '{}'
);

-- Progress
CREATE TABLE progress (
  flashcard_id TEXT,
  user_id TEXT NOT NULL,
  next_review_date TIMESTAMPTZ DEFAULT now(),
  last_review_date TIMESTAMPTZ DEFAULT now(),
  interval_days NUMERIC DEFAULT 1,
  ease_factor NUMERIC DEFAULT 2.5,
  total_reviews INTEGER DEFAULT 0,
  correct_streak INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0,
  PRIMARY KEY (flashcard_id, user_id)
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flashcard_id TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ DEFAULT now(),
  user_answer TEXT DEFAULT '',
  ai_evaluation JSONB DEFAULT '{"score": 0, "feedback": "", "missing_points": []}',
  self_rating TEXT DEFAULT 'good',
  input_method TEXT DEFAULT 'typing',
  time_taken INTEGER DEFAULT 0
);

-- Settings
CREATE TABLE settings (
  user_id UUID PRIMARY KEY,
  timer_duration INTEGER DEFAULT 300,
  input_preference TEXT DEFAULT 'both',
  auto_advance BOOLEAN DEFAULT false,
  show_hints BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'auto',
  daily_review_limit INTEGER,
  topic_filters TEXT[],
  openai_api_key TEXT,
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Analytics
CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Grants (allow anon/authenticated roles to access schema objects; RLS will control row-level access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

COMMIT;

-- Verify
SELECT 'schema created' AS status, table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';