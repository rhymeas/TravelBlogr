-- Fix RLS Security Issues
-- Generated: 2025-10-13
-- Purpose: Enable RLS on all public tables and create appropriate policies

-- ============================================================================
-- REFERENCE DATA TABLES (Public Read-Only)
-- These tables contain shared reference data that everyone can read
-- ============================================================================

-- Locations (cities, countries, etc.)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON public.locations
  FOR SELECT USING (true);

-- Activities (things to do)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view activities" ON public.activities
  FOR SELECT USING (true);

-- Attractions (tourist spots)
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view attractions" ON public.attractions
  FOR SELECT USING (true);

-- Restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view restaurants" ON public.restaurants
  FOR SELECT USING (true);

-- Creators (content creators)
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view creators" ON public.creators
  FOR SELECT USING (true);

-- Location Images (community photos)
ALTER TABLE public.location_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view location images" ON public.location_images
  FOR SELECT USING (true);

-- Hero Images (featured images)
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view hero images" ON public.hero_images
  FOR SELECT USING (true);

-- Scenic Content
ALTER TABLE public.scenic_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scenic content" ON public.scenic_content
  FOR SELECT USING (true);

-- Tour Settings
ALTER TABLE public.tour_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tour settings" ON public.tour_settings
  FOR SELECT USING (true);

-- Location Pings (view tracking)
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view location pings" ON public.location_pings
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert location pings" ON public.location_pings
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- USER-GENERATED CONTENT TABLES
-- These tables contain user-specific data with proper access control
-- ============================================================================

-- Trip Photos (user uploads)
ALTER TABLE public.trip_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view trip photos (they're public)
CREATE POLICY "Anyone can view trip photos" ON public.trip_photos
  FOR SELECT USING (true);

-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload trip photos" ON public.trip_photos
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only delete their own photos
CREATE POLICY "Users can delete their own trip photos" ON public.trip_photos
  FOR DELETE
  USING (uploaded_by = auth.uid()::text);

-- Trip Photo Likes
ALTER TABLE public.trip_photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view photo likes" ON public.trip_photo_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like photos" ON public.trip_photo_likes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "Users can unlike photos" ON public.trip_photo_likes
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- ============================================================================
-- NOTES
-- ============================================================================
-- The following tables already have RLS enabled:
-- - profiles (user profiles)
-- - trips (user trips)
-- - user_locations (user's saved locations)
-- - user_location_notes (user's location notes)
-- - user_activity_notes (user's activity notes)
-- - user_restaurant_notes (user's restaurant notes)
-- - location_comments (location comments)
-- - location_ratings (location ratings)
-- - location_views (location view tracking)
-- - trip_location_customizations (trip-specific location customizations)
-- - cached_itineraries (AI-generated itineraries)
-- - sample_travel_guides (sample guides)
-- - sample_guide_days (sample guide days)
-- ============================================================================

