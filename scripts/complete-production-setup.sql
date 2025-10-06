-- ============================================================================
-- COMPLETE PRODUCTION SETUP - All Features Enabled
-- Run this in Supabase SQL Editor to enable OpenTripMap, WikiVoyage, GeoNames
-- ============================================================================

-- ============================================================================
-- PART 1: Add Enhanced Location Fields
-- ============================================================================

-- WikiVoyage fields
ALTER TABLE locations ADD COLUMN IF NOT EXISTS travel_guide_url TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS travel_tips TEXT[];

-- GeoNames fields
ALTER TABLE locations ADD COLUMN IF NOT EXISTS population INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS elevation INTEGER;

-- Practical info (currency, language, emergency, etc.)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS practical_info JSONB DEFAULT '{}'::jsonb;

-- Data source tracking
ALTER TABLE locations ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}'::jsonb;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_data_refresh TIMESTAMPTZ;

-- ============================================================================
-- PART 2: Create Attractions Table (OpenTripMap)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2),
  image_url TEXT,
  website TEXT,
  opening_hours JSONB,
  price_info TEXT,
  source TEXT DEFAULT 'opentripmap',
  external_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attractions_location ON attractions(location_id);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);
CREATE INDEX IF NOT EXISTS idx_attractions_rating ON attractions(rating DESC);

-- ============================================================================
-- PART 3: Add Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
CREATE INDEX IF NOT EXISTS idx_locations_published ON locations(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_locations_timezone ON locations(timezone);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);

-- ============================================================================
-- PART 4: Set Default Values for Existing Locations
-- ============================================================================

-- Set default practical_info
UPDATE locations 
SET practical_info = jsonb_build_object(
  'currency', NULL,
  'language', NULL,
  'emergency', '112',
  'voltage', NULL,
  'visa_required', NULL
)
WHERE practical_info = '{}'::jsonb OR practical_info IS NULL;

-- Set default data_sources
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
-- PART 5: Create View for Complete Location Data
-- ============================================================================

CREATE OR REPLACE VIEW location_complete AS
SELECT 
  l.*,
  COUNT(DISTINCT r.id) as restaurant_count,
  COUNT(DISTINCT a.id) as activity_count,
  COUNT(DISTINCT at.id) as attraction_count,
  COALESCE(AVG(r.rating), 0) as avg_restaurant_rating,
  COALESCE(AVG(a.rating), 0) as avg_activity_rating
FROM locations l
LEFT JOIN restaurants r ON l.id = r.location_id
LEFT JOIN activities a ON l.id = a.location_id
LEFT JOIN attractions at ON l.id = at.location_id
GROUP BY l.id;

-- ============================================================================
-- PART 6: Show Results
-- ============================================================================

-- Show new columns added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
  AND column_name IN (
    'travel_guide_url', 
    'best_time_to_visit', 
    'travel_tips',
    'population',
    'timezone',
    'elevation',
    'practical_info',
    'data_sources',
    'last_data_refresh'
  )
ORDER BY column_name;

-- Show attractions table structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'attractions'
ORDER BY ordinal_position;

-- Show all locations with enhanced data
SELECT 
  name,
  country,
  population,
  timezone,
  travel_guide_url,
  array_length(travel_tips, 1) as tips_count,
  is_published
FROM locations
ORDER BY created_at DESC;

-- Show statistics
SELECT 
  COUNT(*) as total_locations,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published,
  COUNT(CASE WHEN travel_guide_url IS NOT NULL THEN 1 END) as has_travel_guide,
  COUNT(CASE WHEN population IS NOT NULL THEN 1 END) as has_population,
  COUNT(CASE WHEN timezone IS NOT NULL THEN 1 END) as has_timezone
FROM locations;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ PRODUCTION SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was added:';
  RAISE NOTICE '✅ WikiVoyage fields (travel_guide_url, travel_tips, best_time_to_visit)';
  RAISE NOTICE '✅ GeoNames fields (population, timezone, elevation)';
  RAISE NOTICE '✅ OpenTripMap attractions table';
  RAISE NOTICE '✅ Practical info (currency, language, emergency)';
  RAISE NOTICE '✅ Data source tracking';
  RAISE NOTICE '✅ Performance indexes';
  RAISE NOTICE '✅ Complete location view';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test auto-fill: http://localhost:3000/admin/auto-fill';
  RAISE NOTICE '2. Create new location (e.g., "Santorini")';
  RAISE NOTICE '3. Check logs for enhanced data sources';
  RAISE NOTICE '4. Optional: Add GEONAMES_USERNAME to .env.local';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

