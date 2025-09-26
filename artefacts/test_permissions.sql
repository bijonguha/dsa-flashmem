-- Test script to grant permissions to anon and authenticated roles.
-- Run this in your Supabase SQL editor to diagnose permission issues.

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT, INSERT, UPDATE, DELETE on flashcards table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.flashcards TO anon, authenticated;

-- Grant SELECT, INSERT, UPDATE, DELETE on settings table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings TO anon, authenticated;