-- Migration 012: Trip Contributions Tracking
-- Enables community editing for trips with contribution tracking

-- ============================================================================
-- TRIP CONTRIBUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trip_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  contribution_type VARCHAR(50) NOT NULL, -- 'create', 'edit', 'collaborate', 'share'
  field_edited VARCHAR(100), -- 'title', 'description', 'highlights', 'itinerary', etc.
  change_snippet TEXT, -- Human-readable summary: "Updated title", "Added 3 highlights"
  old_value JSONB, -- Previous value (for rollback/history)
  new_value JSONB, -- New value (for rollback/history)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trip_contributions_user_id 
  ON trip_contributions(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_contributions_trip_id 
  ON trip_contributions(trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_contributions_type 
  ON trip_contributions(contribution_type);

CREATE INDEX IF NOT EXISTS idx_trip_contributions_user_trip 
  ON trip_contributions(user_id, trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_contributions_created_at 
  ON trip_contributions(created_at DESC);

-- ============================================================================
-- ADD CONTRIBUTION COUNT TO TRIPS TABLE
-- ============================================================================

ALTER TABLE trips 
  ADD COLUMN IF NOT EXISTS contribution_count INTEGER DEFAULT 0;

-- ============================================================================
-- TRIGGERS FOR AUTO-COUNTING
-- ============================================================================

-- Function to update trip contribution count
CREATE OR REPLACE FUNCTION update_trip_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trips 
    SET contribution_count = contribution_count + 1 
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trips 
    SET contribution_count = GREATEST(contribution_count - 1, 0) 
    WHERE id = OLD.trip_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain contribution count
DROP TRIGGER IF EXISTS trip_contributions_count_trigger ON trip_contributions;
CREATE TRIGGER trip_contributions_count_trigger
  AFTER INSERT OR DELETE ON trip_contributions
  FOR EACH ROW EXECUTE FUNCTION update_trip_contribution_count();

-- ============================================================================
-- VIEWS FOR TOP CONTRIBUTORS
-- ============================================================================

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

-- View: User contribution statistics for trips
CREATE OR REPLACE VIEW user_trip_contribution_stats AS
SELECT 
  tc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) as total_contributions,
  COUNT(DISTINCT tc.trip_id) as trips_contributed_to,
  MAX(tc.created_at) as last_contribution_at,
  ARRAY_AGG(DISTINCT tc.contribution_type) as contribution_types
FROM trip_contributions tc
JOIN profiles p ON p.id = tc.user_id
GROUP BY tc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY total_contributions DESC;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get top contributors for a trip
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE trip_contributions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view contributions
CREATE POLICY "Anyone can view trip contributions"
  ON trip_contributions FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own contributions
CREATE POLICY "Users can insert their own trip contributions"
  ON trip_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own contributions
CREATE POLICY "Users can delete their own trip contributions"
  ON trip_contributions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trip_contributions IS 'Tracks all community contributions to trips for recognition and history';
COMMENT ON COLUMN trip_contributions.contribution_type IS 'Type of contribution: create, edit, collaborate, share';
COMMENT ON COLUMN trip_contributions.field_edited IS 'Which field was edited: title, description, highlights, etc.';
COMMENT ON COLUMN trip_contributions.change_snippet IS 'Human-readable summary for activity feed';
COMMENT ON COLUMN trip_contributions.old_value IS 'Previous value for rollback/history';
COMMENT ON COLUMN trip_contributions.new_value IS 'New value for rollback/history';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'trip_contributions'
  ) THEN
    RAISE NOTICE '✅ trip_contributions table created successfully';
  ELSE
    RAISE EXCEPTION '❌ trip_contributions table creation failed';
  END IF;
END $$;

-- Verify triggers exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.triggers 
    WHERE trigger_name = 'trip_contributions_count_trigger'
  ) THEN
    RAISE NOTICE '✅ trip_contributions_count_trigger created successfully';
  ELSE
    RAISE EXCEPTION '❌ trip_contributions_count_trigger creation failed';
  END IF;
END $$;

-- Verify views exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_name = 'trip_top_contributors'
  ) THEN
    RAISE NOTICE '✅ trip_top_contributors view created successfully';
  ELSE
    RAISE EXCEPTION '❌ trip_top_contributors view creation failed';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 012 complete: Trip contributions tracking enabled';
  RAISE NOTICE '📊 Tables: trip_contributions';
  RAISE NOTICE '🔍 Indexes: 5 indexes created';
  RAISE NOTICE '⚡ Triggers: trip_contributions_count_trigger';
  RAISE NOTICE '📈 Views: trip_top_contributors, user_trip_contribution_stats';
  RAISE NOTICE '🔒 RLS: Enabled with 3 policies';
  RAISE NOTICE '🎉 Ready for community trip editing!';
END $$;

