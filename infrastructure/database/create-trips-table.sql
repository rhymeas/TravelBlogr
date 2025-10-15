-- Create trips table from scratch
-- Run this in Supabase SQL Editor

-- 1. Drop existing trips table if it exists (be careful!)
DROP TABLE IF EXISTS trips CASCADE;

-- 2. Create trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) NOT NULL,
    cover_image TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    location_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slug)
);

-- 3. Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Anyone can view trips (needed for public share links like tripname.travelblogr.com)
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

-- 5. Create index for faster queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_slug ON trips(slug);
CREATE INDEX idx_trips_status ON trips(status);

-- Done! Now you can create trips.

