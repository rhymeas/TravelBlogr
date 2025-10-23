-- Migration 012: Things to Do - Phase 1 foundation
-- Purpose: Add activity link/media tables for location pages
-- Date: 2025-10-22

-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Activity links
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

-- 2) Activity media (community photos)
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

-- 3) RLS
ALTER TABLE location_activity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_media ENABLE ROW LEVEL SECURITY;

-- Anyone can read activity links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='location_activity_links' AND policyname='Anyone can view activity links'
  ) THEN
    CREATE POLICY "Anyone can view activity links" ON location_activity_links FOR SELECT USING (true);
  END IF;
END $$;

-- Anyone can read activity media
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_media' AND policyname='Anyone can view activity media'
  ) THEN
    CREATE POLICY "Anyone can view activity media" ON activity_media FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can insert their own media
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_media' AND policyname='Users can insert their own media'
  ) THEN
    CREATE POLICY "Users can insert their own media" ON activity_media FOR INSERT WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- 4) Updated at trigger for activity links
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activity_links_updated ON location_activity_links;
CREATE TRIGGER trg_activity_links_updated
BEFORE UPDATE ON location_activity_links
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) Grants
GRANT SELECT ON location_activity_links TO anon, authenticated;
GRANT SELECT, INSERT ON activity_media TO authenticated;

