-- Clear all activity image_url values to force refetch
UPDATE location_activity_links 
SET image_url = NULL 
WHERE image_url IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as cleared_count 
FROM location_activity_links 
WHERE image_url IS NULL;

