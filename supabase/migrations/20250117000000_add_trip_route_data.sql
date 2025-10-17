-- Migration: Add route and elevation data to sample_guide_days
-- Purpose: Store AI-fetched route data, coordinates, and elevation profiles
-- Created: 2025-01-17

-- Add columns to sample_guide_days for location coordinates and route data
ALTER TABLE sample_guide_days
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS route_to_next JSONB, -- Route geometry to next location
ADD COLUMN IF NOT EXISTS distance_to_next NUMERIC, -- Distance in meters
ADD COLUMN IF NOT EXISTS duration_to_next NUMERIC, -- Duration in seconds
ADD COLUMN IF NOT EXISTS elevation_data JSONB; -- Elevation profile data

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_sample_guide_days_coordinates 
ON sample_guide_days(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for route data queries
CREATE INDEX IF NOT EXISTS idx_sample_guide_days_route_data 
ON sample_guide_days(guide_id, day_number);

-- Add comments for documentation
COMMENT ON COLUMN sample_guide_days.latitude IS 'Latitude coordinate of the location for this day';
COMMENT ON COLUMN sample_guide_days.longitude IS 'Longitude coordinate of the location for this day';
COMMENT ON COLUMN sample_guide_days.location_name IS 'Name of the location (e.g., "Tokyo Tower", "Shibuya Crossing")';
COMMENT ON COLUMN sample_guide_days.route_to_next IS 'GeoJSON route geometry to the next day location';
COMMENT ON COLUMN sample_guide_days.distance_to_next IS 'Distance to next location in meters';
COMMENT ON COLUMN sample_guide_days.duration_to_next IS 'Travel duration to next location in seconds';
COMMENT ON COLUMN sample_guide_days.elevation_data IS 'Elevation profile: {elevations: number[], distances: number[], ascent: number, descent: number}';

-- Create function to calculate total trip distance
CREATE OR REPLACE FUNCTION calculate_trip_distance(p_guide_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total_distance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(distance_to_next), 0)
  INTO total_distance
  FROM sample_guide_days
  WHERE guide_id = p_guide_id
  AND distance_to_next IS NOT NULL;
  
  RETURN total_distance;
END;
$$;

-- Create function to calculate total trip duration
CREATE OR REPLACE FUNCTION calculate_trip_duration(p_guide_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total_duration NUMERIC;
BEGIN
  SELECT COALESCE(SUM(duration_to_next), 0)
  INTO total_duration
  FROM sample_guide_days
  WHERE guide_id = p_guide_id
  AND duration_to_next IS NOT NULL;
  
  RETURN total_duration;
END;
$$;

-- Create view for trip route summary
CREATE OR REPLACE VIEW trip_route_summary AS
SELECT 
  g.id as guide_id,
  g.title,
  g.destination,
  COUNT(d.id) as total_locations,
  calculate_trip_distance(g.id) as total_distance_meters,
  calculate_trip_duration(g.id) as total_duration_seconds,
  ROUND(calculate_trip_distance(g.id) / 1000, 2) as total_distance_km,
  ROUND(calculate_trip_duration(g.id) / 3600, 2) as total_duration_hours,
  SUM((d.elevation_data->>'ascent')::NUMERIC) as total_ascent,
  SUM((d.elevation_data->>'descent')::NUMERIC) as total_descent
FROM sample_travel_guides g
LEFT JOIN sample_guide_days d ON d.guide_id = g.id
GROUP BY g.id, g.title, g.destination;

COMMENT ON VIEW trip_route_summary IS 'Summary view of trip routes with distance, duration, and elevation statistics';

