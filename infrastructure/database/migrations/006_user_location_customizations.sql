-- ============================================================================
-- Migration 006: User Location Customizations
-- ============================================================================
-- Purpose: Add user-specific location customizations and trip-location overrides
-- This enables the community-driven location database with personal customizations
-- ============================================================================

-- ============================================================================
-- 1. USER LOCATIONS TABLE
-- ============================================================================
-- Stores user-specific customizations for locations (notes, ratings, wishlist, etc.)
-- Separates public location data from private user preferences

CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    
    -- User customizations
    personal_notes TEXT,
    user_rating DECIMAL(3, 2) CHECK (user_rating >= 0 AND user_rating <= 5),
    is_wishlisted BOOLEAN DEFAULT FALSE,
    is_visited BOOLEAN DEFAULT FALSE,
    visit_date DATE,
    visit_count INTEGER DEFAULT 0,
    
    -- Privacy control
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'friends')),
    
    -- Custom fields (flexible storage for user-specific data)
    custom_data JSONB DEFAULT '{}',
    
    -- Tags for organization
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one customization per user per location
    UNIQUE(user_id, location_id)
);

-- ============================================================================
-- 2. TRIP LOCATION CUSTOMIZATIONS TABLE
-- ============================================================================
-- Stores trip-specific location overrides
-- Allows users to customize location details within their own trips

CREATE TABLE IF NOT EXISTS trip_location_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trip-specific overrides
    custom_name VARCHAR(255), -- Override location name for this trip
    custom_description TEXT,
    custom_notes TEXT,
    custom_images TEXT[] DEFAULT '{}',
    
    -- Timing information
    arrival_time TIMESTAMP WITH TIME ZONE,
    departure_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Budget tracking
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    currency VARCHAR(10),
    
    -- Privacy
    is_public BOOLEAN DEFAULT FALSE, -- Share this customization with community
    
    -- Ordering within trip
    order_index INTEGER DEFAULT 0,
    
    -- Custom data
    custom_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one customization per trip per location
    UNIQUE(trip_id, location_id)
);

-- ============================================================================
-- 3. USER LOCATION PHOTOS TABLE
-- ============================================================================
-- Stores user-uploaded photos for locations
-- Separate table for better organization and performance

CREATE TABLE IF NOT EXISTS user_location_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_location_id UUID NOT NULL REFERENCES user_locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Photo data
    photo_url TEXT NOT NULL,
    caption TEXT,
    taken_at TIMESTAMP WITH TIME ZONE,
    
    -- Privacy
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- EXIF data, camera info, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User locations indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location_id ON user_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_wishlisted ON user_locations(user_id, is_wishlisted) WHERE is_wishlisted = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_locations_visited ON user_locations(user_id, is_visited) WHERE is_visited = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_locations_visibility ON user_locations(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_user_locations_rating ON user_locations(location_id, user_rating) WHERE user_rating IS NOT NULL;

-- Trip location customizations indexes
CREATE INDEX IF NOT EXISTS idx_trip_locations_trip_id ON trip_location_customizations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_location_id ON trip_location_customizations(location_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_user_id ON trip_location_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_public ON trip_location_customizations(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_trip_locations_order ON trip_location_customizations(trip_id, order_index);

-- User location photos indexes
CREATE INDEX IF NOT EXISTS idx_user_location_photos_user_location ON user_location_photos(user_location_id);
CREATE INDEX IF NOT EXISTS idx_user_location_photos_user ON user_location_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_photos_location ON user_location_photos(location_id);
CREATE INDEX IF NOT EXISTS idx_user_location_photos_public ON user_location_photos(is_public) WHERE is_public = TRUE;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_location_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_photos ENABLE ROW LEVEL SECURITY;

-- User Locations Policies
-- Users can view their own customizations
CREATE POLICY user_locations_select_own ON user_locations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public customizations from others
CREATE POLICY user_locations_select_public ON user_locations
    FOR SELECT
    USING (visibility = 'public');

-- Users can insert their own customizations
CREATE POLICY user_locations_insert_own ON user_locations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own customizations
CREATE POLICY user_locations_update_own ON user_locations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own customizations
CREATE POLICY user_locations_delete_own ON user_locations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trip Location Customizations Policies
-- Users can view customizations for their own trips
CREATE POLICY trip_locations_select_own ON trip_location_customizations
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_location_customizations.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Users can view public customizations
CREATE POLICY trip_locations_select_public ON trip_location_customizations
    FOR SELECT
    USING (is_public = TRUE);

-- Users can insert customizations for their own trips
CREATE POLICY trip_locations_insert_own ON trip_location_customizations
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_location_customizations.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Users can update their own trip customizations
CREATE POLICY trip_locations_update_own ON trip_location_customizations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own trip customizations
CREATE POLICY trip_locations_delete_own ON trip_location_customizations
    FOR DELETE
    USING (auth.uid() = user_id);

-- User Location Photos Policies
-- Users can view their own photos
CREATE POLICY user_location_photos_select_own ON user_location_photos
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public photos
CREATE POLICY user_location_photos_select_public ON user_location_photos
    FOR SELECT
    USING (is_public = TRUE);

-- Users can insert their own photos
CREATE POLICY user_location_photos_insert_own ON user_location_photos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY user_location_photos_update_own ON user_location_photos
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY user_location_photos_delete_own ON user_location_photos
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- User locations updated_at trigger
CREATE OR REPLACE FUNCTION update_user_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_locations_updated_at
    BEFORE UPDATE ON user_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_locations_updated_at();

-- Trip location customizations updated_at trigger
CREATE OR REPLACE FUNCTION update_trip_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_locations_updated_at
    BEFORE UPDATE ON trip_location_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_locations_updated_at();

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get aggregated location rating from user ratings
CREATE OR REPLACE FUNCTION get_location_community_rating(location_uuid UUID)
RETURNS DECIMAL(3, 2) AS $$
BEGIN
    RETURN (
        SELECT AVG(user_rating)
        FROM user_locations
        WHERE location_id = location_uuid
        AND user_rating IS NOT NULL
        AND visibility = 'public'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get location visit count from community
CREATE OR REPLACE FUNCTION get_location_community_visits(location_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM user_locations
        WHERE location_id = location_uuid
        AND is_visited = TRUE
        AND visibility = 'public'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

