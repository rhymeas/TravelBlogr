-- ============================================================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This script disables RLS or adds permissive policies for public access
-- ============================================================================

-- Option 1: Disable RLS completely (simplest for development)
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS enabled but add permissive SELECT policies
-- (Uncomment if you want to keep RLS for future security)

-- DROP POLICY IF EXISTS "Allow public read access" ON locations;
-- CREATE POLICY "Allow public read access" ON locations
--   FOR SELECT
--   USING (true);

-- DROP POLICY IF EXISTS "Allow public read access" ON restaurants;
-- CREATE POLICY "Allow public read access" ON restaurants
--   FOR SELECT
--   USING (true);

-- DROP POLICY IF EXISTS "Allow public read access" ON activities;
-- CREATE POLICY "Allow public read access" ON activities
--   FOR SELECT
--   USING (true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed!';
    RAISE NOTICE '📖 Public read access enabled for locations, restaurants, and activities';
    RAISE NOTICE '🔓 Frontend can now fetch location data';
END $$;

