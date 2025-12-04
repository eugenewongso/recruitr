-- Search History Table Schema
-- Stores all search queries made by researchers

-- Drop existing table if needed
DROP TABLE IF EXISTS public.search_history CASCADE;

-- Create search_history table
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Search query details
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    search_type VARCHAR(20) DEFAULT 'hybrid' CHECK (search_type IN ('bm25', 'sbert', 'hybrid')),
    
    -- Results metadata
    results_count INTEGER DEFAULT 0,
    top_result_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX idx_search_history_user_created ON public.search_history(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own search history
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

-- Add comment
COMMENT ON TABLE public.search_history IS 'Stores search queries made by researchers for history tracking';

