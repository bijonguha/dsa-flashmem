-- Fix user_id constraint issue
-- This makes user_id nullable temporarily while we fix the data

BEGIN;

-- Make user_id nullable (remove NOT NULL constraint)
ALTER TABLE flashcards ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE progress ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE analytics ALTER COLUMN user_id DROP NOT NULL;

-- But add a default value so new records have a user_id
ALTER TABLE flashcards ALTER COLUMN user_id SET DEFAULT 'anonymous';
ALTER TABLE progress ALTER COLUMN user_id SET DEFAULT 'anonymous';
ALTER TABLE sessions ALTER COLUMN user_id SET DEFAULT 'anonymous';
ALTER TABLE analytics ALTER COLUMN user_id SET DEFAULT 'anonymous';

COMMIT;

SELECT 'user_id constraints relaxed - imports should work now' as status;