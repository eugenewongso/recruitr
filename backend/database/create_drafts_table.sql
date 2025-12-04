-- Create Outreach Drafts Table

CREATE TABLE IF NOT EXISTS outreach_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    participant_ids UUID[] NOT NULL,
    participants JSONB NOT NULL,
    generated_emails JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes (will skip if they exist)
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_user_id ON outreach_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_created_at ON outreach_drafts(created_at DESC);

-- Enable RLS
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own drafts" ON outreach_drafts;
DROP POLICY IF EXISTS "Users can create their own drafts" ON outreach_drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON outreach_drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON outreach_drafts;

CREATE POLICY "Users can view their own drafts" 
    ON outreach_drafts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts" 
    ON outreach_drafts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
    ON outreach_drafts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" 
    ON outreach_drafts FOR DELETE 
    USING (auth.uid() = user_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_outreach_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS update_outreach_drafts_updated_at_trigger ON outreach_drafts;

CREATE TRIGGER update_outreach_drafts_updated_at_trigger
    BEFORE UPDATE ON outreach_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_outreach_drafts_updated_at();


