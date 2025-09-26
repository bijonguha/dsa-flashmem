-- RESET_SUPABASE.sql
-- WARNING: This script will irreversibly remove all objects in the public schema, including all RLS policies.
-- Only run this if you are certain you want to wipe the Supabase/Postgres database for a fresh deployment.
-- All RLS policies will be removed. Paste the contents below into the Supabase SQL editor (or run via psql / supabase CLI with an admin/service role).

BEGIN;

-- NOTE: This script removes all RLS policies from the database.
-- If you want to re-enable RLS and create policies, you'll need to do so separately after running this script.

-- Drop and recreate the public schema (removes everything inside public)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Standard privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Grant usage on the schema to the anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant all privileges on all tables in the public schema to the anon and authenticated roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Optional: drop extensions you don't need (uncomment to run)
-- DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Drop any existing RLS policies (in case they were created outside this script)
-- Note: This will fail silently if policies don't exist
DROP POLICY IF EXISTS "Allow delete for own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Allow insert for own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Allow select for own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Allow update for own analytics" ON public.analytics;

DROP POLICY IF EXISTS "Allow delete for own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Allow insert for own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Allow select for own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Allow update for own flashcards" ON public.flashcards;

DROP POLICY IF EXISTS "Allow delete for own progress" ON public.progress;
DROP POLICY IF EXISTS "Allow insert for own progress" ON public.progress;
DROP POLICY IF EXISTS "Allow select for own progress" ON public.progress;
DROP POLICY IF EXISTS "Allow update for own progress" ON public.progress;

DROP POLICY IF EXISTS "Allow delete for own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow insert for own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow select for own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow update for own sessions" ON public.sessions;

DROP POLICY IF EXISTS "Allow delete for own settings" ON public.settings;
DROP POLICY IF EXISTS "Allow insert for own settings" ON public.settings;
DROP POLICY IF EXISTS "Allow select for own settings" ON public.settings;
DROP POLICY IF EXISTS "Allow update for own settings" ON public.settings;

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
  -- A user should only have one settings row, so user_id is the primary key
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


COMMIT;

-- End of script