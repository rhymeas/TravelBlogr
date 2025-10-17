-- ============================================================================
-- Migration 009: Add location_id to posts table
-- ============================================================================
-- Purpose: Link trip posts to community locations for better integration
-- This enables users to add existing locations to their trips
-- ============================================================================

-- Add location_id column to posts table (nullable for backward compatibility)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_posts_location_id ON posts(location_id);

-- Add comment for documentation
COMMENT ON COLUMN posts.location_id IS 'Optional reference to a location from the community database';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

