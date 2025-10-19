-- Batch Jobs Table
-- Tracks batch content generation jobs (blog posts, image captions, SEO metadata, etc.)

CREATE TABLE IF NOT EXISTS batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'blog_posts_from_trips',
        'image_captions',
        'seo_metadata',
        'trip_plans_for_locations'
    )),
    config JSONB NOT NULL, -- { sourceIds: [], options: {} }
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'validating',
        'in_progress',
        'completed',
        'failed',
        'cancelled'
    )),
    result JSONB, -- { totalItems, successCount, failureCount, generatedIds, errors }
    groq_batch_id VARCHAR(255), -- GROQ batch API ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_batch_jobs_user ON batch_jobs(user_id);
CREATE INDEX idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX idx_batch_jobs_type ON batch_jobs(type);
CREATE INDEX idx_batch_jobs_created ON batch_jobs(created_at DESC);
CREATE INDEX idx_batch_jobs_groq_batch ON batch_jobs(groq_batch_id) WHERE groq_batch_id IS NOT NULL;

-- RLS Policies
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own batch jobs
CREATE POLICY "Users can view their own batch jobs"
ON batch_jobs FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own batch jobs
CREATE POLICY "Users can create their own batch jobs"
ON batch_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own batch jobs
CREATE POLICY "Users can update their own batch jobs"
ON batch_jobs FOR UPDATE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_batch_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER batch_jobs_updated_at
    BEFORE UPDATE ON batch_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_jobs_updated_at();

-- Comments
COMMENT ON TABLE batch_jobs IS 'Batch content generation jobs using GROQ batch API';
COMMENT ON COLUMN batch_jobs.config IS 'Job configuration: { sourceIds: string[], options: { autoPublish, includeAffiliate, seoOptimize } }';
COMMENT ON COLUMN batch_jobs.result IS 'Job results: { totalItems, successCount, failureCount, skippedCount, generatedIds, errors }';
COMMENT ON COLUMN batch_jobs.groq_batch_id IS 'GROQ batch API job ID for tracking';

