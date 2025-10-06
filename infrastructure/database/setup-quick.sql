-- ============================================================================
-- QUICK SETUP FOR TRAVELBLOGR - ESSENTIAL TABLES ONLY
-- ============================================================================
-- Run this in Supabase SQL Editor to get started quickly
-- Full schema available in schema.sql
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LOCATIONS TABLE (Main table for auto-fill feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    content JSONB, -- Rich content from CMS
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    featured_image TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    timezone VARCHAR(50),
    currency VARCHAR(10),
    language VARCHAR(50),
    best_time_to_visit TEXT,
    budget_info TEXT,
    rating DECIMAL(3, 2),
    visit_count INTEGER DEFAULT 0,
    last_visited TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RESTAURANTS TABLE (Auto-filled from OpenStreetMap)
-- ============================================================================
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    website TEXT,
    opening_hours JSONB,
    price_range VARCHAR(10),
    rating DECIMAL(3, 2),
    image_url TEXT,
    source VARCHAR(50) DEFAULT 'openstreetmap',
    external_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITIES TABLE (Auto-filled from OpenStreetMap)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    website TEXT,
    opening_hours JSONB,
    price_info TEXT,
    duration TEXT,
    rating DECIMAL(3, 2),
    image_url TEXT,
    source VARCHAR(50) DEFAULT 'openstreetmap',
    external_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
CREATE INDEX IF NOT EXISTS idx_locations_published ON locations(is_published);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(location_id);
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location_id);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON restaurants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Allow public read, admin write
-- ============================================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published locations
CREATE POLICY "Public locations are viewable by everyone" 
    ON locations FOR SELECT 
    USING (is_published = true);

-- Allow anyone to read restaurants
CREATE POLICY "Restaurants are viewable by everyone" 
    ON restaurants FOR SELECT 
    USING (true);

-- Allow anyone to read activities
CREATE POLICY "Activities are viewable by everyone" 
    ON activities FOR SELECT 
    USING (true);

-- Allow service role to do everything (for auto-fill API)
CREATE POLICY "Service role can do everything on locations" 
    ON locations FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on restaurants" 
    ON restaurants FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on activities" 
    ON activities FOR ALL 
    USING (auth.role() = 'service_role');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ TravelBlogr database setup complete!';
    RAISE NOTICE '📍 Tables created: locations, restaurants, activities';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '🚀 Ready for auto-fill feature!';
END $$;

