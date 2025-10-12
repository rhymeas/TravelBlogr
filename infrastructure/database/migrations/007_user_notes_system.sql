-- Migration 007: User Notes & Ratings System
-- Created: 2025-01-11
-- Description: Add tables for user notes and ratings on locations, activities, and restaurants

-- ============================================================================
-- USER LOCATION NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_location_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  note_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  photos TEXT[], -- Array of Supabase Storage URLs
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one note per user per location
  UNIQUE(user_id, location_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_location_notes_user ON public.user_location_notes(user_id);
CREATE INDEX idx_user_location_notes_location ON public.user_location_notes(location_id);
CREATE INDEX idx_user_location_notes_created ON public.user_location_notes(created_at DESC);

-- RLS Policies
ALTER TABLE public.user_location_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own location notes"
  ON public.user_location_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location notes"
  ON public.user_location_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location notes"
  ON public.user_location_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location notes"
  ON public.user_location_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER ACTIVITY NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  note_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  photos TEXT[], -- Array of Supabase Storage URLs
  visited_date DATE,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one note per user per activity
  UNIQUE(user_id, activity_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_activity_notes_user ON public.user_activity_notes(user_id);
CREATE INDEX idx_user_activity_notes_activity ON public.user_activity_notes(activity_id);
CREATE INDEX idx_user_activity_notes_created ON public.user_activity_notes(created_at DESC);

-- RLS Policies
ALTER TABLE public.user_activity_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity notes"
  ON public.user_activity_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity notes"
  ON public.user_activity_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity notes"
  ON public.user_activity_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity notes"
  ON public.user_activity_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER RESTAURANT NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_restaurant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  note_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  photos TEXT[], -- Array of Supabase Storage URLs
  visited_date DATE,
  dish_recommendations TEXT, -- Favorite dishes
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one note per user per restaurant
  UNIQUE(user_id, restaurant_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_restaurant_notes_user ON public.user_restaurant_notes(user_id);
CREATE INDEX idx_user_restaurant_notes_restaurant ON public.user_restaurant_notes(restaurant_id);
CREATE INDEX idx_user_restaurant_notes_created ON public.user_restaurant_notes(created_at DESC);

-- RLS Policies
ALTER TABLE public.user_restaurant_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own restaurant notes"
  ON public.user_restaurant_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own restaurant notes"
  ON public.user_restaurant_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant notes"
  ON public.user_restaurant_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant notes"
  ON public.user_restaurant_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_location_notes_updated_at
  BEFORE UPDATE ON public.user_location_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activity_notes_updated_at
  BEFORE UPDATE ON public.user_activity_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_restaurant_notes_updated_at
  BEFORE UPDATE ON public.user_restaurant_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_location_notes IS 'User personal notes and ratings for locations';
COMMENT ON TABLE public.user_activity_notes IS 'User personal notes and ratings for activities';
COMMENT ON TABLE public.user_restaurant_notes IS 'User personal notes and ratings for restaurants';

COMMENT ON COLUMN public.user_location_notes.is_private IS 'If true, note is only visible to the user';
COMMENT ON COLUMN public.user_activity_notes.visited_date IS 'Date when user visited the activity';
COMMENT ON COLUMN public.user_restaurant_notes.dish_recommendations IS 'User favorite dishes at this restaurant';

