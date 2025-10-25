-- ============================================================================
-- Migration: Migrate from activities table to location_activity_links
-- Date: 2025-01-25
-- Description: Creates new location_activity_links table and migrates existing data
-- ============================================================================

-- 1) Create location_activity_links table (from 012_things_to_do_phase1.sql)
CREATE TABLE IF NOT EXISTS location_activity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  cost_level TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  link_url TEXT,
  source TEXT, -- seed | db | wikivoyage | wikipedia | otm | groq | community
  type TEXT,   -- official | guide | booking | affiliate | community
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, activity_name, link_url)
);

CREATE INDEX IF NOT EXISTS idx_activity_links_location ON location_activity_links(location_id);
CREATE INDEX IF NOT EXISTS idx_activity_links_updated ON location_activity_links(updated_at DESC);

-- 2) Create activity_media table (from 012_things_to_do_phase1.sql)
CREATE TABLE IF NOT EXISTS activity_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  activity_link_id UUID REFERENCES location_activity_links(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  attribution JSONB, -- { source: { type, name, url, user_id, user_display, consent } }
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_media_location ON activity_media(location_id);
CREATE INDEX IF NOT EXISTS idx_activity_media_link ON activity_media(activity_link_id);

-- 3) Add translation fields (from 013_translation_fields.sql)
ALTER TABLE location_activity_links
ADD COLUMN IF NOT EXISTS original_activity_name TEXT,
ADD COLUMN IF NOT EXISTS original_description TEXT,
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_activity_links_original_language 
ON location_activity_links(original_language) 
WHERE original_language IS NOT NULL;

-- 4) RLS Policies
ALTER TABLE location_activity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_media ENABLE ROW LEVEL SECURITY;

-- Anyone can read activity links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='location_activity_links' 
    AND policyname='Anyone can view activity links'
  ) THEN
    CREATE POLICY "Anyone can view activity links" 
    ON location_activity_links 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Anyone can read activity media
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='activity_media' 
    AND policyname='Anyone can view activity media'
  ) THEN
    CREATE POLICY "Anyone can view activity media" 
    ON activity_media 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Authenticated users can insert activity links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='location_activity_links' 
    AND policyname='Authenticated users can add activity links'
  ) THEN
    CREATE POLICY "Authenticated users can add activity links" 
    ON location_activity_links 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated users can insert activity media
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='activity_media' 
    AND policyname='Authenticated users can add activity media'
  ) THEN
    CREATE POLICY "Authenticated users can add activity media" 
    ON activity_media 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5) Migrate existing data from activities table to location_activity_links
INSERT INTO location_activity_links (
  location_id,
  activity_name,
  description,
  category,
  image_url,
  link_url,
  source,
  created_at,
  updated_at
)
SELECT 
  location_id,
  name as activity_name,
  description,
  category,
  image_url,
  website as link_url,
  COALESCE(source, 'openstreetmap') as source,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM activities
ON CONFLICT (location_id, activity_name, link_url) DO NOTHING;

-- 6) Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM location_activity_links;
  RAISE NOTICE 'Migration complete! Migrated % activities to location_activity_links', migrated_count;
END $$;

-- 7) Create view for backward compatibility (optional - can be removed later)
CREATE OR REPLACE VIEW activities_view AS
SELECT 
  id,
  location_id,
  activity_name as name,
  description,
  category,
  image_url,
  link_url as website,
  source,
  created_at,
  updated_at
FROM location_activity_links;

COMMENT ON TABLE location_activity_links IS 'Activity links for locations with images, descriptions, and external links';
COMMENT ON TABLE activity_media IS 'Community-contributed photos for activities';
COMMENT ON VIEW activities_view IS 'Backward compatibility view for old activities table';

