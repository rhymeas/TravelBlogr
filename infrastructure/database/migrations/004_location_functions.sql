-- Migration 004: Location Helper Functions
-- Created: 2025-01-15
-- Description: Add helper functions for location operations

-- Function to increment location visit count
CREATE OR REPLACE FUNCTION increment_location_visits(location_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE locations
  SET visit_count = COALESCE(visit_count, 0) + 1
  WHERE id = location_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_location_visits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_location_visits(UUID) TO anon;

-- Function to get location statistics
CREATE OR REPLACE FUNCTION get_location_stats(location_id UUID)
RETURNS TABLE (
  restaurant_count BIGINT,
  activity_count BIGINT,
  post_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM location_restaurants WHERE location_id = $1 AND is_verified = true),
    (SELECT COUNT(*) FROM location_activities WHERE location_id = $1 AND is_verified = true),
    (SELECT COUNT(*) FROM location_posts WHERE location_id = $1 AND status = 'published');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_location_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_stats(UUID) TO anon;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_restaurants_location_verified 
  ON location_restaurants(location_id, is_verified);

CREATE INDEX IF NOT EXISTS idx_location_activities_location_verified 
  ON location_activities(location_id, is_verified);

CREATE INDEX IF NOT EXISTS idx_location_posts_location_status 
  ON location_posts(location_id, status);

-- Add updated_at trigger for locations table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON FUNCTION increment_location_visits IS 'Increments the visit count for a location';
COMMENT ON FUNCTION get_location_stats IS 'Returns statistics for a location (restaurants, activities, posts)';

