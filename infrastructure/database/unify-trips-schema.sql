-- Unify trips schema for user trips and public templates
-- Run this in Supabase SQL Editor

-- 1. Add new columns to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS is_public_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS destination VARCHAR(255),
ADD COLUMN IF NOT EXISTS duration_days INTEGER,
ADD COLUMN IF NOT EXISTS trip_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS highlights TEXT[];

-- 2. Create index for public templates
CREATE INDEX IF NOT EXISTS idx_trips_public_template ON trips(is_public_template) WHERE is_public_template = true;
CREATE INDEX IF NOT EXISTS idx_trips_featured ON trips(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);

-- 3. Update RLS policies to allow public access to templates
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON trips;

-- Create new policy for public templates
CREATE POLICY "Public templates are viewable by everyone" ON trips
  FOR SELECT
  USING (is_public_template = true AND status = 'published');

-- 4. Create function to copy public template to user account
CREATE OR REPLACE FUNCTION copy_trip_template(
  p_template_id UUID,
  p_user_id UUID,
  p_new_title TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_trip_id UUID;
  v_template_trip RECORD;
  v_new_slug TEXT;
BEGIN
  -- Get template trip
  SELECT * INTO v_template_trip
  FROM trips
  WHERE id = p_template_id
  AND is_public_template = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or not public';
  END IF;

  -- Generate new slug
  v_new_slug := LOWER(REGEXP_REPLACE(
    COALESCE(p_new_title, v_template_trip.title),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  )) || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);

  -- Create new trip from template
  INSERT INTO trips (
    user_id,
    title,
    description,
    slug,
    cover_image,
    start_date,
    end_date,
    status,
    destination,
    duration_days,
    trip_type,
    highlights,
    is_public_template,
    is_featured
  ) VALUES (
    p_user_id,
    COALESCE(p_new_title, v_template_trip.title || ' (Copy)'),
    v_template_trip.description,
    v_new_slug,
    v_template_trip.cover_image,
    v_template_trip.start_date,
    v_template_trip.end_date,
    'draft', -- New copies start as draft
    v_template_trip.destination,
    v_template_trip.duration_days,
    v_template_trip.trip_type,
    v_template_trip.highlights,
    false, -- User copies are not templates
    false
  )
  RETURNING id INTO v_new_trip_id;

  -- Copy posts if any (from posts table)
  INSERT INTO posts (
    trip_id,
    title,
    content,
    featured_image,
    post_date,
    order_index,
    location
  )
  SELECT
    v_new_trip_id,
    title,
    content,
    featured_image,
    post_date,
    order_index,
    location
  FROM posts
  WHERE trip_id = p_template_id;

  -- Initialize trip stats
  INSERT INTO trip_stats (trip_id, total_views, unique_views)
  VALUES (v_new_trip_id, 0, 0)
  ON CONFLICT (trip_id) DO NOTHING;

  RETURN v_new_trip_id;
END;
$$;

-- 5. Create view for public trip library
CREATE OR REPLACE VIEW public_trip_library AS
SELECT 
  t.*,
  ts.total_views,
  ts.unique_views,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT sl.id) as share_link_count
FROM trips t
LEFT JOIN trip_stats ts ON t.id = ts.trip_id
LEFT JOIN posts p ON t.id = p.trip_id
LEFT JOIN share_links sl ON t.id = sl.trip_id
WHERE t.is_public_template = true
  AND t.status = 'published'
GROUP BY t.id, ts.total_views, ts.unique_views
ORDER BY t.is_featured DESC, ts.total_views DESC NULLS LAST, t.created_at DESC;

-- 6. Grant access to the view
GRANT SELECT ON public_trip_library TO anon, authenticated;

-- Done! Now you can:
-- 1. Mark trips as public templates: UPDATE trips SET is_public_template = true WHERE id = '...'
-- 2. Feature trips: UPDATE trips SET is_featured = true WHERE id = '...'
-- 3. Copy templates: SELECT copy_trip_template('template-id', 'user-id', 'My Custom Title')
-- 4. Query public library: SELECT * FROM public_trip_library

