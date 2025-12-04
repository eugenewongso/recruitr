-- ============================================
-- Recruitr Database Schema
-- Supabase PostgreSQL + pgvector
-- ============================================
-- 
-- This schema supports both Phase 1 (researcher-only)
-- and Phase 2 (two-sided platform) expansion
--
-- Run this in Supabase SQL Editor after creating your project
-- ============================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- ENUMS
-- ============================================

-- User roles (expandable)
CREATE TYPE user_role AS ENUM ('researcher', 'participant');

-- Interview request status (for future Phase 2)
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');

-- ============================================
-- PROFILES TABLE
-- Extended user profiles (linked to auth.users)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'researcher',
    
    -- Researcher-specific fields (Phase 1)
    company_name TEXT,
    job_title TEXT,
    
    -- Participant linking (Phase 2 - future)
    participant_profile_id UUID,  -- Will reference participants(id)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTICIPANTS TABLE
-- Core participant data for search
-- ============================================

CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL,
    email TEXT,
    
    -- Professional Profile
    role TEXT NOT NULL,
    industry TEXT,
    company_name TEXT,
    company_size TEXT,  -- e.g., "10-50", "50-200", "500+"
    
    -- Work Details
    remote BOOLEAN DEFAULT FALSE,
    team_size INTEGER,
    experience_years INTEGER,
    
    -- Skills & Tools
    tools TEXT[],  -- Array of tools: ["Trello", "Asana", "Slack"]
    skills TEXT[], -- Array of skills: ["Product Management", "UX Research"]
    
    -- Searchable Description
    description TEXT,  -- Full-text description for BM25 and SBERT
    
    -- Vector Embedding for Semantic Search
    embedding vector(384),  -- Sentence-BERT embedding (384 dimensions)
    
    -- Account Linking (Phase 2 - future)
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_synthetic BOOLEAN DEFAULT TRUE,  -- TRUE for generated data, FALSE for real users
    
    -- Availability (Phase 2 - future)
    accepting_interviews BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEARCHES TABLE
-- Search history for researchers
-- ============================================

CREATE TABLE searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Query Information
    query TEXT NOT NULL,
    filters JSONB,  -- Structured filters extracted from query
    
    -- Results
    results_count INTEGER,
    results JSONB,  -- Store top results for history
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED_PARTICIPANTS TABLE
-- Bookmarked participants by researchers
-- ============================================

CREATE TABLE saved_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
    
    -- Optional Notes
    notes TEXT,
    tags TEXT[],  -- Custom tags: ["high-priority", "contacted"]
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(researcher_id, participant_id)
);

-- ============================================
-- INTERVIEW_REQUESTS TABLE (Phase 2 - Future)
-- Requests from researchers to participants
-- ============================================

CREATE TABLE interview_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    researcher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
    
    -- Request Details
    message TEXT,
    status request_status DEFAULT 'pending',
    
    -- Project Information
    project_name TEXT,
    project_description TEXT,
    estimated_duration INTEGER,  -- in minutes
    compensation TEXT,  -- e.g., "$50 gift card", "Free product access"
    
    -- Response
    participant_response TEXT,
    responded_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- For performance optimization
-- ============================================

-- Vector similarity search (IVFFlat index)
CREATE INDEX idx_participants_embedding 
ON participants 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Filtering indexes
CREATE INDEX idx_participants_role ON participants(role);
CREATE INDEX idx_participants_remote ON participants(remote);
CREATE INDEX idx_participants_company_size ON participants(company_size);
CREATE INDEX idx_participants_is_synthetic ON participants(is_synthetic);

-- Array search (GIN index for tools and skills)
CREATE INDEX idx_participants_tools ON participants USING GIN(tools);
CREATE INDEX idx_participants_skills ON participants USING GIN(skills);

-- User lookups
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Search history
CREATE INDEX idx_searches_researcher ON searches(researcher_id);
CREATE INDEX idx_searches_created_at ON searches(created_at DESC);

-- Saved participants
CREATE INDEX idx_saved_researcher ON saved_participants(researcher_id);
CREATE INDEX idx_saved_participant ON saved_participants(participant_id);

-- Interview requests
CREATE INDEX idx_requests_researcher ON interview_requests(researcher_id);
CREATE INDEX idx_requests_participant ON interview_requests(participant_id);
CREATE INDEX idx_requests_status ON interview_requests(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Data access control
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Profiles
-- ============================================

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES: Participants
-- ============================================

-- Researchers can view all participants
CREATE POLICY "Researchers can view all participants"
ON participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'researcher'
    )
);

-- Participants can view their own profile (Phase 2)
CREATE POLICY "Participants can view own profile"
ON participants FOR SELECT
USING (user_id = auth.uid());

-- Participants can update their own profile (Phase 2)
CREATE POLICY "Participants can update own profile"
ON participants FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: Searches
-- ============================================

CREATE POLICY "Users can view own searches"
ON searches FOR SELECT
USING (researcher_id = auth.uid());

CREATE POLICY "Users can create own searches"
ON searches FOR INSERT
WITH CHECK (researcher_id = auth.uid());

CREATE POLICY "Users can delete own searches"
ON searches FOR DELETE
USING (researcher_id = auth.uid());

-- ============================================
-- RLS POLICIES: Saved Participants
-- ============================================

CREATE POLICY "Users can view own saved participants"
ON saved_participants FOR SELECT
USING (researcher_id = auth.uid());

CREATE POLICY "Users can save participants"
ON saved_participants FOR INSERT
WITH CHECK (researcher_id = auth.uid());

CREATE POLICY "Users can unsave participants"
ON saved_participants FOR DELETE
USING (researcher_id = auth.uid());

CREATE POLICY "Users can update own saved participants"
ON saved_participants FOR UPDATE
USING (researcher_id = auth.uid());

-- ============================================
-- RLS POLICIES: Interview Requests (Phase 2)
-- ============================================

-- Researchers can view their sent requests
CREATE POLICY "Researchers can view sent requests"
ON interview_requests FOR SELECT
USING (researcher_id = auth.uid());

-- Researchers can create requests
CREATE POLICY "Researchers can create requests"
ON interview_requests FOR INSERT
WITH CHECK (researcher_id = auth.uid());

-- Participants can view their received requests
CREATE POLICY "Participants can view received requests"
ON interview_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM participants
        WHERE participants.id = interview_requests.participant_id
        AND participants.user_id = auth.uid()
    )
);

-- Participants can update requests (accept/decline)
CREATE POLICY "Participants can respond to requests"
ON interview_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM participants
        WHERE participants.id = interview_requests.participant_id
        AND participants.user_id = auth.uid()
    )
);

-- ============================================
-- FUNCTIONS
-- Custom database functions for queries
-- ============================================

-- Function: Semantic Search with Filters
CREATE OR REPLACE FUNCTION match_participants(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 50,
    filter_remote boolean DEFAULT NULL,
    filter_tools text[] DEFAULT NULL,
    filter_role text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    role text,
    company_name text,
    remote boolean,
    tools text[],
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.role,
        p.company_name,
        p.remote,
        p.tools,
        p.description,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM participants p
    WHERE 
        (filter_remote IS NULL OR p.remote = filter_remote)
        AND (filter_tools IS NULL OR p.tools && filter_tools)
        AND (filter_role IS NULL OR p.role ILIKE '%' || filter_role || '%')
        AND (1 - (p.embedding <=> query_embedding)) > match_threshold
        AND p.is_synthetic = true  -- Phase 1: only synthetic data
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function: Get Participant Statistics
CREATE OR REPLACE FUNCTION get_participant_stats()
RETURNS TABLE (
    total_participants bigint,
    by_role jsonb,
    by_company_size jsonb,
    remote_count bigint,
    onsite_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint as total_participants,
        jsonb_object_agg(role, role_count) as by_role,
        jsonb_object_agg(company_size, size_count) as by_company_size,
        SUM(CASE WHEN remote = true THEN 1 ELSE 0 END)::bigint as remote_count,
        SUM(CASE WHEN remote = false THEN 1 ELSE 0 END)::bigint as onsite_count
    FROM (
        SELECT
            role,
            COUNT(*) as role_count
        FROM participants
        WHERE is_synthetic = true
        GROUP BY role
    ) role_stats,
    (
        SELECT
            company_size,
            COUNT(*) as size_count
        FROM participants
        WHERE is_synthetic = true
        GROUP BY company_size
    ) size_stats,
    (
        SELECT COUNT(*) FROM participants WHERE is_synthetic = true
    ) total;
END;
$$;

-- ============================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_requests_updated_at
    BEFORE UPDATE ON interview_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- This will be populated by backend/data/generate_participants.py

COMMENT ON TABLE participants IS 'Participant profiles for search (synthetic and real)';
COMMENT ON TABLE profiles IS 'Extended user profiles linked to Supabase auth';
COMMENT ON TABLE searches IS 'Search history for researchers';
COMMENT ON TABLE saved_participants IS 'Bookmarked participants by researchers';
COMMENT ON TABLE interview_requests IS 'Interview requests between researchers and participants';

COMMENT ON COLUMN participants.embedding IS 'Sentence-BERT 384-dimensional embedding for semantic search';
COMMENT ON COLUMN participants.is_synthetic IS 'TRUE for generated data, FALSE for real user profiles';
COMMENT ON FUNCTION match_participants IS 'Semantic similarity search with optional filters';

-- ============================================
-- GRANTS (if needed for service role)
-- ============================================

-- Supabase automatically handles permissions for authenticated users
-- Service role has full access

-- ============================================
-- SCHEMA VERSION
-- ============================================

CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema with Phase 1 (researcher) and Phase 2 (two-sided) support');

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Next steps:
-- 1. Run backend/data/generate_participants.py to populate synthetic data
-- 2. Test the match_participants function in SQL Editor
-- 3. Start the FastAPI backend
-- 4. Start the React frontend

