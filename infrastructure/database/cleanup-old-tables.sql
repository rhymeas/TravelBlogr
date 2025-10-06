-- ============================================================================
-- CLEANUP OLD TABLES - Remove unused/unrestricted tables
-- ============================================================================
-- Run this in Supabase SQL Editor to clean up old tables
-- ⚠️ WARNING: This will delete these tables and all their data!
-- ============================================================================

-- Drop old/unused tables
DROP TABLE IF EXISTS trip_photo_likes CASCADE;
DROP TABLE IF EXISTS trip_photos CASCADE;
DROP TABLE IF EXISTS tour_settings CASCADE;
DROP TABLE IF EXISTS scenic_content CASCADE;
DROP TABLE IF EXISTS location_pings CASCADE;
DROP TABLE IF EXISTS location_images CASCADE;
DROP TABLE IF EXISTS hero_images CASCADE;
DROP TABLE IF EXISTS creators CASCADE;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Cleanup complete!';
    RAISE NOTICE '🗑️ Removed old/unused tables';
    RAISE NOTICE '📊 Keeping: locations, restaurants, activities';
END $$;

