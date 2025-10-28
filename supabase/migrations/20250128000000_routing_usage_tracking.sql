-- Routing API Usage Tracking
-- Track Valhalla/Stadia Maps API usage to stay within free tier limits

-- Create routing_usage table
CREATE TABLE IF NOT EXISTS routing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE, -- YYYY-MM format
  total_requests INTEGER DEFAULT 0,
  valhalla_requests INTEGER DEFAULT 0,
  stadia_requests INTEGER DEFAULT 0,
  osrm_requests INTEGER DEFAULT 0,
  ors_requests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on month for fast lookups
CREATE INDEX IF NOT EXISTS idx_routing_usage_month ON routing_usage(month);

-- Create function to increment routing usage
CREATE OR REPLACE FUNCTION increment_routing_usage(
  p_month TEXT,
  p_provider TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update routing usage
  INSERT INTO routing_usage (month, total_requests, valhalla_requests, stadia_requests, osrm_requests, ors_requests)
  VALUES (
    p_month,
    CASE WHEN p_provider IN ('valhalla', 'stadia', 'osrm', 'ors') THEN 1 ELSE 0 END,
    CASE WHEN p_provider = 'valhalla' THEN 1 ELSE 0 END,
    CASE WHEN p_provider = 'stadia' THEN 1 ELSE 0 END,
    CASE WHEN p_provider = 'osrm' THEN 1 ELSE 0 END,
    CASE WHEN p_provider = 'ors' THEN 1 ELSE 0 END
  )
  ON CONFLICT (month) DO UPDATE SET
    total_requests = routing_usage.total_requests + 1,
    valhalla_requests = routing_usage.valhalla_requests + CASE WHEN p_provider = 'valhalla' THEN 1 ELSE 0 END,
    stadia_requests = routing_usage.stadia_requests + CASE WHEN p_provider = 'stadia' THEN 1 ELSE 0 END,
    osrm_requests = routing_usage.osrm_requests + CASE WHEN p_provider = 'osrm' THEN 1 ELSE 0 END,
    ors_requests = routing_usage.ors_requests + CASE WHEN p_provider = 'ors' THEN 1 ELSE 0 END,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE routing_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read routing usage (for admin dashboard)
CREATE POLICY "Anyone can read routing usage"
  ON routing_usage
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update routing usage
CREATE POLICY "Service role can insert/update routing usage"
  ON routing_usage
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert current month with zero usage (if not exists)
INSERT INTO routing_usage (month, total_requests, valhalla_requests, stadia_requests, osrm_requests, ors_requests)
VALUES (
  TO_CHAR(NOW(), 'YYYY-MM'),
  0, 0, 0, 0, 0
)
ON CONFLICT (month) DO NOTHING;

