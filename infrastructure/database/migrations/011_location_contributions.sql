-- Migration 011: Location Contributions Tracking
-- Purpose: Track community contributions to location data for recognition
-- Date: 2025-10-22

-- ============================================================================
-- 1. Create location_contributions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  contribution_type VARCHAR(50) NOT NULL, -- 'create', 'edit', 'image_add', 'image_delete', 'image_featured'
  field_edited VARCHAR(100), -- 'description', 'activities', 'restaurants', etc.
  change_snippet TEXT, -- Human-readable summary: "Added 3 restaurants", "Updated description"
  old_value JSONB, -- Previous value (for rollback/history)
  new_value JSONB, -- New value (for rollback/history)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Create indexes for performance
-- ============================================================================

-- Index for finding contributions by user
CREATE INDEX IF NOT EXISTS idx_location_contributions_user_id 
  ON location_contributions(user_id);

-- Index for finding contributions by location
CREATE INDEX IF NOT EXISTS idx_location_contributions_location_id 
  ON location_contributions(location_id);

-- Index for finding contributions by type
CREATE INDEX IF NOT EXISTS idx_location_contributions_type 
  ON location_contributions(contribution_type);

-- Composite index for user + location queries
CREATE INDEX IF NOT EXISTS idx_location_contributions_user_location 
  ON location_contributions(user_id, location_id);

-- Index for recent contributions (ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_location_contributions_created_at 
  ON location_contributions(created_at DESC);

-- ============================================================================
-- 3. Add contribution_count to locations table
-- ============================================================================

-- Add column to track total contributions per location
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS contribution_count INTEGER DEFAULT 0;

-- ============================================================================
-- 4. Create trigger to maintain contribution_count
-- ============================================================================

-- Function to update contribution count
CREATE OR REPLACE FUNCTION update_location_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment contribution count
    UPDATE locations 
    SET contribution_count = contribution_count + 1 
    WHERE id = NEW.location_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement contribution count (prevent negative)
    UPDATE locations 
    SET contribution_count = GREATEST(contribution_count - 1, 0) 
    WHERE id = OLD.location_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS location_contributions_count_trigger ON location_contributions;
CREATE TRIGGER location_contributions_count_trigger
  AFTER INSERT OR DELETE ON location_contributions
  FOR EACH ROW EXECUTE FUNCTION update_location_contribution_count();

-- ============================================================================
-- 5. Create view for top contributors per location
-- ============================================================================

CREATE OR REPLACE VIEW location_top_contributors AS
SELECT 
  lc.location_id,
  lc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) as contribution_count,
  MAX(lc.created_at) as last_contribution_at,
  ARRAY_AGG(DISTINCT lc.contribution_type) as contribution_types
FROM location_contributions lc
JOIN profiles p ON p.id = lc.user_id
GROUP BY lc.location_id, lc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY lc.location_id, contribution_count DESC;

-- ============================================================================
-- 6. Create view for user contribution stats
-- ============================================================================

CREATE OR REPLACE VIEW user_contribution_stats AS
SELECT 
  lc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) as total_contributions,
  COUNT(DISTINCT lc.location_id) as locations_contributed,
  MAX(lc.created_at) as last_contribution_at,
  ARRAY_AGG(DISTINCT lc.contribution_type) as contribution_types
FROM location_contributions lc
JOIN profiles p ON p.id = lc.user_id
GROUP BY lc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY total_contributions DESC;

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE location_contributions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view contributions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'location_contributions' AND policyname = 'Anyone can view contributions'
  ) THEN
    CREATE POLICY "Anyone can view contributions"
      ON location_contributions
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Policy: Authenticated users can insert their own contributions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'location_contributions' AND policyname = 'Users can insert their own contributions'
  ) THEN
    CREATE POLICY "Users can insert their own contributions"
      ON location_contributions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can delete their own contributions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'location_contributions' AND policyname = 'Users can delete their own contributions'
  ) THEN
    CREATE POLICY "Users can delete their own contributions"
      ON location_contributions
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 8. Initialize contribution_count for existing locations
-- ============================================================================

-- Update contribution_count for all existing locations
UPDATE locations
SET contribution_count = (
  SELECT COUNT(*)
  FROM location_contributions
  WHERE location_contributions.location_id = locations.id
)
WHERE contribution_count = 0;

-- ============================================================================
-- 9. Create function to get top contributors for a location
-- ============================================================================

CREATE OR REPLACE FUNCTION get_location_top_contributors(
  p_location_id UUID,
  p_limit INTEGER DEFAULT 10
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
    lc.user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    COUNT(*) as contribution_count,
    MAX(lc.created_at) as last_contribution_at,
    ARRAY_AGG(DISTINCT lc.contribution_type)::TEXT[] as contribution_types
  FROM location_contributions lc
  JOIN profiles p ON p.id = lc.user_id
  WHERE lc.location_id = p_location_id
  GROUP BY lc.user_id, p.full_name, p.username, p.avatar_url
  ORDER BY contribution_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Grant permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON location_contributions TO authenticated;
GRANT INSERT ON location_contributions TO authenticated;
GRANT DELETE ON location_contributions TO authenticated;

-- Grant access to views
GRANT SELECT ON location_top_contributors TO authenticated;
GRANT SELECT ON user_contribution_stats TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'location_contributions') = 1,
    'location_contributions table not created';
  
  RAISE NOTICE '✅ Migration 011 complete: Location contributions tracking enabled';
  RAISE NOTICE '   - location_contributions table created';
  RAISE NOTICE '   - Indexes created for performance';
  RAISE NOTICE '   - contribution_count column added to locations';
  RAISE NOTICE '   - Triggers created for auto-maintenance';
  RAISE NOTICE '   - Views created for top contributors';
  RAISE NOTICE '   - RLS policies enabled';
  RAISE NOTICE '   - Helper functions created';
END $$;

