-- API Usage Tracking Table
-- Tracks API calls for rate limiting and cost monitoring

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL, -- 'opentripmap', 'groq', 'overpass', etc.
  endpoint TEXT, -- Optional: specific endpoint called
  count INTEGER DEFAULT 1,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: track per user
  metadata JSONB, -- Additional context (e.g., location, query params)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_api_name 
  ON api_usage(api_name);

CREATE INDEX IF NOT EXISTS idx_api_usage_created_at 
  ON api_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_api_name_created 
  ON api_usage(api_name, created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id 
  ON api_usage(user_id) WHERE user_id IS NOT NULL;

-- Function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_api_name TEXT,
  p_endpoint TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage (api_name, endpoint, user_id, metadata, count)
  VALUES (p_api_name, p_endpoint, p_user_id, p_metadata, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API usage count for rate limiting
CREATE OR REPLACE FUNCTION get_api_usage_count(
  p_api_name TEXT,
  p_since_timestamp TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(count), 0)
  INTO v_count
  FROM api_usage
  WHERE api_name = p_api_name
    AND created_at >= p_since_timestamp;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old API usage records (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM api_usage
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies (optional - depends on security requirements)
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all records
CREATE POLICY "Service role can manage api_usage" ON api_usage
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow users to view their own usage
CREATE POLICY "Users can view own api_usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE api_usage IS 'Tracks API calls for rate limiting and cost monitoring';
COMMENT ON COLUMN api_usage.api_name IS 'Name of the API service (opentripmap, groq, overpass, etc.)';
COMMENT ON COLUMN api_usage.count IS 'Number of API calls (usually 1, but can batch increment)';
COMMENT ON COLUMN api_usage.metadata IS 'Additional context like location, query params, response time';

