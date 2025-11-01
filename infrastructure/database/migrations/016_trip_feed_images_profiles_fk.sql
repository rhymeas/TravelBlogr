-- 016_trip_feed_images_profiles_fk.sql
-- Purpose: Ensure PostgREST can join trip_feed_images to public.profiles via user_id
-- Context: PostgREST error PGRST200 indicated no FK from trip_feed_images.user_id -> profiles(id)
-- Note: We keep the existing FK to auth.users(id) for data integrity, and add an additional
--       FK to profiles(id) so API joins using profiles!user_id work without custom hints.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class t ON t.oid = c.conrelid
    WHERE  t.relname = 'trip_feed_images'
    AND    c.conname = 'trip_feed_images_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE trip_feed_images
      ADD CONSTRAINT trip_feed_images_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Optional: verify index exists (already created in 014)
-- CREATE INDEX IF NOT EXISTS idx_trip_feed_images_user ON trip_feed_images(user_id, created_at DESC);

