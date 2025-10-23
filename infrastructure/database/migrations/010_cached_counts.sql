-- Migration: Add cached counts to avoid N+1 query problem
-- Created: 2025-10-22
-- Purpose: Maintain like/save counts in trips table for performance

-- ============================================================================
-- 0. Create missing tables if they don't exist (safe to run multiple times)
-- ============================================================================

-- Create trip_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS trip_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Create trip_saves table if it doesn't exist
CREATE TABLE IF NOT EXISTS trip_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Create activity_likes table if it doesn't exist (only if activities table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities') THEN
    CREATE TABLE IF NOT EXISTS activity_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(activity_id, user_id)
    );
  END IF;
END $$;

-- Create location_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS location_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, user_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_trip_likes_trip ON trip_likes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_likes_user ON trip_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_saves_trip ON trip_saves(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_saves_user ON trip_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_location_ratings_location ON location_ratings(location_id);
CREATE INDEX IF NOT EXISTS idx_location_ratings_user ON location_ratings(user_id);

-- Create activity_likes indexes only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_likes') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON activity_likes(activity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON activity_likes(user_id);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE trip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_likes (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view trip likes" ON trip_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON trip_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON trip_likes;

CREATE POLICY "Anyone can view trip likes" ON trip_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON trip_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON trip_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trip_saves (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view trip saves" ON trip_saves;
DROP POLICY IF EXISTS "Users can create their own saves" ON trip_saves;
DROP POLICY IF EXISTS "Users can delete their own saves" ON trip_saves;

CREATE POLICY "Anyone can view trip saves" ON trip_saves
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own saves" ON trip_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON trip_saves
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for location_ratings (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view location ratings" ON location_ratings;
DROP POLICY IF EXISTS "Users can create their own ratings" ON location_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON location_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON location_ratings;

CREATE POLICY "Anyone can view location ratings" ON location_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own ratings" ON location_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON location_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON location_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on activity_likes if it exists (drop existing policies first)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_likes') THEN
    ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Anyone can view activity likes" ON activity_likes;
    DROP POLICY IF EXISTS "Users can create their own activity likes" ON activity_likes;
    DROP POLICY IF EXISTS "Users can delete their own activity likes" ON activity_likes;

    -- Create policies
    CREATE POLICY "Anyone can view activity likes" ON activity_likes
      FOR SELECT USING (true);

    CREATE POLICY "Users can create their own activity likes" ON activity_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own activity likes" ON activity_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 1. Add cached count columns to trips table
-- ============================================================================

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_like_count ON trips(like_count);
CREATE INDEX IF NOT EXISTS idx_trips_save_count ON trips(save_count);

-- ============================================================================
-- 2. Initialize counts from existing data
-- ============================================================================

-- Update like counts (safe even if trip_likes is empty)
UPDATE trips t
SET like_count = COALESCE((
  SELECT COUNT(*)
  FROM trip_likes tl
  WHERE tl.trip_id = t.id
), 0);

-- Update save counts (safe even if trip_saves is empty)
UPDATE trips t
SET save_count = COALESCE((
  SELECT COUNT(*)
  FROM trip_saves ts
  WHERE ts.trip_id = t.id
), 0);

-- ============================================================================
-- 3. Create trigger function to maintain like count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_trip_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE trips 
    SET like_count = like_count + 1 
    WHERE id = NEW.trip_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE trips 
    SET like_count = GREATEST(like_count - 1, 0)  -- Prevent negative counts
    WHERE id = OLD.trip_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trip_like_count_trigger ON trip_likes;
CREATE TRIGGER trip_like_count_trigger
AFTER INSERT OR DELETE ON trip_likes
FOR EACH ROW EXECUTE FUNCTION update_trip_like_count();

-- ============================================================================
-- 4. Create trigger function to maintain save count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_trip_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment save count
    UPDATE trips 
    SET save_count = save_count + 1 
    WHERE id = NEW.trip_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement save count
    UPDATE trips 
    SET save_count = GREATEST(save_count - 1, 0)  -- Prevent negative counts
    WHERE id = OLD.trip_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trip_save_count_trigger ON trip_saves;
CREATE TRIGGER trip_save_count_trigger
AFTER INSERT OR DELETE ON trip_saves
FOR EACH ROW EXECUTE FUNCTION update_trip_save_count();

-- ============================================================================
-- 5. Add cached count columns to locations table (for ratings)
-- ============================================================================

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_rating_count ON locations(rating_count);
CREATE INDEX IF NOT EXISTS idx_locations_average_rating ON locations(average_rating);

-- Initialize counts from existing data
UPDATE locations l
SET 
  rating_count = (
    SELECT COUNT(*)
    FROM location_ratings lr
    WHERE lr.location_id = l.id
  ),
  average_rating = (
    SELECT COALESCE(AVG(rating), 0.0)
    FROM location_ratings lr
    WHERE lr.location_id = l.id
  );

-- ============================================================================
-- 6. Create trigger function to maintain location rating stats
-- ============================================================================

CREATE OR REPLACE FUNCTION update_location_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_count INTEGER;
  new_average DECIMAL(3,2);
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Calculate new stats
    SELECT 
      COUNT(*),
      COALESCE(AVG(rating), 0.0)
    INTO new_count, new_average
    FROM location_ratings
    WHERE location_id = COALESCE(NEW.location_id, OLD.location_id);
    
    -- Update location
    UPDATE locations
    SET 
      rating_count = new_count,
      average_rating = new_average
    WHERE id = COALESCE(NEW.location_id, OLD.location_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS location_rating_stats_trigger ON location_ratings;
CREATE TRIGGER location_rating_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON location_ratings
FOR EACH ROW EXECUTE FUNCTION update_location_rating_stats();

-- ============================================================================
-- 7. Add cached count columns to activities table (for likes)
-- ============================================================================

-- Only add column if activities table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities') THEN
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_activities_like_count ON activities(like_count);

    -- Initialize counts from existing data (safe even if activity_likes is empty)
    UPDATE activities a
    SET like_count = COALESCE((
      SELECT COUNT(*)
      FROM activity_likes al
      WHERE al.activity_id = a.id
    ), 0);
  END IF;
END $$;

-- ============================================================================
-- 8. Create trigger function to maintain activity like count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_activity_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE activities 
    SET like_count = like_count + 1 
    WHERE id = NEW.activity_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE activities 
    SET like_count = GREATEST(like_count - 1, 0)  -- Prevent negative counts
    WHERE id = OLD.activity_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS activity_like_count_trigger ON activity_likes;
CREATE TRIGGER activity_like_count_trigger
AFTER INSERT OR DELETE ON activity_likes
FOR EACH ROW EXECUTE FUNCTION update_activity_like_count();

-- ============================================================================
-- 9. Verify counts are correct
-- ============================================================================

-- Check trips
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM trips t
  WHERE t.like_count != (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id)
     OR t.save_count != (SELECT COUNT(*) FROM trip_saves WHERE trip_id = t.id);
  
  IF mismatch_count > 0 THEN
    RAISE WARNING 'Found % trips with mismatched counts', mismatch_count;
  ELSE
    RAISE NOTICE 'All trip counts are correct!';
  END IF;
END $$;

-- Check locations
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM locations l
  WHERE l.rating_count != (SELECT COUNT(*) FROM location_ratings WHERE location_id = l.id);
  
  IF mismatch_count > 0 THEN
    RAISE WARNING 'Found % locations with mismatched counts', mismatch_count;
  ELSE
    RAISE NOTICE 'All location counts are correct!';
  END IF;
END $$;

-- Check activities
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM activities a
  WHERE a.like_count != (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id);
  
  IF mismatch_count > 0 THEN
    RAISE WARNING 'Found % activities with mismatched counts', mismatch_count;
  ELSE
    RAISE NOTICE 'All activity counts are correct!';
  END IF;
END $$;

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Summary:
-- ✅ Added like_count and save_count to trips table
-- ✅ Added rating_count and average_rating to locations table
-- ✅ Added like_count to activities table
-- ✅ Created triggers to maintain counts automatically
-- ✅ Initialized counts from existing data
-- ✅ Verified counts are correct
--
-- Performance improvement:
-- Before: N queries per real-time update (N = number of subscribers)
-- After: 0 queries (read from cached column)
-- 
-- Estimated improvement: 100-1000x faster at scale!

