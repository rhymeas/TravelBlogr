-- Migration: Trip Duplication Feature
-- Description: Add database function to duplicate trips with all related data

-- Function to duplicate a trip
CREATE OR REPLACE FUNCTION duplicate_trip(
  source_trip_id UUID,
  new_user_id UUID,
  new_title VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_trip_id UUID;
  original_trip RECORD;
  new_slug VARCHAR(255);
  slug_counter INTEGER := 0;
  temp_slug VARCHAR(255);
BEGIN
  -- Get original trip data
  SELECT * INTO original_trip FROM trips WHERE id = source_trip_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found: %', source_trip_id;
  END IF;

  -- Generate new title if not provided
  IF new_title IS NULL THEN
    new_title := original_trip.title || ' (Copy)';
  END IF;

  -- Generate unique slug
  new_slug := lower(regexp_replace(new_title, '[^a-zA-Z0-9]+', '-', 'g'));
  new_slug := trim(both '-' from new_slug);
  temp_slug := new_slug;

  -- Ensure slug is unique for this user
  WHILE EXISTS (
    SELECT 1 FROM trips 
    WHERE user_id = new_user_id AND slug = temp_slug
  ) LOOP
    slug_counter := slug_counter + 1;
    temp_slug := new_slug || '-' || slug_counter;
  END LOOP;
  
  new_slug := temp_slug;

  -- 1. Create new trip
  INSERT INTO trips (
    user_id,
    title,
    description,
    slug,
    cover_image,
    start_date,
    end_date,
    status,
    is_featured,
    location_data,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_title,
    original_trip.description,
    new_slug,
    original_trip.cover_image,
    original_trip.start_date,
    original_trip.end_date,
    'draft', -- Always create as draft
    FALSE, -- Not featured by default
    original_trip.location_data,
    NOW(),
    NOW()
  ) RETURNING id INTO new_trip_id;

  -- 2. Copy posts
  INSERT INTO posts (
    trip_id,
    user_id,
    title,
    content,
    excerpt,
    featured_image,
    location_data,
    post_date,
    order_index,
    created_at,
    updated_at
  )
  SELECT
    new_trip_id,
    new_user_id,
    title,
    content,
    excerpt,
    featured_image,
    location_data,
    post_date,
    order_index,
    NOW(),
    NOW()
  FROM posts
  WHERE trip_id = source_trip_id
  ORDER BY order_index;

  -- 3. Copy media (reference same files, don't duplicate storage)
  INSERT INTO media (
    user_id,
    trip_id,
    post_id,
    filename,
    original_filename,
    mime_type,
    file_size,
    width,
    height,
    url,
    thumbnail_url,
    alt_text,
    caption,
    location_data,
    metadata,
    created_at,
    updated_at
  )
  SELECT
    new_user_id,
    new_trip_id,
    NULL, -- Will need to map post_id if we want to preserve post relationships
    filename,
    original_filename,
    mime_type,
    file_size,
    width,
    height,
    url,
    thumbnail_url,
    alt_text,
    caption,
    location_data,
    metadata,
    NOW(),
    NOW()
  FROM media
  WHERE trip_id = source_trip_id;

  -- Return the new trip ID
  RETURN new_trip_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION duplicate_trip(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION duplicate_trip(UUID, UUID, VARCHAR) TO anon;

-- Add comment
COMMENT ON FUNCTION duplicate_trip IS 'Duplicates a trip with all posts and media for a new user';

