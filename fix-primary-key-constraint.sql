-- Fix primary key constraint issue safely
-- This recreates tables without strict NOT NULL on user_id where possible

BEGIN;

-- For flashcards table (user_id is not part of primary key)
ALTER TABLE flashcards ALTER COLUMN user_id DROP NOT NULL;

-- For sessions table (user_id is not part of primary key)  
ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;

-- For analytics table (user_id is not part of primary key)
ALTER TABLE analytics ALTER COLUMN user_id DROP NOT NULL;

-- For progress table, we can't modify user_id since it's part of primary key
-- But we can add a default value for new inserts
-- This won't affect the primary key constraint

-- For settings table, user_id IS the primary key, so we can't make it nullable
-- That's fine since settings should always have a user_id

COMMIT;

-- Alternative: If the above fails, recreate the progress table properly
-- Uncomment the section below if needed:

/*
BEGIN;

-- Backup existing progress data
CREATE TEMP TABLE progress_backup AS SELECT * FROM progress;

-- Drop and recreate progress table
DROP TABLE progress CASCADE;

CREATE TABLE progress (
    flashcard_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    next_review_date TIMESTAMPTZ DEFAULT now(),
    last_review_date TIMESTAMPTZ DEFAULT now(),
    interval_days NUMERIC DEFAULT 1,
    ease_factor NUMERIC DEFAULT 2.5,
    total_reviews INTEGER DEFAULT 0,
    correct_streak INTEGER DEFAULT 0,
    average_response_time INTEGER DEFAULT 0,
    PRIMARY KEY (flashcard_id, user_id)
);

-- Restore data (only records with valid user_id)
INSERT INTO progress SELECT * FROM progress_backup WHERE user_id IS NOT NULL;

COMMIT;
*/

SELECT 'Constraints fixed where possible' as status;