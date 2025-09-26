-- EMERGENCY FIX - Completely disable RLS for immediate testing
-- This removes all security but will make your app work instantly
-- Run this in Supabase SQL Editor

BEGIN;

-- Disable RLS on all tables completely
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;

-- Grant maximum permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    user_id TEXT,
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

CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT PRIMARY KEY,
    timer_duration INTEGER DEFAULT 300,
    input_preference TEXT DEFAULT 'both',
    auto_advance BOOLEAN DEFAULT false,
    show_hints BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'auto',
    openai_api_key TEXT
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

CREATE TABLE IF NOT EXISTS analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    event_type TEXT,
    payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);

COMMIT;

SELECT 'RLS completely disabled - your app should work now!' as status;