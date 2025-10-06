-- ============================================================================
-- Add Enhanced Location Fields
-- Run this in Supabase SQL Editor to add new fields for enhanced data
-- ============================================================================

-- ============================================================================
-- PART 1: Add Travel Guide Fields
-- ============================================================================

-- Add WikiVoyage travel guide URL
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS travel_guide_url TEXT;

-- Add best time to visit
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;

-- Add travel tips (array of strings)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS travel_tips TEXT[];

-- Add practical info (JSONB for flexibility)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS practical_info JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- PART 2: Add GeoNames Enhanced Data
-- ============================================================================

-- Add population
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS population INTEGER;

-- Add timezone
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add elevation (in meters)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS elevation INTEGER;

-- ============================================================================
-- PART 3: Add Data Source Tracking
-- ============================================================================

-- Track which APIs provided data
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}'::jsonb;

-- Track last data refresh
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS last_data_refresh TIMESTAMPTZ;

-- ============================================================================
-- PART 4: Add Indexes for Performance
-- ============================================================================

-- Index on country for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);

-- Index on is_published for faster queries
CREATE INDEX IF NOT EXISTS idx_locations_published ON locations(is_published) WHERE is_published = true;

-- Index on timezone for time-based queries
CREATE INDEX IF NOT EXISTS idx_locations_timezone ON locations(timezone);

-- ============================================================================
-- PART 5: Update Existing Locations with Default Values
-- ============================================================================

-- Set default practical_info structure
UPDATE locations 
SET practical_info = jsonb_build_object(
  'currency', NULL,
  'language', NULL,
  'emergency', NULL,
  'voltage', NULL,
  'visa_required', NULL
)
WHERE practical_info = '{}'::jsonb OR practical_info IS NULL;

-- Set default data_sources structure
UPDATE locations 
SET data_sources = jsonb_build_object(
  'geocoding', 'nominatim',
  'restaurants', 'overpass',
  'activities', 'overpass',
  'description', 'wikipedia',
  'images', 'wikimedia',
  'weather', 'open-meteo'
)
WHERE data_sources = '{}'::jsonb OR data_sources IS NULL;

-- ============================================================================
-- PART 6: Show Updated Schema
-- ============================================================================

-- Show all columns in locations table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 7: Show Sample Data
-- ============================================================================

-- Show enhanced data for existing locations
SELECT 
  name,
  country,
  population,
  timezone,
  best_time_to_visit,
  travel_guide_url,
  array_length(travel_tips, 1) as tips_count,
  data_sources,
  last_data_refresh
FROM locations
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

