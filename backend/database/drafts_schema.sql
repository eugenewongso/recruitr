-- Outreach Drafts Table
-- Stores saved outreach email drafts with participants and generated content

CREATE TABLE IF NOT EXISTS outreach_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Participant data
    participant_ids UUID[] NOT NULL,
    participants JSONB NOT NULL, -- Store participant details for display
    
    -- Generated emails (if any)
    generated_emails JSONB, -- Array of {subject, body, participant_name}
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT outreach_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_user_id ON outreach_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_created_at ON outreach_drafts(created_at DESC);

-- Row Level Security
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own drafts
CREATE POLICY "Users can view their own drafts"
    ON outreach_drafts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own drafts
CREATE POLICY "Users can create their own drafts"
    ON outreach_drafts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update their own drafts"
    ON outreach_drafts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete their own drafts"
    ON outreach_drafts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_outreach_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_outreach_drafts_updated_at_trigger
    BEFORE UPDATE ON outreach_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_outreach_drafts_updated_at();

-- Comments
COMMENT ON TABLE outreach_drafts IS 'Stores saved outreach email drafts with participants and generated content';
COMMENT ON COLUMN outreach_drafts.participant_ids IS 'Array of participant UUIDs';
COMMENT ON COLUMN outreach_drafts.participants IS 'Full participant details for display';
COMMENT ON COLUMN outreach_drafts.generated_emails IS 'AI-generated emails if user has generated them';

