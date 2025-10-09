-- =====================================================
-- Location Features Setup
-- =====================================================
-- This script creates tables for:
-- 1. Location Ratings (star rating system)
-- 2. Location Views (pixel tracking)
-- 3. Location Comments (community discussion)
-- =====================================================

-- =====================================================
-- 1. LOCATION RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS location_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one rating per user per location
  UNIQUE(location_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_ratings_location ON location_ratings(location_id);
CREATE INDEX IF NOT EXISTS idx_location_ratings_user ON location_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_location_ratings_created ON location_ratings(created_at DESC);

-- =====================================================
-- 2. LOCATION VIEWS TABLE (Pixel Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS location_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
  ip_address VARCHAR(45), -- IPv4 or IPv6
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_location_views_location ON location_views(location_id);
CREATE INDEX IF NOT EXISTS idx_location_views_user ON location_views(user_id);
CREATE INDEX IF NOT EXISTS idx_location_views_date ON location_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_views_ip ON location_views(ip_address);

-- =====================================================
-- 3. LOCATION COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS location_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES location_comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_comments_location ON location_comments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_user ON location_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_parent ON location_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_created ON location_comments(created_at DESC);

-- =====================================================
-- 4. UPDATE LOCATIONS TABLE
-- =====================================================
-- Add rating and view count columns if they don't exist
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locations_rating ON locations(rating DESC);
CREATE INDEX IF NOT EXISTS idx_locations_view_count ON locations(view_count DESC);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE location_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_comments ENABLE ROW LEVEL SECURITY;

-- Location Ratings Policies
CREATE POLICY "Anyone can view ratings" ON location_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON location_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON location_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON location_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Location Views Policies (mostly permissive for tracking)
CREATE POLICY "Anyone can view location views" ON location_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create views" ON location_views
  FOR INSERT WITH CHECK (true);

-- Location Comments Policies
CREATE POLICY "Anyone can view comments" ON location_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON location_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON location_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON location_comments
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_location_ratings_updated_at ON location_ratings;
CREATE TRIGGER update_location_ratings_updated_at
  BEFORE UPDATE ON location_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_location_comments_updated_at ON location_comments;
CREATE TRIGGER update_location_comments_updated_at
  BEFORE UPDATE ON location_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Initialize existing locations with default values
UPDATE locations 
SET 
  rating = 0.0,
  rating_count = 0,
  view_count = 0
WHERE rating IS NULL OR rating_count IS NULL OR view_count IS NULL;

-- =====================================================
-- DONE!
-- =====================================================
-- Run this script in your Supabase SQL editor
-- or via: psql -U postgres -d your_database -f setup-location-features.sql
-- =====================================================

