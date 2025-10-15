-- Create trip collaborators table for sharing admin access
-- Run this in Supabase SQL Editor

-- 1. Create trip_collaborators table
CREATE TABLE IF NOT EXISTS trip_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip_id ON trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user_id ON trip_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_status ON trip_collaborators(status);

-- 3. Enable RLS
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Trip owners can view all collaborators for their trips
CREATE POLICY "Trip owners can view collaborators" ON trip_collaborators
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Users can view their own collaborations
CREATE POLICY "Users can view own collaborations" ON trip_collaborators
  FOR SELECT
  USING (user_id = auth.uid());

-- Trip owners can invite collaborators
CREATE POLICY "Trip owners can invite collaborators" ON trip_collaborators
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Trip owners and admins can update collaborators
CREATE POLICY "Trip owners can update collaborators" ON trip_collaborators
  FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
    OR (user_id = auth.uid() AND role IN ('editor', 'admin'))
  );

-- Trip owners can delete collaborators
CREATE POLICY "Trip owners can delete collaborators" ON trip_collaborators
  FOR DELETE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- 5. Create function to check if user can edit trip
CREATE OR REPLACE FUNCTION can_edit_trip(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_has_edit_access BOOLEAN;
BEGIN
  -- Check if user is the owner
  SELECT EXISTS (
    SELECT 1 FROM trips
    WHERE id = p_trip_id AND user_id = p_user_id
  ) INTO v_is_owner;

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check if user has editor or admin role
  SELECT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id
      AND user_id = p_user_id
      AND status = 'accepted'
      AND role IN ('editor', 'admin')
  ) INTO v_has_edit_access;

  RETURN v_has_edit_access;
END;
$$;

-- 6. Create function to get trip collaborators with user details
CREATE OR REPLACE FUNCTION get_trip_collaborators(p_trip_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role VARCHAR,
  status VARCHAR,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT,
  user_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.user_id,
    tc.role,
    tc.status,
    tc.invited_at,
    tc.accepted_at,
    au.email as user_email,
    p.full_name as user_name,
    p.avatar_url as user_avatar
  FROM trip_collaborators tc
  JOIN auth.users au ON tc.user_id = au.id
  LEFT JOIN profiles p ON tc.user_id = p.id
  WHERE tc.trip_id = p_trip_id
  ORDER BY tc.created_at DESC;
END;
$$;

-- Done! Now you can:
-- 1. Invite collaborators: INSERT INTO trip_collaborators (trip_id, user_id, role, invited_by) VALUES (...)
-- 2. Check edit access: SELECT can_edit_trip('trip-id', 'user-id')
-- 3. Get collaborators: SELECT * FROM get_trip_collaborators('trip-id')

