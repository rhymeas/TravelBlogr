-- Create route_cache table for storing routing API results
-- This reduces API calls by caching routes for 30 days

CREATE TABLE IF NOT EXISTS route_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  geometry JSONB NOT NULL,
  distance NUMERIC NOT NULL,
  duration NUMERIC NOT NULL,
  elevation_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_route_cache_key ON route_cache(cache_key);

-- Index for cleaning old cache entries
CREATE INDEX IF NOT EXISTS idx_route_cache_created_at ON route_cache(created_at);

-- Enable Row Level Security
ALTER TABLE route_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached routes (public data)
DROP POLICY IF EXISTS "Anyone can read route cache" ON route_cache;
CREATE POLICY "Anyone can read route cache"
  ON route_cache
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update cache
DROP POLICY IF EXISTS "Service role can manage route cache" ON route_cache;
CREATE POLICY "Service role can manage route cache"
  ON route_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean old cache entries (older than 30 days)
CREATE OR REPLACE FUNCTION clean_old_route_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM route_cache
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Comment on table
COMMENT ON TABLE route_cache IS 'Caches routing API results to minimize external API calls. Routes expire after 30 days.';
COMMENT ON COLUMN route_cache.cache_key IS 'Unique key: profile:lng1,lat1|lng2,lat2|...';
COMMENT ON COLUMN route_cache.geometry IS 'GeoJSON LineString geometry of the route';
COMMENT ON COLUMN route_cache.distance IS 'Route distance in meters';
COMMENT ON COLUMN route_cache.duration IS 'Route duration in seconds';

