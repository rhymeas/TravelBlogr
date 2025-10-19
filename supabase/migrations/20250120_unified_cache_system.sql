-- Unified Cache System
-- Replaces external_api_cache with a more flexible cache table

-- Drop old table if exists (migrate data first if needed)
-- DROP TABLE IF EXISTS external_api_cache;

-- Create unified cache table
CREATE TABLE IF NOT EXISTS cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE, -- Unique identifier for cached data
  cache_type TEXT NOT NULL, -- 'pois', 'locations', 'images', 'groq_validation', etc.
  data JSONB NOT NULL, -- Cached data
  expires_at TIMESTAMPTZ NOT NULL, -- Expiration timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_cache_key 
  ON cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_cache_type 
  ON cache(cache_type);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at 
  ON cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_cache_type_key 
  ON cache(cache_type, cache_key);

-- Function to get cache entry
CREATE OR REPLACE FUNCTION get_cache(
  p_cache_key TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT data INTO v_data
  FROM cache
  WHERE cache_key = p_cache_key
    AND expires_at > NOW();
  
  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set cache entry
CREATE OR REPLACE FUNCTION set_cache(
  p_cache_key TEXT,
  p_cache_type TEXT,
  p_data JSONB,
  p_ttl_seconds INTEGER DEFAULT 604800 -- Default: 7 days
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cache (cache_key, cache_type, data, expires_at)
  VALUES (
    p_cache_key,
    p_cache_type,
    p_data,
    NOW() + (p_ttl_seconds || ' seconds')::INTERVAL
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
  cache_type TEXT,
  item_count BIGINT,
  total_size_bytes BIGINT,
  oldest_entry TIMESTAMPTZ,
  newest_entry TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.cache_type,
    COUNT(*)::BIGINT as item_count,
    SUM(LENGTH(c.data::TEXT))::BIGINT as total_size_bytes,
    MIN(c.created_at) as oldest_entry,
    MAX(c.created_at) as newest_entry
  FROM cache c
  WHERE c.expires_at > NOW()
  GROUP BY c.cache_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all cache
CREATE POLICY "Service role can manage cache" ON cache
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to read cache (optional)
CREATE POLICY "Authenticated users can read cache" ON cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cache_updated_at
  BEFORE UPDATE ON cache
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_updated_at();

-- Comments for documentation
COMMENT ON TABLE cache IS 'Unified cache system for all external API responses and computed data';
COMMENT ON COLUMN cache.cache_key IS 'Unique identifier for cached data (e.g., "pois_paris_city-break_medium")';
COMMENT ON COLUMN cache.cache_type IS 'Type of cached data (pois, locations, images, groq_validation, etc.)';
COMMENT ON COLUMN cache.data IS 'Cached data stored as JSONB';
COMMENT ON COLUMN cache.expires_at IS 'Expiration timestamp - entries are deleted after this time';

