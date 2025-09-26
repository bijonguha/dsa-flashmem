# Fix Supabase 406 Error

## Problem
HTTP 406 "Not Acceptable" error suggests the API request format or table structure is incompatible.

## Quick Solutions (try in order)

### Solution 1: Disable RLS Temporarily (for testing)
Run `quick-fix-disable-rls.sql` in Supabase SQL Editor to quickly test if RLS is causing issues.

### Solution 2: Fix Table Structure
Run `debug-supabase-406.sql` in Supabase SQL Editor to check and recreate the settings table with proper structure.

### Solution 3: Check Console Errors
1. Open browser DevTools → Console
2. Look for more detailed error messages
3. Check Network tab for the exact API response

### Solution 4: Manual Table Creation
If the automated scripts don't work, manually create tables in Supabase Dashboard:

1. **Go to Table Editor**
2. **Create `settings` table** with columns:
   - `user_id` (text, primary key)
   - `timer_duration` (int4, default: 300)
   - `input_preference` (text, default: 'both')
   - `auto_advance` (bool, default: false)
   - `show_hints` (bool, default: true)
   - `theme` (text, default: 'auto')
   - `openai_api_key` (text, nullable)

3. **Disable RLS** for now (can re-enable later)

## What I Fixed in Code
- ✅ Changed `.single()` to `.maybeSingle()` to handle empty results
- ✅ Added proper error handling and fallback defaults
- ✅ Added detailed logging to see what's happening

## Test Steps
1. Run one of the SQL scripts
2. Refresh your app
3. Check browser console for any remaining errors
4. If still failing, try the manual table creation approach

The 406 error is likely due to table structure mismatch or missing tables. The SQL scripts should resolve this.