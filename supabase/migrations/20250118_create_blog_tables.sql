-- Migration: Create Blog/CMS Tables
-- Purpose: Add tables for blog system, newsletter, and content blocks
-- Created: 2025-01-18

-- ============================================================================
-- NEWSLETTER SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    source VARCHAR(50), -- Where they subscribed from (homepage, blog, etc.)
    metadata JSONB DEFAULT '{}',
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);

-- ============================================================================
-- BLOG DESTINATIONS (Popular destinations for blog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_flag VARCHAR(10), -- Emoji flag
    image TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_trending BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    trip_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_blog_destinations_trending ON blog_destinations(is_trending, display_order);
CREATE INDEX IF NOT EXISTS idx_blog_destinations_featured ON blog_destinations(is_featured, display_order);

-- ============================================================================
-- BLOG TESTIMONIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(255),
    author_location VARCHAR(255),
    author_avatar TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    trip_reference VARCHAR(255), -- Reference to a trip or destination
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_blog_testimonials_featured ON blog_testimonials(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_blog_testimonials_status ON blog_testimonials(status);

-- ============================================================================
-- CONTENT BLOCKS (For editable page sections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_slug VARCHAR(255) NOT NULL, -- e.g., 'homepage', 'about', 'blog-post-123'
    block_type VARCHAR(50) NOT NULL, -- e.g., 'hero', 'features', 'testimonials', 'stats'
    block_key VARCHAR(100) NOT NULL, -- Unique key within page
    content JSONB NOT NULL, -- Block-specific content
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_slug, block_key)
);

-- Index for fast page queries
CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON content_blocks(page_slug, display_order);
CREATE INDEX IF NOT EXISTS idx_content_blocks_active ON content_blocks(is_active);

-- ============================================================================
-- BLOG STATS (For homepage stats bar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'total_trips', 'total_destinations', 'total_travelers'
    stat_value VARCHAR(50) NOT NULL, -- e.g., '10,000+', '150+', '50,000+'
    stat_label VARCHAR(100) NOT NULL,
    icon VARCHAR(50), -- Lucide icon name
    color VARCHAR(20), -- Color variant
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Newsletter subscriptions - Public can insert, only admins can view all
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own subscription" ON newsletter_subscriptions
    FOR SELECT USING (email = auth.jwt()->>'email');

CREATE POLICY "Admins can view all subscriptions" ON newsletter_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Blog destinations - Public read, admins can manage
ALTER TABLE blog_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog destinations" ON blog_destinations
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog destinations" ON blog_destinations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Blog testimonials - Public read approved, admins can manage
ALTER TABLE blog_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials" ON blog_testimonials
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins can manage testimonials" ON blog_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Content blocks - Public read active, admins can manage
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active content blocks" ON content_blocks
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage content blocks" ON content_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Blog stats - Public read, admins can manage
ALTER TABLE blog_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog stats" ON blog_stats
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage blog stats" ON blog_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default blog stats
INSERT INTO blog_stats (stat_key, stat_value, stat_label, icon, color, display_order) VALUES
    ('total_trips', '10,000+', 'Trips Created', 'Map', 'rausch', 1),
    ('total_destinations', '150+', 'Destinations', 'MapPin', 'kazan', 2),
    ('total_travelers', '50,000+', 'Happy Travelers', 'Users', 'babu', 3),
    ('countries_covered', '75+', 'Countries', 'Globe', 'green', 4)
ON CONFLICT (stat_key) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Blog tables migration complete!';
    RAISE NOTICE '📊 Created tables:';
    RAISE NOTICE '   - newsletter_subscriptions';
    RAISE NOTICE '   - blog_destinations';
    RAISE NOTICE '   - blog_testimonials';
    RAISE NOTICE '   - content_blocks';
    RAISE NOTICE '   - blog_stats';
    RAISE NOTICE '🔒 RLS policies enabled for all tables';
    RAISE NOTICE '🌱 Seed data inserted for blog_stats';
END $$;

