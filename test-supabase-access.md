# Fix Supabase 403 Forbidden Error

## Problem
Your Supabase database has **Row Level Security (RLS)** enabled but **no policies** are configured. This causes all requests to be denied with `403 Forbidden` errors.

## Root Cause
- RLS is enabled on all tables (good for security)
- No RLS policies are defined (blocks all access)
- Users can't access their own data even when authenticated

## Solution

### Step 1: Run the SQL Script
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix-supabase-rls.sql`
4. Click **Run** to execute the script

### Step 2: What the script does
- ✅ Creates simple, permissive RLS policies
- ✅ Allows authenticated users to manage their own data
- ✅ Uses `auth.uid()` to match user ownership
- ✅ Grants necessary permissions

### Step 3: Test the fix
After running the script, your app should work immediately. The policies allow:

- **Flashcards**: Users can CRUD their own flashcards where `user_id = auth.uid()`
- **Progress**: Users can CRUD their own progress where `user_id = auth.uid()`
- **Settings**: Users can CRUD their own settings where `user_id = auth.uid()`
- **Sessions**: Users can CRUD their own sessions where `user_id = auth.uid()`
- **Analytics**: Users can CRUD their own analytics where `user_id = auth.uid()`

## Alternative: Disable RLS (Less Secure)
If you want to completely disable RLS for testing:

```sql
-- WARNING: This removes security - only for testing!
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;
```

## Recommended: Keep RLS Enabled
The `fix-supabase-rls.sql` script is the recommended approach as it maintains security while allowing proper access.

After running the script, all your 403 errors should be resolved!