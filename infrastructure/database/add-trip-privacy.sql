-- Add privacy settings to trips table
-- Run this in Supabase SQL Editor

-- 1. Add privacy column to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS privacy VARCHAR(50) DEFAULT 'public' 
CHECK (privacy IN ('public', 'private', 'family', 'password'));

-- 2. Add password column for password-protected trips
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS privacy_password VARCHAR(255);

-- 3. Add family_members column (array of user IDs who can access)
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS family_members UUID[];

-- 4. Create index for privacy queries
CREATE INDEX IF NOT EXISTS idx_trips_privacy ON trips(privacy);

-- 5. Update existing trips to have 'public' privacy if published, 'private' if draft
UPDATE trips 
SET privacy = CASE 
  WHEN status = 'published' THEN 'public'
  ELSE 'private'
END
WHERE privacy IS NULL;

-- 6. Create function to check trip access
CREATE OR REPLACE FUNCTION can_access_trip(
  p_trip_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip RECORD;
  v_has_access BOOLEAN := FALSE;
BEGIN
  -- Get trip details
  SELECT * INTO v_trip
  FROM trips
  WHERE id = p_trip_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Owner always has access
  IF p_user_id IS NOT NULL AND v_trip.user_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- Check privacy settings
  CASE v_trip.privacy
    WHEN 'public' THEN
      v_has_access := TRUE;
    
    WHEN 'private' THEN
      -- Only owner can access
      v_has_access := (p_user_id IS NOT NULL AND v_trip.user_id = p_user_id);
    
    WHEN 'family' THEN
      -- Owner or family members can access
      v_has_access := (
        p_user_id IS NOT NULL AND (
          v_trip.user_id = p_user_id OR
          p_user_id = ANY(v_trip.family_members)
        )
      );
    
    WHEN 'password' THEN
      -- Check password (simple comparison, in production use proper hashing)
      v_has_access := (
        p_password IS NOT NULL AND 
        v_trip.privacy_password IS NOT NULL AND
        p_password = v_trip.privacy_password
      );
    
    ELSE
      v_has_access := FALSE;
  END CASE;

  RETURN v_has_access;
END;
$$;

-- 7. Grant execute permission
GRANT EXECUTE ON FUNCTION can_access_trip TO anon, authenticated;

-- 8. Add comment
COMMENT ON COLUMN trips.privacy IS 'Privacy setting: public, private, family, password';
COMMENT ON COLUMN trips.privacy_password IS 'Password for password-protected trips';
COMMENT ON COLUMN trips.family_members IS 'Array of user IDs who can access family-only trips';
COMMENT ON FUNCTION can_access_trip IS 'Check if a user can access a trip based on privacy settings';

