-- Create trip views/analytics table
-- Run this in Supabase SQL Editor

-- 1. Create trip_views table for tracking individual views
CREATE TABLE IF NOT EXISTS trip_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    
    -- Visitor information
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    city VARCHAR(255),
    
    -- Session tracking
    session_id VARCHAR(255),
    is_unique_visitor BOOLEAN DEFAULT true,
    
    -- Timestamps
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create trip_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS trip_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
    
    -- View counts
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    
    -- Engagement metrics
    avg_time_on_page INTEGER DEFAULT 0, -- in seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Social shares
    share_count INTEGER DEFAULT 0,
    
    -- Last updated
    last_view_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional stats
    stats_data JSONB DEFAULT '{}'::jsonb
);

-- 3. Enable Row Level Security
ALTER TABLE trip_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stats ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for trip_views
-- Anyone can insert views (for public tracking)
CREATE POLICY "Anyone can insert trip views" ON trip_views
  FOR INSERT
  WITH CHECK (true);

-- Only trip owners can view their analytics
CREATE POLICY "Owners can view trip analytics" ON trip_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_views.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- 5. Create RLS policies for trip_stats
-- Anyone can view stats (for public display)
CREATE POLICY "Anyone can view trip stats" ON trip_stats
  FOR SELECT
  USING (true);

-- Only system can update stats (via function)
CREATE POLICY "System can update trip stats" ON trip_stats
  FOR ALL
  USING (true);

-- 6. Create indexes for faster queries
CREATE INDEX idx_trip_views_trip_id ON trip_views(trip_id);
CREATE INDEX idx_trip_views_viewed_at ON trip_views(viewed_at);
CREATE INDEX idx_trip_views_session_id ON trip_views(session_id);
CREATE INDEX idx_trip_stats_trip_id ON trip_stats(trip_id);

-- 7. Create function to increment view count
CREATE OR REPLACE FUNCTION increment_trip_views(
  p_trip_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_unique BOOLEAN;
BEGIN
  -- Check if this is a unique visitor (same session_id in last 24 hours)
  v_is_unique := NOT EXISTS (
    SELECT 1 FROM trip_views
    WHERE trip_id = p_trip_id
    AND session_id = p_session_id
    AND viewed_at > NOW() - INTERVAL '24 hours'
  );

  -- Insert view record
  INSERT INTO trip_views (
    trip_id,
    ip_address,
    user_agent,
    referrer,
    session_id,
    is_unique_visitor
  ) VALUES (
    p_trip_id,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_session_id,
    v_is_unique
  );

  -- Update or create trip stats
  INSERT INTO trip_stats (trip_id, total_views, unique_views, last_view_at)
  VALUES (
    p_trip_id,
    1,
    CASE WHEN v_is_unique THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (trip_id) DO UPDATE SET
    total_views = trip_stats.total_views + 1,
    unique_views = trip_stats.unique_views + CASE WHEN v_is_unique THEN 1 ELSE 0 END,
    last_view_at = NOW(),
    updated_at = NOW();
END;
$$;

-- 8. Create function to get trip stats
CREATE OR REPLACE FUNCTION get_trip_stats(p_trip_id UUID)
RETURNS TABLE (
  total_views INTEGER,
  unique_views INTEGER,
  last_view_at TIMESTAMP WITH TIME ZONE,
  views_today INTEGER,
  views_this_week INTEGER,
  views_this_month INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.total_views,
    ts.unique_views,
    ts.last_view_at,
    (SELECT COUNT(*) FROM trip_views 
     WHERE trip_id = p_trip_id 
     AND viewed_at > CURRENT_DATE)::INTEGER as views_today,
    (SELECT COUNT(*) FROM trip_views 
     WHERE trip_id = p_trip_id 
     AND viewed_at > CURRENT_DATE - INTERVAL '7 days')::INTEGER as views_this_week,
    (SELECT COUNT(*) FROM trip_views 
     WHERE trip_id = p_trip_id 
     AND viewed_at > CURRENT_DATE - INTERVAL '30 days')::INTEGER as views_this_month
  FROM trip_stats ts
  WHERE ts.trip_id = p_trip_id;
END;
$$;

-- Done! Now you can track trip views and analytics.

