-- Migration 013: Add translation fields for multilingual support
-- Purpose: Store original language content and translations
-- Date: 2025-10-25

-- Add translation fields to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS original_description TEXT,
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10);

-- Add translation fields to location_activity_links table
ALTER TABLE location_activity_links
ADD COLUMN IF NOT EXISTS original_activity_name TEXT,
ADD COLUMN IF NOT EXISTS original_description TEXT,
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10);

-- Add indexes for language queries
CREATE INDEX IF NOT EXISTS idx_locations_original_language ON locations(original_language) WHERE original_language IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_links_original_language ON location_activity_links(original_language) WHERE original_language IS NOT NULL;

-- Comments
COMMENT ON COLUMN locations.original_description IS 'Original description before translation (if translated)';
COMMENT ON COLUMN locations.original_language IS 'ISO 639-1 language code of original content';
COMMENT ON COLUMN location_activity_links.original_activity_name IS 'Original activity name before translation';
COMMENT ON COLUMN location_activity_links.original_description IS 'Original description before translation';
COMMENT ON COLUMN location_activity_links.original_language IS 'ISO 639-1 language code of original content';

