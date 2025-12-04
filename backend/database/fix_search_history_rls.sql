-- Fix Search History RLS Policies
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON public.search_history;

-- Recreate policies with correct logic
CREATE POLICY "Users can view their own search history"
    ON public.search_history
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own search history"
    ON public.search_history
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own search history"
    ON public.search_history
    FOR DELETE
    USING (user_id = auth.uid());

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'search_history';

-- Test query to see if you can read your own data
SELECT 
    id,
    user_id,
    query_text,
    created_at,
    (user_id = auth.uid()) as is_my_data
FROM public.search_history
ORDER BY created_at DESC
LIMIT 5;

