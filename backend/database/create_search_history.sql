-- Create Search History Table (Clean Version)
-- Run this in Supabase SQL Editor if search history is not working

-- Drop and recreate cleanly
DROP TABLE IF EXISTS public.search_history CASCADE;

-- Create the table
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    search_type VARCHAR(20) DEFAULT 'hybrid',
    results_count INTEGER DEFAULT 0,
    top_result_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own search history"
    ON public.search_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
    ON public.search_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
    ON public.search_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Verify it worked
SELECT 'search_history table created successfully!' as status;

