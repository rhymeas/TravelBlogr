-- Performance Metrics Table
-- Stores all performance analytics data

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric type
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'page_render',
    'cache_hit',
    'cache_miss',
    'db_query',
    'api_call',
    'error'
  )),
  
  -- Page/API path
  page_path TEXT,
  
  -- Performance data
  duration_ms INTEGER,
  
  -- Cache data
  cache_key TEXT,
  
  -- Database query data
  query_type TEXT,
  
  -- Error data
  error_message TEXT,
  error_stack TEXT,
  
  -- Request metadata
  user_agent TEXT,
  ip_address TEXT,
  
  -- Additional metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_path ON performance_metrics(page_path) WHERE page_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_performance_metrics_cache_key ON performance_metrics(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_performance_metrics_error ON performance_metrics(metric_type) WHERE metric_type = 'error';

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_dashboard ON performance_metrics(metric_type, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read performance metrics
CREATE POLICY "Admins can read performance metrics"
  ON performance_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: System can insert metrics (no auth required for server-side tracking)
CREATE POLICY "System can insert performance metrics"
  ON performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
  time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  metric_type TEXT,
  total_count BIGINT,
  avg_duration_ms NUMERIC,
  p50_duration_ms NUMERIC,
  p95_duration_ms NUMERIC,
  p99_duration_ms NUMERIC,
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.metric_type,
    COUNT(*) as total_count,
    ROUND(AVG(pm.duration_ms)::numeric, 2) as avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pm.duration_ms) as p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.duration_ms) as p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY pm.duration_ms) as p99_duration_ms,
    COUNT(*) FILTER (WHERE pm.metric_type = 'error') as error_count
  FROM performance_metrics pm
  WHERE pm.created_at >= NOW() - (time_range_hours || ' hours')::INTERVAL
  GROUP BY pm.metric_type
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cache hit rate
CREATE OR REPLACE FUNCTION get_cache_hit_rate(
  time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  cache_key_prefix TEXT,
  total_requests BIGINT,
  cache_hits BIGINT,
  cache_misses BIGINT,
  hit_rate_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SPLIT_PART(pm.cache_key, ':', 1) as cache_key_prefix,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE pm.metric_type = 'cache_hit') as cache_hits,
    COUNT(*) FILTER (WHERE pm.metric_type = 'cache_miss') as cache_misses,
    ROUND(
      (COUNT(*) FILTER (WHERE pm.metric_type = 'cache_hit')::numeric / 
       NULLIF(COUNT(*), 0)::numeric * 100),
      2
    ) as hit_rate_percent
  FROM performance_metrics pm
  WHERE pm.created_at >= NOW() - (time_range_hours || ' hours')::INTERVAL
    AND pm.metric_type IN ('cache_hit', 'cache_miss')
    AND pm.cache_key IS NOT NULL
  GROUP BY SPLIT_PART(pm.cache_key, ':', 1)
  ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slowest pages
CREATE OR REPLACE FUNCTION get_slowest_pages(
  time_range_hours INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  page_path TEXT,
  request_count BIGINT,
  avg_duration_ms NUMERIC,
  p95_duration_ms NUMERIC,
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.page_path,
    COUNT(*) as request_count,
    ROUND(AVG(pm.duration_ms)::numeric, 2) as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.duration_ms) as p95_duration_ms,
    COUNT(*) FILTER (WHERE pm.metric_type = 'error') as error_count
  FROM performance_metrics pm
  WHERE pm.created_at >= NOW() - (time_range_hours || ' hours')::INTERVAL
    AND pm.page_path IS NOT NULL
    AND pm.metric_type = 'page_render'
  GROUP BY pm.page_path
  ORDER BY avg_duration_ms DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent errors
CREATE OR REPLACE FUNCTION get_recent_errors(
  time_range_hours INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  page_path TEXT,
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.page_path,
    pm.error_message,
    pm.error_stack,
    pm.metadata,
    pm.created_at
  FROM performance_metrics pm
  WHERE pm.created_at >= NOW() - (time_range_hours || ' hours')::INTERVAL
    AND pm.metric_type = 'error'
  ORDER BY pm.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-cleanup old metrics (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM performance_metrics
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up old performance metrics';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run daily at 3 AM)
-- Note: Requires pg_cron extension
-- SELECT cron.schedule('cleanup-performance-metrics', '0 3 * * *', 'SELECT cleanup_old_performance_metrics()');

COMMENT ON TABLE performance_metrics IS 'Stores performance analytics and error tracking data';
COMMENT ON FUNCTION get_performance_summary IS 'Get performance summary with percentiles for a time range';
COMMENT ON FUNCTION get_cache_hit_rate IS 'Get cache hit rate by cache key prefix';
COMMENT ON FUNCTION get_slowest_pages IS 'Get slowest pages by average render time';
COMMENT ON FUNCTION get_recent_errors IS 'Get recent errors with full stack traces';

