-- Migration: Add tips column to posts table
-- Date: 2025-01-31
-- Purpose: Add "Did you know?" tips field to posts table for trip library pages

-- Add tips column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS tips TEXT;

-- Add comment
COMMENT ON COLUMN posts.tips IS 'Did you know? interesting facts about the location for this day';

-- Update existing Family Tokyo Adventure posts with tips from seed data
UPDATE posts
SET tips = CASE order_index
  WHEN 1 THEN 'Book airport transfer in advance. Kids love the Shibuya crossing - go at sunset for best photos!'
  WHEN 2 THEN 'TeamLab is incredibly popular - book tickets online weeks in advance. Wear comfortable shoes!'
  WHEN 3 THEN 'Ghibli Museum requires advance booking - book as soon as tickets open! No photos inside.'
  WHEN 4 THEN 'Tokyo Disneyland is huge - arrive early and use the app to check wait times. FastPass is your friend!'
  WHEN 5 THEN 'Visit Sensoji early morning to avoid crowds. Try the fortune slips (omikuji) for 100 yen!'
  WHEN 6 THEN 'TeamLab Planets requires you to walk barefoot through water - bring a towel and wear shorts/skirt!'
  WHEN 7 THEN 'Pack snacks for the flight - Japanese convenience stores have amazing options!'
  ELSE NULL
END
WHERE trip_id IN (
  SELECT id FROM trips WHERE slug = 'family-tokyo-adventure'
);

