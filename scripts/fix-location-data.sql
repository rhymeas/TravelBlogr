-- ============================================================================
-- Fix Location Data Script - Enhanced Version
-- Run this in Supabase SQL Editor to fix and enhance existing locations
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Country Names (Critical for Breadcrumbs)
-- ============================================================================

-- Update country names for existing locations
UPDATE locations SET country = 'Japan' WHERE name = 'Tokyo' AND (country = 'Unknown' OR country IS NULL);
UPDATE locations SET country = 'France' WHERE name = 'Paris' AND (country = 'Unknown' OR country IS NULL);
UPDATE locations SET country = 'United States' WHERE name = 'new york' AND (country = 'Unknown' OR country IS NULL);
UPDATE locations SET country = 'Spain' WHERE name = 'Barcelona' AND (country = 'Unknown' OR country = 'España' OR country IS NULL);
UPDATE locations SET country = 'United Kingdom' WHERE name = 'London' AND (country = 'Unknown' OR country IS NULL);
UPDATE locations SET country = 'Canada' WHERE name = 'vancouver' AND (country = 'Unknown' OR country IS NULL);
UPDATE locations SET country = 'Italy' WHERE name = 'Rome' AND (country = 'Unknown' OR country = 'Italia' OR country IS NULL);
UPDATE locations SET country = 'Netherlands' WHERE name = 'Amsterdam' AND (country = 'Unknown' OR country = 'Nederland' OR country IS NULL);

-- ============================================================================
-- PART 2: Standardize Location Names (Proper Capitalization)
-- ============================================================================

UPDATE locations SET name = 'New York' WHERE slug = 'new-york';
UPDATE locations SET name = 'Vancouver' WHERE slug = 'vancouver';
UPDATE locations SET name = 'Tokyo' WHERE slug = 'tokyo' AND name != 'Tokyo';
UPDATE locations SET name = 'Paris' WHERE slug = 'paris' AND name != 'Paris';
UPDATE locations SET name = 'Barcelona' WHERE slug = 'barcelona' AND name != 'Barcelona';
UPDATE locations SET name = 'London' WHERE slug = 'london' AND name != 'London';
UPDATE locations SET name = 'Rome' WHERE slug = 'rome' AND name != 'Rome';
UPDATE locations SET name = 'Amsterdam' WHERE slug = 'amsterdam' AND name != 'Amsterdam';

-- ============================================================================
-- PART 3: Fix Image References (SVG Placeholders)
-- ============================================================================

-- Update featured images to use SVG placeholders
UPDATE locations
SET featured_image = '/placeholder-location.svg'
WHERE featured_image IS NULL
   OR featured_image = '/placeholder-location.jpg'
   OR featured_image = '';

-- Update gallery images to use SVG placeholders (if empty)
UPDATE locations
SET gallery_images = ARRAY['/placeholder-location.svg']::text[]
WHERE gallery_images IS NULL
   OR gallery_images = ARRAY[]::text[]
   OR array_length(gallery_images, 1) IS NULL;

-- ============================================================================
-- PART 4: Ensure Published Status
-- ============================================================================

-- Publish locations that have complete data
UPDATE locations
SET is_published = true
WHERE is_published = false
  AND description IS NOT NULL
  AND description != ''
  AND featured_image IS NOT NULL
  AND country IS NOT NULL
  AND country != 'Unknown';

-- ============================================================================
-- PART 5: Show Results
-- ============================================================================

-- Show all locations with their current status
SELECT
  id,
  name,
  slug,
  country,
  region,
  featured_image,
  CASE
    WHEN gallery_images IS NOT NULL THEN array_length(gallery_images, 1)
    ELSE 0
  END as gallery_count,
  is_published,
  is_featured,
  created_at,
  updated_at
FROM locations
ORDER BY created_at DESC;

-- ============================================================================
-- PART 6: Statistics Summary
-- ============================================================================

-- Show summary statistics
SELECT
  COUNT(*) as total_locations,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_count,
  COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_count,
  COUNT(CASE WHEN country = 'Unknown' OR country IS NULL THEN 1 END) as missing_country,
  COUNT(CASE WHEN featured_image IS NULL OR featured_image = '' THEN 1 END) as missing_image,
  COUNT(CASE WHEN description IS NULL OR description = '' THEN 1 END) as missing_description
FROM locations;

-- ============================================================================
-- PART 7: Show Locations Needing Attention
-- ============================================================================

-- Show locations that still need fixes
SELECT
  name,
  slug,
  country,
  CASE
    WHEN country = 'Unknown' OR country IS NULL THEN '❌ Fix country'
    WHEN featured_image IS NULL OR featured_image = '' THEN '❌ Add image'
    WHEN description IS NULL OR description = '' THEN '❌ Add description'
    ELSE '✅ OK'
  END as status
FROM locations
WHERE country = 'Unknown'
   OR country IS NULL
   OR featured_image IS NULL
   OR featured_image = ''
   OR description IS NULL
   OR description = ''
ORDER BY name;

-- ============================================================================
-- OPTIONAL: Re-fetch Data for Locations
-- ============================================================================

-- If you want to re-fetch data for specific locations, use the auto-fill API:
-- POST http://localhost:3000/api/admin/auto-fill
-- Body: { "locationName": "Tokyo" }

-- This will:
-- ✅ Fetch from OpenTripMap (tourist attractions)
-- ✅ Fetch from WikiVoyage (travel guides)
-- ✅ Fetch from Wikipedia (descriptions + images)
-- ✅ Fetch from Wikimedia Commons (images)
-- ✅ Fetch from OpenStreetMap (restaurants + activities)
-- ✅ Fetch from Open-Meteo (weather)
-- ✅ Generate activity tags automatically
-- ✅ Cache for 24 hours

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

