-- ============================================================================
-- DELETE A SPECIFIC LOCATION (and all related data)
-- ============================================================================
-- Use this to delete a location that was created incorrectly
-- This will also delete all restaurants and activities for that location
-- ============================================================================

-- Delete Berlin (change the slug to delete a different location)
DELETE FROM locations WHERE slug = 'berlin';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Location deleted!';
    RAISE NOTICE '🗑️ All related restaurants and activities also deleted (CASCADE)';
END $$;

