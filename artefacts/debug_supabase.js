// A standalone script to debug Supabase connectivity and permissions.
// To run this, you'll need to install the Supabase JS library: `npm install @supabase/supabase-js`
// Then, execute from your terminal: `node artefacts/debug_supabase.js`

import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
const supabaseUrl = 'https://aagnqlxkwrpeyduubcai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ25xbHhrd3JwZXlkdXViY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Mzc1MjksImV4cCI6MjA3NDQxMzUyOX0.sXv1L1NMCDDuoDKR4K97bkzmsY-WBISheOLD5IRdQ8U';
const userIdToQuery = '3a71facb-e66f-4396-8a9f-80d5fe07616c'; // The user ID from the error logs

// --- Script ---
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
  console.log('--- Supabase Debug Script ---');

  try {
    console.log('\n[1/2] Attempting to fetch flashcards...');
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userIdToQuery);

    if (flashcardsError) {
      console.error('Error fetching flashcards:', flashcardsError);
    } else {
      console.log('Successfully fetched flashcards:', flashcards);
    }

    console.log('\n[2/2] Attempting to fetch settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userIdToQuery);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    } else {
      console.log('Successfully fetched settings:', settings);
    }
  } catch (error) {
    console.error('\nAn unexpected error occurred:', error);
  } finally {
    console.log('\n--- Debug script finished ---');
  }
}

runDebug();