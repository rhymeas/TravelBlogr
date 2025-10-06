-- ============================================================================
-- ADD VISIT COUNT INCREMENT FUNCTION
-- ============================================================================
-- This function safely increments the visit count for a location
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_visit_count(location_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE locations
  SET 
    visit_count = visit_count + 1,
    last_visited = NOW()
  WHERE id = location_id;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION increment_visit_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_visit_count(UUID) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Visit count function created!';
    RAISE NOTICE '📊 Locations can now track visits automatically';
END $$;

