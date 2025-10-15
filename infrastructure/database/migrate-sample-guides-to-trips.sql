-- Migrate sample_travel_guides to trips table as public templates
-- Run this in Supabase SQL Editor

-- 1. Insert sample guides as public templates in trips table
INSERT INTO trips (
  id,
  user_id,
  title,
  slug,
  description,
  cover_image,
  destination,
  duration_days,
  trip_type,
  highlights,
  is_public_template,
  is_featured,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  -- Use a system user or first admin user for ownership
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) as user_id,
  title,
  slug,
  description,
  cover_image,
  destination,
  duration_days,
  trip_type,
  highlights,
  true as is_public_template,
  is_featured,
  'published' as status,
  created_at,
  NOW() as updated_at
FROM sample_travel_guides
WHERE NOT EXISTS (
  SELECT 1 FROM trips WHERE trips.slug = sample_travel_guides.slug
);

-- 2. Migrate sample guide days to posts table
INSERT INTO posts (
  id,
  trip_id,
  user_id,
  title,
  content,
  post_date,
  order_index,
  created_at,
  updated_at
)
SELECT
  sgd.id,
  sgd.guide_id as trip_id,
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) as user_id,
  sgd.title,
  sgd.description || E'\n\n' || 
  CASE 
    WHEN sgd.activities IS NOT NULL AND array_length(sgd.activities, 1) > 0 
    THEN E'Activities:\n' || array_to_string(sgd.activities, E'\n• ', '• ')
    ELSE ''
  END ||
  CASE 
    WHEN sgd.tips IS NOT NULL 
    THEN E'\n\nTips: ' || sgd.tips
    ELSE ''
  END as content,
  NOW() + (sgd.day_number || ' days')::interval as post_date,
  sgd.day_number as order_index,
  sgd.created_at,
  NOW() as updated_at
FROM sample_guide_days sgd
WHERE EXISTS (
  SELECT 1 FROM trips WHERE trips.id = sgd.guide_id
)
AND NOT EXISTS (
  SELECT 1 FROM posts WHERE posts.id = sgd.id
);

-- 3. Initialize trip_stats for migrated trips
INSERT INTO trip_stats (trip_id, total_views, unique_views)
SELECT 
  id as trip_id,
  view_count as total_views,
  0 as unique_views
FROM sample_travel_guides
WHERE EXISTS (
  SELECT 1 FROM trips WHERE trips.id = sample_travel_guides.id
)
ON CONFLICT (trip_id) DO UPDATE
SET total_views = EXCLUDED.total_views;

-- 4. Verify migration
SELECT 
  COUNT(*) as total_public_templates,
  COUNT(CASE WHEN is_featured THEN 1 END) as featured_count
FROM trips
WHERE is_public_template = true;

-- Done! Sample guides are now in the trips table as public templates
-- You can now safely drop the old tables (optional):
-- DROP TABLE IF EXISTS sample_guide_days CASCADE;
-- DROP TABLE IF EXISTS sample_travel_guides CASCADE;

