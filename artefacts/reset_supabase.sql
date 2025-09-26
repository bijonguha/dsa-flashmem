-- RESET_SUPABASE.sql
-- WARNING: This script will irreversibly remove all objects in the public schema.
-- Only run this if you are certain you want to wipe the Supabase/Postgres database for a fresh deployment.
-- Paste the contents below into the Supabase SQL editor (or run via psql / supabase CLI with an admin/service role).

BEGIN;

-- Drop and recreate the public schema (removes everything inside public)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Standard privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Optional: drop extensions you don't need (uncomment to run)
-- DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Example: recreate application tables (adjust columns/types to your schema)
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
  id TEXT PRIMARY KEY,
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

COMMIT;

-- End of script