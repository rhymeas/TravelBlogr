-- Fix trips table to reference auth.users instead of public.users
-- Run this in Supabase SQL Editor

-- 1. Drop existing foreign key constraint if it exists
ALTER TABLE IF EXISTS trips
DROP CONSTRAINT IF EXISTS trips_user_id_fkey;

-- 2. Add new foreign key constraint referencing auth.users
ALTER TABLE trips
ADD CONSTRAINT trips_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Anyone can view trips" ON trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

-- 5. Create RLS policies for trips
-- Anyone can view trips (needed for public share links)
CREATE POLICY "Anyone can view trips" ON trips
  FOR SELECT
  USING (true);

-- Only authenticated users can insert their own trips
CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only owners can update their trips
CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only owners can delete their trips
CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE
  USING (auth.uid() = user_id);

