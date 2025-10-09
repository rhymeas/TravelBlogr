-- Migration: Cached Itineraries Table
-- Purpose: Store Groq AI-generated itineraries for intelligent caching
-- Created: 2025-10-08

-- Create cached_itineraries table
CREATE TABLE IF NOT EXISTS cached_itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Cache key (hash of request parameters for quick lookup)
    cache_key VARCHAR(64) NOT NULL UNIQUE,
    
    -- Request parameters (for matching and analytics)
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    stops JSONB DEFAULT '[]'::jsonb,
    total_days INTEGER NOT NULL,
    interests TEXT[] DEFAULT '{}',
    budget TEXT NOT NULL,
    
    -- Cached plan data (full Groq AI response)
    plan_data JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    
    -- Soft delete support
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Performance indexes
    CONSTRAINT cached_itineraries_cache_key_key UNIQUE (cache_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_cache_key ON cached_itineraries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_locations ON cached_itineraries(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_created_at ON cached_itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_last_used ON cached_itineraries(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_usage_count ON cached_itineraries(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_active ON cached_itineraries(is_active) WHERE is_active = TRUE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_cached_itineraries_lookup 
ON cached_itineraries(from_location, to_location, total_days, is_active) 
WHERE is_active = TRUE;

-- Function to automatically update last_used_at
CREATE OR REPLACE FUNCTION update_cached_itinerary_usage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    NEW.usage_count = OLD.usage_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage stats
CREATE TRIGGER trigger_update_cached_itinerary_usage
    BEFORE UPDATE ON cached_itineraries
    FOR EACH ROW
    WHEN (OLD.plan_data IS NOT DISTINCT FROM NEW.plan_data)
    EXECUTE FUNCTION update_cached_itinerary_usage();

-- Function to clean up old cache entries (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_cached_itineraries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM cached_itineraries
        WHERE created_at < NOW() - INTERVAL '30 days'
        AND usage_count < 2  -- Keep frequently used caches longer
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE cached_itineraries IS 'Stores cached Groq AI-generated itineraries to reduce API calls and improve performance';
COMMENT ON COLUMN cached_itineraries.cache_key IS 'SHA-256 hash of request parameters (from, to, stops, days, interests, budget)';
COMMENT ON COLUMN cached_itineraries.plan_data IS 'Full Groq AI response stored as JSONB';
COMMENT ON COLUMN cached_itineraries.usage_count IS 'Number of times this cached plan has been reused';
COMMENT ON COLUMN cached_itineraries.last_used_at IS 'Last time this cached plan was accessed';

-- Grant permissions (adjust based on your RLS policies)
ALTER TABLE cached_itineraries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access to cached_itineraries"
ON cached_itineraries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read cached itineraries
CREATE POLICY "Authenticated users can read cached_itineraries"
ON cached_itineraries
FOR SELECT
TO authenticated
USING (is_active = true);

-- Analytics view for cache performance
CREATE OR REPLACE VIEW cached_itineraries_stats AS
SELECT 
    COUNT(*) as total_cached_plans,
    COUNT(DISTINCT from_location) as unique_from_locations,
    COUNT(DISTINCT to_location) as unique_to_locations,
    SUM(usage_count) as total_cache_hits,
    AVG(usage_count) as avg_usage_per_plan,
    MAX(usage_count) as max_usage_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as plans_created_last_7_days,
    COUNT(*) FILTER (WHERE last_used_at > NOW() - INTERVAL '24 hours') as plans_used_last_24h
FROM cached_itineraries
WHERE is_active = true;

COMMENT ON VIEW cached_itineraries_stats IS 'Analytics view for monitoring cache performance and usage patterns';

