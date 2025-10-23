-- Migration: Trip Saves/Bookmarks System
-- Created: 2025-10-22
-- Description: Allows users to save/bookmark trips for later viewing

-- Create trip_saves table
CREATE TABLE IF NOT EXISTS trip_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one save per user per trip
  UNIQUE(trip_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_saves_trip ON trip_saves(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_saves_user ON trip_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_saves_created_at ON trip_saves(created_at DESC);

-- Enable Row Level Security
ALTER TABLE trip_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all trip saves" ON trip_saves
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own saves" ON trip_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON trip_saves
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE trip_saves IS 'Stores user bookmarks/saves for trips';
COMMENT ON COLUMN trip_saves.trip_id IS 'Reference to the saved trip';
COMMENT ON COLUMN trip_saves.user_id IS 'User who saved the trip';
COMMENT ON COLUMN trip_saves.created_at IS 'When the trip was saved';

