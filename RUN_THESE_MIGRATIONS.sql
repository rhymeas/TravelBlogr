-- ============================================================================
-- COMBINED MIGRATIONS: Run this in Supabase SQL Editor
-- ============================================================================
-- This file combines:
-- - Migration 011: Location Contributions
-- - Migration 012: Trip Contributions
-- ============================================================================

-- ============================================================================
-- MIGRATION 011: LOCATION CONTRIBUTIONS
-- ============================================================================

-- Create location_contributions table
CREATE TABLE IF NOT EXISTS location_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  contribution_type VARCHAR(50) NOT NULL,
  field_edited VARCHAR(100),
  change_snippet TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for location_contributions
CREATE INDEX IF NOT EXISTS idx_location_contributions_user_id ON location_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_contributions_location_id ON location_contributions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_contributions_type ON location_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_location_contributions_user_location ON location_contributions(user_id, location_id);
CREATE INDEX IF NOT EXISTS idx_location_contributions_created_at ON location_contributions(created_at DESC);

-- Add contribution_count to locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS contribution_count INTEGER DEFAULT 0;

-- Trigger function for location contributions
CREATE OR REPLACE FUNCTION update_location_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE locations SET contribution_count = contribution_count + 1 WHERE id = NEW.location_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE locations SET contribution_count = GREATEST(contribution_count - 1, 0) WHERE id = OLD.location_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for location contributions
DROP TRIGGER IF EXISTS location_contributions_count_trigger ON location_contributions;
CREATE TRIGGER location_contributions_count_trigger
  AFTER INSERT OR DELETE ON location_contributions
  FOR EACH ROW EXECUTE FUNCTION update_location_contribution_count();

-- View: Top contributors per location
CREATE OR REPLACE VIEW location_top_contributors AS
SELECT
  lc.location_id,
  lc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) as contribution_count,
  MAX(lc.created_at) as last_contribution_at,
  ARRAY_AGG(DISTINCT lc.contribution_type)::TEXT[] as contribution_types
FROM location_contributions lc
JOIN profiles p ON p.id = lc.user_id
GROUP BY lc.location_id, lc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY lc.location_id, contribution_count DESC;

-- Function: Get top contributors for a location
CREATE OR REPLACE FUNCTION get_location_top_contributors(
  p_location_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  contribution_count BIGINT,
  last_contribution_at TIMESTAMPTZ,
  contribution_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ltc.user_id,
    ltc.full_name,
    ltc.username,
    ltc.avatar_url,
    ltc.contribution_count,
    ltc.last_contribution_at,
    ltc.contribution_types
  FROM location_top_contributors ltc
  WHERE ltc.location_id = p_location_id
  ORDER BY ltc.contribution_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS for location_contributions
ALTER TABLE location_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view location contributions" ON location_contributions;
CREATE POLICY "Anyone can view location contributions"
  ON location_contributions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own location contributions" ON location_contributions;
CREATE POLICY "Users can insert their own location contributions"
  ON location_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own location contributions" ON location_contributions;
CREATE POLICY "Users can delete their own location contributions"
  ON location_contributions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 012: TRIP CONTRIBUTIONS
-- ============================================================================

-- Create trip_contributions table
CREATE TABLE IF NOT EXISTS trip_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  contribution_type VARCHAR(50) NOT NULL,
  field_edited VARCHAR(100),
  change_snippet TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for trip_contributions
CREATE INDEX IF NOT EXISTS idx_trip_contributions_user_id ON trip_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_contributions_trip_id ON trip_contributions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_contributions_type ON trip_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_trip_contributions_user_trip ON trip_contributions(user_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_contributions_created_at ON trip_contributions(created_at DESC);

-- Add contribution_count to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contribution_count INTEGER DEFAULT 0;

-- Trigger function for trip contributions
CREATE OR REPLACE FUNCTION update_trip_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trips SET contribution_count = contribution_count + 1 WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trips SET contribution_count = GREATEST(contribution_count - 1, 0) WHERE id = OLD.trip_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trip contributions
DROP TRIGGER IF EXISTS trip_contributions_count_trigger ON trip_contributions;
CREATE TRIGGER trip_contributions_count_trigger
  AFTER INSERT OR DELETE ON trip_contributions
  FOR EACH ROW EXECUTE FUNCTION update_trip_contribution_count();

-- View: Top contributors per trip
CREATE OR REPLACE VIEW trip_top_contributors AS
SELECT 
  tc.trip_id,
  tc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) as contribution_count,
  MAX(tc.created_at) as last_contribution_at,
  ARRAY_AGG(DISTINCT tc.contribution_type) as contribution_types
FROM trip_contributions tc
JOIN profiles p ON p.id = tc.user_id
GROUP BY tc.trip_id, tc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY tc.trip_id, contribution_count DESC;

-- Function: Get top contributors for a trip
CREATE OR REPLACE FUNCTION get_trip_top_contributors(
  p_trip_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  contribution_count BIGINT,
  last_contribution_at TIMESTAMPTZ,
  contribution_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ttc.user_id,
    ttc.full_name,
    ttc.username,
    ttc.avatar_url,
    ttc.contribution_count,
    ttc.last_contribution_at,
    ttc.contribution_types
  FROM trip_top_contributors ttc
  WHERE ttc.trip_id = p_trip_id
  ORDER BY ttc.contribution_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS for trip_contributions
ALTER TABLE trip_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trip contributions" ON trip_contributions;
CREATE POLICY "Anyone can view trip contributions"
  ON trip_contributions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own trip contributions" ON trip_contributions;
CREATE POLICY "Users can insert their own trip contributions"
  ON trip_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trip contributions" ON trip_contributions;
CREATE POLICY "Users can delete their own trip contributions"
  ON trip_contributions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify location_contributions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'location_contributions') THEN
    RAISE NOTICE '✅ location_contributions table created';
  ELSE
    RAISE EXCEPTION '❌ location_contributions table creation failed';
  END IF;

  -- Verify trip_contributions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trip_contributions') THEN
    RAISE NOTICE '✅ trip_contributions table created';
  ELSE
    RAISE EXCEPTION '❌ trip_contributions table creation failed';
  END IF;

  -- Verify triggers
  IF EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'location_contributions_count_trigger') THEN
    RAISE NOTICE '✅ location_contributions_count_trigger created';
  END IF;

  IF EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'trip_contributions_count_trigger') THEN
    RAISE NOTICE '✅ trip_contributions_count_trigger created';
  END IF;

  -- Verify views
  IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'location_top_contributors') THEN
    RAISE NOTICE '✅ location_top_contributors view created';
  END IF;

  IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'trip_top_contributors') THEN
    RAISE NOTICE '✅ trip_top_contributors view created';
  END IF;

  RAISE NOTICE '🎉 All migrations completed successfully!';
END $$;

