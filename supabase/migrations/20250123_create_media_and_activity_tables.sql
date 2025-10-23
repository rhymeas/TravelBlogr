-- Migration: Create media and activity_feed tables with proper foreign keys
-- Date: 2025-01-23
-- Purpose: Fix missing tables for live feed and trip updates functionality

-- ============================================================================
-- 1. CREATE MEDIA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    caption TEXT,
    location_data JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for media table
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_trip_id ON media(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- RLS policies for media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media from public trips" ON media
    FOR SELECT
    USING (
        trip_id IN (
            SELECT id FROM trips 
            WHERE status = 'published' 
            OR user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own media" ON media
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 2. CREATE ACTIVITY FEED TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'trip_created', 'post_created', 'location_visited', etc.
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity_feed
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- RLS policies for activity_feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public activities" ON activity_feed
    FOR SELECT
    USING (
        -- Public activities from users with public profiles
        user_id IN (
            SELECT id FROM profiles WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert their own activities" ON activity_feed
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activity_feed
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activity_feed
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. CREATE ACTIVITY LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Indexes for activity_likes
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON activity_likes(user_id);

-- RLS policies for activity_likes
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity likes" ON activity_likes
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like activities" ON activity_likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON activity_likes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 4. UPDATE EXISTING POSTS TABLE FOREIGN KEY (if needed)
-- ============================================================================

-- Check if posts table exists and update foreign key
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
    END IF;
    
    -- Add new constraint referencing auth.users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey_auth' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts 
        ADD CONSTRAINT posts_user_id_fkey_auth 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to media table
DROP TRIGGER IF EXISTS update_media_updated_at ON media;
CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON media TO authenticated;
GRANT SELECT ON media TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON activity_feed TO authenticated;
GRANT SELECT ON activity_feed TO anon;

GRANT SELECT, INSERT, DELETE ON activity_likes TO authenticated;
GRANT SELECT ON activity_likes TO anon;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE media IS 'Media files (images, videos) uploaded by users for trips and posts';
COMMENT ON TABLE activity_feed IS 'User activity feed for social features (trips, posts, locations)';
COMMENT ON TABLE activity_likes IS 'Likes on activity feed items';

COMMENT ON COLUMN media.location_data IS 'JSONB containing location metadata (lat, lng, place name)';
COMMENT ON COLUMN media.metadata IS 'JSONB containing EXIF data, camera info, etc.';
COMMENT ON COLUMN activity_feed.type IS 'Activity type: trip_created, post_created, location_visited, etc.';
COMMENT ON COLUMN activity_feed.data IS 'JSONB containing activity-specific data (trip_id, post_id, etc.)';

