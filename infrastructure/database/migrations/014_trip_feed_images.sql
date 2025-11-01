-- Migration 014: Trip Feed Images
-- Purpose: Per-trip live feed images with global pool for public trips
-- Date: 2025-10-31

-- PREREQUISITE: Ensure trips table has privacy column
-- If trips.privacy doesn't exist, add it now
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS privacy VARCHAR(50) DEFAULT 'public'
CHECK (privacy IN ('public', 'private', 'family', 'password'));

-- Update existing trips to have 'public' privacy if published, 'private' if draft
UPDATE trips
SET privacy = CASE
  WHEN status = 'published' THEN 'public'
  ELSE 'private'
END
WHERE privacy IS NULL;

-- Table: trip_feed_images
CREATE TABLE IF NOT EXISTS trip_feed_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  location_name TEXT,
  location_coordinates JSONB, -- { lat: number, lng: number }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_feed_images_trip ON trip_feed_images(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_feed_images_user ON trip_feed_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_feed_images_created ON trip_feed_images(created_at DESC);

-- Cached count on trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS feed_image_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_trip_feed_image_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trips SET feed_image_count = feed_image_count + 1 WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trips SET feed_image_count = GREATEST(feed_image_count - 1, 0) WHERE id = OLD.trip_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (CREATE TRIGGER IF NOT EXISTS is not supported)
DROP TRIGGER IF EXISTS trip_feed_images_count_trigger ON trip_feed_images;

-- Create trigger
CREATE TRIGGER trip_feed_images_count_trigger
  AFTER INSERT OR DELETE ON trip_feed_images
  FOR EACH ROW EXECUTE FUNCTION update_trip_feed_image_count();

-- Enable RLS
ALTER TABLE trip_feed_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (CREATE POLICY IF NOT EXISTS is not supported)
DROP POLICY IF EXISTS "Public trip images are viewable by everyone" ON trip_feed_images;
DROP POLICY IF EXISTS "Users can view their own trip images" ON trip_feed_images;
DROP POLICY IF EXISTS "Users can post images to their trips" ON trip_feed_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON trip_feed_images;

-- Policy: Anyone can view images from public trips
CREATE POLICY "Public trip images are viewable by everyone"
  ON trip_feed_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_feed_images.trip_id
      AND trips.privacy = 'public'
    )
  );

-- Policy: Owners can view their own trip images
CREATE POLICY "Users can view their own trip images"
  ON trip_feed_images FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Owners can insert images to their trips
CREATE POLICY "Users can post images to their trips"
  ON trip_feed_images FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_feed_images.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON trip_feed_images FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE trip_feed_images IS 'Per-trip live feed images (public trips also appear in global pool)';
COMMENT ON COLUMN trip_feed_images.image_url IS 'Public URL from Supabase Storage (trip-images bucket)';

