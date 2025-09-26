-- DSA FlashMem seed data: seed.sql
-- Run after schema.sql and policies.sql
BEGIN;

-- Demo profile
INSERT INTO profiles (id, username) VALUES ('00000000-0000-0000-0000-000000000001', 'demo') ON CONFLICT DO NOTHING;

-- Flashcards
INSERT INTO flashcards (id, user_id, topic, title, question, hint, expected_points, solution, neetcode_url, difficulty, tags) VALUES
('two-sum','00000000-0000-0000-0000-000000000001','Arrays','Two Sum','Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.','Think about using a hash map to store complements.', ARRAY['Use hash map','Check complement on each iteration','Return indices'], $$ {"approaches":[{"name":"Hash Map Approach","code":"def twoSum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []","time_complexity":"O(n)","space_complexity":"O(n)","explanation":"Iterate once, storing number->index mapping and checking complements."}]} $$::jsonb, 'https://neetcode.io/two-sum', 'Easy', ARRAY['Array','Hash Table']) ON CONFLICT DO NOTHING,
('reverse-string','00000000-0000-0000-0000-000000000001','Strings','Reverse String','Write a function that reverses a string.','Consider two-pointer technique.', ARRAY['Two pointers','In-place reversal','O(n) time'], $$ {"approaches":[{"name":"Two Pointer","code":"def reverseString(s):\n    s = list(s)\n    i, j = 0, len(s)-1\n    while i < j:\n        s[i], s[j] = s[j], s[i]\n        i += 1\n        j -= 1\n    return ''.join(s)","time_complexity":"O(n)","space_complexity":"O(1)","explanation":"Swap characters using two pointers."}]} $$::jsonb, NULL, 'Easy', ARRAY['String']) ON CONFLICT DO NOTHING;

-- Progress rows
INSERT INTO progress (flashcard_id, user_id, next_review_date, last_review_date, interval_days, ease_factor, total_reviews, correct_streak, average_response_time) VALUES
('two-sum','00000000-0000-0000-0000-000000000001', now(), now(), 1, 2.5, 0, 0, 0),
('reverse-string','00000000-0000-0000-0000-000000000001', now(), now(), 1, 2.5, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Settings
INSERT INTO settings (user_id, timer_duration, input_preference, auto_advance, show_hints, theme, daily_review_limit, topic_filters) VALUES
('00000000-0000-0000-0000-000000000001', 300, 'both', false, true, 'auto', NULL, NULL) ON CONFLICT DO NOTHING;

-- Sample analytics
INSERT INTO analytics (user_id, event_type, payload) VALUES
('00000000-0000-0000-0000-000000000001', 'app_started', '{"device":"browser","version":"dev"}'::jsonb)
ON CONFLICT DO NOTHING;

COMMIT;

-- End