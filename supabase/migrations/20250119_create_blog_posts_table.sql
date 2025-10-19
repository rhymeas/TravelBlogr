-- Migration: Create Blog Posts Table
-- Date: 2025-01-19
-- Purpose: Create dedicated blog_posts table for blog CMS, separate from trip posts

-- Step 1: Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB, -- Rich content from Novel editor
  featured_image TEXT,
  gallery_images TEXT[], -- Array of image URLs
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  category VARCHAR(100),
  tags TEXT[],
  
  -- Relationships
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL, -- Link to trip (optional)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- Link to location (optional)
  
  -- SEO
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Publishing
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_trip_id ON blog_posts(trip_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_location_id ON blog_posts(location_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Step 3: Add comments
COMMENT ON TABLE blog_posts IS 'Blog posts for TravelBlogr - can be standalone or linked to trips/locations';
COMMENT ON COLUMN blog_posts.trip_id IS 'Links blog post to a specific trip (for trip-based blog posts)';
COMMENT ON COLUMN blog_posts.location_id IS 'Links blog post to a specific location (for destination guides)';
COMMENT ON COLUMN blog_posts.content IS 'Rich content from Novel editor stored as JSONB';

-- Step 4: Create RLS policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT
  USING (status = 'published' AND visibility = 'public');

-- Authenticated users can view their own posts
CREATE POLICY "Authenticated users can view their own blog posts" ON blog_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create blog posts" ON blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own blog posts" ON blog_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own blog posts" ON blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Step 5: Create view for blog posts with trip and location data
CREATE OR REPLACE VIEW blog_posts_with_relations AS
SELECT 
  p.*,
  t.title AS trip_title,
  t.slug AS trip_slug,
  t.cover_image AS trip_cover_image,
  t.start_date AS trip_start_date,
  t.end_date AS trip_end_date,
  t.location_data AS trip_location_data,
  l.name AS location_name,
  l.slug AS location_slug,
  l.country AS location_country,
  l.featured_image AS location_image,
  l.latitude AS location_latitude,
  l.longitude AS location_longitude,
  u.id AS user_id,
  u.email AS author_email,
  prof.full_name AS author_name,
  prof.username AS author_username,
  prof.avatar_url AS author_avatar
FROM blog_posts p
LEFT JOIN trips t ON p.trip_id = t.id
LEFT JOIN locations l ON p.location_id = l.id
LEFT JOIN auth.users u ON p.author_id = u.id
LEFT JOIN profiles prof ON p.author_id = prof.id;

-- Grant access to the view
GRANT SELECT ON blog_posts_with_relations TO authenticated, anon;

COMMENT ON VIEW blog_posts_with_relations IS 'Blog posts with joined trip and location data for easy querying';

-- Step 6: Create function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_post_slug(post_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug format
  base_slug := lower(regexp_replace(post_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION auto_generate_blog_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_blog_post_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_auto_slug ON blog_posts;
CREATE TRIGGER blog_posts_auto_slug
  BEFORE INSERT ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_blog_slug();

-- Step 8: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_update_timestamp ON blog_posts;
CREATE TRIGGER blog_posts_update_timestamp
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_timestamp();

-- Step 9: Create trigger to auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_blog_post_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_set_published_at ON blog_posts;
CREATE TRIGGER blog_posts_set_published_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_blog_post_published_at();

-- Migration complete!

