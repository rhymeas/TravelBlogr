-- Migration: Integrate Blog with Trips and Locations
-- Date: 2025-01-19
-- Purpose: Link cms_posts to trips and locations, remove redundant blog_destinations

-- Step 1: Add foreign keys to cms_posts table
ALTER TABLE cms_posts 
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_posts_trip_id ON cms_posts(trip_id);
CREATE INDEX IF NOT EXISTS idx_cms_posts_location_id ON cms_posts(location_id);

-- Step 3: Add comment to explain the relationship
COMMENT ON COLUMN cms_posts.trip_id IS 'Links blog post to a specific trip (for trip-based blog posts)';
COMMENT ON COLUMN cms_posts.location_id IS 'Links blog post to a specific location (for destination guides)';

-- Step 4: Drop blog_destinations table (redundant - use locations table instead)
DROP TABLE IF EXISTS blog_destinations CASCADE;

-- Step 5: Update RLS policies for cms_posts to include trip/location joins
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON cms_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON cms_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON cms_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON cms_posts;

-- Recreate policies with better names
CREATE POLICY "Public can view published blog posts" ON cms_posts
  FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Authenticated users can view their own blog posts" ON cms_posts
  FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create blog posts" ON cms_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own blog posts" ON cms_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own blog posts" ON cms_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Step 6: Create view for blog posts with trip and location data
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
  u.id AS author_id,
  u.email AS author_email,
  prof.full_name AS author_name,
  prof.username AS author_username,
  prof.avatar_url AS author_avatar
FROM cms_posts p
LEFT JOIN trips t ON p.trip_id = t.id
LEFT JOIN locations l ON p.location_id = l.id
LEFT JOIN auth.users u ON p.author_id = u.id
LEFT JOIN profiles prof ON p.author_id = prof.id;

-- Step 7: Grant access to the view
GRANT SELECT ON blog_posts_with_relations TO authenticated, anon;

-- Step 8: Create function to auto-generate slug from title
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
  WHILE EXISTS (SELECT 1 FROM cms_posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_blog_post_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cms_posts_auto_slug ON cms_posts;
CREATE TRIGGER cms_posts_auto_slug
  BEFORE INSERT ON cms_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Step 10: Add helpful comments
COMMENT ON TABLE cms_posts IS 'Blog posts for TravelBlogr - can be standalone or linked to trips/locations';
COMMENT ON VIEW blog_posts_with_relations IS 'Blog posts with joined trip and location data for easy querying';

-- Migration complete!

